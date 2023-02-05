import { Database } from "../db";
import * as KateDb from "./apis/db"
import * as Cart from "../generated/cartridge";
import type {Kate} from "../kate-kernel/kate"
import { EventStream } from "../util/events";
import { KateStorage } from "./apis/file_storage";
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

export class KateOS {
  private _scene_stack: Scene[] = [];
  private _active_hud: Scene[] = [];
  private _current_scene: Scene | null = null;
  readonly storage: KateStorage;
  readonly cart_manager: CartManager;
  readonly processes: KateProcesses;
  readonly context_menu: KateContextMenu;
  readonly notifications: KateNotification;
  readonly installer: KateDropInstaller;
  readonly focus_handler: KateFocusHandler;
  readonly status_bar: KateStatusBar;
  readonly kv_storage: KateKVStorage;
  readonly events = {
    on_cart_inserted: new EventStream<Cart.Cartridge>()
  }

  private constructor(readonly kernel: Kate, readonly db: Database) {
    this.storage = new KateStorage(this);
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
    this.focus_handler.change_root(scene.canvas)
  }

  pop_scene() {
    if (this._current_scene != null) {
      this._current_scene.detach();
    }
    this._current_scene = this._scene_stack.pop() ?? null;
    this.focus_handler.change_root(this._current_scene?.canvas ?? null);
  }

  show_hud(scene: Scene) {
    this._active_hud.push(scene);
    scene.attach(this.hud_display);
  }

  hide_hud(scene: Scene) {
    this._active_hud = this._active_hud.filter(x => x !== scene);
    scene.detach();
  }

  static async boot(kernel: Kate) {
    const db = await KateDb.kate.open();
    const os = new KateOS(kernel, db);
    const boot_screen = new SceneBoot(os);
    os.push_scene(boot_screen);
    await wait(2100);
    os.pop_scene();
    os.push_scene(new SceneHome(os));
    return os;
  }
}