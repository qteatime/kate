export class Mixer<T extends { [key: string]: KateTypes.KateAudioSource }> {
  constructor(
    readonly sounds: T,
    readonly channel: KateTypes.KateAudioChannel
  ) {}

  async play(sound: keyof T) {
    await this.channel.play(this.sounds[sound], false);
  }

  static async with_sounds<R extends { [key: string]: string }>(sounds: R) {
    const loaded = Object.create(null) as Record<
      keyof R,
      KateTypes.KateAudioSource
    >;
    for (const [key, path] of Object.entries(sounds)) {
      (loaded as any)[key] = await load_sound(path);
    }
    const channel = await KateAPI.audio.create_channel("sfx", 1);
    return new Mixer(loaded, channel);
  }
}

async function load_sound(path: string) {
  const file = await KateAPI.cart_fs.read_file(path);
  const sound = await KateAPI.audio.load_audio(file.mime, file.bytes);
  return sound;
}
