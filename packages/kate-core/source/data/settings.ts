import { kate } from "./db";

export type Settings = {
  key: string;
  data: any;
  last_updated: Date | null;
};
export const settings = kate.table1<Settings, "key">({
  since: 7,
  name: "settings",
  path: "key",
  auto_increment: false,
});
