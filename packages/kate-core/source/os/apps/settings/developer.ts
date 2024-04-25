/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { DeveloperProfile, KeyStore_v1 } from "../../../data";
import { Observable, relative_date, unreachable } from "../../../utils";
import { SettingsData } from "../../apis";
import type { KateOS } from "../../os";
import * as UI from "../../ui";
import { SceneCreateMasterPassword } from "./key-store";

export class SceneDeveloperSettings extends UI.SimpleScene {
  readonly application_id = "kate:settings:developer";
  icon = "code";
  title = ["Developer settings"];

  async missing_actions() {
    const profiles = await this.os.developer_profile.list();
    const key_store = this.os.settings.get("key_store");

    return [
      {
        type: "protect-store",
        missing: key_store.master_key == null,
      },
      {
        type: "make-profile",
        missing: profiles.length === 0,
      },
    ];
  }

  async body() {
    const actions = await this.missing_actions();
    const is_developer = actions.every((x) => !x.missing);

    return [
      UI.when(!is_developer, [
        UI.p([
          `Your console is not yet configured for publishing cartridges.
          If you want to create your own Kate cartridges, the configuration
          wizard will guide you through the necessary steps.
          `,
        ]),
        UI.p([
          `You'll need to create a developer profile and generate signing
          keys for your cartridges. The process will take a few minutes.`,
        ]),
        UI.text_button(this.os, "I want to make games for Kate!", {
          on_click: () => {
            this.os.push_scene(new SceneNewDeveloper(this.os), () => {
              this.refresh();
            });
          },
        }),
        UI.vspace(16),
        UI.h("h3", {}, ["I already have a profile!"]),
        UI.p([
          `If you have a backup file for a developer profile, you can also import `,
          `that backup file instead.`,
        ]),
        UI.text_button(this.os, "Import my profile backup file", {
          on_click: () => {
            this.import_backup();
          },
        }),
      ]),

      UI.when(is_developer, [...this.developer_settings()]),
    ];
  }

  developer_settings() {
    const data = this.os.settings.get("developer");

    return [
      UI.link_card(this.os, {
        icon: "user",
        title: "Developer profiles",
        description: "View and manager your developer profiles",
        on_click: () => {
          this.os.push_scene(new SceneDeveloperProfiles(this.os));
        },
      }),

      UI.h("h3", {}, ["Testing your Kate cartridges"]),
      UI.toggle_cell(this.os, {
        value: data.allow_version_overwrite,
        title: "Allow overwriting a cartridge",
        description: `
          Stop Kate from ignoring cartridge installs when the cartridge's
          version is already installed. Useful for iterating.
        `,
        on_changed: (v) => {
          this.change("allow_version_overwrite", v);
        },
      }),
    ];
  }

  async change<K extends keyof SettingsData["developer"]>(
    key: K,
    value: SettingsData["developer"][K]
  ) {
    await this.os.settings.update("developer", (x) => {
      return { ...x, [key]: value };
    });
    await this.os.audit_supervisor.log("kate:settings", {
      resources: ["kate:settings"],
      risk: "high",
      type: "kate.settings.developer.updated",
      message: "Updated developer settings",
      extra: { [key]: value },
    });
  }

  async import_backup() {
    const config = this.os.settings.get("key_store");
    if (config.master_key == null) {
      await this.os.dialog.message(this.application_id, {
        title: "Key store is not protected",
        message: `
          Before you can import your profile backup you'll need to 
          configure a master password for your key store. That way
          your private key can be stored securely.
        `,
      });
      this.os.push_scene(new SceneCreateMasterPassword(this.os), async () => {
        const config = this.os.settings.get("key_store");
        if (config == null) {
          return;
        }
        await import_from_file(this.os).catch((x) =>
          UI.show_error(this.os, "Failed to import backup", x)
        );
        this.refresh();
      });
    } else {
      await import_from_file(this.os).catch((x) =>
        UI.show_error(this.os, "Failed to import backup", x)
      );
      this.refresh();
    }
  }
}

export class SceneNewDeveloper extends UI.SimpleScene {
  readonly application_id = "kate:settings:developer:new";
  icon = "code";
  title = ["Create a developer profile"];
  data = {
    name: new Observable(""),
    domain: new Observable(""),
    has_master_key: new Observable(false),
    key_ids: new Observable<null | { private_key: KeyStore_v1; public_key: KeyStore_v1 }>(null),
  };
  non_empty_name = this.data.name.map((x) =>
    x.length > 0 ? null : `Publisher name cannot be empty`
  );
  valid_domain = this.data.domain.map((x) => {
    if (this.os.developer_profile.is_valid_domain(x)) {
      return null;
    } else {
      return `
        A publisher domain must be in the form 'domain.tld' (e.g.: 'qteati.me').
        It must have at least one part separated by '.', each part must have at least 2 characters,
        and the only allowed characters are letters, numbers, underscores ('_'), and hyphens ('-').
      `;
    }
  });

  body() {
    this.data.has_master_key.value = this.os.settings.get("key_store").master_key != null;

    return [
      UI.multistep(this.os, [
        {
          content: this.choose_profile(),
          valid: this.non_empty_name.zip_with(this.valid_domain, (name, domain) => {
            return name === null && domain === null;
          }),
        },
        {
          content: this.protect_key_store(),
          valid: this.data.has_master_key,
        },
        {
          content: this.generate_key_pair(),
          valid: this.data.key_ids.map((x) => x != null),
        },
        {
          content: this.confirm(),
        },
      ]),
    ];
  }

  choose_profile() {
    return UI.section({
      title: "Your publisher profile",
      contents: [
        UI.p([
          `You'll need a developer profile to publish Kate cartridges. This
        profile exists only locally in your Kate device—think of it as
        accounts in your computer. You pick one of them when publishing.`,
        ]),
        UI.vspace(16),

        UI.form((form) => {
          return [
            UI.field("Publisher name", [
              UI.text_input(this.os, {
                name: "publisher-name",
                type: "text",
                initial_value: this.data.name.value,
                write_to: this.data.name,
                placeholder: "Cute Games Studio",
              }),
              UI.klass("kate-ui-text-input-error", [
                UI.dynamic(this.non_empty_name as Observable<UI.Widgetable>),
              ]),
              UI.meta_text([`The name stamped as "developed by" in the cartridge.`]),
            ]),
            UI.vspace(16),
            UI.field("Publisher internet domain", [
              UI.text_input(this.os, {
                name: "publisher-domain",
                type: "text",
                initial_value: this.data.domain.value,
                write_to: this.data.domain,
                placeholder: "cute-games-studio.com",
              }),
              UI.klass("kate-ui-text-input-error", [
                UI.dynamic(this.valid_domain as Observable<UI.Widgetable>),
              ]),
              UI.meta_text([
                `Cartridges in Kate are associated with an internet domain, like
              'qteati.me'. You need to provide an internet domain or subdomain
              that you own in some capacity. If you publish your games on
              Itch.io, your profile's domain works (e.g.: 'my-name.itch.io')`,
              ]),
            ]),
          ];
        }),
      ],
    });
  }

  protect_key_store() {
    return UI.stack([
      UI.section({
        title: "Protecting your key store",
        contents: [
          UI.p([
            `When you publish a Kate cartridge you'll need to sign it digitally
            so players know the cartridge file they downloaded truly came from
            you.`,
          ]),

          UI.dynamic(
            this.data.has_master_key.map<UI.Widgetable>((has_key) => {
              if (has_key) {
                return UI.stack([
                  UI.p([
                    `Your key store is already protected with a master password.
                  You're all set!`,
                  ]),
                ]);
              } else {
                return UI.stack([
                  UI.p([
                    `You sign cartridges with a Cryptographic Signing Key. We'll generate
                one for you, and keep it secure in your device. You need to provide a
                password to encrypt this key and ensure that it can only be accessed
                by you.`,
                  ]),
                  UI.text_button(this.os, "Secure my key store with a password", {
                    on_click: async () => {
                      const config = this.os.settings.get("key_store");
                      if (config.master_key != null) {
                        this.data.has_master_key.value = true;
                        return;
                      } else {
                        this.os.push_scene(new SceneCreateMasterPassword(this.os), () => {
                          const config = this.os.settings.get("key_store");
                          this.data.has_master_key.value = config.master_key != null;
                        });
                      }
                    },
                  }),
                ]);
              }
            })
          ),
        ],
      }),
    ]);
  }

  generate_key_pair() {
    return UI.section({
      title: "Your signing keys",
      contents: [
        UI.p([
          `To sign cartridges you'll need a Cryptographic Signing Key. Signing keys
        used by Kate come in a pair: you use a private key to sign your cartridges,
        and your players use the public part of this key to verify your signature`,
        ]),
        UI.dynamic(
          this.data.key_ids.map<UI.Widgetable>((x) => {
            if (x == null) {
              return UI.stack([
                UI.p([
                  `We'll generate this pair of keys and store it securely in your key store
              so it's ready any time you wish to sign cartridges. Your private key is like
              a password, and you should never share it.
              Anyone with the private key could use it to sign cartridges as if they were you!`,
                ]),
                UI.text_button(this.os, "Generate my cartridge signing keys", {
                  on_click: async () => {
                    const keys = await this.os.key_manager.generate_key(
                      this.application_id,
                      this.data.domain.value,
                      `Kate signing keys for ${this.data.name.value}`
                    );
                    if (keys == null) {
                      await this.os.dialog.message(this.application_id, {
                        title: "Failed to generate keys",
                        message: `Something went wrong while generating your signing keys.`,
                      });
                    } else {
                      this.data.key_ids.value = {
                        private_key: keys.private_key,
                        public_key: keys.public_key,
                      };
                    }
                  },
                }),
              ]);
            } else {
              return UI.p([`Your signing keys are all set!`]);
            }
          })
        ),
      ],
    });
  }

  confirm() {
    return UI.section({
      title: "Confirm your details",
      contents: [
        UI.p([
          `Almost there! Once you confirm the details below we'll save your
        developer profile and you'll be ready to start publishing Kate cartridges!`,
        ]),
        UI.vspace(16),
        UI.info_line("Publisher name", [UI.dynamic(this.data.name as Observable<UI.Widgetable>)]),
        UI.info_line("Publisher domain", [
          UI.dynamic(this.data.domain as Observable<UI.Widgetable>),
        ]),
        UI.text_button(this.os, "Save my developer profile", {
          on_click: async () => {
            const keys = this.data.key_ids.value!;
            // Users can go back and update the domain, but the domain is stored
            // in the key records already when they're generated so we need to
            // make sure they match here.
            keys.private_key.domain = this.data.domain.value;
            keys.public_key.domain = this.data.domain.value;
            const profile = {
              name: this.data.name.value,
              domain: this.data.domain.value,
              icon: null,
              created_at: new Date(),
              key_id: keys.private_key.id,
              fingerprint: keys.public_key.fingerprint,
            };
            await this.os.key_manager
              .save_keys([keys.private_key, keys.public_key])
              .catch((x) => UI.show_error(this.os, "Failed to save keys", x));
            await this.os.developer_profile
              .add(profile)
              .catch((x) => UI.show_error(this.os, "Failed to add profile", x));
            await this.os.dialog.message(this.application_id, {
              title: "Developer profile created",
              message: `Your new developer profile is saved and ready to use!`,
            });
            this.close();
            this.os.push_scene(new SceneDeveloperViewProfile(this.os, profile));
          },
        }),
      ],
    });
  }
}

export class SceneDeveloperProfiles extends UI.SimpleScene {
  readonly application_id = "kate:settings:developer:profiles";
  icon = "user";
  title = ["Developer profiles"];

  actions: UI.Action[] = [
    {
      key: ["x"],
      label: "Return",
      handler: () => {
        this.on_return();
      },
    },
    {
      key: ["menu"],
      label: "Actions",
      handler: () => {
        this.handle_actions();
      },
    },
  ];

  async body() {
    const profiles = await this.os.developer_profile.list();
    return profiles.map((x) =>
      UI.link_card(this.os, {
        icon: "user",
        title: x.name,
        description: `${x.domain} | Created ${relative_date(x.created_at)}`,
        on_click: () => {
          this.os.push_scene(new SceneDeveloperViewProfile(this.os, x), () => {
            this.refresh();
          });
        },
      })
    );
  }

  async handle_actions() {
    const action = await this.os.dialog.pop_menu(
      this.application_id,
      `Actions on developer profiles`,
      [
        { label: "Import profile backup", value: "import-backup" as const },
        { label: "Create new profile", value: "new" as const },
      ],
      null
    );

    switch (action) {
      case null: {
        return;
      }

      case "new": {
        this.os.push_scene(new SceneNewDeveloper(this.os), () => {
          this.refresh();
        });
        return;
      }

      case "import-backup": {
        await import_from_file(this.os).catch((x) =>
          UI.show_error(this.os, "Failed to import backup", x)
        );
        this.refresh();
        return;
      }

      default:
        throw unreachable(action);
    }
  }
}

export class SceneDeveloperViewProfile extends UI.SimpleScene {
  readonly application_id = "kate:settings:developer:view-profile";
  icon = "user";
  get title() {
    return [`Profile for ${this.profile.name}`];
  }

  actions: UI.Action[] = [
    {
      key: ["x"],
      label: "Return",
      handler: () => {
        this.on_return();
      },
    },
    {
      key: ["menu"],
      label: "Actions",
      handler: () => {
        this.handle_actions();
      },
    },
  ];

  constructor(os: KateOS, readonly profile: DeveloperProfile) {
    super(os);
  }

  async body() {
    const { private_key, public_key } = await this.os.developer_profile.get_keys(
      this.profile.domain
    );

    return [
      UI.info_line("Publisher name", [this.profile.name]),
      UI.info_line("Publisher domain", [this.profile.domain]),
      UI.info_line("Created at", [this.profile.created_at.toISOString()]),

      UI.vspace(16),
      UI.section({
        title: "Signing key fingerprints",
        contents: [
          UI.info_line("Private key", [UI.mono_text([private_key.fingerprint])]),
          UI.info_line("Public key", [UI.mono_text([public_key.fingerprint])]),
        ],
      }),
    ];
  }

  async handle_actions() {
    const action = await this.os.dialog.pop_menu(
      this.application_id,
      `Actions on ${this.profile.name}`,
      [
        { label: "Export public key", value: "export-public-key" as const },
        { label: "Export profile backup", value: "backup" as const },
        { label: "Delete profile", value: "delete" as const },
      ],
      null
    );
    switch (action) {
      case null:
        return;

      case "export-public-key": {
        const { public_key } = await this.os.developer_profile.get_keys(this.profile.domain);
        const pem = this.os.key_manager.export_public_key(public_key.key);
        download_blob(new Blob([pem]), `${this.profile.domain}-public-key.pem`);
        return;
      }

      case "backup": {
        const bkp = await this.os.developer_profile.export_backup(this.profile.domain);
        const source = JSON.stringify(bkp, null, 2);
        const blob = new Blob([new TextEncoder().encode(source)]);
        download_blob(blob, `${this.profile.domain}-backup.json`);
        return;
      }

      case "delete": {
        const ok = await this.os.dialog.confirm(this.application_id, {
          title: `Delete profile ${this.profile.name}`,
          message: `Are you sure you want to delete the profile ${this.profile.name} (${this.profile.domain})?
            This operation is irreversible.
            `,
          dangerous: true,
          ok: "Delete profile",
        });
        if (ok) {
          await this.os.developer_profile.delete(this.profile.domain);
          this.close();
        }
        return;
      }

      default:
        throw unreachable(action);
    }
  }
}

function download_blob(blob: Blob, name: string) {
  const a = document.createElement("a");
  document.body.appendChild(a);
  a.style.display = "none";
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
}

async function import_from_file(os: KateOS) {
  const [file] = await os.device_file.open_file("kate:settings:developer-profile", {
    types: [{ description: "JSON profile backups", accept: { "application/json": [".json"] } }],
  });
  if (file == null) {
    return;
  }
  const data = new Uint8Array(await file.handle.arrayBuffer());
  const json = JSON.parse(new TextDecoder().decode(data));
  await os.developer_profile.import_backup(json, false);
}
