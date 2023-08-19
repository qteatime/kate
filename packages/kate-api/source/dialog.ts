import type { KateIPC } from "./channel";

export class KateDialogs {
  #channel: KateIPC;

  constructor(channel: KateIPC) {
    this.#channel = channel;
  }

  async text_input(
    message: string,
    options: {
      type: "text" | "password";
      initial_value?: string;
      max_length?: number;
      placeholder?: string;
    }
  ): Promise<string | null> {
    return await this.#channel.call("kate:dialog.text-input", {
      message,
      initial_value: options.initial_value,
      max_length: options.max_length,
      type: options.type,
      placeholder: options.placeholder,
    });
  }
}
