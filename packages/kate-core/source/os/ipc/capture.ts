import { EMessageFailed, handler } from "./handlers";
import { TC } from "../../utils";

export default [
  handler(
    "kate:capture.save-image",
    TC.spec({
      data: TC.instance_of(Uint8Array),
      type: TC.str,
      token: TC.str,
    }),
    async (os, env, ipc, payload, message) => {
      await ipc.consume_capture_token(payload.token, env, message as any);

      try {
        os.sfx.play("shutter");
        await os.capture.save_screenshot(
          env.cart.metadata.id,
          payload.data,
          payload.type
        );
      } catch (error) {
        console.debug(`[Kate] failed to save screenshot`, error);
        os.notifications.push_transient(
          "kate:capture",
          "Failed to save screenshot",
          ""
        );
        throw new EMessageFailed(
          "kate.capture.failed",
          "Failed to save screenshot"
        );
      }
      return null;
    }
  ),

  handler("kate:capture.start-recording", TC.spec({}), async (os, env) => {
    os.kernel.console.take_resource("screen-recording");
    await os.notifications.push(
      env.cart.metadata.id,
      "Screen recording started",
      ""
    );

    return null;
  }),

  handler(
    "kate:capture.save-recording",
    TC.spec({
      data: TC.instance_of(Uint8Array),
      type: TC.str,
      token: TC.str,
    }),
    async (os, env, ipc, payload, message) => {
      await ipc.consume_capture_token(payload.token, env, message as any);

      try {
        os.kernel.console.release_resource("screen-recording");
        await os.capture.save_video(
          env.cart.metadata.id,
          payload.data,
          payload.type
        );
      } catch (error) {
        console.debug(`[Kate] failed to save recording`, error);
        os.notifications.push_transient(
          "kate:capture",
          "Failed to save screen recording",
          ""
        );
        throw new EMessageFailed(
          `kate.capture.failed`,
          "Failed to save recording"
        );
      }
      return null;
    }
  ),
];