import { TC } from "../../utils";
import { handler } from "./handlers";

export default [
  handler("kate:special.focus", TC.anything(), async () => {
    window.focus();
    return null;
  }),
];
