import Route from "./Route.js";

//Définir ici vos routes
export const allRoutes = [
    //Routes Générales
    new Route("/", "Accueil", "/Pages/home.html", [], "/js/home.js"),
    new Route("/contact", "Contact", "/Pages/contact.html", []),

    //Routes Profils
    new Route("/monProfil", "Mon Profil", "/Pages/monProfil.html", [], "/js/auth/monProfil.js"),
    new Route("/rechercheProfils", "Recherche de profils", "/Pages/rechercheProfils.html", [], "/js/rechercheProfils.js"),
    new Route("/profil", "Profil utilisateur", "/Pages/profil.html", [], "/js/profil.js"),
    new Route("/connexion", "Connexion", "/Pages/connexion.html", [], "/js/auth/connexion.js"),
    new Route("/inscription", "Inscription", "/Pages/inscription.html", [], "/js/auth/inscription.js"),
    new Route("/modifierProfil", "Modifier Profil", "/Pages/modifierProfil.html", [], "/js/auth/modifierProfil.js"),

    //Routes Evènements
    new Route("/rechercheEvenements","Recherche d'évènements", "/Pages/rechercheEvenements.html", [], "/js/rechercheEvenements.js"),
    new Route("/evenement", "Evenement", "/Pages/evenement.html", [], "/js/evenement.js"),
    new Route("/creationEvenement", "Création d'évènement", "/Pages/creationEvenement.html", ["ROLE_ORGANISATEUR", "ROLE_ADMIN"], "/js/creationEvenement.js"),
    new Route("/modifierEvenement", "Modifier l'évènement", "/Pages/modifierEvenement.html", ["ROLE_ORGANISATEUR", "ROLE_ADMIN"], "/js/modifierEvenement.js"),
];

//Le titre s'affiche comme ceci : Route.titre - websiteName
export const websiteName = "Esportify";