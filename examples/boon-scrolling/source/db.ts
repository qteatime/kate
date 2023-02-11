export const content = [
  {
    name: "Kitty Cute",
    user: "@kitty_cute_girl",
    text: `My cats are the cutest thing. Look at these adorable furballs. UGHH!`,
  },
  {
    name: "Beary 🐻",
    user: "@beary",
    text: `It has been forever ahaha`,
  },
  {
    name: "One, Two, Three",
    user: "@one23",
    text: "We recorded a new MV!",
  },
  {
    name: "Alice is not dead",
    user: "@that_alice",
    text: `Happy birthday to me! I went home after so long and got to cuddle Petra a lot <3`,
  },
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
    return result;
  }
}
