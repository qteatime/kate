/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

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
import { KateIPCServer } from "./ipc";
import { KateAudioServer, KateFileStore, KateObjectStore } from "./apis";
import { KateDialog } from "./apis/dialog";
import { KateCapture } from "./apis/capture";
import { KateSfx } from "./sfx";
import { KateSettings } from "./apis/settings";
import { KateStorageManager } from "./apis/storage-manager";
import { KatePlayHabits } from "./apis/play-habits";
import { KateAppResources } from "./apis/app-resources";
import { KateBrowser } from "./apis/browse";
import { KateCapabilitySupervisor } from "./services/capability-supervisor";
import { KateAuditSupervisor } from "./services/audit-supervisor";
import { KateDeviceFile } from "./apis/device-file";
import { KateFairnessSupervisor } from "./services/fairness-supervisor";
import { ButtonChangeEvent } from "../kernel";

export type CartChangeReason = "installed" | "removed" | "archived" | "save-data-changed";

const trace_messages = new URL(document.URL).searchParams.get("trace") === "true";

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
  readonly storage_manager: KateStorageManager;
  readonly play_habits: KatePlayHabits;
  readonly app_resources: KateAppResources;
  readonly browser: KateBrowser;
  readonly device_file: KateDeviceFile;
  readonly file_store: KateFileStore;
  // Services
  readonly capability_supervisor: KateCapabilitySupervisor;
  readonly audit_supervisor: KateAuditSupervisor;
  readonly fairness_supervisor: KateFairnessSupervisor;
  readonly TRACE_ENABLED = trace_messages;

  readonly events = {
    on_cart_inserted: new EventStream<Cart.CartMeta>(),
    on_cart_removed: new EventStream<{ id: string; title: string }>(),
    on_cart_archived: new EventStream<string>(),
    on_cart_changed: new EventStream<{
      id: string;
      reason: CartChangeReason;
    }>(),
  };

  private constructor(
    readonly kernel: KateKernel,
    readonly db: Database,
    readonly sfx: KateSfx,
    readonly settings: KateSettings
  ) {
    // TODO: move setup functions outside
    this.cart_manager = new CartManager(this);
    this.processes = new KateProcesses(this);
    this.processes.setup();
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
    this.dialog = new KateDialog(this);
    this.capture = new KateCapture(this);
    this.play_habits = new KatePlayHabits(this);
    this.storage_manager = new KateStorageManager(this);
    this.storage_manager.setup();
    this.app_resources = new KateAppResources(this);
    this.browser = new KateBrowser(this);
    this.device_file = new KateDeviceFile(this);
    this.capability_supervisor = new KateCapabilitySupervisor(this);
    this.audit_supervisor = new KateAuditSupervisor(this);
    this.fairness_supervisor = new KateFairnessSupervisor(this);
    this.file_store = new KateFileStore();
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
    console.debug(`[kate:os] Entering ${scene.application_id}`);
    if (this._current_scene != null) {
      this._scene_stack.push(this._current_scene);
    }
    this._current_scene = scene;
    scene.attach(this.display);
    scene.canvas.classList.remove("kate-os-leaving");
    scene.canvas.classList.add("kate-os-entering");
    this.focus_handler.push_root(scene.canvas);
    this.kernel.set_running_process(scene.application_id, this.is_trusted(scene.application_id));
    wait(300).then((_) => scene.canvas.classList.remove("kate-os-entering"));
  }

  pop_scene(scene0: Scene) {
    console.debug(`[kate:os] Leaving ${scene0.application_id}`);
    const popped_scene =
      this._current_scene === scene0
        ? this._current_scene
        : this._scene_stack.find((x) => x === scene0);
    if (popped_scene == null) {
      console.warn(`[Kate] pop_scene() called with inactive scene`, scene0);
      return;
    }

    this.focus_handler.pop_root(popped_scene.canvas);
    if (this._current_scene === popped_scene) {
      popped_scene.canvas.classList.remove("kate-os-entering");
      popped_scene.canvas.classList.add("kate-os-leaving");
      wait(250).then(() => {
        popped_scene.detach();
        popped_scene.canvas.classList.remove("kate-os-leaving");
      });
      const scene = (this._current_scene = this._scene_stack.pop() ?? null);
      if (scene != null) {
        this.kernel.set_running_process(
          scene.application_id,
          this.is_trusted(scene.application_id)
        );
      }
    } else {
      popped_scene.detach();
      this._scene_stack = this._scene_stack.filter((x) => x !== popped_scene);
    }
  }

  replace_scene(old: Scene, scene: Scene) {
    this.pop_scene(old);
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

  handle_virtual_button_feedback = (ev: ButtonChangeEvent) => {
    const ignore = ["up", "down", "left", "right"];
    if (ev.is_pressed && !ignore.includes(ev.button)) {
      const settings = this.settings.get("input");
      if (settings.haptic_feedback_for_virtual_button) {
        this.kernel.console.vibrate(30);
      }
    }
  };

  set_os_animation(enabled: boolean) {
    this.display.classList.toggle("disable-animation", !enabled);
  }

  private is_trusted(id: string) {
    // FIXME: this should rather rely on application signatures, but it's
    // currently "safe enough" in that cartridges' ids are very restricted.
    return id.startsWith("kate:");
  }

  static async boot(kernel: KateKernel, x: { database?: string; set_case_mode?: boolean } = {}) {
    // Setup OS
    console.debug(`[kate:os] Starting OS boot sequence`);
    const sfx = await KateSfx.make(kernel);
    console.debug(`[kate:os] Opening the Kate database`);
    const { db, old_version } = await KateDb.kate.open(x.database);
    console.debug(`[kate:os] Loading player settings`);
    const settings = await KateSettings.load(db);
    const os = new KateOS(kernel, db, sfx, settings);
    console.debug(`[kate:os] Initialising and configuring OS services`);
    kernel.console.button_input.virtual_source.on_button_changed.listen(
      os.handle_virtual_button_feedback
    );
    kernel.keyboard_source.remap(settings.get("input").keyboard_mapping);
    kernel.gamepad_source.remap(settings.get("input").gamepad_mapping.standard);
    kernel.gamepad_source.set_primary(settings.get("input").paired_gamepad);
    sfx.set_enabled(settings.get("ui").sound_feedback);
    os.set_os_animation(settings.get("ui").animation_effects);
    if (x.set_case_mode !== false) {
      kernel.console.case.reconfigure(settings.get("ui").case_type);
    }

    console.debug(`[kate:os] Booting...`);
    const min_boot_time = wait(1000);
    const boot_screen = new SceneBoot(os, true);

    // Perform boot operations (migrations, etc)
    console.debug(`[kate:os] Ensuring we have persistent storage`);
    await request_persistent_storage(os);
    os.push_scene(boot_screen);

    console.debug(`[kate:os] Running database migrations...`);
    await KateDb.kate.run_data_migration(old_version, db, (migration, current, total) => {
      boot_screen.set_message(
        `Updating database (${current} of ${total}): ${migration.description}`
      );
    });

    console.debug(`[kate:os] Launching audit supervisor`);
    await os.audit_supervisor.start();

    boot_screen.set_message("");

    await min_boot_time;
    boot_screen.close();

    // Show start screen
    console.debug(`[kate:os] Boot done. Launching home screen`);
    os.push_scene(new SceneHome(os));

    // Check for updates
    await os.app_resources.listen_for_updates();

    return os;
  }
}

async function request_persistent_storage(os: KateOS) {
  if (navigator.storage?.persisted == null || navigator.storage?.persist == null) {
    os.kernel.console.resources.take("transient-storage");
    return;
  }

  if (os.kernel.console.options.persistent_storage && !(await navigator.storage.persisted())) {
    const persistent = await navigator.storage.persist();
    if (persistent) {
      return;
    }
  }
  if (!(await navigator.storage.persisted())) {
    os.kernel.console.resources.take("transient-storage");
  }
}
