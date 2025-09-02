import Route from "./Route.js";

//Définir ici vos routes
export const allRoutes = [
    //Routes Générales
    new Route("/", "Accueil", "/Pages/home.html", []),
    new Route("/contact", "Contact", "/Pages/contact.html", []),

    //Routes Profils
    new Route("/monProfil", "Mon Profil", "/Pages/monProfil.html", [], "/js/auth/monProfil.js"),
    new Route("/connexion", "Connexion", "/Pages/connexion.html", [], "/js/auth/connexion.js"),
    new Route("/inscription", "Inscription", "/Pages/inscription.html", [], "/js/auth/inscription.js"),
    new Route("/modifierProfil", "Modifier Profil", "/Pages/modifierProfil.html", []),

    //Routes Evènements
    new Route("/rechercheEvenements","Recherche d'évènements", "/Pages/rechercheEvenements.html", []),
    new Route("/evenement", "Evenement", "/Pages/Evenements/evenement.html", [], "/js/evenement.js"),
    new Route("/creationEvenement", "Création d'évènement", "/Pages/creationEvenement.html", ["organizer", "admin"]),
];

//Le titre s'affiche comme ceci : Route.titre - websiteName
export const websiteName = "Esportify";