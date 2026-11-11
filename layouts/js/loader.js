const parts = [
    "header",
    "home",
    "about",
    "stack",
    "projects",
    "experience",
    "certifications",
    "contact",
    "footer"
];

function loadStylesheet(part) {
    return new Promise((resolve, reject) => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `css/parts/${part}.css`;
        link.onload = resolve;
        link.onerror = () => reject(new Error(`Unable to load ${link.href}`));
        document.head.append(link);
    });
}

function showLoadError(error) {
    console.error("The wireframe layout could not be initialized.", error);
    document.body.dataset.layoutError = "true";
    const message = document.createElement("p");
    message.className = "layout-error";
    message.textContent = "The layout could not be loaded. Open this page through the local web server.";
    document.body.append(message);
}

async function loadPart(part) {
    const response = await fetch(`parts/${part}.html`);
    if (!response.ok) {
        throw new Error(`Unable to load ${part}.html (${response.status})`);
    }

    const target = document.querySelector(`[data-layout-part="${part}"]`);
    target.innerHTML = await response.text();
    await loadStylesheet(part);

    const module = await import(`./parts/${part}.js`);
    return { target, module };
}

try {
    const loadedParts = await Promise.all(parts.map(loadPart));
    loadedParts.forEach(({ target, module }) => module.init(target));

    const portfolioScript = document.createElement("script");
    portfolioScript.src = "../js/index.js";
    portfolioScript.onerror = () => {
        showLoadError(new Error("Unable to load the portfolio interactions."));
    };
    document.body.append(portfolioScript);
} catch (error) {
    showLoadError(error);
}
