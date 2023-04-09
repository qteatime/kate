void function([module, exports, node_require]) {
  const require = (id) => {
    if (typeof id === "string") {
      return node_require(id);
    }

    const module = require.mapping.get(id);
    if (module == null) {
      throw new Error("Undefined module " + id);
    }
    if (!module.initialised) {
      module.initialised = true;
      module.load.call(null,
        module.module,
        module.module.exports,
        module.dirname,
        module.filename
      );
    }
    return module.module.exports;
  };
  
  require.mapping = new Map();
  require.define = (id, dirname, filename, fn) => {
    const module = Object.create(null);
    module.exports = Object.create(null);
    require.mapping.set(id, {
      module: module,
      dirname,
      filename,
      initialised: false,
      load: fn
    });
  };

// examples\katchu\build\index.js
require.define(1, "examples\\katchu\\build", "examples\\katchu\\build\\index.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require(2);

});

// examples\katchu\build\main.js
require.define(2, "examples\\katchu\\build", "examples\\katchu\\build\\main.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const audio_1 = require(3);
const graphics_1 = require(4);
const timer_1 = require(5);
// Get a reference to our canvas, so we can draw things
const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
// Allow screenshots and video recordings of this game's screen
KateAPI.capture.set_root(canvas);
const LEFT_OFFSET = 50;
const TOP_OFFSET = 65;
const KATE_WIDTH = 233;
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 480;
class HighScore {
    _score;
    static KEY = "highest-score";
    constructor(_score) {
        this._score = _score;
    }
    static async load() {
        const score = (await KateAPI.store
            .get_special_bucket()
            .try_get(HighScore.KEY));
        return new HighScore(score ?? 0);
    }
    get score() {
        return this._score;
    }
    async save_if_highest(score) {
        if (score > this._score) {
            await KateAPI.store.get_special_bucket().put(HighScore.KEY, score);
            this._score = score;
        }
    }
}
async function main_scene() {
    // The scene state
    let kate_position = 0;
    let console_position = 2;
    let score = 0;
    let time = 30_000;
    const high_score = await HighScore.load();
    function x(i) {
        return LEFT_OFFSET + i * KATE_WIDTH;
    }
    // Load the images that we want to use for this scene
    const kate_texture = await graphics_1.Texture.from_path("/images/kate.png");
    const kate_off_texture = await graphics_1.Texture.from_path("/images/kate-off.png");
    const console_texture = await graphics_1.Texture.from_path("/images/console.png");
    const score_texture = await graphics_1.Texture.from_path("/images/score.png");
    // Initialise the sprites we'll draw in this scene
    const kate = new graphics_1.Sprite(kate_texture).move(x(kate_position), TOP_OFFSET);
    // kate_off is the faded images of kate we draw on the background
    // to indicate where kate can be positioned, trying to capture
    // the aesthetics of very old handhelds.
    const kate_off = new graphics_1.Container();
    for (let i = 0; i < 3; ++i) {
        kate_off.add(new graphics_1.Sprite(kate_off_texture).move(x(i), TOP_OFFSET));
    }
    const console = new graphics_1.Sprite(console_texture).move(x(console_position), TOP_OFFSET);
    // The pieces of text we need
    const time_str = new graphics_1.Text(String(Math.round(time / 1000)), {
        stroke: "#000",
        font: "bold 48px sans-serif",
    }).move(25, 25);
    const score_str = new graphics_1.Text(String(score), {
        stroke: "#000",
        font: "bold 48px sans-serif",
        align: "right",
    }).move(SCREEN_WIDTH - 25, 25);
    const high_score_str = new graphics_1.Text(`HIGH: ${high_score.score}`, {
        fill: "#000",
        font: "bold 24px sans-serif",
        align: "right",
    }).move(SCREEN_WIDTH - 25, 70);
    // Attach the sprites to the scene in the order we want them to be drawn.
    // This doesn't draw them yet, just records how we want to draw them.
    const scene = new graphics_1.Container();
    scene.add(kate_off);
    scene.add(console);
    scene.add(kate);
    scene.add(time_str);
    scene.add(score_str);
    scene.add(high_score_str);
    // The end screen we show the player when time's up.
    const es_bg = new graphics_1.Sprite(score_texture);
    const es_score = new graphics_1.Text("0", {
        font: "bold 48px sans-serif",
        fill: "#000",
    });
    es_score.move(420, 195);
    const es_high = new graphics_1.Text("0", { font: "bold 48px sans-serif", fill: "#000" });
    es_high.move(420, 265);
    const end_screen = new graphics_1.Container();
    end_screen.add(es_bg);
    end_screen.add(es_score);
    end_screen.add(es_high);
    end_screen.visible = false;
    scene.add(end_screen);
    // Initialises the sounds we want to play in this scene
    const mixer = await audio_1.Mixer.with_sounds({
        move: "/audio/move.wav",
        score: "/audio/score.wav",
    });
    function handle_input() {
        if (KateAPI.input.is_just_pressed("left")) {
            kate_position = Math.max(0, kate_position - 1);
            kate.x = x(kate_position);
        }
        if (KateAPI.input.is_just_pressed("right")) {
            kate_position = Math.min(2, kate_position + 1);
            kate.x = x(kate_position);
        }
        if (kate_position === console_position) {
            score = score + 1;
            while (console_position === kate_position) {
                console_position = Math.floor(Math.random() * 3);
            }
            console.x = x(console_position);
        }
    }
    function update(delta) {
        const old_position = kate_position;
        const old_score = score;
        if (time > 0) {
            time = Math.max(0, time - delta);
            time_str.value = String(Math.round(time / 1000));
            handle_input();
            if (score !== old_score) {
                mixer.play("score");
                score_str.value = String(score);
            }
            else if (kate_position !== old_position) {
                mixer.play("move");
            }
            if (time === 0) {
                const max_score = Math.max(score, high_score.score);
                high_score.save_if_highest(score);
                es_score.value = String(score);
                es_high.value = String(max_score);
                high_score_str.value = `HIGH: ${max_score}`;
                end_screen.visible = true;
            }
        }
        else {
            if (KateAPI.input.is_just_pressed("o")) {
                kate_position = 0;
                console_position = 2;
                time = 30_000;
                score = 0;
                end_screen.visible = false;
            }
        }
    }
    return { root: scene, update };
}
async function main() {
    const scene = await main_scene();
    const timer = new timer_1.Timer();
    timer.on_tick = (delta) => {
        scene.update(delta);
        ctx.fillStyle = "#efebea";
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        scene.root.render(ctx);
    };
    timer.start();
}
main();

});

// examples\katchu\build\audio.js
require.define(3, "examples\\katchu\\build", "examples\\katchu\\build\\audio.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mixer = void 0;
class Mixer {
    sounds;
    channel;
    constructor(sounds, channel) {
        this.sounds = sounds;
        this.channel = channel;
    }
    async play(sound) {
        await this.channel.play(this.sounds[sound], false);
    }
    static async with_sounds(sounds) {
        const loaded = Object.create(null);
        for (const [key, path] of Object.entries(sounds)) {
            loaded[key] = await load_sound(path);
        }
        const channel = await KateAPI.audio.create_channel("sfx", 1);
        return new Mixer(loaded, channel);
    }
}
exports.Mixer = Mixer;
async function load_sound(path) {
    const file = await KateAPI.cart_fs.read_file(path);
    const sound = await KateAPI.audio.load_audio(file.mime, file.bytes);
    return sound;
}

});

// examples\katchu\build\graphics.js
require.define(4, "examples\\katchu\\build", "examples\\katchu\\build\\graphics.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Texture = exports.Sprite = exports.Text = exports.Container = void 0;
class Container {
    visible = true;
    items = [];
    add(item) {
        this.items.push(item);
    }
    remove(item) {
        this.items = this.items.filter((x) => x !== item);
    }
    render(ctx) {
        if (this.visible) {
            for (const item of this.items) {
                item.render(ctx);
            }
        }
    }
}
exports.Container = Container;
class Text {
    value;
    options;
    visible = true;
    x = 0;
    y = 0;
    constructor(value, options) {
        this.value = value;
        this.options = options;
    }
    move(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    render(ctx) {
        if (this.visible) {
            ctx.save();
            ctx.font = this.options.font ?? "16px sans-serif";
            ctx.fillStyle = this.options.fill ?? "";
            ctx.strokeStyle = this.options.stroke ?? "";
            ctx.textAlign = this.options.align ?? "left";
            ctx.textBaseline = this.options.baseline ?? "top";
            if (this.options.fill != null) {
                ctx.fillText(this.value, this.x, this.y, this.options.width);
            }
            if (this.options.stroke != null) {
                ctx.strokeText(this.value, this.x, this.y, this.options.width);
            }
            ctx.restore();
        }
    }
}
exports.Text = Text;
class Sprite {
    texture;
    visible = true;
    x = 0;
    y = 0;
    constructor(texture) {
        this.texture = texture;
    }
    move(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    render(ctx) {
        if (this.visible) {
            ctx.drawImage(this.texture.base, this.x, this.y);
        }
    }
}
exports.Sprite = Sprite;
class Texture {
    base;
    constructor(base) {
        this.base = base;
    }
    static async from_path(path) {
        return new Texture(await load_image(path));
    }
}
exports.Texture = Texture;
async function load_image(path) {
    const url = await KateAPI.cart_fs.get_file_url(path);
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("failed to load " + path));
        img.src = url;
    });
}

});

// examples\katchu\build\timer.js
require.define(5, "examples\\katchu\\build", "examples\\katchu\\build\\timer.js", (module, exports, __dirname, __filename) => {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timer = void 0;
class Timer {
    _last_time = null;
    _started = false;
    start() {
        if (this._started) {
            return;
        }
        KateAPI.timer.on_tick.listen(this.update);
    }
    stop() {
        this._last_time = null;
        this._started = false;
        KateAPI.timer.on_tick.remove(this.update);
    }
    update = (time) => {
        if (this._last_time == null) {
            this._last_time = time;
        }
        const delta = time - this._last_time;
        this._last_time = time;
        if (!KateAPI.input.is_paused) {
            this.on_tick(delta);
        }
    };
    on_tick(delta) { }
}
exports.Timer = Timer;

});

module.exports = require(1);
}((() => {
  if (typeof require !== "undefined" && typeof module !== "undefined") {
    return [module, module.exports, require];
  } else if (typeof window !== "undefined") {
    const module = Object.create(null);
    module.exports = Object.create(null);
    Object.defineProperty(window, "Katchu", {
      get() { return module.exports },
      set(v) { module.exports = v }
    });
    return [module, module.exports, (id) => {
      throw new Error("Cannot load " + JSON.stringify(id) + " because node modules are not supported.");
    }];
  } else {
    throw new Error("Unsupported environment");
  }
})());