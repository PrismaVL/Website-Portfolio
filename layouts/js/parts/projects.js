import { revealTargets } from "../reveal.js";

export function init(root) {
    revealTargets(root, [
        ".content-section > .eyebrow",
        ".content-section > h2",
        ".project-carousel__filters",
        ".project-carousel__controls"
    ]);

    root.querySelectorAll(".project-card__gallery").forEach((gallery) => {
        const card = gallery.closest(".project-card");
        const placeholder = card.querySelector(".project-card__placeholder");
        const thumbnails = Array.from(gallery.querySelectorAll(".project-card__thumbnail"));

        thumbnails.forEach((thumbnail) => {
            thumbnail.addEventListener("click", () => {
                const screen = thumbnail.dataset.previewImage;
                placeholder.dataset.screen = screen;
                placeholder.classList.remove("project-card__image--changing");
                void placeholder.offsetWidth;
                placeholder.classList.add("project-card__image--changing");
                thumbnails.forEach((item) => {
                    item.setAttribute("aria-pressed", String(item === thumbnail));
                });
            });
        });
    });
}
