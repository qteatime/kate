import { Database } from "../db-schema";
import * as KateDb from "../data";
import * as Cart from "../cart";
import type { KateKernel } from "../kernel/kate";
import { EventStream } from "../utils";
import { wait } from "./time";
import { Scene } from "./ui/scenes";
import { SceneBoot } from "./apps/boot";
import { SceneHome } from "./apps/home";
import { CartManager } from "./apis/cart-manager";
import { KateProcesses } from "./apis/processes";
import { KateContextMenu } from "./apis/context_menu";
import { KateNotification } from "./apis/notification";
import { KateDropInstaller } from "./apis/drop-installer";
import { KateFocusHandler } from "./apis/focus-handler";
import { KateStatusBar } from "./apis/status-bar";
import { KateIPCServer } from "./apis/ipc";
import { KateAudioServer, KateObjectStore } from "./apis";
import { KateDialog } from "./apis/dialog";
import { KateCapture } from "./apis/capture";
import { KateSfx } from "./sfx";
import { KateSettings } from "./apis/settings";
import { InputKey } from "../kernel";

export class KateOS {
  private _scene_stack: Scene[] = [];
  private _active_hud: Scene[] = [];
  private _current_scene: Scene | null = null;
  readonly cart_manager: CartManager;
  readonly processes: KateProcesses;
  readonly context_menu: KateContextMenu;
  readonly notifications: KateNotification;
  readonly installer: KateDropInstaller;
  readonly focus_handler: KateFocusHandler;
  readonly status_bar: KateStatusBar;
  readonly object_store: KateObjectStore;
  readonly ipc: KateIPCServer;
  readonly dialog: KateDialog;
  readonly capture: KateCapture;
  readonly events = {
    on_cart_inserted: new EventStream<Cart.CartMeta>(),
    on_cart_removed: new EventStream<{ id: string; title: string }>(),
  };

  private constructor(
    readonly kernel: KateKernel,
    readonly db: Database,
    readonly sfx: KateSfx,
    readonly settings: KateSettings
  ) {
    this.cart_manager = new CartManager(this);
    this.processes = new KateProcesses(this);
    this.object_store = new KateObjectStore(this);
    this.context_menu = new KateContextMenu(this);
    this.context_menu.setup();
    this.notifications = new KateNotification(this);
    this.notifications.setup();
    this.installer = new KateDropInstaller(this);
    this.installer.setup();
    this.focus_handler = new KateFocusHandler(this);
    this.focus_handler.setup();
    this.status_bar = new KateStatusBar(this);
    this.status_bar.setup();
    this.ipc = new KateIPCServer(this);
    this.ipc.setup();
    this.dialog = new KateDialog(this);
    this.dialog.setup();
    this.capture = new KateCapture(this);
  }

  get display() {
    return this.kernel.console.os_root;
  }

  get hud_display() {
    return this.kernel.console.hud;
  }

  get current_scene() {
    return this._current_scene;
  }

  push_scene(scene: Scene) {
    if (this._current_scene != null) {
      this._scene_stack.push(this._current_scene);
    }
    this._current_scene = scene;
    scene.attach(this.display);
    scene.canvas.classList.remove("kate-os-leaving");
    scene.canvas.classList.add("kate-os-entering");
    this.focus_handler.push_root(scene.canvas);
  }

  pop_scene() {
    if (this._current_scene != null) {
      this.focus_handler.pop_root(this._current_scene.canvas);
      const scene = this._current_scene;
      scene.canvas.classList.remove("kate-os-entering");
      scene.canvas.classList.add("kate-os-leaving");
      wait(250).then(() => {
        scene.detach();
      });
    }
    this._current_scene = this._scene_stack.pop() ?? null;
    if (
      this._current_scene != null &&
      this.focus_handler.current_root !== this._current_scene.canvas
    ) {
      console.warn(
        `[Kate] incorrect focus root when moving scenes`,
        "Expected:",
        this._current_scene.canvas,
        "Got:",
        this.focus_handler.current_root
      );
    }
  }

  replace_scene(scene: Scene) {
    this.pop_scene();
    this.push_scene(scene);
  }

  show_hud(scene: Scene) {
    this._active_hud.push(scene);
    scene.attach(this.hud_display);
  }

  hide_hud(scene: Scene) {
    this._active_hud = this._active_hud.filter((x) => x !== scene);
    scene.detach();
  }

  make_audio_server() {
    return new KateAudioServer(this.kernel);
  }

  handle_virtual_button_feedback = (key: InputKey) => {
    const settings = this.settings.get("input");
    if (settings.haptic_feedback_for_virtual_button) {
      this.kernel.console.vibrate(30);
    }
  };

  set_os_animation(enabled: boolean) {
    this.display.classList.toggle("disable-animation", !enabled);
  }

  static async boot(kernel: KateKernel) {
    // Setup OS
    const sfx = await KateSfx.make(kernel);
    const { db, old_version } = await KateDb.kate.open();
    const settings = await KateSettings.load(db);
    const os = new KateOS(kernel, db, sfx, settings);
    kernel.console.on_virtual_button_touched.listen(
      os.handle_virtual_button_feedback
    );
    kernel.keyboard.remap(settings.get("input").keyboard_mapping);
    sfx.set_enabled(settings.get("ui").sound_feedback);
    os.set_os_animation(settings.get("ui").animation_effects);

    const min_boot_time = wait(1000);
    const boot_screen = new SceneBoot(os);

    // Perform boot operations (migrations, etc)
    await request_persistent_storage(os);
    os.push_scene(boot_screen);

    await KateDb.kate.run_data_migration(
      old_version,
      db,
      (migration, current, total) => {
        boot_screen.set_message(
          `Updating database (${current} of ${total}): ${migration.description}`
        );
      }
    );

    boot_screen.set_message("");

    await min_boot_time;
    os.pop_scene();

    // Show start screen
    os.push_scene(new SceneHome(os));
    return os;
  }
}

async function request_persistent_storage(os: KateOS) {
  if (
    navigator.storage?.persisted == null ||
    navigator.storage?.persist == null
  ) {
    os.kernel.console.take_resource("transient-storage");
    return;
  }

  if (
    os.kernel.console.options.persistent_storage &&
    !(await navigator.storage.persisted())
  ) {
    const persistent = await navigator.storage.persist();
    if (persistent) {
      return;
    }
  }
  if (!(await navigator.storage.persisted())) {
    os.kernel.console.take_resource("transient-storage");
  }
}
