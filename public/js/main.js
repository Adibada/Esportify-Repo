//Variables des noms de cookies
const roleCookieName = "role";
const tokenCookieName = "accesstoken";

//Enregistrement du token dans un cookie
function setToken(token) {
    setCookie(tokenCookieName, token, 7);
}

//Récupération du token depuis le cookie
function getToken() {
    return getCookie(tokenCookieName);
}

//Création du cookie et de sa période de validité
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

//récupération du cookie
function getCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for (const element of ca) {
        let c = element;
        while (c.startsWith(' ')) c = c.substring(1, c.length);
        if (c.startsWith(nameEQ)) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

//Suppression du cookie
function eraseCookie(name) {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

// Vérifie si l'utilisateur est connecté
function isConnected() {
    const token = getToken();
    return typeof token === 'string' && token.trim() !== '';
}


//Récupère le rôle de l'utilisateur depuis le cookie
function getRole() {
    return getCookie(roleCookieName);
}

//Fonction pour masquer les éléments en fonction de l'état et du rôle
function editByRoles() {
    const userConnected = isConnected();
    const userRole = getRole();

    let elementsToEdit = document.querySelectorAll('[data-show]');

    elementsToEdit.forEach(element => {
        switch (element.dataset.show) {
            case "disconnected":
                if (userConnected)
                    element.classList.add('d-none');
                break;
            case "connected":
                if (!userConnected)
                    element.classList.add('d-none');
                break;
            case "admin":
                if (!userConnected || userRole !== "admin")
                    element.classList.add('d-none');
                break;
            case "organizer":
                if (!userConnected || userRole !== "organizer")
                    element.classList.add('d-none');
                break;
        }
    })
}

//Refermement de la navbar mobile
document.querySelectorAll('.navbar-collapse .nav-link').forEach(link => {
  link.addEventListener('click', () => {
    const navbarCollapse = document.querySelector('.navbar-collapse');
    if (navbarCollapse.classList.contains('show')) {
      // Ferme la navbar en mode mobile
      new bootstrap.Collapse(navbarCollapse).hide();
    }
  });
});
