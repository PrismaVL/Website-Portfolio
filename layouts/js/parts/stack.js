import { revealTargets } from "../reveal.js";

export function init(root) {
    revealTargets(root, [".stack-title", ".stack-group h3", ".stack-items li"]);
}
