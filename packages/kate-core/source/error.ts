/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { KateVersion } from "./cart";
import type { DeveloperProfile, KateOS } from "./os";
import { SemVer } from "./utils";

export abstract class EUserError extends Error {
  abstract code: string;
  public handled = false;
  readonly warning: boolean = false;

  get formatted_error_message() {
    return `${this.code}: ${this.message}`;
  }
}

export class ENoCartParser extends EUserError {
  code = "EC.0001";
  constructor(readonly file: string) {
    super(`No suitable cartridge decoders found for: ${file}`);
  }
}

export class ECartFormatTooNew extends EUserError {
  code = "EC.0002";
  constructor(readonly version: SemVer, readonly file: string) {
    super(`${file} requires at least Kate v${version} to decode.`);
  }
}

export class ECartCorrupted extends EUserError {
  code = "EC.0003";
  constructor(readonly file: string) {
    super(`${file} is corrupted.`);
  }
}

export class EDeveloperProfileExists extends EUserError {
  code = "ED.0001";
  constructor(readonly domain: string, readonly profile: DeveloperProfile) {
    super(
      [
        `A developer profile already exists for domain ${domain} `,
        `(${profile.name} - ${profile.fingerprint})`,
      ].join("")
    );
  }
}

export class EDeveloperNotFound extends EUserError {
  code = "ED.0002";
  constructor(readonly domain: string) {
    super(`No developer profile has been configured for ${domain}`);
  }
}

export class EDeveloperKeysMissing extends EUserError {
  code = "ED.0003";
  constructor(readonly domain: string) {
    super(
      [
        `A developer profile is configured for ${domain}, `,
        `but its signing keys are missing from the key store. `,
        `You will have to re-import the profile from a backup or `,
        `re-create it.`,
      ].join("")
    );
  }
}

export class EDeveloperBackupInvalid extends EUserError {
  code = "ED.0004";
  constructor(readonly error: unknown) {
    super(
      [
        `Could not read the profile backup, the data might be invalid or corrupted.\n\n`,
        `Reason: ${String(error)}`,
      ].join("")
    );
  }
}

export class EDeveloperBackupHashMismatch extends EUserError {
  code = "ED.0005";
  constructor(readonly profile: { name: string; domain: string }) {
    super(
      [
        `Could not read the profile backup for ${profile.name} (${profile.domain}), `,
        `the data was modified or corrupted after the backup was generated.`,
      ].join("")
    );
  }
}

export class EDeveloperBackupConflict extends EUserError {
  code = "ED.0006";
  constructor(readonly profile: DeveloperProfile, readonly fingerprint: string) {
    super(
      [
        `A developer profile for ${profile.name} (${profile.domain}) already exists, `,
        `but its key fingerprint doesn't match. The backup was not imported.\n\n`,
        `Current fingerprint: ${profile.fingerprint}\n`,
        `Backup fingerprint: ${fingerprint}`,
      ].join("")
    );
  }
}

export class EDeveloperInvalidDomain extends EUserError {
  code = "ED.0007";
  constructor(readonly domain: string) {
    super(`${JSON.stringify(domain)} is not a valid developer profile domain.`);
  }
}

export class EKeyNoMasterPassword extends EUserError {
  code = "EK.0001";
  constructor() {
    super(
      [
        `This operation requires your key store to be encrypted, but no master `,
        `password has been configured for the key store. You can configure `,
        `a master password in Settings -> Secure key store.`,
      ].join("")
    );
  }
}

export class EKeyIncorrectPassword extends EUserError {
  code = "EK.0002";
  constructor() {
    super(`The password provided was incorrect. The key could not be decrypted.`);
  }
}

export class EKeyStoreAlreadyProtected extends EUserError {
  code = "EK.0003";
  constructor() {
    super(
      [
        `Your key store is already protected by an existing password. `,
        `If you wish to change it, you'll need to use the 'change password' `,
        `feature in Settings -> Secure key store.`,
      ].join("")
    );
  }
}

export class EKeyRotateWithoutExistingKey extends EUserError {
  code = "EK.0004";
  constructor() {
    super(
      [
        `Cannot change the key store's password because it's not currently `,
        `protected by any password. You can create a password for the key store `,
        `in Settings -> Secure key store.`,
      ].join("")
    );
  }
}

export class EKeyRotateFailure extends EUserError {
  code = "EK.0005";
  constructor(readonly error: unknown) {
    super(
      [
        `An unknown error occurred while trying to re-encrypt your key store with `,
        `the new master password. The password change has been reverted.`,
      ].join("")
    );
  }
}

export class EKeyNotGoodPassword extends EUserError {
  code = "EK.0006";
  constructor() {
    super([`An encryption password for the key store must have at least 16 characters.`].join(""));
  }
}

export class EKeyMissing extends EUserError {
  code = "EK.0007";
  constructor(readonly fingerprint: string) {
    super([`Key ${fingerprint} was not found in the key store.`].join(""));
  }
}

export class EOperationAborted extends EUserError {
  code = "E.0001";
  warning = true;
  constructor(readonly operation: string) {
    super(`The operation "${operation}" was aborted by the user.`);
  }
}
