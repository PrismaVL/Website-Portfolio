import { revealTargets } from "../reveal.js";

export function init(root) {
    revealTargets(root, [".site-header", ".back-to-top"]);

    const links = Array.from(root.querySelectorAll(".site-header nav a[href^='#']"));
    const sections = links
        .map((link) => document.getElementById(link.hash.slice(1)))
        .filter(Boolean);

    function updateCurrentLink() {
        const threshold = window.innerHeight * 0.45;
        let currentSection = sections[0];

        sections.forEach((section) => {
            if (section.getBoundingClientRect().top <= threshold) {
                currentSection = section;
            }
        });

        links.forEach((link) => {
            if (currentSection && link.hash === `#${currentSection.id}`) {
                link.setAttribute("aria-current", "location");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    }

    window.addEventListener("scroll", updateCurrentLink, { passive: true });
    window.addEventListener("resize", updateCurrentLink);
    updateCurrentLink();
}
