import {KateAPI} from "../kate-api";
declare var KateAPI: KateAPI;
declare var Utils: any;
declare var Input: any;


let paused = false;
const {events} = KateAPI;

// -- Things that need to be patched still
Utils.isOptionValid = (name: string) => {
  return ["noaudio"].includes(name);
}

const key_mapping: {[key: string]: string} = {
  up: "up",
  right: "right",
  down: "down",
  left: "left",
  x: "cancel",
  o: "ok",
  menu: "menu",
  rtrigger: "shift"
};

events.input_state_changed.listen(({key, is_down}) => {
  if (!paused) {
    const name = key_mapping[key];
    if (name) {
      Input._currentState[name] = is_down;
    }
  }
});

events.paused.listen(state => {
  paused = state;
  if (state) {
    for (const key of Object.values(key_mapping)) {
      Input._currentState[key] = false;
    }
  }
});