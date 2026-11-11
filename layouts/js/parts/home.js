import { revealTargets } from "../reveal.js";

export function init(root) {
    revealTargets(root, [".hero__content > *", ".hero__details > div"]);

    const intro = root.querySelector(".intro");
    intro?.addEventListener("animationend", (event) => {
        if (event.animationName === "intro-dismiss") {
            document.documentElement.classList.remove("intro-active");
        }
    });
}
