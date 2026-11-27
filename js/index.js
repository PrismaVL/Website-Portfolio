if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
}

const intro = document.querySelector(".intro");

if (intro) {
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

    const contactRevealTargets = [];
    document.querySelectorAll(".content-section").forEach((section) => {
        const revealTargets = [];

        Array.from(section.children).forEach((child) => {
            if (section.id === "contact") {
                contactRevealTargets.push(child);
                return;
            }

            if (child.classList.contains("stack-list")) {
                child.querySelectorAll(".stack-group").forEach((group) => {
                    revealTargets.push(group.querySelector("h3"));
                    group.querySelectorAll(".stack-items li").forEach((item, index) => {
                        item.style.setProperty("--reveal-delay", `${index * 100}ms`);
                        revealTargets.push(item);
                    });
                });
            } else if (child.classList.contains("project-carousel")) {
                revealTargets.push(child);
                child.querySelectorAll(".project-card__preview--image").forEach((preview) => {
                    revealTargets.push(preview);
                });
            } else {
                revealTargets.push(child);
            }
        });

        revealTargets.forEach((target) => {
            target.classList.add("scroll-reveal");
            revealObserver.observe(target);
        });
    });

    const contactRevealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.01 });

    contactRevealTargets.forEach((target) => {
        target.classList.add("scroll-reveal");
        contactRevealObserver.observe(target);
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
        if (document.documentElement.classList.contains("intro-active")) {
            event.preventDefault();
            stopWheelScroll();
            return;
        }

        if (event.ctrlKey || !event.deltaY || !event.cancelable) {
            return;
        }

        cancelAnimationFrame(navigationFrame);
        navigationFrame = 0;

        const delta = event.deltaY * (event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16
            : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? window.innerHeight
            : 1);
        const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
        scrollEase = 100;

        if (!scrollFrame) {
            targetScrollY = window.scrollY;
        }

        targetScrollY = Math.max(0, Math.min(targetScrollY + delta, maxScrollY));
        event.preventDefault();

        if (!scrollFrame) {
            scrollFrame = requestAnimationFrame(animateWheelScroll);
        }
    }, { passive: false });

    window.addEventListener("pointerdown", stopWheelScroll, { passive: true });
    window.addEventListener("touchstart", stopWheelScroll, { passive: true });
    window.addEventListener("keydown", stopWheelScroll);
}

document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
        return;
    }

    const link = event.target.closest("nav a[href^='#'], .hero__link[href^='#'], .back-to-top[href^='#']");
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
    const sectionTop = start + section.getBoundingClientRect().top;
    const alignmentOffset = section.id === "about" || section.id === "stack"
        ? (window.innerHeight - section.offsetHeight) / 2
        : 0;
    const end = Math.max(0, Math.min(
        sectionTop - alignmentOffset,
        document.documentElement.scrollHeight - window.innerHeight
    ));

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

const navToggle = document.querySelector(".nav-toggle");
const mainNavigation = document.getElementById("main-navigation");
const navScrim = document.querySelector(".nav-scrim");
const navSheetHandle = document.querySelector(".nav-sheet-handle");

if (navToggle && mainNavigation && navScrim) {
    function setNavigationOpen(isOpen) {
        document.body.classList.toggle("nav-open", isOpen);
        navToggle.setAttribute("aria-expanded", String(isOpen));
        navToggle.querySelector(".sr-only").textContent = isOpen
            ? "Close navigation menu"
            : "Open navigation menu";
    }

    navToggle.addEventListener("click", () => {
        setNavigationOpen(navToggle.getAttribute("aria-expanded") !== "true");
    });

    navScrim.addEventListener("click", () => setNavigationOpen(false));
    mainNavigation.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => setNavigationOpen(false));
    });

    if (navSheetHandle) {
        let dragStartY = null;

        navSheetHandle.addEventListener("pointerdown", (event) => {
            dragStartY = event.clientY;
            navSheetHandle.setPointerCapture?.(event.pointerId);
            mainNavigation.style.transition = "none";
        });

        navSheetHandle.addEventListener("pointermove", (event) => {
            if (dragStartY === null) {
                return;
            }

            event.preventDefault();
            const distance = Math.max(0, event.clientY - dragStartY);
            mainNavigation.style.transform = `translateY(${distance}px)`;
        });

        const finishSheetDrag = (event) => {
            if (dragStartY === null) {
                return;
            }

            const distance = Math.max(0, event.clientY - dragStartY);
            dragStartY = null;
            mainNavigation.style.transition = "";
            mainNavigation.style.removeProperty("transform");

            if (distance > 80) {
                setNavigationOpen(false);
            }
        };

        navSheetHandle.addEventListener("pointerup", finishSheetDrag);
        navSheetHandle.addEventListener("pointercancel", finishSheetDrag);
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
            setNavigationOpen(false);
            navToggle.focus();
        }
    });
}

const navigationLinks = [...document.querySelectorAll("#main-navigation a")];
const navigationSections = navigationLinks
    .map((link) => document.getElementById(link.hash.slice(1)))
    .filter(Boolean);

if (navigationLinks.length && navigationSections.length) {
    function updateCurrentNavigation() {
        const marker = window.innerHeight * 0.35;
        let currentId = navigationSections[0].id;

        navigationSections.forEach((section) => {
            if (section.getBoundingClientRect().top <= marker) {
                currentId = section.id;
            }
        });

        navigationLinks.forEach((link) => {
            const isCurrent = link.hash === `#${currentId}`;
            link.classList.toggle("is-current", isCurrent);
            if (isCurrent) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    }

    window.addEventListener("scroll", updateCurrentNavigation, { passive: true });
    window.addEventListener("resize", updateCurrentNavigation);
    updateCurrentNavigation();
}

function enableSwipeNavigation(viewport, onSwipe) {
    let startX = 0;
    let startY = 0;
    let activePointerId = null;

    viewport.addEventListener("pointerdown", (event) => {
        if (!window.matchMedia("(max-width: 640px)").matches
            || (event.pointerType === "mouse" && event.button !== 0)
            || event.target.closest(".project-card__gallery")) {
            return;
        }

        activePointerId = event.pointerId;
        startX = event.clientX;
        startY = event.clientY;
        viewport.setPointerCapture?.(event.pointerId);
    });

    viewport.addEventListener("pointerup", (event) => {
        if (event.pointerId !== activePointerId) {
            return;
        }

        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;
        activePointerId = null;

        if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) {
            return;
        }

        onSwipe(deltaX < 0 ? 1 : -1);
    });

    viewport.addEventListener("pointercancel", () => {
        activePointerId = null;
    });
}

const aboutSection = document.getElementById("about");
const backToTop = document.querySelector(".back-to-top");

if (aboutSection && backToTop) {
    function updateBackToTopVisibility() {
        backToTop.classList.toggle(
            "is-visible",
            aboutSection.getBoundingClientRect().top <= window.innerHeight * 0.25
        );
    }

    window.addEventListener("scroll", updateBackToTopVisibility, { passive: true });
    window.addEventListener("resize", updateBackToTopVisibility);
    updateBackToTopVisibility();
}

const scrollProgress = document.querySelector(".scroll-progress__fill");

if (scrollProgress) {
    const scrollRail = scrollProgress.closest(".scroll-progress");

    function updateScrollProgress() {
        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollableHeight > 0
            ? Math.min(window.scrollY / scrollableHeight, 1)
            : 0;
        scrollProgress.style.setProperty("--scroll-progress", `${progress * 100}%`);
        scrollRail?.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
    }

    if (scrollRail) {
        let isDragging = false;

        function scrollToRailPosition(clientY) {
            const bounds = scrollRail.getBoundingClientRect();
            const progress = Math.max(0, Math.min((clientY - bounds.top) / bounds.height, 1));
            const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
            stopWheelScroll();
            window.scrollTo({
                top: progress * maxScrollY,
                behavior: "instant"
            });
        }

        scrollRail.addEventListener("pointerdown", (event) => {
            if (event.pointerType === "mouse" && event.button !== 0) {
                return;
            }

            isDragging = true;
            scrollRail.setPointerCapture?.(event.pointerId);
            scrollToRailPosition(event.clientY);
            event.preventDefault();
        });

        scrollRail.addEventListener("pointermove", (event) => {
            if (!isDragging) {
                return;
            }

            scrollToRailPosition(event.clientY);
            event.preventDefault();
        });

        const stopRailDrag = (event) => {
            if (!isDragging) {
                return;
            }

            isDragging = false;
            scrollRail.releasePointerCapture?.(event.pointerId);
        };

        scrollRail.addEventListener("pointerup", stopRailDrag);
        scrollRail.addEventListener("pointercancel", stopRailDrag);

        scrollRail.addEventListener("keydown", (event) => {
            const step = window.innerHeight * 0.1;
            let nextScrollY;

            if (event.key === "ArrowDown") {
                nextScrollY = window.scrollY + step;
            } else if (event.key === "ArrowUp") {
                nextScrollY = window.scrollY - step;
            } else if (event.key === "PageDown") {
                nextScrollY = window.scrollY + window.innerHeight;
            } else if (event.key === "PageUp") {
                nextScrollY = window.scrollY - window.innerHeight;
            } else if (event.key === "Home") {
                nextScrollY = 0;
            } else if (event.key === "End") {
                nextScrollY = document.documentElement.scrollHeight - window.innerHeight;
            }

            if (nextScrollY === undefined) {
                return;
            }

            event.preventDefault();
            stopWheelScroll();
            window.scrollTo({ top: nextScrollY, behavior: "instant" });
        });
    }

    window.addEventListener("scroll", updateScrollProgress, { passive: true });
    window.addEventListener("resize", updateScrollProgress);
    updateScrollProgress();
}

function getMostVisibleCarousel() {
    let mostVisibleCarousel = null;
    let mostVisibleArea = 0;

    document.querySelectorAll(".project-carousel, .certification-carousel").forEach((carousel) => {
        const bounds = carousel.getBoundingClientRect();
        const visibleWidth = Math.max(0, Math.min(bounds.right, window.innerWidth) - Math.max(bounds.left, 0));
        const visibleHeight = Math.max(0, Math.min(bounds.bottom, window.innerHeight) - Math.max(bounds.top, 0));
        const visibleArea = visibleWidth * visibleHeight;

        if (visibleArea > mostVisibleArea) {
            mostVisibleArea = visibleArea;
            mostVisibleCarousel = carousel;
        }
    });

    return mostVisibleCarousel;
}

document.querySelectorAll(".project-carousel").forEach((carousel) => {
    const track = carousel.querySelector(".project-carousel__track");
    const viewport = carousel.querySelector(".project-carousel__viewport");
    const slides = Array.from(track.children);
    const pagination = carousel.querySelector(".project-carousel__pagination");
    const status = carousel.querySelector(".project-carousel__status");
    const filterGroup = carousel.querySelector(".project-carousel__filters");
    const filters = Array.from(carousel.querySelectorAll(".project-carousel__filter"));
    const videos = Array.from(carousel.querySelectorAll(".project-card__video"));
    videos.forEach((video) => {
        video.dataset.videoSrc = video.getAttribute("src");
        video.setAttribute("src", "about:blank");
    });
    let activeCategory = "all";
    let visibleSlides = slides;
    let activeIndex = 0;
    let dots = [];
    let viewportAnimation;
    let sectionScrollFrame;

    const projectTitles = Array.from(carousel.querySelectorAll(".project-card__info h3"));

    projectTitles.forEach((title) => {
        const text = title.textContent.trim();
        const titleTrack = document.createElement("span");
        titleTrack.className = "project-title__track";

        [false, true].forEach((isDuplicate) => {
            const titleText = document.createElement("span");
            titleText.className = "project-title__text";
            titleText.textContent = text;
            if (isDuplicate) {
                titleText.setAttribute("aria-hidden", "true");
            }
            titleTrack.append(titleText);
        });

        title.replaceChildren(titleTrack);
    });

    function updateProjectTitleMarquees() {
        const isMobile = window.matchMedia("(max-width: 640px)").matches;
        projectTitles.forEach((title) => {
            const firstText = title.querySelector(".project-title__text");
            title.classList.toggle(
                "is-marquee",
                isMobile && firstText.scrollWidth > title.clientWidth
            );
        });
    }

    function scrollFiltersIntoPosition(targetTop) {
        cancelAnimationFrame(sectionScrollFrame);
        sectionScrollFrame = 0;

        const start = window.scrollY;
        const end = Math.max(0, Math.min(
            start + filterGroup.getBoundingClientRect().top - targetTop,
            document.documentElement.scrollHeight - window.innerHeight
        ));

        if (prefersReducedMotion.matches || Math.abs(end - start) < 1) {
            window.scrollTo({ top: end, behavior: "instant" });
            return;
        }

        const duration = 600;
        let animationStart;

        function animateScroll(timestamp) {
            if (animationStart === undefined) {
                animationStart = timestamp;
            }

            const progress = Math.min((timestamp - animationStart) / duration, 1);
            const easedProgress = 1 - (1 - progress) ** 3;
            window.scrollTo({
                top: start + (end - start) * easedProgress,
                behavior: "instant"
            });

            if (progress < 1) {
                sectionScrollFrame = requestAnimationFrame(animateScroll);
            } else {
                sectionScrollFrame = 0;
            }
        }

        sectionScrollFrame = requestAnimationFrame(animateScroll);
    }

    window.addEventListener("wheel", () => {
        cancelAnimationFrame(sectionScrollFrame);
        sectionScrollFrame = 0;
    }, { passive: true });
    window.addEventListener("touchstart", () => {
        cancelAnimationFrame(sectionScrollFrame);
        sectionScrollFrame = 0;
    }, { passive: true });

    function updateViewportHeight(animate = true) {
        if (animate) {
            const targetTop = Math.min(165, window.innerHeight * 0.35);
            scrollFiltersIntoPosition(targetTop);
        }

        const currentHeight = viewport.getBoundingClientRect().height;
        if (viewportAnimation) {
            viewportAnimation.cancel();
            viewportAnimation = null;
        }

        const targetHeight = visibleSlides[activeIndex].getBoundingClientRect().height;
        viewport.style.height = `${currentHeight}px`;

        if (!animate || prefersReducedMotion.matches || Math.abs(targetHeight - currentHeight) < 1) {
            viewport.style.height = `${targetHeight}px`;
            return;
        }

        viewportAnimation = viewport.animate(
            [{ height: `${currentHeight}px` }, { height: `${targetHeight}px` }],
            { duration: 450, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
        );
        viewportAnimation.onfinish = () => {
            viewport.style.height = `${targetHeight}px`;
            viewportAnimation = null;
        };
    }

    function updateSlide(index, animateHeight = true) {
        const previousIndex = activeIndex;
        const direction = index >= previousIndex ? "next" : "previous";
        activeIndex = (index + visibleSlides.length) % visibleSlides.length;
        track.style.transform = `translate3d(-${activeIndex * viewport.clientWidth}px, 0, 0)`;
        status.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(visibleSlides.length).padStart(2, "0")}`;

        visibleSlides.forEach((slide, slideIndex) => {
            const isActive = slideIndex === activeIndex;
            slide.setAttribute("aria-label", `${slideIndex + 1} of ${visibleSlides.length}`);
            slide.setAttribute("aria-hidden", String(!isActive));
            slide.toggleAttribute("inert", !isActive);
            slide.classList.toggle("is-active", isActive);
            slide.classList.remove("slide-from-next", "slide-from-previous");
            if (isActive && animateHeight && activeIndex !== previousIndex) {
                slide.classList.add(`slide-from-${direction}`);
            }
            dots[slideIndex].setAttribute("aria-current", String(isActive));
        });

        updateProjectTitleMarquees();

        updateViewportHeight(animateHeight);

        slides.forEach((slide) => {
            const video = slide.querySelector(".project-card__video");
            if (!video) {
                return;
            }

            const source = slide === visibleSlides[activeIndex] ? video.dataset.videoSrc : "about:blank";
            if (video.getAttribute("src") !== source) {
                video.setAttribute("src", source);
            }
        });
    }

    function updateCategory(category, animateHeight = true) {
        activeCategory = category;
        carousel.dataset.activeCategory = category;
        visibleSlides = slides.filter((slide) => (
            category === "all" || slide.dataset.category === category
        ));
        activeIndex = 0;

        slides.forEach((slide) => {
            const isVisible = visibleSlides.includes(slide);
            slide.hidden = !isVisible;
            slide.setAttribute("aria-hidden", "true");
            slide.toggleAttribute("inert", !isVisible);
            slide.classList.remove("is-active");
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

        updateSlide(activeIndex, animateHeight);
    }

    filters.forEach((filter) => {
        filter.addEventListener("click", () => updateCategory(filter.dataset.category));
    });

    window.addEventListener("resize", () => {
        track.style.transform = `translate3d(-${activeIndex * viewport.clientWidth}px, 0, 0)`;
    });

    carousel.querySelectorAll(".project-carousel__arrow").forEach((button) => {
        button.addEventListener("click", () => {
            updateSlide(activeIndex + Number(button.dataset.direction));
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            if (getMostVisibleCarousel() !== carousel
                || event.target.closest(".project-card__gallery")
                || event.target.closest("input, textarea, select, [contenteditable='true']")) {
                return;
            }
            event.preventDefault();
            updateSlide(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
        }
    });

    enableSwipeNavigation(viewport, (direction) => {
        updateSlide(activeIndex + direction);
    });

    updateCategory(activeCategory, false);
    window.addEventListener("resize", () => updateViewportHeight(false));
    window.addEventListener("resize", updateProjectTitleMarquees);
    updateProjectTitleMarquees();
});

document.querySelectorAll(".project-card__gallery").forEach((gallery) => {
    const card = gallery.closest(".project-card");
    const preview = card.querySelector(".project-card__image");
    const thumbnails = Array.from(gallery.querySelectorAll(".project-card__thumbnail"));
    let imageRequestId = 0;
    let isTransitioning = false;

    thumbnails.forEach((thumbnail) => {
        thumbnail.addEventListener("click", () => {
            if (isTransitioning || preview.getAttribute("src") === thumbnail.dataset.previewImage) {
                return;
            }

            isTransitioning = true;
            const currentIndex = thumbnails.findIndex((item) => item.getAttribute("aria-pressed") === "true");
            const nextIndex = thumbnails.indexOf(thumbnail);
            const slideDirection = nextIndex < currentIndex ? "left" : "right";
            const requestedImage = thumbnail.dataset.previewImage;
            const requestId = ++imageRequestId;
            const preloadedImage = new Image();

            preloadedImage.onload = () => {
                if (requestId !== imageRequestId) {
                    isTransitioning = false;
                    return;
                }

                const previousTransition = card.querySelector(".project-card__image--transitioning-in");
                previousTransition?.remove();
                preview.classList.remove(
                    "project-card__image--transitioning-out",
                    "project-card__image--from-left",
                    "project-card__image--from-right"
                );

                if (prefersReducedMotion.matches) {
                    preview.src = requestedImage;
                    isTransitioning = false;
                } else {
                    const incomingPreview = preview.cloneNode(true);
                    incomingPreview.src = requestedImage;
                    incomingPreview.classList.remove("project-card__image--transitioning-out");
                    incomingPreview.classList.add(
                        "project-card__image--transitioning-in",
                        `project-card__image--from-${slideDirection}`
                    );
                    incomingPreview.setAttribute("aria-hidden", "true");

                    preview.classList.add(
                        "project-card__image--transitioning-out",
                        `project-card__image--from-${slideDirection}`
                    );
                    preview.parentElement.append(incomingPreview);

                    incomingPreview.addEventListener("animationend", () => {
                        if (requestId !== imageRequestId) {
                            return;
                        }

                        preview.src = requestedImage;
                        preview.classList.remove(
                            "project-card__image--transitioning-out",
                            "project-card__image--from-left",
                            "project-card__image--from-right"
                        );
                        incomingPreview.remove();
                        isTransitioning = false;
                    }, { once: true });
                }

                thumbnails.forEach((item) => {
                    item.setAttribute("aria-pressed", String(item === thumbnail));
                });
            };

            preloadedImage.onerror = () => {
                if (requestId === imageRequestId) {
                    isTransitioning = false;
                }
            };

            preloadedImage.src = requestedImage;
        });
    });
});

document.querySelectorAll(".certification-carousel").forEach((carousel) => {
    const track = carousel.querySelector(".certification-carousel__track");
    const slides = Array.from(track.children);
    const pagination = carousel.querySelector(".certification-carousel__pagination");
    const status = carousel.querySelector(".certification-carousel__status");
    const arrows = Array.from(carousel.querySelectorAll(".certification-carousel__arrow"));
    let visibleCount = Number.parseInt(
        window.getComputedStyle(carousel).getPropertyValue("--certification-cards-visible"),
        10
    );
    let pageCount = Math.ceil(slides.length / visibleCount);
    let activePage = 0;
    let dots = [];
    const shouldAnimateCards = !prefersReducedMotion.matches && "IntersectionObserver" in window;
    const viewedSlides = new Set();
    let carouselIsVisible = false;
    let sectionScrollFrame = 0;

    function focusCertificationSection() {
        cancelAnimationFrame(sectionScrollFrame);
        sectionScrollFrame = 0;

        const start = window.scrollY;
        const bounds = carousel.getBoundingClientRect();
        const end = Math.max(0, Math.min(
            start + bounds.top + bounds.height / 2 - window.innerHeight / 2,
            document.documentElement.scrollHeight - window.innerHeight
        ));

        if (prefersReducedMotion.matches || Math.abs(end - start) < 1) {
            window.scrollTo({ top: end, behavior: "instant" });
            return;
        }

        const duration = 600;
        let animationStart;

        function animateScroll(timestamp) {
            if (animationStart === undefined) {
                animationStart = timestamp;
            }

            const progress = Math.min((timestamp - animationStart) / duration, 1);
            const easedProgress = 1 - (1 - progress) ** 3;
            window.scrollTo({
                top: start + (end - start) * easedProgress,
                behavior: "instant"
            });

            if (progress < 1) {
                sectionScrollFrame = requestAnimationFrame(animateScroll);
            } else {
                sectionScrollFrame = 0;
            }
        }

        sectionScrollFrame = requestAnimationFrame(animateScroll);
    }

    window.addEventListener("wheel", () => {
        cancelAnimationFrame(sectionScrollFrame);
        sectionScrollFrame = 0;
    }, { passive: true });
    window.addEventListener("touchstart", () => {
        cancelAnimationFrame(sectionScrollFrame);
        sectionScrollFrame = 0;
    }, { passive: true });

    if (shouldAnimateCards) {
        slides.forEach((slide) => slide.classList.add("certification-card--reveal"));
    }

    function revealVisibleSlides(firstVisibleIndex, lastVisibleIndex) {
        if (!shouldAnimateCards || !carouselIsVisible) {
            return;
        }

        slides.slice(firstVisibleIndex, lastVisibleIndex).forEach((slide, index) => {
            if (viewedSlides.has(slide)) {
                return;
            }

            viewedSlides.add(slide);
            slide.style.setProperty("--certification-reveal-delay", `${index * 120}ms`);
            requestAnimationFrame(() => slide.classList.add("is-revealed"));
        });
    }

    function updatePage(page) {
        activePage = (page + pageCount) % pageCount;
        const firstVisibleIndex = activePage * visibleCount;
        const lastVisibleIndex = Math.min(firstVisibleIndex + visibleCount, slides.length);
        track.style.transform = `translateX(-${firstVisibleIndex / visibleCount * carousel.clientWidth}px)`;
        const firstVisibleLabel = String(firstVisibleIndex + 1).padStart(2, "0");
        const totalLabel = String(slides.length).padStart(2, "0");
        status.textContent = window.matchMedia("(max-width: 640px)").matches
            ? `${firstVisibleLabel} / ${totalLabel}`
            : `${firstVisibleLabel}\u2013${String(lastVisibleIndex).padStart(2, "0")} / ${totalLabel}`;

        slides.forEach((slide, slideIndex) => {
            const isActive = slideIndex >= firstVisibleIndex && slideIndex < lastVisibleIndex;
            slide.setAttribute("aria-label", `${slideIndex + 1} of ${slides.length}`);
            slide.setAttribute("aria-hidden", String(!isActive));
            slide.toggleAttribute("inert", !isActive);
        });

        dots.forEach((dot, dotIndex) => {
            dot.setAttribute("aria-current", String(dotIndex === activePage));
        });

        revealVisibleSlides(firstVisibleIndex, lastVisibleIndex);
    }

    function renderPagination() {
        pagination.replaceChildren();
        dots = Array.from({ length: pageCount }, (_, index) => {
            const button = document.createElement("button");
            button.className = "certification-carousel__dot";
            button.type = "button";
            button.setAttribute("aria-label", `Show certifications ${index * visibleCount + 1} to ${Math.min((index + 1) * visibleCount, slides.length)}`);
            button.addEventListener("click", () => {
                updatePage(index);
                focusCertificationSection();
            });
            pagination.append(button);
            return button;
        });
    }

    renderPagination();

    if (shouldAnimateCards) {
        const visibilityObserver = new IntersectionObserver(([entry]) => {
            carouselIsVisible = entry.isIntersecting;
            if (carouselIsVisible) {
                const firstVisibleIndex = activePage * visibleCount;
                revealVisibleSlides(
                    firstVisibleIndex,
                    Math.min(firstVisibleIndex + visibleCount, slides.length)
                );
            }
        }, { rootMargin: "0px 0px -20% 0px", threshold: 0.01 });
        visibilityObserver.observe(carousel);
    }

    arrows.forEach((button) => {
        button.addEventListener("click", () => {
            updatePage(activePage + Number(button.dataset.direction));
            focusCertificationSection();
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            if (getMostVisibleCarousel() !== carousel
                || event.target.closest("input, textarea, select, [contenteditable='true']")) {
                return;
            }
            event.preventDefault();
            updatePage(activePage + (event.key === "ArrowRight" ? 1 : -1));
            focusCertificationSection();
        }
    });

    enableSwipeNavigation(carousel.querySelector(".certification-carousel__viewport"), (direction) => {
        updatePage(activePage + direction);
    });

    updatePage(activePage);

    window.addEventListener("resize", () => {
        const nextVisibleCount = Number.parseInt(
            window.getComputedStyle(carousel).getPropertyValue("--certification-cards-visible"),
            10
        );

        if (nextVisibleCount !== visibleCount) {
            visibleCount = nextVisibleCount;
            pageCount = Math.ceil(slides.length / visibleCount);
            activePage = Math.min(activePage, pageCount - 1);
            renderPagination();
        }

        updatePage(activePage);
    });
});

if (!prefersReducedMotion.matches) {
    document.addEventListener("pointerdown", (event) => {
        if (event.pointerType !== "touch"
            || event.target.closest("a, button, input, textarea, select, [role=button]")) {
            return;
        }

        const ripple = document.createElement("span");
        ripple.className = "tap-ripple";
        ripple.style.left = `${event.clientX}px`;
        ripple.style.top = `${event.clientY}px`;
        ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
        document.body.append(ripple);
    }, { passive: true });
}
