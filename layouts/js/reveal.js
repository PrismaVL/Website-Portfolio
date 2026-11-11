const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

export function revealTargets(root, selectors) {
    const targets = selectors.flatMap((selector) => Array.from(root.querySelectorAll(selector)));

    targets.forEach((target) => target.classList.add("wireframe-reveal"));

    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
        targets.forEach((target) => target.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                currentObserver.unobserve(entry.target);
            }
        });
    }, { rootMargin: "0px 0px -15% 0px", threshold: 0.01 });

    targets.forEach((target) => observer.observe(target));
}
