if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
}

const intro = document.querySelector(".intro");

if (intro) {
    document.documentElement.classList.add("intro-active");
    intro.addEventListener("animationend", (event) => {
        if (event.animationName === "intro-dismiss") {
            document.documentElement.classList.remove("intro-active");
        }
    });
}

window.addEventListener("pageshow", () => {
    if (window.location.hash) {
        history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }

    window.scrollTo(0, 0);
});

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (!prefersReducedMotion.matches && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: "0px 0px -20% 0px", threshold: 0.01 });

    document.querySelectorAll(".content-section").forEach((section) => {
        const revealTargets = [];

        Array.from(section.children).forEach((child) => {
            if (child.classList.contains("stack-list")) {
                revealTargets.push(...child.querySelectorAll(".stack-group > h3, .stack-group > .stack-items"));
            } else {
                revealTargets.push(child);
            }
        });

        revealTargets.forEach((target) => {
            target.classList.add("scroll-reveal");
            revealObserver.observe(target);
        });
    });
}

let targetScrollY = window.scrollY;
let scrollFrame = 0;
let previousFrame = 0;
let navigationFrame = 0;

function stopWheelScroll() {
    cancelAnimationFrame(scrollFrame);
    cancelAnimationFrame(navigationFrame);
    scrollFrame = 0;
    previousFrame = 0;
    navigationFrame = 0;
    targetScrollY = window.scrollY;
}

if (!prefersReducedMotion.matches) {
    let scrollEase = 100;

    function animateWheelScroll(timestamp) {
        if (!previousFrame) {
            previousFrame = timestamp;
        }

        const progress = 1 - Math.exp(-(timestamp - previousFrame) / scrollEase);
        previousFrame = timestamp;
        const distance = targetScrollY - window.scrollY;

        if (Math.abs(distance) < 1) {
            window.scrollTo({ top: targetScrollY, behavior: "instant" });
            scrollFrame = 0;
            previousFrame = 0;
            return;
        }

        window.scrollTo({ top: window.scrollY + distance * progress, behavior: "instant" });
        scrollFrame = requestAnimationFrame(animateWheelScroll);
    }

    window.addEventListener("wheel", (event) => {
        if (event.ctrlKey || !event.deltaY || !event.cancelable) {
            return;
        }

        cancelAnimationFrame(navigationFrame);
        navigationFrame = 0;

        const delta = event.deltaY * (event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16
            : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? window.innerHeight
            : 1);
        const absoluteDelta = Math.abs(event.deltaY);
        const isMouseWheel = event.deltaMode === WheelEvent.DOM_DELTA_LINE
            || (event.deltaMode === WheelEvent.DOM_DELTA_PIXEL
                && absoluteDelta >= 80
                && (absoluteDelta % 100 === 0 || absoluteDelta % 120 === 0));
        const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
        scrollEase = isMouseWheel ? 240 : 100;

        if (!scrollFrame) {
            targetScrollY = window.scrollY;
        }

        targetScrollY = Math.max(0, Math.min(targetScrollY + delta * (isMouseWheel ? 0.5 : 1), maxScrollY));
        event.preventDefault();

        if (!scrollFrame) {
            scrollFrame = requestAnimationFrame(animateWheelScroll);
        }
    }, { passive: false });

    window.addEventListener("pointerdown", stopWheelScroll, { passive: true });
    window.addEventListener("touchstart", stopWheelScroll, { passive: true });
    window.addEventListener("keydown", stopWheelScroll);
}

document.querySelector("nav")?.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
        return;
    }

    const link = event.target.closest("a[href^='#']");
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
    }

    const section = document.getElementById(link.hash.slice(1));
    if (!section) {
        return;
    }

    event.preventDefault();
    stopWheelScroll();

    if (window.location.hash !== link.hash) {
        history.pushState(null, "", link.hash);
    }

    const start = window.scrollY;
    const end = Math.min(
        start + section.getBoundingClientRect().top,
        document.documentElement.scrollHeight - window.innerHeight
    );

    if (prefersReducedMotion.matches) {
        window.scrollTo({ top: end, behavior: "instant" });
        return;
    }

    const duration = Math.min(1800, Math.max(1000, Math.abs(end - start) * 0.8));
    let animationStart;

    function animateNavigation(timestamp) {
        if (animationStart === undefined) {
            animationStart = timestamp;
        }

        const progress = Math.min((timestamp - animationStart) / duration, 1);
        const easedProgress = progress < 0.5
            ? 4 * progress ** 3
            : 1 - ((-2 * progress + 2) ** 3) / 2;
        window.scrollTo({
            top: start + (end - start) * easedProgress,
            behavior: "instant"
        });

        if (progress < 1) {
            navigationFrame = requestAnimationFrame(animateNavigation);
        } else {
            navigationFrame = 0;
        }
    }

    navigationFrame = requestAnimationFrame(animateNavigation);
});

const scrollProgress = document.querySelector(".scroll-progress__fill");

if (scrollProgress) {
    function updateScrollProgress() {
        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollableHeight > 0
            ? Math.min(window.scrollY / scrollableHeight, 1)
            : 0;
        scrollProgress.style.setProperty("--scroll-progress", `${progress * 100}%`);
    }

    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    window.addEventListener("resize", updateScrollProgress);
    updateScrollProgress();
}

document.querySelectorAll(".project-carousel").forEach((carousel) => {
    const track = carousel.querySelector(".project-carousel__track");
    const slides = Array.from(track.children);
    const pagination = carousel.querySelector(".project-carousel__pagination");
    const status = carousel.querySelector(".project-carousel__status");
    const filters = Array.from(carousel.querySelectorAll(".project-carousel__filter"));
    let activeCategory = "all";
    let visibleSlides = slides;
    let activeIndex = 0;
    let dots = [];

    function updateSlide(index) {
        activeIndex = (index + visibleSlides.length) % visibleSlides.length;
        track.style.transform = `translateX(-${activeIndex * 100}%)`;
        status.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(visibleSlides.length).padStart(2, "0")}`;

        visibleSlides.forEach((slide, slideIndex) => {
            const isActive = slideIndex === activeIndex;
            slide.setAttribute("aria-label", `${slideIndex + 1} of ${visibleSlides.length}`);
            slide.setAttribute("aria-hidden", String(!isActive));
            slide.toggleAttribute("inert", !isActive);
            dots[slideIndex].setAttribute("aria-current", String(isActive));
        });
    }

    function updateCategory(category) {
        activeCategory = category;
        visibleSlides = slides.filter((slide) => (
            category === "all" || slide.dataset.category === category
        ));
        activeIndex = 0;

        slides.forEach((slide) => {
            const isVisible = visibleSlides.includes(slide);
            slide.hidden = !isVisible;
            slide.setAttribute("aria-hidden", "true");
            slide.toggleAttribute("inert", !isVisible);
        });

        filters.forEach((filter) => {
            filter.setAttribute("aria-pressed", String(filter.dataset.category === category));
        });

        pagination.replaceChildren();
        dots = visibleSlides.map((slide, index) => {
            const button = document.createElement("button");
            button.className = "project-carousel__dot";
            button.type = "button";
            button.setAttribute("aria-label", `Show ${slide.querySelector("h3").textContent}`);
            button.addEventListener("click", () => updateSlide(index));
            pagination.append(button);
            return button;
        });

        updateSlide(activeIndex);
    }

    filters.forEach((filter) => {
        filter.addEventListener("click", () => updateCategory(filter.dataset.category));
    });

    carousel.querySelectorAll(".project-carousel__arrow").forEach((button) => {
        button.addEventListener("click", () => {
            updateSlide(activeIndex + Number(button.dataset.direction));
        });
    });

    carousel.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            updateSlide(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
        }
    });

    updateCategory(activeCategory);
});
