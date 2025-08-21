import Route from "./Route.js";
import { allRoutes, websiteName } from "./allRoutes.js";

const route404 = new Route("/404", "Page introuvable", "/Pages/404.html", []);

// Récupérer la route correspondant à l'URL
const getRouteByUrl = (url) => allRoutes.find(r => r.url === url) || route404;

// Charger le contenu d'une page
const LoadContentPage = async () => {
    const path = window.location.pathname;
    const actualRoute = getRouteByUrl(path);

    // Vérification des droits
    const roles = actualRoute.authorize;
    if (roles.length && !isConnected()) return window.location.replace("/connexion");
    if (roles.length && !roles.includes(getRole())) return window.location.replace("/404");

    try {
        const html = await fetch(actualRoute.pathHtml + "?v=" + Date.now(), { cache: "no-store" })
            .then(r => r.ok ? r.text() : fetch(route404.pathHtml + "?v=" + Date.now()).then(r2 => r2.text()));
        document.getElementById("main-page").innerHTML = html;
    } catch (err) {
        console.error(err);
        document.getElementById("main-page").innerHTML = "<h1>Erreur lors du chargement</h1>";
    }

    // JS de page
    if (actualRoute.pathJS) {
        const oldScript = document.getElementById("page-script");
        if (oldScript) oldScript.remove();

        const script = document.createElement("script");
        script.src = actualRoute.pathJS + "?v=" + Date.now();
        script.id = "page-script";
        document.body.appendChild(script);
    }

    document.title = `${actualRoute.title} - ${websiteName}`;
    editByRoles();
};

// Gestion des clics
window.route = (e) => { e.preventDefault(); window.history.pushState({}, "", e.currentTarget.href); LoadContentPage(); };
window.navigate = (path) => { if (window.location.pathname !== path) { window.history.pushState({}, "", path); LoadContentPage(); } };
window.onpopstate = LoadContentPage;

// Chargement initial
LoadContentPage();
