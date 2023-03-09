export {};

declare var Input: any;
declare var WebAudio: any;
declare var AudioManager: any;

let paused = false;
const { events } = KateAPI;

// Disable RPGMkMV's handling of gamepads to avoid double-input handling.
Input._updateGamepadState = () => {};

// Ensure RPGMkMV uses ogg files (Kate will handle the decoding).
WebAudio.canPlayOgg = () => true;
WebAudio.canPlayM4a = () => false;
AudioManager.audioFileExt = () => ".ogg";

// Patch RPGMkMV's keyboard input handling directly
const key_mapping: { [key: string]: string } = {
  up: "up",
  right: "right",
  down: "down",
  left: "left",
  x: "cancel",
  o: "ok",
  menu: "menu",
  rtrigger: "shift",
};

events.input_state_changed.listen(({ key, is_down }) => {
  if (!paused) {
    const name = key_mapping[key];
    if (name) {
      Input._currentState[name] = is_down;
    }
  }
});

events.paused.listen((state) => {
  paused = state;
  if (state) {
    for (const key of Object.values(key_mapping)) {
      Input._currentState[key] = false;
    }
  }
});
