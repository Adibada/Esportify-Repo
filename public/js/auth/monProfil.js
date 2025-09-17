// Récupération du profil et affichage du nom + participations
function loadUserProfile() {
    const token = getToken();   
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

        eventList.innerHTML = "";
        
        if (participations.length === 0) {
            eventList.innerHTML = `<li class="text-center py-3 text-muted">Aucune participation</li>`;
        } else {
            participations.forEach(participation => {
                // Déterminer le badge selon le statut de l'événement
                let statusBadge;
                let badgeClass;
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
                        badgeClass = 'bg-secondary';
                        statusBadge = 'Terminé';
                        break;
                    default:
                        badgeClass = 'bg-warning';
                        statusBadge = 'Inconnu';
                        break;
                }

                const li = document.createElement("li");
                li.classList.add("event-in-list");
                li.innerHTML = `
                    <a href="/evenement?id=${participation.id}" onclick="window.route(event)">
                        <span>${participation.titre || 'Sans titre'}</span>
                        <span>/</span>
                        <span><time datetime="${participation.dateDebut}">${new Date(participation.dateDebut).toLocaleDateString()}</time></span>
                        <span>/</span>
                        <span class="badge ${badgeClass}">${statusBadge}</span>
                    </a>
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

        eventsList.innerHTML = "";
        
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
                <div class="d-flex align-items-center justify-content-between w-100 py-2">
                    <a href="/evenement?id=${event.id}" onclick="window.route(event)" class="flex-grow-1 text-decoration-none">
                        <span>${event.titre || 'Sans titre'}</span>
                        <span class="mx-2">/</span>
                        <span><time datetime="${event.dateDebut}">${new Date(event.dateDebut).toLocaleDateString()}</time></span>
                        <span class="mx-2">/</span>
                        <span>${event.nombreParticipants || 0} Participant${(event.nombreParticipants || 0) !== 1 ? 's' : ''}</span>
                        <span class="mx-2">/</span>
                        <span class="badge ${badgeClass}">${statusBadge}</span>
                    </a>
                    ${startButton}
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