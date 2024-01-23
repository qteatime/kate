/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { DeveloperProfile, DeveloperProfileStore, KeyStore, KeyStore_v1 } from "../../data";
import {
  EDeveloperBackupConflict,
  EDeveloperBackupHashMismatch,
  EDeveloperBackupInvalid,
  EDeveloperInvalidDomain,
  EDeveloperKeysMissing,
  EDeveloperNotFound,
  EDeveloperProfileExists,
} from "../../error";
import { TC, byte_equals, bytes_to_base64 } from "../../utils";
import type { KateOS } from "../os";

type ProfileBackupEnvelope = {
  version: 1;
  backup: ProfileBackup;
  sha256_integrity: string; // base64
};

type ProfileBackup = {
  profile: {
    name: string;
    domain: string;
    created_at: string; // ISO date
    exported_at: string; // ISO date
  };
  public_key: {
    curve: string;
    comment: string;
    key: string; // base64
    fingerprint: string;
  };
  private_key: {
    curve: string;
    comment: string;
    iterations: number;
    key: string; // base64
    salt: string; // base64
    iv: string; // base64
  };
};

const valid_domain = /^[a-z0-9_\-\.]{2,}(\.[a-z0-9_\-\.]{2,})+$/;
const valid_curve = TC.one_of(["P-384" as const]);

const backup_spec = TC.spec({
  profile: TC.spec({
    name: TC.str,
    domain: TC.regex("domain", valid_domain),
    created_at: TC.date,
    exported_at: TC.date,
  }),
  public_key: TC.spec({
    curve: valid_curve,
    comment: TC.str,
    key: TC.base64_bytes,
    fingerprint: TC.str,
  }),
  private_key: TC.spec({
    curve: valid_curve,
    comment: TC.str,
    key: TC.base64_bytes,
    iterations: TC.int,
    salt: TC.base64_bytes,
    iv: TC.base64_bytes,
  }),
});

const envelope_spec = TC.spec({
  version: TC.constant(1 as const),
  backup: backup_spec,
  sha256_integrity: TC.base64_bytes,
});

export class KateDeveloperProfile {
  constructor(readonly os: KateOS) {}

  private assert_developer_domain(domain: string) {
    if (!this.is_valid_domain(domain)) {
      throw new EDeveloperInvalidDomain(domain);
    }
  }

  is_valid_domain(domain: string) {
    return valid_domain.test(domain);
  }

  async list(): Promise<DeveloperProfile[]> {
    return await this.rt((s) => s.list());
  }

  async try_get(domain: string): Promise<DeveloperProfile | null> {
    return await this.rt((s) => s.try_get_by_domain(domain));
  }

  async get(domain: string) {
    const profile = await this.try_get(domain);
    if (profile == null) {
      throw new EDeveloperNotFound(domain);
    }
    return profile;
  }

  async add(profile: DeveloperProfile) {
    this.assert_developer_domain(profile.domain);
    const exists = await this.try_get(profile.domain);
    if (exists != null) {
      throw new EDeveloperProfileExists(profile.domain, profile);
    }

    await DeveloperProfileStore.transaction(this.os.db, "readwrite", async (s) => {
      await s.add(profile);
    });
    await this.os.audit_supervisor.log("kate:developer-profile", {
      risk: "low",
      type: "kate.developer-profile.added",
      message: `Added a new developer profile for ${profile.domain} (${profile.name} - ${profile.fingerprint})`,
      extra: {
        domain: profile.domain,
        name: profile.name,
        fingerprint: profile.fingerprint,
      },
      resources: ["kate:profile"],
    });
  }

  async delete(domain: string) {
    const profile = await this.try_get(domain);
    if (profile == null) {
      return;
    }
    const keys = await this.get_keys(domain);
    await this.os.db.transaction(
      [...DeveloperProfileStore.tables, ...KeyStore.tables],
      "readwrite",
      async (txn) => {
        const key_store = new KeyStore(txn);
        const dev_store = new DeveloperProfileStore(txn);
        await key_store.delete_key(keys.private_key);
        await key_store.delete_key(keys.public_key);
        await dev_store.delete(profile);
      }
    );
    await this.os.audit_supervisor.log("kate:developer-profile", {
      risk: "low",
      type: "kate.developer-profile.added",
      message: `Removed developer profile for ${profile.domain} (${profile.name} - ${profile.fingerprint})`,
      extra: {
        domain: profile.domain,
        name: profile.name,
        fingerprint: profile.fingerprint,
      },
      resources: ["kate:profile"],
    });
  }

  async get_keys(domain: string): Promise<{ private_key: KeyStore_v1; public_key: KeyStore_v1 }> {
    const profile = await this.get(domain);
    const private_key = await this.os.key_manager.try_get_key(profile.key_id);
    const public_key_id = private_key?.encryption_meta?.pair_id;
    if (private_key == null || public_key_id == null) {
      throw new EDeveloperKeysMissing(domain);
    }
    const public_key = await this.os.key_manager.try_get_key(public_key_id);
    if (public_key == null) {
      throw new EDeveloperKeysMissing(domain);
    }

    return { private_key, public_key };
  }

  async export_backup(domain: string) {
    const profile = await this.get(domain);
    const keys = await this.get_keys(domain);
    const bkp_key = await this.os.key_manager.export_private_key_for_backup(keys.private_key);

    const json: ProfileBackup = {
      profile: {
        name: profile.name,
        domain: profile.domain,
        created_at: profile.created_at.toISOString(),
        exported_at: new Date().toISOString(),
      },
      public_key: {
        curve: keys.public_key.algorithm.namedCurve,
        comment: keys.public_key.comment,
        key: bytes_to_base64(keys.public_key.key),
        fingerprint: keys.public_key.fingerprint,
      },
      private_key: {
        curve: keys.public_key.algorithm.namedCurve,
        comment: keys.private_key.comment,
        iterations: bkp_key.iterations,
        key: bytes_to_base64(bkp_key.key),
        salt: bytes_to_base64(bkp_key.salt),
        iv: bytes_to_base64(bkp_key.iv),
      },
    };

    const bkp_source = JSON.stringify(json);
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(bkp_source));
    const bkp: ProfileBackupEnvelope = {
      version: 1,
      backup: json,
      sha256_integrity: bytes_to_base64(new Uint8Array(hash)),
    };

    await this.os.audit_supervisor.log("kate:developer-profile", {
      risk: "high",
      resources: ["kate:profile"],
      message: `Exported developer profile ${profile.name} (${profile.domain}) to a backup file.`,
      type: "kate.developer-profile.exported",
      extra: {
        name: profile.name,
        domain: profile.domain,
        fingerprint: keys.public_key.fingerprint,
      },
    });

    return bkp;
  }

  async import_backup(json: unknown, overwrite: boolean) {
    const bkp_envelope = TC.bracket(envelope_spec, (x) => {
      throw new EDeveloperBackupInvalid(x);
    })(json);

    const bkp_source = JSON.stringify((json as ProfileBackupEnvelope).backup);
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(bkp_source));
    if (!byte_equals(bkp_envelope.sha256_integrity, new Uint8Array(hash))) {
      throw new EDeveloperBackupHashMismatch(bkp_envelope.backup.profile);
    }

    const bkp = bkp_envelope.backup;
    const exists = await this.try_get(bkp.profile.domain);
    if (exists != null && exists.fingerprint !== bkp.public_key.fingerprint && !overwrite) {
      throw new EDeveloperBackupConflict(exists, bkp.public_key.fingerprint);
    }

    const public_key = await this.os.key_manager.import_public_key(bkp.public_key.key, {
      format: "spki",
      store: "personal",
      domain: bkp.profile.domain,
      comment: `Kate signing key for ${bkp.profile.name}`,
    });
    const private_key = await this.os.key_manager.import_encrypted_private_key(
      "kate:developer-profile",
      bkp.private_key.key,
      {
        format: "pkcs8",
        comment: `Kate signing key for ${bkp.profile.name}`,
        iterations: bkp.private_key.iterations,
        domain: bkp.profile.domain,
        salt: bkp.private_key.salt,
        iv: bkp.private_key.iv,
        pair_id: public_key,
      }
    );
    await DeveloperProfileStore.transaction(this.os.db, "readwrite", async (store) => {
      store.add({
        name: bkp.profile.name,
        domain: bkp.profile.domain,
        icon: null,
        key_id: private_key,
        created_at: bkp.profile.created_at,
        fingerprint: bkp.public_key.fingerprint,
      });
    });
    await this.os.audit_supervisor.log("kate:developer-profile", {
      risk: "medium",
      resources: ["kate:profile"],
      message: `Imported developer profile ${bkp.profile.name} (${bkp.profile.domain}) from a backup file.`,
      type: "kate.developer-profile.imported",
      extra: {
        name: bkp.profile.name,
        domain: bkp.profile.domain,
        fingerprint: bkp.public_key.fingerprint,
      },
    });
  }

  async sign(requestee: string, profile: DeveloperProfile, data: Uint8Array) {
    const keys = await this.os.key_manager.signing_keys_for_domain(profile.domain);
    const key = keys.find((x) => x.id === profile.key_id && x.kind === "private");
    if (key == null) {
      return null;
    } else {
      return await this.os.key_manager.sign_with_key(requestee, key, data);
    }
  }

  async rt<A>(fn: (_: DeveloperProfileStore) => Promise<A>) {
    return DeveloperProfileStore.transaction(this.os.db, "readonly", (s) => fn(s));
  }
}
