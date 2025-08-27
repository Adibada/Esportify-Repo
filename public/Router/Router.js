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

    // Ne jamais intercepter les routes API
    if (path.startsWith("/api")) {
        return; // laisse Symfony gérer la requête
    }

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
        console.error("Erreur fetch HTML :", err);
        document.getElementById("main-page").innerHTML = "<h1>Erreur lors du chargement</h1>";
    }

    // Chargement du JS spécifique
    if (actualRoute.pathJS) {
        // Supprimer ancien script si existant
        const oldScript = document.getElementById("page-script");
        if (oldScript) oldScript.remove();

        try {
            // Essayer d'importer comme module ES
            const module = await import(BASE_URL + actualRoute.pathJS + "?v=" + Date.now());
            if (module.default) {
                module.default(); // ⚡ Appelle initPage() si export default
            } else {
                console.log("Module chargé mais pas d'export default, code passif exécuté");
            }
        } catch (err) {
            // Si import échoue (fichier non module), charger en script classique
            console.warn("Import module échoué, injection script classique :", err);
            const script = document.createElement("script");
            script.src = BASE_URL + actualRoute.pathJS + "?v=" + Date.now();
            script.id = "page-script";
            document.body.appendChild(script);
        }
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
