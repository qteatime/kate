#!/usr/bin/env node
const { parseArgs } = require("util");
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
  help: {
    type: "boolean",
    short: "h",
  },
};

const {
  values: { output_directory, type, overwrite, help },
  positionals: [cart],
} = parseArgs({ args: process.argv.slice(2), options, allowPositionals: true });

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

  --type web
      The type of distribution that should be generated. 'web' is the
      only supported format currently.

      'web'
        Generates an HTML5 package containing the Kate emulator booting
        straight into the game, which can be uploaded to stores like Itch.io.
  `);
  process.exit(1);
}

Dist.generate(cart, output_directory, type, overwrite).catch((error) => {
  console.error(`Failed to generate a distribution for ${cart}\n`);
  console.error(error);
  process.exit(1);
});
