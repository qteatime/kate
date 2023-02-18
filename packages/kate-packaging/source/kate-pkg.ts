import * as Path from "path";
import * as FS from "fs";
import * as Glob from "glob";

const [kind, out0, cart, overwrite0] = process.argv.slice(2);

if (!kind || !out0 || !cart) {
  console.log("Usage: kate-pkg web <out-dir> <game.kart> [--overwrite]");
  process.exit(1);
}

const overwrite = overwrite0 === "--overwrite";
const out = Path.resolve(out0);
const www_root = Path.join(__dirname, "../../../www");
const asset_root = Path.join(__dirname, "../assets");

function copy(root: string, from: string) {
  console.log("-> Copying", from);
  FS.mkdirSync(Path.dirname(Path.join(out, from)), { recursive: true });
  FS.copyFileSync(Path.join(root, from), Path.join(out, from));
}

async function main() {
  switch (kind) {
    case "web": {
      const files = Glob.sync("**/*", { cwd: www_root, nodir: true });
      if (FS.existsSync(out) && !overwrite) {
        console.log("Output directory already exists. Aborting");
        return;
      }
      FS.mkdirSync(out, { recursive: true });
      for (const file of files) {
        if (file === "index.html") {
          continue;
        }
        copy(www_root, file);
      }
      copy(asset_root, "index.html");
      console.log(`-> Copying cartridge (${cart})`);
      FS.copyFileSync(cart, Path.join(out, "game.kart"));
      break;
    }

    default: {
      throw new Error(`Unsupported packaging type: ${kind}`);
    }
  }
}

main();
