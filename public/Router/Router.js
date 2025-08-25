import Route from "./Route.js";
import { allRoutes, websiteName } from "./allRoutes.js";

// Route 404 par défaut
const route404 = new Route("/404", "Page introuvable", "/Pages/404.html", []);

// Base URL dynamique pour éviter les problèmes de port
const BASE_URL = window.location.origin;

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
        // Chargement du HTML
        const html = await fetch(BASE_URL + actualRoute.pathHtml + "?v=" + Date.now(), { cache: "no-store" })
            .then(r => r.ok ? r.text() : fetch(BASE_URL + route404.pathHtml + "?v=" + Date.now()).then(r2 => r2.text()));
        document.getElementById("main-page").innerHTML = html;
    } catch (err) {
        console.error(err);
        document.getElementById("main-page").innerHTML = "<h1>Erreur lors du chargement</h1>";
    }

    // Chargement du JS spécifique à la page
    if (actualRoute.pathJS) {
        const oldScript = document.getElementById("page-script");
        if (oldScript) oldScript.remove();

        const script = document.createElement("script");
        script.src = BASE_URL + actualRoute.pathJS + "?v=" + Date.now();
        script.id = "page-script";
        document.body.appendChild(script);
    }

    // Mise à jour du titre
    document.title = `${actualRoute.title} - ${websiteName}`;
    editByRoles();
};

// Gestion des clics
window.route = (e) => { 
    e.preventDefault(); 
    window.history.pushState({}, "", e.currentTarget.href); 
    LoadContentPage(); 
};
window.navigate = (path) => { 
    if (window.location.pathname !== path) { 
        window.history.pushState({}, "", path); 
        LoadContentPage(); 
    } 
};
window.onpopstate = LoadContentPage;

// Chargement initial
LoadContentPage();
