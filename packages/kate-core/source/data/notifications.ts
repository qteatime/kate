import type { NotificationType } from "../os";
import { kate } from "./db";

export type Notification = {
  id?: number;
  type: NotificationType;
  process_id: string;
  time: Date;
  title: string;
  message: string;
};
export const notifications = kate.table1<Notification, "id">({
  since: 1,
  name: "notifications",
  path: "id",
  auto_increment: true,
});
