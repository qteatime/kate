import { gen_name } from "./gen";

export const content = [
  `My cats are the cutest thing. Look at these adorable furballs. UGHH!`,
  `It has been forever ahaha`,
  "We recorded a new MV!",
  `Happy birthday to me! I went home after so long and got to cuddle Petra a lot <3`,
];

export class Db {
  private candidates = content.slice();

  pick_one() {
    if (this.candidates.length === 0) {
      this.candidates = content.slice();
    }
    const item = Math.floor(Math.random() * this.candidates.length);
    const result = this.candidates[item];
    this.candidates.splice(item, 1);
    const { user, name } = gen_name();
    return { user, name, text: result };
  }
}
