import type { kernel, os } from "./index";
declare var Kate: {
  kernel: typeof kernel;
  os: typeof os;
};

const DEFAULT_CHANNEL =
  location.hostname === "kate.qteati.me" ? "preview" : "latest";

type Version = {
  version: string;
  main: string;
  breaking_change: boolean;
  migration_needed: boolean;
  channels: string[];
  release_notes: string;
};

type VersionMeta = {
  versions: Version[];
  channels: { [key: string]: string };
};

async function cache_version(version: Version) {
  const cache_name = "kate-web-cache";
  const app_files = [
    "/",
    "/manifest.json",
    "/loader.js",
    // CSS
    "/css/kate.css",
    "/css/kate-os.css",
    "/css/os/animation.css",
    "/css/os/content.css",
    "/css/os/core.css",
    "/css/os/fonts.css",
    "/css/os/index.css",
    "/css/os/reset.css",
    "/css/os/ui-old.css",
    "/css/os/ui.css",
    "/css/os/hud/context-menu.css",
    "/css/os/hud/dialog-message.css",
    "/css/os/hud/dialog-progress.css",
    "/css/os/hud/drop-installer.css",
    "/css/os/hud/index.css",
    "/css/os/hud/notifications.css",
    "/css/os/hud/pop-menu.css",
    "/css/os/hud/status-bar.css",
    "/css/os/screens/about.css",
    "/css/os/screens/apps.css",
    "/css/os/screens/home.css",
    "/css/os/screens/index.css",
    "/css/os/screens/loading.css",
    "/css/os/screens/logo.css",
    "/css/os/screens/media.css",
    "/css/os/themes/candy-pop.css",
    // Fonts
    "/fonts/fontawesome/css/fontawesome.css",
    "/fonts/fontawesome/css/solid.css",
    "/fonts/fontawesome/webfonts/fa-solid-900.ttf",
    "/fonts/poppins/Poppins-Light.ttf",
    "/fonts/poppins/Poppins-Medium.ttf",
    "/fonts/poppins/Poppins-Regular.ttf",
    "/fonts/roboto/Roboto-Bold.ttf",
    "/fonts/roboto/Roboto-BoldItalic.ttf",
    "/fonts/roboto/Roboto-Italic.ttf",
    "/fonts/roboto/Roboto-Medium.ttf",
    "/fonts/roboto/Roboto-MediumItalic.ttf",
    "/fonts/roboto/Roboto-Regular.ttf",
    "/fonts/roboto-mono/RobotoMono-Bold.ttf",
    "/fonts/roboto-mono/RobotoMono-Regular.ttf",
    // Images
    "/img/cancel.png",
    "/img/down.png",
    "/img/kate-chan.png",
    "/img/left.png",
    "/img/ok.png",
    "/img/right.png",
    "/img/up.png",
    "/icons/icon16.png",
    "/icons/icon32.png",
    "/icons/icon64.png",
    "/icons/icon128.png",
    "/icons/icon256.png",
    // Sounds
    "/sfx/cursor.wav",
    "/sfx/invalid.wav",
    "/sfx/select.wav",
    "/sfx/shutter.wav",
  ];
  try {
    const cache = await caches.open(cache_name);
    await cache.addAll(app_files);
    await cache.add(version.main);
  } catch (e) {
    console.error("[Kate] cache unavailable");
  }
}

async function load_script(url: string) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.onload = () => resolve();
    script.onerror = (ev, source, lineno, colno, error) => {
      console.error(
        `[Kate] failed to load script at ${url}`,
        ev,
        source,
        lineno,
        colno,
        error
      );
      reject(new Error(`failed to load script at ${url}`));
    };
    script.src = url;
    document.body.appendChild(script);
  });
}

async function load_kate(version: Version) {
  try {
    await load_script(version.main);
  } catch (e) {
    alert(`Kate version ${version.version} could not be found.`);
    return;
  }
}

async function main() {
  let version: Version | null = JSON.parse(
    localStorage["kate-version"] ?? "null"
  );
  const channel: string = localStorage["kate-channel"] || DEFAULT_CHANNEL;
  if (version == null) {
    const versions = (await fetch("versions.json").then((x) =>
      x.json()
    )) as VersionMeta;
    const latest = versions.channels[channel];
    version = versions.versions.find((x) => x.version === latest) ?? null;
    if (version == null) {
      alert("Could not find a Kate version to download.");
      return;
    }
    localStorage["kate-version"] = JSON.stringify(version);
    localStorage["kate-channel"] = channel;
    await load_kate(version);
    await cache_version(version);
  } else {
    await load_kate(version);
  }

  // Run Kate
  const kate = Kate.kernel.KateKernel.from_root(
    document.querySelector(".kate")!,
    {
      mode: "web",
      persistent_storage: true,
    }
  );
  const kate_os = await Kate.os.KateOS.boot(kate);
}

main();
