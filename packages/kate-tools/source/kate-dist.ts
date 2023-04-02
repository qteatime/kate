import * as Path from "path";
import * as FS from "fs";
import * as Glob from "glob";

const www_root = Path.join(__dirname, "../packaging/web");
const asset_root = Path.join(__dirname, "../assets");

const ignored_files = new Set(["index.html", "manifest.json", "worker.js"]);

function copy(root: string, from: string, out: string) {
  console.log("-> Copying", from);
  FS.mkdirSync(Path.dirname(Path.join(out, from)), { recursive: true });
  FS.copyFileSync(Path.join(root, from), Path.join(out, from));
}

export async function generate(
  cart: string,
  out: string,
  kind: string,
  overwrite: boolean
) {
  switch (kind) {
    case "web": {
      const files = Glob.sync("**/*", { cwd: www_root, nodir: true });
      if (FS.existsSync(out) && !overwrite) {
        console.log("Output directory already exists. Aborting");
        return;
      }
      FS.mkdirSync(out, { recursive: true });
      for (const file of files) {
        if (ignored_files.has(file)) {
          continue;
        }
        copy(www_root, file, out);
      }
      copy(asset_root, "index.html", out);
      console.log(`-> Copying cartridge (${cart})`);
      FS.copyFileSync(cart, Path.join(out, "game.kart"));
      break;
    }

    default: {
      throw new Error(`Unsupported packaging type: ${kind}`);
    }
  }
}
