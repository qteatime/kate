/*
 * Copyright (c) 2023-2024 The Kate Project Authors
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, see <https://www.gnu.org/licenses>.
 */

// The KeyManager takes care of handling all usage of private keys and
// making sure that they don't live decrypted outside of the kernel.

import { DeveloperProfileStore, KeyStore, KeyStore_v1, TrustStore } from "../../data";
import {
  EKeyIncorrectPassword,
  EKeyMissing,
  EKeyNoMasterPassword,
  EKeyNotGoodPassword,
  EKeyRotateFailure,
  EKeyRotateWithoutExistingKey,
  EKeyStoreAlreadyProtected,
  EOperationAborted,
} from "../../error";
import { enumerate, make_id, byte_equals, bytes_to_base64 } from "../../utils";
import type { KateOS } from "../os";
import { AutoComplete } from "../ui";

export class KateKeyManager {
  #master_key: CryptoKey | null = null;
  #master_unlocked_at: Date = new Date();
  #cache_ttl = 1000 * 60 * 60; // 1 hour
  #key_check_delay = 1000 * 10; // 10s
  #key_check_timer: any = null;
  #key_default_iterations = 1_200_000;

  constructor(readonly os: KateOS) {}

  #expire_old_key = () => {
    clearTimeout(this.#key_check_timer);
    if (this.#master_key == null) {
      return;
    }
    const elapsed = new Date().getTime() - this.#master_unlocked_at.getTime();
    if (elapsed > this.#cache_ttl) {
      this.#master_key = null;
      return;
    }
    this.#key_check_timer = setTimeout(this.#expire_old_key, this.#key_check_delay);
  };

  // == Utilities
  async fingerprint(key: Uint8Array) {
    const hashed = await crypto.subtle.digest({ name: "SHA-1" }, key);
    return Array.from(new Uint8Array(hashed))
      .map((x) => x.toString(16).padStart(2, "0"))
      .join(":");
  }

  private async ask_password(message: string, autocomplete: AutoComplete) {
    const password = await this.os.dialog.text_input("kate:key-manager", message, {
      max_length: 255,
      min_length: 16,
      type: "password",
      autocomplete: [autocomplete],
    });
    if (password == null) {
      throw new EOperationAborted("provide password");
    }
    if (password.length < 16 || password.length > 255) {
      throw new EKeyNotGoodPassword();
    }
    const text_encoder = new TextEncoder();
    const secret = new Uint8Array(text_encoder.encode(password));
    return secret;
  }

  // == Handling storage encryption
  async unlock_master_key(requestee: string): Promise<CryptoKey> {
    const config = this.os.settings.get("key_store").master_key;
    if (config == null) {
      throw new EKeyNoMasterPassword();
    }

    this.#expire_old_key();
    if (this.#master_key != null) {
      await this.os.audit_supervisor.log("kate:key-manager", {
        risk: "high",
        type: "kate.key-store.unlocked",
        resources: ["kate:key-store"],
        message: `Key store accessed on request of ${requestee} (already unlocked by another recent action)`,
        extra: { requestee },
      });
      return this.#master_key;
    }

    const secret = await this.ask_password(
      `Enter your password to unlock your key store (prompted by ${requestee}'s request).`,
      "current-password"
    );

    return this.unlock_master_key_with_password(requestee, secret);
  }

  async unlock_master_key_with_password(requestee: string, pass_bytes: Uint8Array) {
    const config = this.os.settings.get("key_store").master_key;
    if (config == null) {
      throw new EKeyNoMasterPassword();
    }

    const decryption_key = await this.make_encryption_key(
      config.salt,
      config.key_derive_iterations,
      pass_bytes
    );
    let key_check;
    try {
      key_check = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: config.salt },
        decryption_key,
        config.key_check
      );
    } catch (_) {
      key_check = new Uint8Array(0);
    }
    if (!byte_equals(config.salt, new Uint8Array(key_check))) {
      throw new EKeyIncorrectPassword();
    }

    this.#master_key = decryption_key;
    this.#master_unlocked_at = new Date();

    await this.os.audit_supervisor.log("kate:key-manager", {
      risk: "high",
      type: "kate.key-store.unlocked",
      resources: ["kate:key-store"],
      message: `Key store unlocked on request of ${requestee}`,
      extra: { requestee },
    });
    this.#key_check_timer = setTimeout(this.#expire_old_key, this.#key_check_delay);

    return decryption_key;
  }

  private async make_encryption_key(salt: Uint8Array, iterations: number, secret: Uint8Array) {
    const pass_key = await crypto.subtle.importKey("raw", secret, { name: "PBKDF2" }, false, [
      "deriveBits",
      "deriveKey",
    ]);
    return await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt.buffer,
        iterations: iterations,
        hash: "SHA-256",
      },
      pass_key,
      { name: "AES-GCM", length: 256 },
      false,
      ["wrapKey", "unwrapKey", "encrypt", "decrypt"]
    );
  }

  async unlock_key(requestee: string, key_data: KeyStore_v1, extractable: boolean = false) {
    const master_key = await this.unlock_master_key(requestee);
    return await crypto.subtle.unwrapKey(
      "pkcs8",
      key_data.key,
      master_key,
      { name: "AES-GCM", iv: key_data.encryption_meta!.iv },
      key_data.algorithm,
      extractable,
      key_data.usage
    );
  }

  // == Signing and verification
  async verify_with_key(key_data: KeyStore_v1, message: Uint8Array, signature: Uint8Array) {
    if (!key_data.usage.includes("verify")) {
      return { verified: false as const };
    }
    const key = await crypto.subtle.importKey(
      "spki",
      key_data.key,
      key_data.algorithm,
      false,
      key_data.usage
    );
    const ok = await crypto.subtle.verify(
      { name: "ECDSA", hash: { name: "SHA-384" } },
      key,
      signature,
      message
    );
    if (ok) {
      await this.mark_used(key_data);
      return {
        verified: true as const,
        key: {
          id: key_data.id,
          fingerprint: this.fingerprint(key_data.key),
          store: key_data.store,
          comment: key_data.comment,
          invalidated: key_data.invalidated,
        },
      };
    } else {
      return { verified: false as const };
    }
  }

  async verify(domain: string, message: Uint8Array, signature: Uint8Array) {
    const keys = await this.rt(async (store) => store.public_keys_for_domain(domain));
    for (const key_data of keys) {
      const result = await this.verify_with_key(key_data, message, signature);
      if (result.verified) {
        return result;
      }
    }
    return {
      verified: false,
    };
  }

  async sign_with_key(requestee: string, key_data: KeyStore_v1, message: Uint8Array) {
    const key = await this.unlock_key(requestee, key_data);
    const signature = await crypto.subtle.sign(
      {
        name: "ECDSA",
        hash: { name: "SHA-384" },
      },
      key,
      message.buffer
    );
    await this.mark_used(key_data);
    return new Uint8Array(signature);
  }

  async signing_keys_for_domain(domain: string) {
    const keys = await this.rt(async (store) => store.private_keys_for_domain(domain));
    return keys.filter((x) => x.store === "personal");
  }

  async mark_used(key: KeyStore_v1) {
    await KeyStore.transaction(this.os.db, "readwrite", async (store) => {
      const k = await store.get_by_id(key.id);
      if (k == null) {
        throw new EKeyMissing(key.fingerprint);
      }
      await store.update_key({ ...k, last_used_at: new Date() });
    });
  }

  // == Key management lifecycle
  async reset_store(requestee: string): Promise<void> {
    await this.os.db.transaction(
      [...KeyStore.tables, ...DeveloperProfileStore.tables],
      "readwrite",
      async (txn) => {
        const key_store = new KeyStore(txn);
        const dev_store = new DeveloperProfileStore(txn);
        const keys = await key_store.all_private_keys();
        for (const key of keys) {
          await key_store.delete_key(key);
        }
        const profiles = await dev_store.list();
        for (const profile of profiles) {
          await dev_store.delete(profile);
        }
      }
    );
    await this.os.settings.update("key_store", (store) => ({ ...store, master_key: null }));
    await this.os.audit_supervisor.log(requestee, {
      risk: "critical",
      type: "kate.key-manager.store-reset",
      resources: ["kate:key-store"],
      message: `Store has been reset.`,
    });
  }

  async rotate_master_key(requestee: string, old_pass: string, new_pass: string): Promise<void> {
    const config = this.os.settings.get("key_store").master_key;
    if (config == null) {
      throw new EKeyRotateWithoutExistingKey();
    }
    const old_pass_bytes = new Uint8Array(new TextEncoder().encode(old_pass));
    const current_key = await this.unlock_master_key_with_password(requestee, old_pass_bytes);
    const new_key = await this.do_generate_master_key(new_pass);
    const new_config = this.os.settings.get("key_store").master_key!;
    await this.os.dialog.progress(
      "kate:key-manager",
      `Encrypting all keys with the new master password...`,
      async (progress) => {
        const keys = await this.rt(async (store) => store.all_private_keys());
        const updates: KeyStore_v1[] = [];
        for (const [i, key] of enumerate(keys)) {
          progress.set_message(
            `Encrypting all keys with the new master password... (${i + 1}/${keys.length})`
          );
          if (key.encryption_meta == null) {
            continue;
          }
          if (byte_equals(key.encryption_meta.key_hash, new_config.key_check)) {
            continue;
          }

          const raw_key = await crypto.subtle.unwrapKey(
            "pkcs8",
            key.key,
            current_key,
            { name: "AES-GCM", iv: key.encryption_meta.iv },
            key.algorithm,
            true,
            key.usage
          );
          const iv = crypto.getRandomValues(new Uint8Array(12));
          const wrapped_key = await crypto.subtle.wrapKey("pkcs8", raw_key, new_key, {
            name: "AES-GCM",
            iv,
          });
          updates.push({
            ...key,
            updated_at: new Date(),
            key: new Uint8Array(wrapped_key),
            encryption_meta: {
              iv,
              key_hash: new_config.key_check,
              pair_id: key.encryption_meta.pair_id,
            },
          });
        }
        try {
          await KeyStore.transaction(this.os.db, "readwrite", async (store) => {
            for (const update of updates) {
              await store.update_key(update);
            }
          });
        } catch (e) {
          console.error(e);
          this.os.settings.update("key_store", (value) => {
            return { ...value, master_key: config };
          });
          throw new EKeyRotateFailure(e);
        }
      }
    );
  }

  async generate_master_key(password: string): Promise<CryptoKey> {
    const config = this.os.settings.get("key_store").master_key;
    if (config != null) {
      throw new EKeyStoreAlreadyProtected();
    }
    return await this.do_generate_master_key(password);
  }

  private async do_generate_master_key(password: string): Promise<CryptoKey> {
    const salt = new Uint8Array(crypto.getRandomValues(new Uint8Array(16)));
    const secret = new TextEncoder().encode(password);
    const key = await this.make_encryption_key(salt, this.#key_default_iterations, secret);
    const key_check = new Uint8Array(
      await crypto.subtle.encrypt({ name: "AES-GCM", iv: salt }, key, salt)
    );
    this.os.settings.update("key_store", (value) => {
      return {
        ...value,
        master_key: {
          salt,
          key_check,
          key_derive_iterations: this.#key_default_iterations,
        },
      };
    });
    this.#master_key = key;
    this.#master_unlocked_at = new Date();
    await this.os.audit_supervisor.log("kate:key-manager", {
      risk: "high",
      type: "kate.key-store.master-password-changed",
      message: `Master password for the key store has changed`,
      resources: ["kate:key-store"],
      extra: {},
    });
    return key;
  }

  // == Managing keys in the store
  async generate_key(
    requestee: string,
    domain: string,
    comment: string
  ): Promise<{ private_key: KeyStore_v1; public_key: KeyStore_v1 }> {
    const master_key = await this.unlock_master_key(requestee);
    const config = this.os.settings.get("key_store").master_key;
    if (master_key == null || config == null) {
      throw new EKeyNoMasterPassword();
    }

    const algo = { name: "ECDSA", namedCurve: "P-384" };
    const data0: Omit<
      KeyStore_v1,
      "id" | "kind" | "key" | "usage" | "encryption_meta" | "fingerprint"
    > = {
      store: "personal",
      algorithm: algo,
      comment,
      domain,
      invalidated: null,
      added_at: new Date(),
      updated_at: new Date(),
      last_used_at: null,
    };
    const key_pair = await crypto.subtle.generateKey(algo, true, ["sign", "verify"]);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const raw_private_key = await crypto.subtle.wrapKey("pkcs8", key_pair.privateKey, master_key, {
      name: "AES-GCM",
      iv,
    });
    const raw_public_key = await crypto.subtle.exportKey("spki", key_pair.publicKey);

    const public_id = make_id();
    const private_data: KeyStore_v1 = {
      ...data0,
      id: make_id(),
      kind: "private",
      key: new Uint8Array(raw_private_key),
      fingerprint: await this.fingerprint(new Uint8Array(raw_private_key)),
      encryption_meta: { iv, key_hash: config.key_check, pair_id: public_id },
      usage: ["sign"],
    };
    const public_data: KeyStore_v1 = {
      ...data0,
      id: public_id,
      kind: "public",
      key: new Uint8Array(raw_public_key),
      fingerprint: await this.fingerprint(new Uint8Array(raw_public_key)),
      usage: ["verify"],
      encryption_meta: null,
    };

    return {
      private_key: private_data,
      public_key: public_data,
    };
  }

  async import_public_key(
    key_data: Uint8Array,
    meta: { format: "spki"; store: TrustStore; comment: string; domain: string }
  ) {
    const algo = { name: "ECDSA", namedCurve: "P-384" };
    const key = await crypto.subtle.importKey(meta.format, key_data, algo, true, ["verify"]);
    const bin_key = new Uint8Array(await crypto.subtle.exportKey("spki", key));
    const fp = await this.fingerprint(bin_key);
    const exists = await this.rt(async (s) => s.get_by_fingerprint(meta.domain, meta.store, fp));
    if (exists != null) {
      return exists.id;
    }

    const id = await KeyStore.transaction(this.os.db, "readwrite", async (store) => {
      return await store.add_key({
        id: make_id(),
        kind: "public",
        store: meta.store,
        algorithm: algo,
        comment: meta.comment,
        domain: meta.domain,
        fingerprint: fp,
        key: bin_key,
        encryption_meta: null,
        usage: ["verify"],
        invalidated: null,
        added_at: new Date(),
        updated_at: new Date(),
        last_used_at: null,
      });
    });

    const show_fp = await this.fingerprint(bin_key);
    await this.os.audit_supervisor.log("kate:key-manager", {
      risk: meta.store === "trusted" ? "critical" : "medium",
      type: "kate.key-manager.public-key-added",
      resources: ["kate:key-store"],
      message: `Added key ${show_fp} (${meta.domain}) to ${meta.store}`,
      extra: {
        fingerprint: show_fp,
        domain: meta.domain,
        store: meta.store,
        comment: meta.comment,
      },
    });

    return id;
  }

  async import_encrypted_private_key(
    requestee: string,
    key_data: Uint8Array,
    meta: {
      format: "pkcs8";
      comment: string;
      domain: string;
      salt: Uint8Array;
      iv: Uint8Array;
      iterations: number;
      pair_id: string | null;
    }
  ) {
    const config = this.os.settings.get("key_store").master_key;
    if (config == null) {
      throw new EKeyNoMasterPassword();
    }

    const secret = await this.ask_password(
      `Enter the password to decrypt your private key.`,
      "new-password"
    );
    const master_key = await this.unlock_master_key(requestee);

    const algo = { name: "ECDSA", namedCurve: "P-384" };
    const crypt_key = await this.make_encryption_key(meta.salt, meta.iterations, secret);
    const raw_key = await crypto.subtle.unwrapKey(
      "pkcs8",
      key_data,
      crypt_key,
      {
        name: "AES-GCM",
        iv: meta.iv,
      },
      algo,
      true,
      ["sign"]
    );
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const bin_key = new Uint8Array(
      await crypto.subtle.wrapKey("pkcs8", raw_key, master_key, { name: "AES-GCM", iv })
    );
    const fp = await this.fingerprint(bin_key);
    const id = await KeyStore.transaction(this.os.db, "readwrite", async (store) => {
      return await store.add_key({
        id: make_id(),
        kind: "private",
        store: "personal",
        algorithm: algo,
        comment: meta.comment,
        domain: meta.domain,
        fingerprint: fp,
        key: bin_key,
        encryption_meta: {
          iv: iv,
          key_hash: config.key_check,
          pair_id: meta.pair_id,
        },
        usage: ["sign"],
        invalidated: null,
        added_at: new Date(),
        updated_at: new Date(),
        last_used_at: null,
      });
    });

    const show_fp = await this.fingerprint(bin_key);
    await this.os.audit_supervisor.log("kate:key-manager", {
      risk: "high",
      type: "kate.key-manager.private-key-added",
      resources: ["kate:key-store"],
      message: `Added personal private key ${show_fp} (${meta.domain})`,
      extra: {
        fingerprint: show_fp,
        domain: meta.domain,
        comment: meta.comment,
      },
    });

    return id;
  }

  async export_private_key_for_backup(key: KeyStore_v1) {
    const secret = await this.ask_password(
      `Enter a password to encrypt your private key backup.`,
      "new-password"
    );
    const signing_key = await this.unlock_key("kate:key-manager", key, true);

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const crypt_key = await this.make_encryption_key(salt, this.#key_default_iterations, secret);
    const wrapped_key = new Uint8Array(
      await crypto.subtle.wrapKey("pkcs8", signing_key, crypt_key, {
        name: "AES-GCM",
        iv,
      })
    );

    return {
      salt,
      iv,
      iterations: this.#key_default_iterations,
      key: wrapped_key,
    };
  }

  async save_keys(keys: KeyStore_v1[]) {
    await KeyStore.transaction(this.os.db, "readwrite", async (store) => {
      for (const key of keys) {
        await store.add_key(key);
      }
    });
    await this.os.audit_supervisor.log("kate:key-manager", {
      risk: keys.some((x) => x.store === "trusted") ? "critical" : "medium",
      type: "kate.key-store.key-added",
      extra: {
        keys: keys.map((x) => {
          return {
            id: x.id,
            store: x.store,
            kind: x.kind,
            fingerprint: String(x.fingerprint),
          };
        }),
      },
      message: `Added ${keys.length} keys to the store`,
      resources: ["kate:key-store"],
    });
  }

  async delete_keys(keys: KeyStore_v1[]) {
    await KeyStore.transaction(this.os.db, "readwrite", async (store) => {
      for (const key of keys) {
        await store.delete_key(key);
      }
    });

    await this.os.audit_supervisor.log("kate:key-manager", {
      risk: keys.some((x) => x.store === "trusted") ? "critical" : "medium",
      type: "kate.key-store.key-deleted",
      extra: {
        keys: keys.map((x) => {
          return {
            id: x.id,
            store: x.store,
            kind: x.kind,
            fingerprint: String(x.fingerprint),
          };
        }),
      },
      message: `Removed ${keys.length} keys to the store`,
      resources: ["kate:key-store"],
    });
  }

  async try_get_key(key_id: string) {
    return this.rt((s) => s.get_by_id(key_id));
  }

  export_public_key(key: Uint8Array) {
    const base64_string = bytes_to_base64(key);
    const PEM_LINE_SIZE = 64;
    const lines: string[] = [];
    let x = base64_string;
    while (x.length > PEM_LINE_SIZE) {
      lines.push(x.slice(0, PEM_LINE_SIZE));
      x = x.slice(PEM_LINE_SIZE);
    }
    return `-----BEGIN PUBLIC KEY-----\n${lines.join("\n")}\n-----END PUBLIC KEY-----`;
  }

  async public_keys_in_store(store: TrustStore) {
    return this.rt((s) => s.public_keys_in_store(store));
  }

  private async rt<A>(fn: (store: KeyStore) => Promise<A>) {
    return KeyStore.transaction(this.os.db, "readonly", fn);
  }
}
