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
