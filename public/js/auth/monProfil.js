// Utilitaires de cookies
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function getToken() {
    return getCookie('accesstoken');
}

// Récupération du profil et affichage du nom + participations
function loadUserProfile() {
    const token = getCookie('accesstoken');   
    fetch('/api/users/me', {
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
        if (profilName) profilName.textContent = user.username || "Nom indisponible";

        // Adresse email
        const profilEmail = document.getElementById("profilEmail");
        if (profilEmail) profilEmail.textContent = user.mail || "Email indisponible";

        // Charger les participations séparément
        loadUserParticipations(token);

        // Charger les événements organisés si l'utilisateur est organisateur
        loadOrganizedEvents(token, user.roles);

        // Suppression du compte
        const deleteButton = document.getElementById("deleteAccountBtn");
        if (deleteButton) {
            deleteButton.addEventListener("click", () => {
                if (!confirm("Voulez-vous vraiment supprimer votre compte ? Cette action est irréversible.")) return;
                
                // Deuxième confirmation
                if (!confirm("Êtes-vous absolument sûr ? Toutes vos données seront perdues définitivement.")) return;

                fetch('/api/users/me', {
                    method: 'DELETE',
                    headers: { 'X-AUTH-TOKEN': token }
                })
                .then(res => {
                    if (res.ok) {
                        alert("Compte supprimé avec succès !");
                        // Supprimer les cookies et rediriger vers l'accueil
                        eraseCookie(tokenCookieName);
                        eraseCookie(roleCookieName);
                        eraseCookie('userId');
                        navigate("/");
                    } else {
                        return res.json().then(data => { throw new Error(data.message || 'Erreur lors de la suppression'); });
                    }
                })
                .catch(err => {
                    alert("Erreur lors de la suppression du compte : " + err.message);
                });
            });
        }
    })
    .catch(err => {
        alert("Erreur : " + err.message);
        navigate("/connexion");
    });
}

// Charger les participations de l'utilisateur
function loadUserParticipations(token) {
    fetch('/api/users/me', {
        headers: {
            'X-AUTH-TOKEN': token
        }
    })
    .then(res => {
        if (!res.ok) throw new Error("Erreur lors du chargement des participations");
        return res.json();
    })
    .then(userData => {
        const participations = userData.participations || [];
        const eventList = document.querySelector(".event-list");
        if (!eventList) return;

        // Ajouter la classe pour le style du tableau
        eventList.parentElement.classList.add('participations-table');
        eventList.innerHTML = "";
        
        if (participations.length === 0) {
            eventList.innerHTML = `<li class="text-center py-3 text-muted">Aucune participation</li>`;
        } else {
            // Ajouter l'en-tête des colonnes
            const headerLi = document.createElement("li");
            headerLi.innerHTML = `
                <div class="row py-2 border-bottom fw-bold text-muted small">
                    <div class="col-md-3">Titre de l'événement</div>
                    <div class="col-md-3">Dates</div>
                    <div class="col-md-2">Participants</div>
                    <div class="col-md-2">Statut</div>
                    <div class="col-md-2 text-end">Score</div>
                </div>
            `;
            eventList.appendChild(headerLi);
            
            participations.forEach(participation => {
                // Déterminer le badge selon le statut de l'événement
                let statusBadge;
                let badgeClass;
                let scoreDisplay = '';
                
                switch (participation.statut) {
                    case 'valide':
                        badgeClass = 'bg-info';
                        statusBadge = 'Validé';
                        break;
                    case 'en_cours':
                        badgeClass = 'bg-primary';
                        statusBadge = 'En cours';
                        break;
                    case 'demarre':
                        badgeClass = 'bg-success';
                        statusBadge = 'Démarré !!';
                        break;
                    case 'termine':
                        badgeClass = 'bg-dark';
                        statusBadge = 'Terminé';
                        // Afficher le score pour les événements terminés
                        if (participation.score !== null && participation.score !== undefined) {
                            scoreDisplay = `<span class="badge bg-warning text-dark fw-bold">Score: ${participation.score}</span>`;
                        } else {
                            scoreDisplay = `<span class="text-muted small">Score non défini</span>`;
                        }
                        break;
                    default:
                        badgeClass = 'bg-warning';
                        statusBadge = 'Inconnu';
                        break;
                }

                const li = document.createElement("li");
                li.classList.add("event-in-list");
                li.innerHTML = `
                    <div class="row align-items-center py-2">
                        <div class="col-md-3">
                            <a href="/evenement?id=${participation.id}" onclick="window.route(event)" class="text-decoration-none fw-medium">
                                ${participation.titre || 'Sans titre'}
                            </a>
                        </div>
                        <div class="col-md-3 text-muted small">
                            <div>Début: <time datetime="${participation.dateDebut}">${new Date(participation.dateDebut).toLocaleDateString()}</time></div>
                            <div>Fin: <time datetime="${participation.dateFin}">${new Date(participation.dateFin).toLocaleDateString()}</time></div>
                        </div>
                        <div class="col-md-2 text-center">
                            <span class="badge bg-info">${participation.numberCompetitors || 0}</span>
                            <small class="d-block text-muted mt-1">participant${(participation.numberCompetitors || 0) !== 1 ? 's' : ''}</small>
                        </div>
                        <div class="col-md-2">
                            <span class="badge ${badgeClass}">${statusBadge}</span>
                        </div>
                        <div class="col-md-2 text-end">
                            ${scoreDisplay}
                        </div>
                    </div>
                `;
                eventList.appendChild(li);
            });
        }
    })
    .catch(err => {
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

// Charger les événements organisés par l'utilisateur
function loadOrganizedEvents(token, userRoles) {
    const organizedSection = document.getElementById('organizedEventsSection');
    
    if (!organizedSection) {
        return;
    }

    fetch('/api/users/me', {
        headers: {
            'X-AUTH-TOKEN': token
        }
    })
    .then(res => {
        if (!res.ok) throw new Error("Erreur lors du chargement des événements organisés");
        return res.json();
    })
    .then(userData => {
        const organizedEvents = userData.evenements || [];  // Utiliser 'evenements' au lieu de 'evenementsOrganises'
        
        // Afficher la section seulement s'il y a des événements organisés
        if (organizedEvents.length === 0) {
            organizedSection.style.display = 'none';
            return;
        }
        
        // Afficher la section
        organizedSection.style.display = 'block';
        
        const eventsList = document.querySelector(".organized-events-list");
        if (!eventsList) return;

        // Ajouter la classe pour le style du tableau
        eventsList.parentElement.classList.add('organized-events-table');
        eventsList.innerHTML = "";
        
        // Ajouter l'en-tête des colonnes
        const headerLi = document.createElement("li");
        headerLi.innerHTML = `
            <div class="row py-2 border-bottom fw-bold text-muted small">
                <div class="col-md-4">Titre de l'événement</div>
                <div class="col-md-3">Dates</div>
                <div class="col-md-2">Participants</div>
                <div class="col-md-3">Statut & Actions</div>
            </div>
        `;
        eventsList.appendChild(headerLi);
        
        organizedEvents.forEach(event => {
            // Déterminer le badge selon le statut de l'événement
            let statusBadge;
            let badgeClass;
            
            switch (event.statut) {
                case 'valide':
                    badgeClass = 'bg-success';
                    statusBadge = 'Validé';
                    break;
                case 'refuse':
                    badgeClass = 'bg-danger';
                    statusBadge = 'Refusé';
                    break;
                case 'en_cours':
                    badgeClass = 'bg-primary';
                    statusBadge = 'En cours';
                    break;
                case 'demarre':
                    badgeClass = 'bg-info';
                    statusBadge = 'Démarré!!';
                    break;
                case 'termine':
                    badgeClass = 'bg-dark';
                    statusBadge = 'Terminé';
                    break;
                case 'en_attente':
                default:
                    badgeClass = 'bg-warning';
                    statusBadge = 'En attente';
                    break;
            }

            const li = document.createElement("li");
            li.classList.add("event-in-list");
            
            // Créer le bouton démarrer si l'événement est en cours
            let startButton = '';
            if (event.statut === 'en_cours') {
                startButton = `
                    <button class="btn btn-success btn-sm ms-2" onclick="startEventFromProfile(${event.id}, event)" 
                            title="Démarrer l'événement">
                        <i class="fas fa-play me-1"></i>Démarrer
                    </button>
                `;
            }
            
            li.innerHTML = `
                <div class="row align-items-center py-2">
                    <div class="col-md-4">
                        <a href="/evenement?id=${event.id}" onclick="window.route(event)" class="text-decoration-none fw-medium">
                            ${event.titre || 'Sans titre'}
                        </a>
                    </div>
                    <div class="col-md-3 text-muted small">
                        <div>Début: <time datetime="${event.dateDebut}">${new Date(event.dateDebut).toLocaleDateString()}</time></div>
                        <div>Fin: <time datetime="${event.dateFin}">${new Date(event.dateFin).toLocaleDateString()}</time></div>
                    </div>
                    <div class="col-md-2 text-center">
                        <span class="badge bg-info">${event.numberCompetitors || 0}</span>
                        <small class="d-block text-muted mt-1">participant${(event.numberCompetitors || 0) !== 1 ? 's' : ''}</small>
                    </div>
                    <div class="col-md-3 d-flex align-items-center">
                        <span class="badge ${badgeClass}">${statusBadge}</span>
                        ${startButton}
                    </div>
                </div>
            `;
            eventsList.appendChild(li);
        });
    })
    .catch(err => {
        const eventsList = document.querySelector(".organized-events-list");
        if (eventsList) {
            eventsList.innerHTML = `
                <li class="text-center py-3 text-danger">
                    <div>Erreur lors du chargement des événements organisés</div>
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
    // Utiliser la fonction de déconnexion globale améliorée
    handleLogout();
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

// Fonction pour démarrer un événement depuis la page profil
window.startEventFromProfile = async (eventId, clickEvent) => {
    // Empêcher la propagation du clic pour éviter la navigation
    if (clickEvent) {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
    }

    const token = getToken();
    if (!token) {
        alert('Vous devez être connecté pour effectuer cette action');
        return;
    }

    if (!confirm('Êtes-vous sûr de vouloir démarrer cet événement ? Cette action ne peut pas être annulée.')) {
        return;
    }

    try {
        const response = await fetch(`/api/evenements/${eventId}/demarrer`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-AUTH-TOKEN': token
            }
        });

        if (response.ok) {
            alert('Événement démarré avec succès !');
            // Recharger les événements organisés pour mettre à jour l'affichage
            loadUserProfile();
        } else {
            const errorData = await response.json();
            alert(errorData.message || errorData.error || 'Erreur lors du démarrage de l\'événement');
        }
    } catch (error) {
        console.error('Erreur lors du démarrage de l\'événement:', error);
        alert('Erreur de connexion');
    }
};