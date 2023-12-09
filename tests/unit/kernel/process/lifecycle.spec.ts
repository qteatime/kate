/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/
 */
import test, { Page } from "playwright/test";
import { Kate, load } from "../../unit";
import { assert_match, sleep } from "../../../deps/utils";

async function init(page: Page) {
  await page.goto("/test.html");
  const kate = await load(page);
  return kate;
}

function make_frame(program: string) {
  function sample(program: string) {
    function defer<A>() {
      const p = {
        promise: null as any as Promise<A>,
        resolve: (_: A) => {},
        reject: (_: any) => {},
      };
      p.promise = new Promise((resolve, reject) => {
        p.resolve = resolve;
        p.reject = reject;
      });
      return p;
    }

    const paired = defer<void>();
    const secret = "12345";
    let port: MessagePort;
    let pairing = false;
    console.log("[frame] will pair");
    window.onmessage = (ev) => {
      if (pairing) return;
      if (program === "dead") return;
      pairing = true;
      console.log("[frame] ready for pairing");
      if (ev.data.type === "kate:pairing-ready") {
        const channel = new MessageChannel();
        channel.port1.onmessage = (ev) => {
          console.log("[frame] got paired");
          if (ev.data.type === "kate:paired") {
            port = ev.data.port;
            paired.resolve();
          }
        };
        console.log("[frame] pairing");
        window.parent.postMessage({ type: "kate:pair", secret, port: channel.port2 }, "*", [
          channel.port2,
        ]);
      }
    };
    window.onmessage(new MessageEvent("message", { data: { type: "kate:pairing-ready" } }));

    async function echo() {
      await paired.promise;
      port.onmessage = (ev) => {
        console.log("[frame] received message", ev);
        port.postMessage(ev.data);
      };
    }

    switch (program) {
      case "echo": {
        echo();
      }
    }
  }

  const code = `<!DOCTYPE html>
<html>
<head></head>
<body>
  <script>
  (${sample.toString()})(${JSON.stringify(program)})
  </script>
</body>
  `;
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-scripts");
  frame.setAttribute(
    "csp",
    "default-src data: blob: 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'; navigate-to 'none'"
  );
  frame.src = URL.createObjectURL(new Blob([code], { type: "text/html" }));
  return frame;
}

test("@kernel processes can pair with frames", async ({ page }) => {
  const kate = await init(page);
  const recording = await kate.evaluateHandle(async (x, make_frame) => {
    const frame = new Function(`return ${make_frame}`)()("echo");
    document.body.appendChild(frame);
    const process = new x.kernel.Process("id" as any, "12345", frame, 0 as any, 0 as any, 0 as any);
    const recording = process.on_system_event.record();
    await process.pair();
    process.send("Hello" as any);
    return recording;
  }, make_frame.toString());
  await sleep(100);

  assert_match(await recording.evaluate((x) => x.trace), [
    { type: "pairing" },
    { type: "paired" },
    { type: "message-received", payload: "Hello" },
  ]);
});

test("@kernel process pairing fails if it takes too long", async ({ page }) => {
  const kate = await init(page);
  const result = await kate.evaluate(async (x, make_frame) => {
    const frame = new Function(`return ${make_frame}`)()("dead");
    document.body.appendChild(frame);
    const process = new x.kernel.Process("id" as any, "12345", frame, 0 as any, 0 as any, 0 as any);
    const result = await process.pair().catch((e) => e);
    return String(result);
  }, make_frame.toString());

  assert_match(result, "Error: [kate] Process id took too long to pair");
});
