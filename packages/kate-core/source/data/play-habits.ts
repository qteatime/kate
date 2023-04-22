import { kate } from "./db";

export type PlayHabits = {
  id: string;
  last_played: Date | null;
  play_time: number;
};
export const play_habits = kate.table1<PlayHabits, "id">({
  since: 5,
  name: "play_habits",
  path: "id",
  auto_increment: false,
});
