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

        // Charger les participations séparément
        loadUserParticipations(token);

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

// Charger les participations de l'utilisateur
function loadUserParticipations(token) {
    fetch('/api/me/participations', {
        headers: {
            'X-AUTH-TOKEN': token
        }
    })
    .then(res => {
        if (!res.ok) throw new Error("Erreur lors du chargement des participations");
        return res.json();
    })
    .then(participations => {
        const eventList = document.querySelector(".event-list");
        if (!eventList) return;

        eventList.innerHTML = "";
        
        if (!participations || participations.length === 0) {
            eventList.innerHTML = `<li class="text-center py-3 text-muted">Aucune participation</li>`;
        } else {
            participations.forEach(event => {
                const li = document.createElement("li");
                li.classList.add("event-in-list");
                li.innerHTML = `
                    <a href="/evenement?id=${event.id}" onclick="window.route(event)">
                        <span>${event.titre || 'Sans titre'}</span>
                        <span>/</span>
                        <span><time datetime="${event.start}">${new Date(event.start).toLocaleDateString()}</time></span>
                        <span>/</span>
                        <span>${event.numberCompetitors || 0} Participant${(event.numberCompetitors || 0) !== 1 ? 's' : ''}</span>
                        <span>/</span>
                        <span class="badge bg-${event.statut === 'valide' ? 'success' : 'secondary'}">${event.statut || 'en attente'}</span>
                    </a>
                `;
                eventList.appendChild(li);
            });
        }
    })
    .catch(err => {
        console.error('Erreur participations:', err);
        const eventList = document.querySelector(".event-list");
        if (eventList) {
            eventList.innerHTML = `
                <li class="text-center py-3 text-danger">
                    <div>Erreur lors du chargement des participations</div>
                    <div class="mt-2">
                        <button class="btn btn-outline-secondary btn-sm" onclick="loadUserProfile()">
                            Réessayer
                        </button>
                    </div>
                </li>
            `;
        }
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