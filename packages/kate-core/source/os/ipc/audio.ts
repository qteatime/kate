import { TC } from "../../utils";
import { EMessageFailed, handler } from "./handlers";

export default [
  handler(
    "kate:audio.create-channel",
    TC.spec({
      max_tracks: TC.optional(undefined, TC.int),
    }),
    async (os, env, ipc, { max_tracks }) => {
      const channel = await env.audio_server.create_channel(max_tracks ?? 1);
      return { id: channel.id, volume: channel.volume.gain.value };
    }
  ),

  handler(
    "kate:audio.stop-all-sources",
    TC.spec({ channel_id: TC.str }),
    async (os, env, ipc, { channel_id }) => {
      const channel = env.audio_server.get_channel(channel_id);
      await channel.stop_all_sources();
      return null;
    }
  ),

  handler(
    "kate:audio.change-volume",
    TC.spec({ channel_id: TC.str, volume: TC.num }),
    async (os, env, ipc, { channel_id, volume }) => {
      const channel = env.audio_server.get_channel(channel_id);
      await channel.set_volume(volume);
      return null;
    }
  ),

  handler(
    "kate:audio.load",
    TC.spec({ mime: TC.str, bytes: TC.instance_of(Uint8Array) }),
    async (os, env, ipc, { mime, bytes }) => {
      const source = await env.audio_server.load_sound(bytes);
      return source.id;
    }
  ),

  handler(
    "kate:audio.play",
    TC.spec({
      channel_id: TC.str,
      source_id: TC.str,
      loop: TC.bool,
    }),
    async (os, env, ipc, { channel_id, source_id, loop }) => {
      const channel = env.audio_server.get_channel(channel_id);
      const source = env.audio_server.get_source(source_id);
      await channel.play(source, loop);
      return null;
    }
  ),
];
