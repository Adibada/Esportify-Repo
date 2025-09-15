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

//Récupération du cookie
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
        const showValues = element.dataset.show.split(',').map(s => s.trim());
        let shouldShow = false;

        showValues.forEach(value => {
            switch (value) {
                case "disconnected":
                    if (!userConnected) shouldShow = true;
                    break;
                case "connected":
                    if (userConnected) shouldShow = true;
                    break;
                case "admin":
                    if (userConnected && userRole === "ROLE_ADMIN") shouldShow = true;
                    break;
                case "organizer":
                case "organisateur":
                    if (userConnected && userRole === "ROLE_ORGANISATEUR") shouldShow = true;
                    break;
            }
        });

        if (!shouldShow) {
            element.classList.add('d-none');
        } else {
            element.classList.remove('d-none');
        }
    })
}

// Rendre la fonction disponible globalement
window.editByRoles = editByRoles;

//Refermement de la navbar mobile
document.querySelectorAll('.navbar-collapse .nav-link').forEach(link => {
  link.addEventListener('click', () => {
    const navbarCollapse = document.querySelector('.navbar-collapse');
    if (navbarCollapse.classList.contains('show')) {
      //Ferme la navbar en mode mobile
      new bootstrap.Collapse(navbarCollapse).hide();
    }
  });
});

// Appeler editByRoles au chargement initial
document.addEventListener('DOMContentLoaded', () => {
  editByRoles();
});

// Appeler aussi immédiatement si le DOM est déjà chargé
if (document.readyState === 'loading') {
  // DOM pas encore chargé, attendre l'événement
} else {
  // DOM déjà chargé, appeler immédiatement
  editByRoles();
}

// Fonction de déconnexion globale améliorée
async function handleLogout(event) {
    if (event) event.preventDefault();
    
    const token = getToken();
    if (!token) {
        // Pas de token, redirection directe
        navigate("/connexion");
        return;
    }

    try {
        // Appeler l'endpoint de déconnexion côté serveur pour invalider le token
        await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'X-AUTH-TOKEN': token,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.warn('Erreur lors de la déconnexion côté serveur:', error);
        // Continuer la déconnexion côté client même en cas d'erreur serveur
    }

    // Supprimer tous les cookies de session
    eraseCookie(tokenCookieName);
    eraseCookie(roleCookieName);
    eraseCookie("userId");
    
    // Mettre à jour l'affichage des éléments de navigation
    if (typeof window.editByRoles === 'function') {
        window.editByRoles();
    }
    
    // Rediriger vers la page de connexion
    navigate("/connexion");
}

// Rendre la fonction disponible globalement
window.handleLogout = handleLogout;
