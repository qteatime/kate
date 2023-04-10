// Polls for a canvas element to provide to the Kate Capture API
declare var SELECTOR: string;
const MAX_RETRIES = 60;

function try_capture(retries: number) {
  const element = document.querySelector(SELECTOR);
  if (element instanceof HTMLCanvasElement) {
    KateAPI.capture.set_root(element);
  } else if (retries > 0) {
    setTimeout(() => try_capture(retries - 1), 1_000);
  } else {
    console.warn(
      `[Kate] Could not find '${SELECTOR}' to capture in ${MAX_RETRIES} seconds. Giving up.`
    );
  }
}

try_capture(MAX_RETRIES);
