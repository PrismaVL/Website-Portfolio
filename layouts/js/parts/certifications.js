import { revealTargets } from "../reveal.js";

export function init(root) {
    revealTargets(root, [".content-section > .eyebrow", ".certifications-header", ".certification-carousel"]);
}
