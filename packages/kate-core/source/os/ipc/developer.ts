/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { TC, relative_date } from "../../utils";
import type { KateOS } from "../os";
import { EMessageFailed, auth_handler } from "./handlers";
import * as UI from "../ui";
import type { Process } from "../../kernel";
import type { DeveloperProfile } from "../../data";

type ExportedProfile = {
  cid: string;
  name: string;
  domain: string;
  fingerprint: string;
};

async function ask_for_profile(
  os: KateOS,
  process: Process,
  requestee: string
): Promise<ExportedProfile | null> {
  const profiles = await os.developer_profile.list();
  const selected = await os.dialog.action_menu(requestee, {
    title: `Choose a developer profile to expose`,
    description: UI.p([
      `Cartridge `,
      UI.inline(UI.mono_text([requestee])),
      ` will have access `,
      `to the basic profile data (name, domain, public key fingerprint) of the `,
      `account you choose below.`,
    ]),
    cancel_value: null,
    options: profiles.map((x) => {
      return {
        icon: UI.fa_icon("user"),
        title: x.name,
        description: UI.hbox(0.3, [
          UI.mono_text([x.domain]),
          `| Created ${relative_date(x.created_at)}`,
        ]),
        value: x,
      };
    }),
  });

  if (selected != null) {
    const id = await os.process_data_supervisor.put_object(process.id, selected);
    return {
      cid: id,
      name: selected.name,
      domain: selected.domain,
      fingerprint: selected.fingerprint,
    };
  } else {
    return null;
  }
}

export default [
  auth_handler(
    "kate:developer.get-profile",
    TC.spec({}),
    { capabilities: [{ type: "view-developer-profile" }] },
    async (os, process, ipc, {}) => {
      return await ask_for_profile(os, process, process.id);
    }
  ),

  auth_handler(
    "kate:developer.sign",
    TC.spec({ profile_cid: TC.str, message: TC.bytearray }),
    { capabilities: [{ type: "sign-digitally" }] },
    async (os, process, ipc, { profile_cid, message }) => {
      const profile = (await os.process_data_supervisor.read_object(
        process.id,
        profile_cid
      )) as DeveloperProfile | null;
      if (profile == null) {
        throw new EMessageFailed(
          "kate.os.developer.invalid-capability",
          `Provided profile capability id is invalid`
        );
      }

      const should_sign = await os.dialog.confirm("kate:capability-check", {
        title: "Attach your digital signature?",
        message: UI.stack([
          UI.flow([
            UI.mono_text([process.cartridge.id]),
            " wants to attach your digital ",
            "signature using the following profile:",
          ]),
          UI.developer_profile_chip(profile),
        ]),
        cancel: "Cancel",
        ok: "Attach digital signature",
      });

      if (should_sign) {
        return os.developer_profile.sign(process.id, profile, message);
      } else {
        return null;
      }
    }
  ),
];
