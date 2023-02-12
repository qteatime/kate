import { KateUI, widget } from "../../../packages/kate-domui/build";
import { Widget } from "../../../packages/kate-domui/source/widget";
import { defer, Deferred } from "../../../packages/util/build/promise";
import { gen_name } from "./name_grammar";
import { gen_text } from "./text_grammar";
const { Box, Text, Icon, Keymap } = widget;

const root = document.querySelector("#game")! as HTMLElement;
const ui = KateUI.from_root(root);

function show<A>(
  scene: (promise: Deferred<A>) => widget.Widget
): [Widget, Promise<A>] {
  const result = defer<A>();
  ui.clear();
  const widget = scene(result);
  ui.draw(widget);
  return [widget, result.promise];
}

function dismiss<A>(x: Deferred<A>, value: A) {
  return async () => {
    x.resolve(value);
    return false;
  };
}

function gen_card() {
  const { user, name } = gen_name();
  const text = gen_text();
  return { user, name, text };
}

async function main() {
  const like_wav = await KateAPI.cart_fs.read_file("/assets/like.wav");
  const start_wav = await KateAPI.cart_fs.read_file("/assets/start.wav");
  const sfx = await KateAPI.audio.create_channel("sfx");
  const like = await KateAPI.audio.load_audio(like_wav.mime, like_wav.bytes);
  const start = await KateAPI.audio.load_audio(start_wav.mime, start_wav.bytes);

  const [main_widget, main_screen_dismiss] = show(screen_main);
  await main_screen_dismiss;
  await KateAPI.audio.play(sfx, start, false);
  await main_widget.live_node.animate([{ opacity: 1 }, { opacity: 0 }], 1000);

  while (true) {
    const content = gen_card();
    const [widget, promise] = show(card(content));
    const result = await promise;
    await KateAPI.audio.play(sfx, like, false);
    const node = widget.live_node.select(
      result === "like" ? ".button-like" : ".button-share"
    );
    const alternate = widget.live_node.select(
      result === "like" ? ".button-share" : ".button-like"
    );
    await Promise.all([
      alternate.animate(
        [
          {
            color: "var(--dark)",
            background: "var(--light)",
            opacity: 0.4,
          },
        ],
        {
          duration: 100,
          fill: "forwards",
        }
      ),
      node.animate([{ background: "var(--accent)" }], {
        duration: 250,
        fill: "forwards",
      }),
      node
        .select(".kate-icon")
        .animate(
          [
            { transform: "rotate(0deg) scale(1.0)" },
            { transform: "rotate(-5deg) scale(1.5)" },
            { transform: "rotate(0deg) scale(1.0)", offset: 0.8 },
          ],
          {
            duration: 250,
            fill: "forwards",
          }
        ),
    ]);
    await widget.live_node.animate(
      [{ transform: "translateY(-480px)", opacity: 0 }],
      400
    );
  }
}

function screen_main(result: Deferred<null>) {
  return new Box("div", "screen-main", [
    new Box("h1", "title", [new Text("Boon-scrolling")]),
    new Box("div", "subtitle", [new Text("A tiny, endless si(lly)mulation")]),
    new Box("div", "divider", []),
    new Box("div", "paragraph", [
      new Text(`
        You're sitting on the sofa, bored and overwhelmed. Life has been
        a bit too much for you lately.
      `),
    ]),
    new Box("div", "paragraph", [
      new Text(`
        You pick up your phone and open the usual application.
        The short messages show up in the screen.
      `),
    ]),
    new Box("div", "status-bar", [new Icon("o"), new Text("Start")]),
    new Keymap({ o: dismiss(result, null) }),
  ]);
}

function card({
  name,
  user,
  text,
}: {
  name: string;
  user: string;
  text: string;
}) {
  return (result: Deferred<"share" | "like">) => {
    return new Box("div", "screen-card", [
      new Box("div", "card-header", [
        new Box("div", "card-display-name", [new Text(name)]),
        new Box("div", "card-user-name", [new Text(user)]),
      ]),
      new Box("div", "card-text", [new Text(text)]),
      new Box("div", "card-actions", [
        new Box("div", "card-button button-like", [
          new Icon("ltrigger"),
          new Text("Like"),
        ]),
        new Box("div", "card-button button-share", [
          new Text("Share"),
          new Icon("rtrigger"),
        ]),
      ]),
      new Keymap({
        ltrigger: dismiss(result, "like"),
        rtrigger: dismiss(result, "share"),
      }),
    ]);
  };
}

main();
