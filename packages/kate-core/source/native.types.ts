import type { KateNative as KN } from "../../kate-desktop/build/native-api";

declare global {
  var KateNative: typeof KN;
}
