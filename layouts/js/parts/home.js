import { revealTargets } from "../reveal.js";

export function init(root) {
    revealTargets(root, [".hero__content > *", ".hero__details > div"]);
}
