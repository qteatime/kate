#!/usr/bin/env node
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
const { parseArgs } = require("util");
const Spec = require("../build/deps/util").Spec;
const Dist = require("../build/kate-dist");

const options = {
  output_directory: {
    type: "string",
    default: "dist",
  },
  type: {
    type: "string",
  },
  overwrite: {
    type: "boolean",
    default: false,
  },
  case_mode: {
    type: "string",
    default: "handheld",
  },
  resolution: {
    type: "string",
    default: "480",
  },
  scale_to_fit: {
    type: "boolean",
    default: false,
  },
  help: {
    type: "boolean",
    short: "h",
  },
};

const parsed = parseArgs({
  args: process.argv.slice(2),
  options,
  allowPositionals: true,
});
const {
  values: { output_directory, type, overwrite, help },
  positionals: [cart],
} = parsed;

const case_mode_parser = Spec.map(
  Spec.spec({
    case_mode: Spec.one_of(["handheld", "tv", "fullscreen"]),
    resolution: Spec.map(Spec.one_of(["480", "720"]), (x) => Number(x)),
    scale_to_fit: Spec.bool,
  }),
  (x) => ({
    type: x.case_mode,
    resolution: x.resolution,
    scale_to_fit: x.scale_to_fit,
  })
);

const config = {
  case_mode: Spec.parse(case_mode_parser, parsed.values),
};

if (!output_directory || !cart || help) {
  console.log(`Usage: kate-dist <game.kart> [--overwrite] [--output_directory <dir>] [--type web]
  
Generates a standalone distribution from a Kate cartridge; that is, one which
packages the emulator and the game as a single thing. Currently only web 
packages are supported.

Options:

  --overwrite
      If not provided, the tool will abort if the output directory
      already exists, as a safe-guard.

  --output_directory  [default: 'dist']
      The directory where the package files will be placed on. Defaults
      to 'dist'.

  --type  [default: 'web']
      The type of distribution that should be generated. 'web' is the
      only supported format currently.

      'web'
        Generates an HTML5 package containing the Kate emulator booting
        straight into the game, which can be uploaded to stores like Itch.io.

  --case_mode  [default: 'handheld']
      The type of emulator chrome to use. See the user manual for details.

      'handheld'
        Includes virtual buttons in to the sides and on the top of the chrome,
        like in a physical handheld.

      'tv'
        Includes borders around the screen, but no virtual buttons. Requires
        a keyboard or gamepad to play.

      'fullscreen'
        Lets the game take the whole available screen, does not include virtual
        buttons. Requires a keyboard or gamepad to play.

  --resolution  [default: '480']
      The screen resolution as given by the screen height.

      '480'
        A 800x480 resolution.

      '720'
        A 1200x720 resolution.

  --scale_to_fit  [default: false]
      If provided, Kate will upscale the emulator to fit all available screen
      size. This might result in blurry/pixelated images.
  `);
  process.exit(1);
}

Dist.generate(cart, output_directory, type, overwrite, config).catch(
  (error) => {
    console.error(`Failed to generate a distribution for ${cart}\n`);
    console.error(error);
    process.exit(1);
  }
);
