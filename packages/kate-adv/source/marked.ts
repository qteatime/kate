import { type_writer as tw } from "../../kate-domui/build";

export function text(x: string) {
  return new tw.MT_Text(x);
}

export function sleep(ms: number) {
  return new tw.MT_Sleep(ms);
}

export function wait() {
  return new tw.MT_Wait();
}

export function emphasis(x: tw.MT_Text) {
  return new tw.MT_Emphasis(x);
}
