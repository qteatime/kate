interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<any>): void;
}

let version: string | null = null;

self.addEventListener("message", (ev) => {
  if (ev.data?.type === "set-version") {
    version = ev.data?.version;
  }
});

async function cache_version(version: string) {
  const cache_name = "kate-cache-v1";
  const app_files = [
    "/",
    "/manifest.json",
    "/loader.js",
    // CSS
    "/css/kate.css",
    "/css/kate-os.css",
    "/css/os/accessibility.css",
    "/css/os/animation.css",
    "/css/os/content.css",
    "/css/os/core.css",
    "/css/os/fonts.css",
    "/css/os/index.css",
    "/css/os/reset.css",
    "/css/os/ui-old.css",
    "/css/os/ui.css",
    "/css/os/hud/base-dialog.css",
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
    "/css/os/screens/dialog.css",
    "/css/os/screens/gamepad-mapping.css",
    "/css/os/screens/gamepad-settings.css",
    "/css/os/screens/gamepad.css",
    "/css/os/screens/home.css",
    "/css/os/screens/index.css",
    "/css/os/screens/input-settings.css",
    "/css/os/screens/kate-wireframe.css",
    "/css/os/screens/keyboard-mapping.css",
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
    "/img/buttons/cancel.png",
    "/img/buttons/cancel.png",
    "/img/buttons/dpad-down.png",
    "/img/buttons/dpad-fill.png",
    "/img/buttons/dpad-horizontal.png",
    "/img/buttons/dpad-left.png",
    "/img/buttons/dpad-lower.png",
    "/img/buttons/dpad-right.png",
    "/img/buttons/dpad-stroke.png",
    "/img/buttons/dpad-up.png",
    "/img/buttons/dpad-upper.png",
    "/img/buttons/dpad-vertical.png",
    "/img/buttons/l.png",
    "/img/buttons/menu.png",
    "/img/buttons/r.png",
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
    // Kate JS
    `/kate/kate-${version}.js`,
  ];
  try {
    const cache = await caches.open(cache_name);
    await cache.addAll(app_files);
  } catch (e) {
    console.error("[Kate] cache unavailable");
  }
}

self.addEventListener("install", (ev0: any) => {
  const ev = ev0 as ExtendableEvent;
  ev.waitUntil(
    (async () => {
      if (version != null) {
        const version_id = JSON.parse(version).version;
        await cache_version(version_id);
      }
    })()
  );
});
