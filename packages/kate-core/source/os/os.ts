import { Database } from "../db-schema";
import * as KateDb from "../data";
import * as Cart from "../cart";
import type { KateKernel } from "../kernel/kate";
import { EventStream } from "../utils";
import { wait } from "./time";
import { Scene, SceneBoot, SceneHome } from "./ui/scenes";
import { CartManager } from "./apis/cart-manager";
import { KateProcesses } from "./apis/processes";
import { KateContextMenu } from "./apis/context_menu";
import { KateNotification } from "./apis/notification";
import { KateDropInstaller } from "./apis/drop-installer";
import { KateFocusHandler } from "./apis/focus-handler";
import { KateStatusBar } from "./apis/status-bar";
import { KateKVStorage } from "./apis/kv_storage";
import { KateIPCServer } from "./apis/ipc";
import { KateAudioServer } from "./apis";
import { KateDialog } from "./apis/dialog";
import { KateCapture } from "./apis/capture";
import { KateSfx } from "./sfx";

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
  readonly kv_storage: KateKVStorage;
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
    readonly sfx: KateSfx
  ) {
    this.cart_manager = new CartManager(this);
    this.processes = new KateProcesses(this);
    this.kv_storage = new KateKVStorage(this);
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

  push_scene(scene: Scene, accept_focus: boolean = true) {
    if (this._current_scene != null) {
      this._scene_stack.push(this._current_scene);
    }
    this._current_scene = scene;
    scene.attach(this.display);
    if (accept_focus) {
      this.focus_handler.push_root(scene.canvas);
    } else {
      this.focus_handler.push_root(null);
    }
  }

  pop_scene() {
    if (this._current_scene != null) {
      this.focus_handler.pop_root(this._current_scene.canvas);
      this._current_scene.detach();
    }
    this._current_scene = this._scene_stack.pop() ?? null;
    this.focus_handler.push_root(this._current_scene?.canvas ?? null);
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

  static async boot(kernel: KateKernel) {
    const sfx = await KateSfx.make(kernel);
    const { db } = await KateDb.kate.open();
    const os = new KateOS(kernel, db, sfx);
    await request_persistent_storage(os);
    const boot_screen = new SceneBoot(os);
    os.push_scene(boot_screen);
    await wait(2100);
    os.pop_scene();
    os.push_scene(new SceneHome(os));
    return os;
  }
}

async function request_persistent_storage(os: KateOS) {
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
