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

        // Charger les événements en attente si l'utilisateur est administrateur
        loadPendingEvents(token, user.roles);

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
        
        // Ajouter les styles CSS pour l'effet de clignotement
        if (!document.getElementById('joinBtnStyles')) {
            const style = document.createElement('style');
            style.id = 'joinBtnStyles';
            style.textContent = `
                @keyframes joinBlink {
                    0%, 100% { 
                        background-color: var(--bs-primary);
                        border-color: var(--bs-primary);
                    }
                    50% { 
                        background-color: var(--bs-secondary);
                        border-color: var(--bs-secondary);
                    }
                }
                
                @keyframes startBlink {
                    0%, 100% { 
                        background-color: var(--bs-warning);
                        border-color: var(--bs-warning);
                    }
                    50% { 
                        background-color: var(--bs-danger);
                        border-color: var(--bs-danger);
                    }
                }
                
                .join-blink {
                    animation: joinBlink 1.5s infinite;
                    font-weight: bold;
                    white-space: nowrap;
                }
                
                .start-blink {
                    animation: startBlink 1.2s infinite;
                    font-weight: bold;
                    white-space: nowrap;
                }
                
                .join-blink:hover, .start-blink:hover {
                    animation-play-state: paused;
                }
                
                .join-blink:hover {
                    background-color: var(--bs-success) !important;
                    border-color: var(--bs-success) !important;
                }
                
                .start-blink:hover {
                    background-color: var(--bs-success) !important;
                    border-color: var(--bs-success) !important;
                }
                
                .join-btn-container, .start-btn-container {
                    z-index: 10;
                }
                
                /* Version desktop : bouton dans la marge de droite */
                .join-btn-desktop, .start-btn-desktop {
                    display: block;
                }
                
                /* Version mobile : bouton dans le bloc, masquer la version desktop */
                @media (max-width: 767.98px) {
                    .join-btn-desktop, .start-btn-desktop {
                        display: none !important;
                    }
                    
                    .join-btn-mobile, .start-btn-mobile {
                        display: block !important;
                    }
                }
                
                /* Version desktop : masquer la version mobile */
                @media (min-width: 768px) {
                    .join-btn-mobile, .start-btn-mobile {
                        display: none !important;
                    }
                }
                
                .participations-table, .organized-events-table, .pending-events-table {
                    overflow: visible;
                    position: relative;
                }
                
                .event-in-list {
                    overflow: visible;
                }
            `;
            document.head.appendChild(style);
        }
        
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
                let joinButton = '';
                
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
                        // Bouton rejoindre seulement si la participation de l'utilisateur est validée
                        if (participation.statutParticipation === 'valide') {
                            joinButton = `
                                <div class="join-btn-container join-btn-desktop position-absolute" style="right: -100px; top: 50%; transform: translateY(-50%);">
                                    <button class="btn btn-primary btn-sm join-blink" onclick="joinEventFromProfile(${participation.id})">
                                        <i class="fas fa-play me-1"></i>Rejoindre
                                    </button>
                                </div>
                                <div class="join-btn-container join-btn-mobile d-block d-md-none mt-2 text-center">
                                    <button class="btn btn-primary btn-sm join-blink" onclick="joinEventFromProfile(${participation.id})">
                                        <i class="fas fa-play me-1"></i>Rejoindre
                                    </button>
                                </div>
                            `;
                        }
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
                li.style.position = 'relative'; // Pour permettre le positionnement absolu du bouton
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
                    ${joinButton}
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
        
        // Vérifier si l'utilisateur est organisateur ou admin
        const isOrganizerOrAdmin = userRoles && (userRoles.includes('ROLE_ORGANISATEUR') || userRoles.includes('ROLE_ADMIN'));
        
        // Afficher la section si l'utilisateur est organisateur/admin
        if (isOrganizerOrAdmin) {
            organizedSection.style.display = 'block';
            
            // Ajouter le gestionnaire d'événement pour le bouton de création d'événement
            const createEventBtn = document.getElementById('createEventBtn');
            if (createEventBtn) {
                // Supprimer l'ancien event listener s'il existe
                createEventBtn.replaceWith(createEventBtn.cloneNode(true));
                const newCreateEventBtn = document.getElementById('createEventBtn');
                newCreateEventBtn.addEventListener('click', function() {
                    window.navigate('/creationEvenement');
                });
            }
            
            const eventsList = document.querySelector(".organized-events-list");
            if (!eventsList) return;

            // Ajouter la classe pour le style du tableau
            eventsList.parentElement.classList.add('organized-events-table');
            eventsList.innerHTML = "";
            
            if (organizedEvents.length === 0) {
                // Afficher un message s'il n'y a pas d'événements organisés
                eventsList.innerHTML = `
                    <li class="text-center py-4 text-muted">
                        <i class="fas fa-calendar-plus fa-2x mb-2"></i>
                        <div>Vous n'avez pas encore créé d'événements.</div>
                        <div class="mt-2">
                            <small>Utilisez le bouton "Créer un événement" pour commencer !</small>
                        </div>
                    </li>
                `;
                return;
            }
            
            // Ajouter l'en-tête des colonnes
            const headerLi = document.createElement("li");
            headerLi.innerHTML = `
                <div class="row py-2 border-bottom fw-bold text-muted small">
                    <div class="col-md-4">Titre de l'événement</div>
                    <div class="col-md-3">Dates</div>
                    <div class="col-md-2 text-center">Participants</div>
                    <div class="col-md-3 text-center">Statut & Actions</div>
                </div>
            `;
            eventsList.appendChild(headerLi);
            
            // Traiter chaque événement organisé
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
                li.style.position = 'relative'; // Pour permettre le positionnement absolu du bouton
                
                // Créer le bouton démarrer avec effet de clignotement si l'événement est en cours
                let startButton = '';
                if (event.statut === 'en_cours') {
                    startButton = `
                        <div class="start-btn-container start-btn-desktop position-absolute" style="right: -100px; top: 50%; transform: translateY(-50%);">
                            <button class="btn btn-warning btn-sm start-blink" onclick="startEventFromProfile(${event.id}, event)" 
                                    title="Démarrer l'événement">
                                <i class="fas fa-rocket me-1"></i>Démarrer
                            </button>
                        </div>
                        <div class="start-btn-container start-btn-mobile d-block d-md-none mt-2 text-center">
                            <button class="btn btn-warning btn-sm start-blink" onclick="startEventFromProfile(${event.id}, event)" 
                                    title="Démarrer l'événement">
                                <i class="fas fa-rocket me-1"></i>Démarrer
                            </button>
                        </div>
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
                        <div class="col-md-3 text-center d-flex align-items-center justify-content-center">
                            <span class="badge ${badgeClass}">${statusBadge}</span>
                        </div>
                    </div>
                    ${startButton}
                `;
                eventsList.appendChild(li);
            });
        } else {
            organizedSection.style.display = 'none';
            return;
        }
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

// Fonction pour rejoindre un événement depuis la page profil
window.joinEventFromProfile = async (eventId) => {
    const token = getToken();
    if (!token) {
        alert('Vous devez être connecté pour effectuer cette action');
        return;
    }

    if (!confirm('Êtes-vous prêt à rejoindre cet événement démarré ?')) {
        return;
    }

    try {
        const response = await fetch(`/api/evenements/${eventId}/rejoindre`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-AUTH-TOKEN': token
            }
        });

        if (response.ok) {
            const data = await response.json();
            alert('Vous avez rejoint l\'événement avec succès !');
            
            // Rediriger vers la page de l'événement
            setTimeout(() => {
                navigate(`/evenement?id=${eventId}`);
            }, 1000); // Délai pour permettre à l'utilisateur de voir le message
        } else {
            const errorData = await response.json();
            alert(errorData.message || errorData.error || 'Erreur lors de la connexion à l\'événement');
        }
    } catch (error) {
        console.error('Erreur lors de la connexion à l\'événement:', error);
        alert('Erreur de connexion');
    }
};

// Charger les événements en attente pour les administrateurs
function loadPendingEvents(token, userRoles) {
    // Vérifier si l'utilisateur est administrateur
    const isAdmin = userRoles && userRoles.includes('ROLE_ADMIN');
    
    const pendingEventsSection = document.getElementById('pendingEventsSection');
    if (!pendingEventsSection) return;
    
    if (!isAdmin) {
        // Masquer la section si l'utilisateur n'est pas administrateur
        pendingEventsSection.style.display = 'none';
        return;
    }
    
    // Afficher la section pour les administrateurs
    pendingEventsSection.style.display = 'block';
    
    // Charger les événements en attente
    fetch('/api/evenements', {
        headers: {
            'X-AUTH-TOKEN': token
        }
    })
    .then(res => {
        if (!res.ok) throw new Error("Erreur lors du chargement des événements en attente");
        return res.json();
    })
    .then(data => {
        // Pour l'API /api/evenements, la réponse est directement un tableau d'événements
        const allEvents = Array.isArray(data) ? data : (data.events || []);
        // Filtrer uniquement les événements en attente
        const events = allEvents.filter(event => event.statut === 'en_attente');
        
        const pendingEventsList = document.querySelector(".pending-events-list");
        const pendingEventsCount = document.getElementById("pendingEventsCount");
        
        if (!pendingEventsList) return;
        
        // Ajouter la classe pour le style du tableau
        pendingEventsList.parentElement.classList.add('pending-events-table');
        
        // Mettre à jour le compteur
        if (pendingEventsCount) {
            pendingEventsCount.textContent = events.length;
        }
        
        if (events.length === 0) {
            pendingEventsList.innerHTML = `
                <li class="text-center py-4 text-success">
                    <i class="bi bi-check-circle me-2"></i>
                    Aucun événement en attente de validation !
                </li>
            `;
            return;
        }
        
        // Ajouter l'en-tête des colonnes
        pendingEventsList.innerHTML = "";
        const headerLi = document.createElement("li");
        headerLi.innerHTML = `
            <div class="row py-2 border-bottom fw-bold text-muted small">
                <div class="col-md-3">Titre de l'événement</div>
                <div class="col-md-2">Organisateur</div>
                <div class="col-md-2">Date de début</div>
                <div class="col-md-2">Participants</div>
                <div class="col-md-3">Actions</div>
            </div>
        `;
        pendingEventsList.appendChild(headerLi);
        
        // Afficher chaque événement en attente
        events.forEach(event => {
            const eventLi = document.createElement("li");
            eventLi.className = "event-in-list border-bottom py-2";
            
            const eventDate = new Date(event.start);
            const formattedDate = eventDate.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const organizerName = event.organisateur ? event.organisateur.username : 'Inconnu';
            const participantCount = event.numberCompetitors || 0;
            
            eventLi.innerHTML = `
                <div class="row align-items-center py-2">
                    <div class="col-md-3">
                        <div class="d-flex flex-column">
                            <strong class="text-primary">${event.titre}</strong>
                            <small class="text-muted text-truncate" style="max-width: 200px;" title="${event.description}">
                                ${event.description ? event.description.substring(0, 60) + (event.description.length > 60 ? '...' : '') : 'Pas de description'}
                            </small>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <span class="badge bg-info">${organizerName}</span>
                    </div>
                    <div class="col-md-2">
                        <small>${formattedDate}</small>
                    </div>
                    <div class="col-md-2">
                        <span class="badge bg-secondary">${participantCount}</span>
                    </div>
                    <div class="col-md-3">
                        <div class="d-flex gap-2 flex-wrap">
                            <button class="btn btn-success btn-sm" onclick="validateEventFromProfile('${event.id}')" 
                                    title="Valider l'événement">
                                <i class="bi bi-check-lg me-1"></i>Valider
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="rejectEventFromProfile('${event.id}')" 
                                    title="Refuser l'événement">
                                <i class="bi bi-x-lg me-1"></i>Refuser
                            </button>
                            <a href="/evenement?id=${event.id}" class="btn btn-outline-primary btn-sm" 
                               title="Voir les détails">
                                <i class="bi bi-eye me-1"></i>Voir
                            </a>
                        </div>
                    </div>
                </div>
            `;
            
            pendingEventsList.appendChild(eventLi);
        });
    })
    .catch(err => {
        console.error('Erreur lors du chargement des événements en attente:', err);
        const pendingEventsList = document.querySelector(".pending-events-list");
        if (pendingEventsList) {
            pendingEventsList.innerHTML = `
                <li class="text-center py-3 text-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Erreur lors du chargement des événements en attente
                    <div class="mt-2">
                        <button class="btn btn-outline-secondary btn-sm" onclick="loadPendingEvents('${token}', ${JSON.stringify(userRoles).replace(/"/g, "'")})">
                            <i class="bi bi-arrow-clockwise me-1"></i>Réessayer
                        </button>
                    </div>
                </li>
            `;
        }
    });
}

// Fonction pour valider un événement depuis le profil
window.validateEventFromProfile = async function(eventId) {
    if (!confirm('Voulez-vous valider cet événement ?')) return;
    
    const token = getToken();
    if (!token) {
        alert('Vous devez être connecté');
        return;
    }
    
    try {
        const response = await fetch(`/api/evenements/${eventId}/valider`, {
            method: 'PUT',
            headers: {
                'X-AUTH-TOKEN': token
            }
        });
        
        if (response.ok) {
            alert('Événement validé avec succès !');
            // Recharger les événements en attente
            loadUserProfile();
        } else {
            const errorData = await response.json();
            alert('Erreur : ' + (errorData.message || errorData.error || 'Impossible de valider l\'événement'));
        }
    } catch (error) {
        console.error('Erreur lors de la validation:', error);
        alert('Erreur de connexion');
    }
};

// Fonction pour refuser un événement depuis le profil
window.rejectEventFromProfile = async function(eventId) {
    if (!confirm('Voulez-vous refuser cet événement ? Cette action est irréversible.')) return;
    
    const token = getToken();
    if (!token) {
        alert('Vous devez être connecté');
        return;
    }
    
    try {
        const response = await fetch(`/api/evenements/${eventId}/refuser`, {
            method: 'PUT',
            headers: {
                'X-AUTH-TOKEN': token
            }
        });
        
        if (response.ok) {
            alert('Événement refusé avec succès.');
            // Recharger les événements en attente
            loadUserProfile();
        } else {
            const errorData = await response.json();
            alert('Erreur : ' + (errorData.message || errorData.error || 'Impossible de refuser l\'événement'));
        }
    } catch (error) {
        console.error('Erreur lors du refus:', error);
        alert('Erreur de connexion');
    }
};