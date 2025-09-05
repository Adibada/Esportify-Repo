// Récupération du profil et affichage du nom + participations
function loadUserProfile() {
    const token = getToken();   
    fetch('/api/me', {
        headers: {
            'X-AUTH-TOKEN': token
        }
    })
    .then(res => {
        if (!res.ok) throw new Error("Non authentifié ou erreur serveur");
        return res.json();
    })
    .then(user => {
        // Nom de profil
        const profilName = document.getElementById("profilName");
        if (profilName) profilName.textContent = user.user || "Nom indisponible";

        // Participations (à adapter si la route /api/me retourne ce champ)
        const eventList = document.querySelector(".event-list");
        if (eventList) {
            eventList.innerHTML = "";
            if (!user.participations || user.participations.length === 0) {
                eventList.innerHTML = `<li>Aucune participation</li>`;
            } else {
                user.participations.forEach(event => {
                    const li = document.createElement("li");
                    li.classList.add("event-in-list");
                    li.innerHTML = `
                        <a href="/evenements/${event.id}" onclick="window.route(event)">
                            <span class="eventName">${event.titre}</span> /
                            <span class="eventStart">
                                <time datetime="${event.start}">
                                    ${new Date(event.start).toLocaleDateString()}
                                </time>
                            </span> /
                            <span class="numOfCompetitors">
                                ${event.numberCompetitors} Participants
                            </span>
                        </a>
                    `;
                    eventList.appendChild(li);
                });
            }
        }

        // Suppression du compte
        const deleteButton = document.getElementById("deleteAccountBtn");
        if (deleteButton) {
            deleteButton.addEventListener("click", () => {
                if (!confirm("Voulez-vous vraiment supprimer votre compte ?")) return;

                fetch('/api/users/' + user.id, {
                    method: 'DELETE',
                    headers: { 'X-AUTH-TOKEN': token }
                })
                .then(res => {
                    if (res.ok) {
                        alert("Compte supprimé !");
                        navigate("/");
                    } else {
                        return res.json().then(data => { throw new Error(data.error); });
                    }
                })
                .catch(err => alert("Erreur : " + err.message));
            });
        }
    })
    .catch(err => {
        console.error(err);
        alert("Erreur : " + err.message);
        navigate("/connexion");
    });
}

// Boutons modifier et déconnexion
function modifyAccount() {
    navigate("/modifierProfil");
}

function signOut() {
    eraseCookie(tokenCookieName);
    eraseCookie(roleCookieName);
    navigate("/connexion");
}

// Attacher événements
function attachProfilePageEvents() {
    const modifyAccButton = document.getElementById("modifyAccountBtn");
    const signoutButton = document.getElementById("signoutBtn");

    if (modifyAccButton) modifyAccButton.addEventListener("click", modifyAccount);
    if (signoutButton) signoutButton.addEventListener("click", signOut);

    // Charger le profil et participations
    loadUserProfile();
}

// Initialisation
attachProfilePageEvents();