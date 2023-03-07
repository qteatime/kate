import { KateUI } from "../../../packages/kate-domui/build";
import { Widget } from "../../../packages/kate-domui/build/widget";
import { defer } from "../../../packages/util/build/promise";
import { Animation } from "./animation";
import { div, keyevent } from "./widget";

type Path = string;

export class Namespace<T> {
  private data = new Map<string, T>();
  constructor(readonly name: string) {}

  get(name: string) {
    if (this.has(name)) {
      return this.data.get(name)!;
    } else {
      throw new Error(`Unknown ${this.name}: ${name}`);
    }
  }

  try_get(name: string) {
    return this.data.get(name) ?? null;
  }

  has(name: string) {
    return this.data.has(name);
  }

  put(name: string, value: T) {
    if (this.has(name)) {
      throw new Error(`Duplicate ${this.name}: ${name}`);
    }
    this.data.set(name, value);
  }

  delete(name: string) {
    this.data.delete(name);
  }

  count() {
    return this.data.size;
  }

  clear() {
    for (const key of this.keys()) {
      this.delete(key);
    }
  }

  *keys() {
    yield* this.data.keys();
  }

  *values() {
    yield* this.data.values();
  }

  *entries() {
    yield* this.data.entries();
  }
}

export class Layer {
  private _widgets = new Namespace<Widget>("widget");
  private _self = div("kate-adv-layer", []);
  private _initialised = false;

  constructor(readonly adv: KateADV, readonly name: string) {}

  private get root() {
    return this._self.raw_node as HTMLElement;
  }

  setup() {
    if (this._initialised) {
      throw new Error(`setup() called twice`);
    }
    this._initialised = true;
    this._self.attach(this.adv.ui.root, this.adv.ui);
    this._self.on_attached = this.handle_attachment;
    this._self.on_detached = this.handle_detachment;
  }

  // -- CSS
  add_class(name: string) {
    this.root.classList.add(name);
  }

  remove_class(name: string) {
    this.root.classList.remove(name);
  }

  has_class(name: string) {
    this.root.classList.contains(name);
  }

  // -- Managing widgets
  clear() {
    for (const widget of this._widgets.values()) {
      widget.detach();
    }
    this._widgets.clear();
  }

  show(name: string, widget: Widget) {
    const previous = this._widgets.try_get(name);
    if (previous != null && previous.raw_node != null) {
      previous.detach();
    }
    this._widgets.put(name, widget);
    widget.attach(this.root, this.adv.ui);
    return widget;
  }

  hide(name: string) {
    const widget = this._widgets.get(name);
    this._widgets.delete(name);
    widget.detach();
  }

  get(name: string) {
    return this._widgets.get(name);
  }

  try_get(name: string) {
    return this._widgets.try_get(name);
  }

  keys() {
    return this._widgets.keys();
  }

  *find_all(predicate: (name: string) => boolean) {
    for (const [key, value] of this._widgets.entries()) {
      if (predicate(key)) {
        yield value;
      }
    }
  }

  async animate(name: string, animation: Animation) {
    return await animation(this.get(name));
  }

  async animate_all(widgets: Widget[], animation: Animation) {
    return await Promise.all(widgets.map((x) => animation(x)));
  }

  // -- Other
  private handle_attachment = () => {
    for (const widget of this._widgets.values()) {
      widget.attach(this.root, this.adv.ui);
    }
  };

  private handle_detachment = () => {
    for (const widget of this._widgets.values()) {
      widget.detach();
    }
  };
}

export class Screen {
  private _layers = new Namespace<Layer>("layer");

  constructor(readonly adv: KateADV) {}

  add_class(name: string) {
    this.adv.root.classList.add(name);
  }

  remove_class(name: string) {
    this.adv.root.classList.remove(name);
  }

  has_class(name: string) {
    this.adv.root.classList.contains(name);
  }

  add_layer(name: string) {
    const layer = new Layer(this.adv, name);
    layer.setup();
    this._layers.put(name, layer);
    return layer;
  }

  get_layer(name: string) {
    return this._layers.get(name);
  }
}

export class Audio {
  private _channels = new Namespace<KateTypes.KateAudioChannel>(
    "audio channel"
  );
  constructor(readonly adv: KateADV) {}

  async make_channel(name: string, options: { max_tracks?: number }) {
    const channel = await KateAPI.audio.create_channel(
      name,
      options.max_tracks ?? 1
    );
    this._channels.put(name, channel);
    return channel;
  }

  get_channel(name: string) {
    return new AudioChannel(this.adv, this._channels.get(name));
  }
}

export class AudioChannel {
  constructor(
    readonly adv: KateADV,
    readonly channel: KateTypes.KateAudioChannel
  ) {}

  async play(name: string, loop: boolean) {
    const source = await this.adv.loader.get_sound_source(name);
    await KateAPI.audio.play(this.channel, source, loop);
  }

  async stop_all() {
    await this.channel.stop_all_sources();
  }
}

export class Loader {
  private _sounds = new Namespace<KateTypes.KateAudioSource>("sound");
  private _images = new Namespace<Path>("image");

  constructor(readonly adv: KateADV) {}

  async load_image(name: string, path: Path) {
    const img = await KateAPI.cart_fs.get_file_url(path);
    this._images.put(name, img);
    return img;
  }

  async unload_image(name: string) {
    const url = this._images.get(name);
    URL.revokeObjectURL(url);
    this._images.delete(name);
  }

  async load_sound(name: string, path: Path) {
    const audio = await KateAPI.cart_fs.read_file(path);
    const source = await KateAPI.audio.load_audio(audio.mime, audio.bytes);
    this._sounds.put(name, source);
    return source;
  }

  async unload_sound(name: string) {
    this._sounds.delete(name);
  }

  async unload_all() {
    await this.unload_prefixed("");
  }

  async unload_prefixed(prefix: string) {
    for (const key of this._images.keys()) {
      if (key.startsWith(prefix)) {
        await this.unload_image(key);
      }
    }
    for (const key of this._sounds.keys()) {
      if (key.startsWith(prefix)) {
        await this.unload_sound(key);
      }
    }
  }

  get_image_url(name: string) {
    return this._images.get(name);
  }

  get_sound_source(name: string) {
    return this._sounds.get(name);
  }
}

export class KateADV {
  readonly ui: KateUI;
  readonly loader: Loader;
  readonly audio: Audio;
  readonly screen: Screen;

  private constructor(readonly root: HTMLElement) {
    this.ui = KateUI.from_root(root);
    this.loader = new Loader(this);
    this.audio = new Audio(this);
    this.screen = new Screen(this);
  }

  static from_root(root: HTMLElement) {
    const adv = new KateADV(root);
    return adv;
  }

  async wait_key(key: KateTypes.InputKey) {
    const result = defer<void>();
    const map = keyevent({
      [key]: () => {
        result.resolve();
        map.detach();
        return false;
      },
    });
    this.ui.draw(map);
    return result.promise;
  }
}
