import { UI } from "./deps/appui";
import { SceneMain } from "./scenes/main";

const root = document.querySelector("#canvas")! as HTMLElement;
const ui = new UI(root);

async function main() {
  ui.push_scene(new SceneMain(ui));
}

main();
