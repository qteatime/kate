import { Mixer } from "./audio";
import { Container, Sprite, Texture, Text } from "./graphics";
import { Timer } from "./timer";

// Get a reference to our canvas, so we can draw things
const canvas = document.querySelector("#game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

// Allow screenshots and video recordings of this game's screen
KateAPI.capture.set_root(canvas);

const LEFT_OFFSET = 50;
const TOP_OFFSET = 65;
const KATE_WIDTH = 233;
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 480;

class HighScore {
  static readonly KEY = "highest-score";

  constructor(private _score: number) {}

  static get bucket() {
    return KateAPI.store.unversioned().get_special_bucket();
  }

  static async load() {
    const bucket = await HighScore.bucket;
    const score = (await bucket.try_read_data(HighScore.KEY)) as number | null;
    return new HighScore(score ?? 0);
  }

  get score() {
    return this._score;
  }

  async save_if_highest(score: number) {
    if (score > this._score) {
      const bucket = await HighScore.bucket;
      await bucket.update_structured(HighScore.KEY, score);
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

  function x(i: number) {
    return LEFT_OFFSET + i * KATE_WIDTH;
  }

  // Load the images that we want to use for this scene
  const kate_texture = await Texture.from_path("/images/kate.png");
  const kate_off_texture = await Texture.from_path("/images/kate-off.png");
  const console_texture = await Texture.from_path("/images/console.png");
  const score_texture = await Texture.from_path("/images/score.png");

  // Initialise the sprites we'll draw in this scene
  const kate = new Sprite(kate_texture).move(x(kate_position), TOP_OFFSET);

  // kate_off is the faded images of kate we draw on the background
  // to indicate where kate can be positioned, trying to capture
  // the aesthetics of very old handhelds.
  const kate_off = new Container();
  for (let i = 0; i < 3; ++i) {
    kate_off.add(new Sprite(kate_off_texture).move(x(i), TOP_OFFSET));
  }

  const console = new Sprite(console_texture).move(
    x(console_position),
    TOP_OFFSET
  );

  // The pieces of text we need
  const time_str = new Text(String(Math.round(time / 1000)), {
    stroke: "#000",
    font: "bold 48px sans-serif",
  }).move(25, 25);
  const score_str = new Text(String(score), {
    stroke: "#000",
    font: "bold 48px sans-serif",
    align: "right",
  }).move(SCREEN_WIDTH - 25, 25);
  const high_score_str = new Text(`HIGH: ${high_score.score}`, {
    fill: "#000",
    font: "bold 24px sans-serif",
    align: "right",
  }).move(SCREEN_WIDTH - 25, 70);

  // Attach the sprites to the scene in the order we want them to be drawn.
  // This doesn't draw them yet, just records how we want to draw them.
  const scene = new Container();
  scene.add(kate_off);
  scene.add(console);
  scene.add(kate);
  scene.add(time_str);
  scene.add(score_str);
  scene.add(high_score_str);

  // The end screen we show the player when time's up.
  const es_bg = new Sprite(score_texture);
  const es_score = new Text("0", {
    font: "bold 48px sans-serif",
    fill: "#000",
  });
  es_score.move(420, 195);
  const es_high = new Text("0", { font: "bold 48px sans-serif", fill: "#000" });
  es_high.move(420, 265);

  const end_screen = new Container();
  end_screen.add(es_bg);
  end_screen.add(es_score);
  end_screen.add(es_high);
  end_screen.visible = false;

  scene.add(end_screen);

  // Initialises the sounds we want to play in this scene
  const mixer = await Mixer.with_sounds({
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

  function update(delta: number) {
    const old_position = kate_position;
    const old_score = score;

    if (time > 0) {
      time = Math.max(0, time - delta);
      time_str.value = String(Math.round(time / 1000));

      handle_input();

      if (score !== old_score) {
        mixer.play("score");
        score_str.value = String(score);
      } else if (kate_position !== old_position) {
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
    } else {
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
  const timer = new Timer();
  timer.on_tick = (delta) => {
    scene.update(delta);

    ctx.fillStyle = "#efebea";
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    scene.root.render(ctx);
  };
  timer.start();
}

main();
