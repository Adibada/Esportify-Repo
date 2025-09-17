// === UTILITAIRES ===
const tokenCookieName = "accesstoken";
const getCookie = (name) => {
    const nameEQ = name + "=";
    return document.cookie.split(';')
        .map(c => c.trim())
        .find(c => c.indexOf(nameEQ) === 0)
        ?.substring(nameEQ.length) || null;
};

const getToken = () => getCookie(tokenCookieName);
const isConnected = () => getToken() !== null;
const getUserId = () => getCookie('userId') ? parseInt(getCookie('userId')) : null;
const getRole = () => getCookie('role');

// === GESTION GALERIE D'IMAGES ===
// Fonctions d'accessibilité pour générer les labels dynamiques
function generateImageAlt(image) {
    if (image.originalName) {
        // Si c'est une description personnalisée, l'utiliser directement
        if (!image.originalName.match(/\.(jpg|jpeg|png|gif|webp)$/i) && !image.originalName.startsWith('URL:')) {
            return image.originalName;
        }
        
        // Sinon, nettoyer le nom de fichier pour créer un alt text descriptif
        const cleanName = image.originalName
            .replace(/^URL:\s*/, '') // Supprimer le préfixe "URL:" pour les URLs
            .replace(/\.[^/.]+$/, '') // Supprimer l'extension
            .replace(/[-_]/g, ' ')     // Remplacer tirets et underscores par espaces
            .replace(/\b\w/g, l => l.toUpperCase()); // Mettre en forme de titre
        return `Image: ${cleanName}`;
    }
    return 'Image de l\'événement';
}

function generateImageTitle(image) {
    if (image.originalName) {
        return `Image originale: ${image.originalName}`;
    }
    return 'Image de l\'événement';
}

const updateImageGallery = (images) => {
    const imgContainer = document.querySelector('.bloc img')?.parentElement;
    if (!imgContainer) return;

    // Supprimer l'ancienne structure
    imgContainer.innerHTML = '';

    if (!images || images.length === 0) {
        // Image par défaut si aucune image
        imgContainer.innerHTML = '<img src="/Images/images accueil/multiécrans.jpg" alt="Événement">';
        return;
    }

    // Créer la galerie
    const gallery = document.createElement('div');
    gallery.className = 'image-gallery';

    if (images.length === 1) {
        // Affichage simple pour une seule image
        const img = document.createElement('img');
        const image = images[0];
        img.src = image.url || image;
        img.alt = generateImageAlt(image);
        img.title = generateImageTitle(image);
        gallery.appendChild(img);
    } else {
        // Carrousel pour plusieurs images
        const carousel = document.createElement('div');
        carousel.className = 'carousel';

        const slider = document.createElement('div');
        slider.className = 'carousel-slider';

        images.forEach((image, index) => {
            const imgWrapper = document.createElement('div');

            const img = document.createElement('img');
            img.src = image.url || image;
            img.alt = generateImageAlt(image);
            img.title = generateImageTitle(image);

            imgWrapper.appendChild(img);
            slider.appendChild(imgWrapper);
        });

        // Navigation si plus d'une image
        if (images.length > 1) {
            let currentIndex = 0;
            let autoPlayInterval;

            const updateCarousel = () => {
                slider.style.transform = `translateX(-${currentIndex * 100}%)`;
                // Mettre à jour les indicateurs
                if (indicators) {
                    [...indicators.children].forEach((dot, i) => {
                        dot.classList.toggle('active', i === currentIndex);
                    });
                }
            };

            const nextSlide = () => {
                currentIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
                updateCarousel();
            };

            const startAutoPlay = () => {
                autoPlayInterval = setInterval(nextSlide, 4000); // Change toutes les 4 secondes
            };

            const stopAutoPlay = () => {
                if (autoPlayInterval) {
                    clearInterval(autoPlayInterval);
                    autoPlayInterval = null;
                }
            };

            const prevBtn = document.createElement('button');
            prevBtn.innerHTML = '‹';
            prevBtn.setAttribute('aria-label', 'Image précédente');

            const nextBtn = document.createElement('button');
            nextBtn.innerHTML = '›';
            nextBtn.setAttribute('aria-label', 'Image suivante');

            prevBtn.onclick = () => {
                stopAutoPlay();
                currentIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
                updateCarousel();
                startAutoPlay(); // Redémarrer l'autoplay après interaction
            };

            nextBtn.onclick = () => {
                stopAutoPlay();
                currentIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
                updateCarousel();
                startAutoPlay(); // Redémarrer l'autoplay après interaction
            };

            // Pause automatique au survol
            carousel.addEventListener('mouseenter', stopAutoPlay);
            carousel.addEventListener('mouseleave', startAutoPlay);

            carousel.appendChild(prevBtn);
            carousel.appendChild(nextBtn);

            // Indicateurs
            const indicators = document.createElement('div');
            indicators.className = 'carousel-indicators';

            images.forEach((_, index) => {
                const dot = document.createElement('button');
                dot.className = index === 0 ? 'active' : '';
                dot.setAttribute('aria-label', `Aller à l'image ${index + 1}`);
                dot.onclick = () => {
                    stopAutoPlay();
                    currentIndex = index;
                    updateCarousel();
                    startAutoPlay(); // Redémarrer l'autoplay après interaction
                };
                indicators.appendChild(dot);
            });

            carousel.appendChild(indicators);

            // Démarrer l'autoplay
            startAutoPlay();
        }

        carousel.appendChild(slider);
        gallery.appendChild(carousel);
    }

    imgContainer.appendChild(gallery);
};

// === VARIABLES GLOBALES ===
const eventIdParam = new URLSearchParams(window.location.search).get('id');
const eventId = eventIdParam !== null ? parseInt(eventIdParam) : null;
let commentsPage = 1;
const commentsPerPage = 10;
let allComments = [];
let isLoadingComments = false;
let hasMoreComments = true;

// === GESTION DES ÉTATS ===
const setState = (type, content) => {
    const elem = document.getElementById("eventName");
    if (!elem) return;
    
    if (type === 'loading') {
        elem.innerHTML = 'Chargement en cours... <div class="spinner-border spinner-border-sm ms-2"><span class="visually-hidden">Chargement...</span></div>';
    } else if (type === 'error') {
        elem.innerHTML = `
            <span class="text-danger">Erreur de chargement</span>
            <div class="mt-2"><small class="text-muted">${content}</small></div>
            <div class="mt-3">
                <button class="btn btn-primary" onclick="location.href='/'">Retour à l'accueil</button>
                <button class="btn btn-secondary ms-2" onclick="location.reload()">Réessayer</button>
            </div>`;
    }
};

// === MISE À JOUR DU DOM ===
const updateEvent = (event) => {
    // Images - Galerie multiple
    updateImageGallery(event.images || []);

    // Éléments à mettre à jour
    const updates = [
        { id: "eventName", content: event.titre },
        { id: "eventDescription", content: event.description },
        { id: "eventOrganizer", content: event.organisateur?.username || 'Non défini', format: (c) => `<p><strong>Organisateur :</strong> ${c}</p>` },
        { id: "numOfCompetitors", content: event.numberCompetitors || 0, format: (c) => `<p><strong>Participants :</strong> ${c}</p>` },
        { id: "eventStart", content: new Date(event.start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
        { id: "eventEnd", content: new Date(event.end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
        { id: "eventStatus", content: event.statut, format: (c) => {
            const statusLabels = {
                'en_attente': 'En attente de validation',
                'valide': 'Validé',
                'refuse': 'Refusé',
                'en_cours': 'En cours',
                'demarre': 'Démarré!!'
            };
            const statusColors = {
                'en_attente': 'warning',
                'valide': 'success', 
                'refuse': 'danger',
                'en_cours': 'primary',
                'demarre': 'info'
            };
            const label = statusLabels[c] || c;
            const color = statusColors[c] || 'secondary';
            return `<p><strong>Statut :</strong> <span class="badge bg-${color}">${label}</span></p>`;
        } }
    ];

    updates.forEach(({ id, content, format }) => {
        const elem = document.getElementById(id);
        if (elem) {
            if (format) {
                elem.innerHTML = format(content || 'Non défini');
            } else {
                elem.textContent = content || '';
            }
        }
    });

    // Gestion des boutons selon l'état de connexion
    if (isConnected()) {
        updateAdminButtons(event);
        checkParticipationStatus(eventId).then(status => {
            updateParticipationButton(status, event.statut);
            updateEditButton(status, event);
        }).catch(error => {
            console.error('Error checking participation status:', error);
        });
    } else {
        hideParticipationButton();
        document.getElementById('organizerButtons')?.style.setProperty('display', 'none');
    }
};

// === CHARGEMENT DES DONNÉES ===
const loadEvent = async () => {
    if (!eventId && eventId !== 0) return setState('error', "L'ID de l'événement est manquant dans l'URL.");

    setState('loading');
    
    try {
        const token = getToken();
        const res = await fetch(`/api/evenements/${eventId}`, {
            headers: token ? { 'X-AUTH-TOKEN': token } : {}
        });
        
        if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
        
        const event = await res.json();
        updateEvent(event);
        
        // Charger la liste des participants après la mise à jour de l'événement
        if (event.numberCompetitors > 0) {
            loadParticipantsList();
        }
        
    } catch (err) {
        setState('error', err.message);
    }
};

// === GESTION DE LA LISTE DES PARTICIPANTS ===
const loadParticipantsList = async () => {
    try {
        const token = getToken();
        const res = await fetch(`/api/evenements/${eventId}/participants`, {
            headers: token ? { 'X-AUTH-TOKEN': token } : {}
        });

        if (res.ok) {
            const participations = await res.json();
            // Les participants sont déjà filtrés côté serveur (statut valide uniquement)
            displayParticipantsList(participations);
        }
    } catch (err) {
        // En cas d'erreur, ne pas afficher la section des participants
    }
};

const displayParticipantsList = (participants) => {
    // Chercher le conteneur des participants après le nombre de participants
    let participantsListContainer = document.getElementById('participantsList');
    
    if (!participantsListContainer) {
        // Créer le conteneur s'il n'existe pas
        participantsListContainer = document.createElement('div');
        participantsListContainer.id = 'participantsList';
        participantsListContainer.className = 'mt-3';
        
        // L'insérer après l'élément numOfCompetitors
        const numOfCompetitorsElement = document.getElementById('numOfCompetitors');
        if (numOfCompetitorsElement && numOfCompetitorsElement.parentNode) {
            numOfCompetitorsElement.parentNode.insertBefore(participantsListContainer, numOfCompetitorsElement.nextSibling);
        }
    }

    if (participants.length === 0) {
        participantsListContainer.innerHTML = '';
        return;
    }

    // Créer la liste scrollable des participants
    participantsListContainer.innerHTML = `
        <div class="participants-scroll-container" style="max-height: 300px; overflow-y: auto; border: 1px solid #dee2e6; border-radius: 0.375rem; padding: 0.75rem; background-color: #f8f9fa;">
            <h6 class="mb-3 text-center text-muted">Liste des participants</h6>
            <div class="participants-table">
                <div class="row mb-2 fw-bold text-muted" style="font-size: 0.85rem;">
                    <div class="col-7 col-md-8">
                        <i class="fas fa-user me-1"></i>Utilisateur
                    </div>
                    <div class="col-5 col-md-4 text-end">
                        <i class="fas fa-info-circle me-1"></i>Statut
                    </div>
                </div>
                ${participants.map(participant => {
                    const statusColor = participant.statut === 'valide' ? 'success' : 
                                      participant.statut === 'en_attente' ? 'warning' : 'danger';
                    const statusIcon = participant.statut === 'valide' ? 'check-circle' : 
                                     participant.statut === 'en_attente' ? 'clock' : 'times-circle';
                    const statusText = participant.statut === 'valide' ? 'Validé' : 
                                     participant.statut === 'en_attente' ? 'En attente' : 'Refusé';
                    
                    return `
                        <div class="row participant-row py-2 border-bottom" style="transition: background-color 0.2s ease;" 
                             onmouseover="this.style.backgroundColor='#e9ecef'" 
                             onmouseout="this.style.backgroundColor='transparent'">
                            <div class="col-7 col-md-8">
                                <a href="/profil?id=${participant.user.id}" class="text-decoration-none text-primary fw-medium participant-link" 
                                   style="font-size: 0.95rem;"
                                   onmouseover="this.style.color='#0056b3'"
                                   onmouseout="this.style.color='#0d6efd'">
                                    <i class="fas fa-user-circle me-2"></i>${participant.user.username}
                                </a>
                            </div>
                            <div class="col-5 col-md-4 text-end">
                                <span class="badge bg-${statusColor}" style="font-size: 0.75rem;">
                                    <i class="fas fa-${statusIcon} me-1"></i>${statusText}
                                </span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            ${participants.length > 10 ? '<small class="text-muted d-block text-center mt-2">Faites défiler pour voir plus de participants</small>' : ''}
        </div>
    `;

    // Ajouter les styles CSS si ce n'est pas déjà fait
    if (!document.getElementById('participantsListStyles')) {
        const style = document.createElement('style');
        style.id = 'participantsListStyles';
        style.textContent = `
            .participants-scroll-container::-webkit-scrollbar {
                width: 8px;
            }
            .participants-scroll-container::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 4px;
            }
            .participants-scroll-container::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 4px;
            }
            .participants-scroll-container::-webkit-scrollbar-thumb:hover {
                background: #a8a8a8;
            }
            .participant-item:hover {
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
        `;
        document.head.appendChild(style);
    }
};

const checkParticipationStatus = async (eventId) => {
    const token = getToken();
    if (!token) {
        return { isParticipant: false, isOrganizer: false };
    }

    try {
        const res = await fetch(`/api/evenements/${eventId}/statut-participation`, {
            headers: { 'X-AUTH-TOKEN': token }
        });
        
        if (res.ok) {
            const data = await res.json();
            return data;
        } else {
            return { isParticipant: false, isOrganizer: false };
        }
    } catch (error) {
        return { isParticipant: false, isOrganizer: false };
    }
};

// === GESTION DES BOUTONS ===
const updateParticipationButton = (status, eventStatus) => {
    const btn = document.querySelector("#participateBtn, .btn-participate, [data-participate]");
    const joinBtn = document.getElementById('joinEventBtn');
    if (!btn) return;

    // Masquer le bouton rejoindre par défaut
    if (joinBtn) {
        joinBtn.style.display = 'none';
    }

    // Configuration standard pour tous les utilisateurs (y compris les administrateurs)
    // Ce bouton ne sert qu'à demander/annuler sa participation, pas à la valider
    const configs = {
        invalid: { text: "Participation impossible", class: "btn btn-secondary mt-2 p-4", disabled: true },
        en_attente: { text: "Participation en attente", class: "btn btn-warning mt-2 p-4", onclick: () => cancelParticipation(eventId) },
        valide: { text: "Annuler ma participation", class: "btn btn-danger mt-2 p-4", onclick: () => cancelParticipation(eventId) },
        refusee: { text: "Participation refusée", class: "btn btn-secondary mt-2 p-4", disabled: true },
        default: { text: "Participer", class: "btn btn-success mt-2 p-4", onclick: () => participer(eventId) }
    };

    // Logique normale pour les autres utilisateurs
    let config;
    if (eventStatus !== 'valide' && eventStatus !== 'en_cours' && eventStatus !== 'demarre') {
        config = configs.invalid;
    } else if (status.participationStatut) {
        config = configs[status.participationStatut];
    } else {
        config = configs.default;
    }

    btn.textContent = config.text;
    btn.className = config.class;
    btn.disabled = config.disabled || false;
    btn.onclick = config.onclick || null;

    // Afficher le bouton "Rejoindre l'événement" si :
    // - L'événement est démarré
    // - L'utilisateur a une participation validée
    if (joinBtn && eventStatus === 'demarre' && status.participationStatut === 'valide') {
        joinBtn.style.display = 'inline-block';
    }
};

const updateEditButton = (status, event) => {
    const editBtn = document.getElementById('editEventBtn');
    const organizerButtons = document.getElementById('organizerButtons');
    
    if (!editBtn || !organizerButtons) {
        return;
    }
    
    const isAdmin = getRole() === 'ROLE_ADMIN';
    const startEventBtn = document.getElementById('startEventBtn');
    
    if (status.isOrganizer || isAdmin) {
        organizerButtons.style.removeProperty('display');
        organizerButtons.style.display = 'flex';
        organizerButtons.style.visibility = 'visible';
        editBtn.href = `/modifierEvenement?id=${eventId}`;
        
        // Afficher le bouton "Démarrer l'événement" seulement si l'événement est en cours
        if (startEventBtn) {
            if (event && event.statut === 'en_cours') {
                startEventBtn.style.display = 'inline-block';
            } else {
                startEventBtn.style.display = 'none';
            }
        }
        
        // Les organisateurs ET les administrateurs peuvent gérer les participations
        if (status.isOrganizer || getRole() === 'ROLE_ADMIN') {
            loadPendingParticipations();
        }
    } else {
        organizerButtons.style.display = 'none';
        organizerButtons.style.visibility = 'hidden';
        organizerButtons.style.setProperty('display', 'none', 'important');
        
        // Masquer aussi le bouton démarrer
        if (startEventBtn) {
            startEventBtn.style.display = 'none';
        }
    }
};

const hideParticipationButton = () => {
    const btn = document.querySelector("#participateBtn, .btn-participate, [data-participate]");
    if (btn) btn.style.display = 'none';
    
    const container = document.querySelector('[data-show="connected"]');
    if (container) container.style.display = 'none';
};

// Charger les demandes de participation en attente
const loadPendingParticipations = async () => {
    const token = getToken();
    if (!token) return;

    try {
        const res = await fetch(`/api/evenements/${eventId}/participations`, {
            headers: { 'X-AUTH-TOKEN': token }
        });

        if (res.ok) {
            const participations = await res.json();
            displayPendingParticipations(participations);
        }
    } catch (err) {
        console.error('Erreur lors du chargement des participations:', err);
    }
};

// Afficher les demandes de participation
const displayPendingParticipations = (participations) => {
    // Chercher s'il existe déjà une section pour les participations
    let participationsSection = document.getElementById('participationsManagement');
    
    if (!participationsSection) {
        // Créer la section si elle n'existe pas
        participationsSection = document.createElement('div');
        participationsSection.id = 'participationsManagement';
        participationsSection.className = 'bloc mt-4';
        
        // L'insérer avant la section commentaires
        const commentsSection = document.querySelector('[aria-labelledby="comment-title"]');
        if (commentsSection) {
            commentsSection.parentNode.insertBefore(participationsSection, commentsSection);
        }
    }

    const pendingParticipations = participations.filter(p => p.statut === 'en_attente');
    
    if (pendingParticipations.length === 0) {
        participationsSection.innerHTML = `
            <h3 class="text-center fs-2 mb-3">Gestion des participations</h3>
            <p class="text-center text-muted">Aucune demande de participation en attente.</p>
        `;
        return;
    }

    participationsSection.innerHTML = `
        <h3 class="text-center fs-2 mb-4">Demandes de participation (${pendingParticipations.length})</h3>
        <div class="row">
            ${pendingParticipations.map(participation => `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${participation.user.username}</h5>
                            <p class="card-text">
                                <small class="text-muted">Demande le ${new Date(participation.createdAt).toLocaleDateString('fr-FR')}</small>
                            </p>
                            <div class="d-flex gap-2">
                                <button class="btn btn-success btn-sm" onclick="validateParticipation(${participation.user.id})">
                                    <i class="fas fa-check me-1"></i>Accepter
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="rejectParticipation(${participation.user.id})">
                                    <i class="fas fa-times me-1"></i>Refuser
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
};

// Valider une participation
const validateParticipation = async (userId) => {
    const token = getToken();
    if (!token) return;

    try {
        const res = await fetch(`/api/evenements/${eventId}/participations/${userId}/valider`, {
            method: 'POST',
            headers: { 'X-AUTH-TOKEN': token }
        });

        if (res.ok) {
            alert('Participation validée !');
            loadPendingParticipations(); // Recharger la liste
            await refreshEventData(); // Mettre à jour le nombre de participants
        } else {
            const error = await res.text();
            alert(`Erreur : ${error}`);
        }
    } catch (err) {
        alert('Erreur lors de la validation de la participation.');
    }
};

// Refuser une participation
const rejectParticipation = async (userId) => {
    const token = getToken();
    if (!token) return;

    try {
        const res = await fetch(`/api/evenements/${eventId}/participations/${userId}/refuser`, {
            method: 'POST',
            headers: { 'X-AUTH-TOKEN': token }
        });

        if (res.ok) {
            alert('Participation refusée.');
            loadPendingParticipations(); // Recharger la liste
        } else {
            const error = await res.text();
            alert(`Erreur : ${error}`);
        }
    } catch (err) {
        alert('Erreur lors du refus de la participation.');
    }
};

// Rendre les fonctions accessibles globalement
window.validateParticipation = validateParticipation;
window.rejectParticipation = rejectParticipation;

// === ACTIONS UTILISATEUR ===
const handleApiRequest = async (url, method, successMsg, errorPrefix = 'Erreur') => {
    const token = getToken();
    if (!token) return alert('Vous devez être connecté.');

    try {
        const res = await fetch(url, {
            method,
            headers: { 'X-AUTH-TOKEN': token }
        });

        if (res.ok) {
            await refreshEventData();
            if (successMsg) alert(successMsg);
        } else {
            const error = await res.text();
            alert(`${errorPrefix} : ${error}`);
        }
    } catch {
        alert(`${errorPrefix} lors de l'opération.`);
    }
};

const participer = (eventId) => handleApiRequest(
    `/api/evenements/${eventId}/participer`, 
    'POST', 
    'Demande de participation envoyée ! En attente de validation par l\'organisateur.',
    'Erreur'
);

const cancelParticipation = (eventId) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler votre participation ?')) return;
    handleApiRequest(`/api/evenements/${eventId}/annuler-participation`, 'DELETE', 'Participation annulée.');
};

const refreshEventData = async () => {
    try {
        const token = getToken();
        const res = await fetch(`/api/evenements/${eventId}`, {
            headers: token ? { 'X-AUTH-TOKEN': token } : {}
        });
        
        if (res.ok) {
            const event = await res.json();
            document.getElementById("numOfCompetitors").innerHTML = `<p><strong>Participants :</strong> ${event.numberCompetitors || 0}</p>`;
            
            // Recharger la liste des participants après une modification
            if (event.numberCompetitors > 0) {
                loadParticipantsList();
            } else {
                // Si plus de participants, vider la liste
                const participantsListContainer = document.getElementById('participantsList');
                if (participantsListContainer) {
                    participantsListContainer.innerHTML = '';
                }
            }
            
            if (isConnected()) {
                const status = await checkParticipationStatus(eventId);
                updateParticipationButton(status, event.statut);
            } else {
                hideParticipationButton();
            }
        }
    } catch {
        setTimeout(() => location.reload(), 1000);
    }
};

// === FONCTIONS ADMINISTRATIVES ===
function validateEvent(eventId) {
    // Vérification du rôle administrateur
    if (getRole() !== 'ROLE_ADMIN') {
        alert('Accès non autorisé. Seuls les administrateurs peuvent valider les événements.');
        return;
    }
    
    if (!confirm('Valider cet événement ?')) return;
    handleApiRequest(`/api/evenements/${eventId}/valider`, 'PUT', 'Événement validé avec succès !', 'Erreur')
        .then(() => location.reload());
}

function rejectEvent(eventId) {
    // Vérification du rôle administrateur
    if (getRole() !== 'ROLE_ADMIN') {
        alert('Accès non autorisé. Seuls les administrateurs peuvent rejeter les événements.');
        return;
    }
    
    if (!confirm('Rejeter cet événement ? Cette action est irréversible.')) return;
    handleApiRequest(`/api/evenements/${eventId}/rejeter`, 'PUT', 'Événement rejeté.', 'Erreur')
        .then(() => window.location.href = '/');
}

// Rendre les fonctions accessibles globalement
window.validateEvent = validateEvent;
window.rejectEvent = rejectEvent;

// Fonction pour qu'un administrateur valide sa propre participation
const validateOwnParticipation = async (eventId) => {
    const userId = getUserId();
    if (!userId) {
        console.error('Impossible de récupérer l\'ID utilisateur');
        return;
    }
    
    try {
        const token = getToken();
        const res = await fetch(`/api/evenements/${eventId}/participations/${userId}/valider`, {
            method: 'POST',
            headers: { 'X-AUTH-TOKEN': token }
        });

        if (res.ok) {
            // Recharger le statut de participation
            const newStatus = await checkParticipationStatus(eventId);
            updateParticipationButton(newStatus, currentEvent?.statut);
            loadPendingParticipations(); // Recharger la liste des participations
            showMessage('Votre participation a été validée !', 'success');
        } else {
            const error = await res.text();
            showMessage(`Erreur : ${error}`, 'error');
        }
    } catch (err) {
        showMessage('Erreur lors de la validation de votre participation.', 'error');
    }
};

// Rendre la fonction accessible globalement
window.validateOwnParticipation = validateOwnParticipation;

const updateAdminButtons = (event) => {
    const role = getRole();
    
    // Les boutons de validation des événements ne sont disponibles que pour ROLE_ADMIN
    const adminContainer = document.getElementById('adminValidationButtons') || 
                          document.querySelector('.admin-controls, .admin-buttons, [data-admin]');
    
    if (!adminContainer) return;

    // Seuls les admins peuvent voir et utiliser les boutons de validation d'événement
    // Accepter les deux formats : "en_attente" et "en attente"
    if (role === 'ROLE_ADMIN' && (event.statut === 'en_attente' || event.statut === 'en attente')) {
        // Forcer l'affichage en supprimant le !important
        adminContainer.removeAttribute('style');
        adminContainer.style.cssText = 'display: flex !important; justify-content: center; gap: 1rem; margin-top: 1rem;';
        adminContainer.innerHTML = `
            <button class="btn btn-success px-4 py-2" onclick="validateEvent('${eventId}')">
                <i class="fas fa-check me-2"></i>Valider l'événement
            </button>
            <button class="btn btn-danger px-4 py-2" onclick="rejectEvent('${eventId}')">
                <i class="fas fa-times me-2"></i>Refuser l'événement
            </button>`;
    } else {
        // Masquer complètement les boutons si l'utilisateur n'est pas admin ou si l'événement n'est pas en attente
        adminContainer.style.display = 'none';
        adminContainer.style.visibility = 'hidden';
        adminContainer.style.setProperty('display', 'none', 'important');
        adminContainer.innerHTML = '';
    }
};

// Chargement des commentaires avec pagination
const loadComments = async (reset = false) => {
    if (isLoadingComments || (!hasMoreComments && !reset)) return;
    
    if (reset) {
        commentsPage = 1;
        allComments = [];
        hasMoreComments = true;
    }
    
    isLoadingComments = true;
    
    // Afficher l'indicateur de chargement
    if (commentsPage === 1) {
        showCommentsLoading();
    } else {
        addCommentsLoadingIndicator();
    }
    
    try {
        // Récupérer tous les commentaires pour cette implémentation simple
        const res = await fetch(`/api/commentaires/evenement/${eventId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (res.ok) {
            const comments = await res.json();
            
            if (reset) {
                allComments = comments;
            }
            
            // Simuler la pagination côté client
            const startIndex = (commentsPage - 1) * commentsPerPage;
            const endIndex = startIndex + commentsPerPage;
            const pageComments = allComments.slice(startIndex, endIndex);
            
            hasMoreComments = endIndex < allComments.length;
            
            if (reset) {
                displayComments(pageComments, true);
            } else {
                displayComments(pageComments, false);
            }
            
            commentsPage++;
        } else {
            if (reset) {
                displayComments([], true);
            }
        }
    } catch (error) {
        if (reset) {
            displayComments([], true);
        }
    } finally {
        isLoadingComments = false;
        removeCommentsLoadingIndicator();
    }
};

// Affichage des commentaires
const displayComments = (comments, reset = true) => {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;

    if (reset && comments.length === 0) {
        commentsList.innerHTML = `
            <ul>
                <li class="text-muted">
                    <span>Aucun commentaire pour le moment.</span>
                </li>
            </ul>
        `;
        return;
    }

    const commentsHtml = comments.map(comment => {
        const date = new Date(comment.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const isAuthor = isConnected() && comment.auteur && getUserId() === comment.auteur.id;
        const isAdmin = isConnected() && getRole() === 'ROLE_ADMIN';
        const canDelete = isAuthor || isAdmin;

        // Nom de l'auteur (ou "Utilisateur supprimé" si l'auteur n'existe plus)
        const authorName = comment.auteur ? comment.auteur.username : 'Utilisateur supprimé';
        const authorClass = comment.auteur ? '' : 'comment-author-deleted';

        return `
            <li class="comment-item mb-3 p-3 border rounded">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong class="${authorClass}">${authorName}</strong>
                        <small class="comment-date ms-2">${date}</small>
                    </div>
                    ${canDelete ? `<button class="btn btn-sm btn-outline-danger" onclick="deleteComment(${comment.id})">
                        <i class="fas fa-trash"></i>
                    </button>` : ''}
                </div>
                <p class="mt-2 mb-0">${comment.contenu}</p>
            </li>
        `;
    }).join('');

    if (reset) {
        commentsList.innerHTML = `<ul class="list-unstyled" id="comments-list-ul">${commentsHtml}</ul>`;
    } else {
        // Ajouter les nouveaux commentaires à la liste existante
        const existingUl = commentsList.querySelector('#comments-list-ul');
        if (existingUl) {
            existingUl.insertAdjacentHTML('beforeend', commentsHtml);
        } else {
            commentsList.innerHTML = `<ul class="list-unstyled" id="comments-list-ul">${commentsHtml}</ul>`;
        }
    }
};

// Fonctions pour l'indicateur de chargement
const showCommentsLoading = () => {
    const commentsList = document.getElementById('commentsList');
    if (commentsList) {
        commentsList.innerHTML = `
            <div class="comments-loading">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Chargement...</span>
                </div>
                <div class="mt-2">Chargement des commentaires...</div>
            </div>
        `;
    }
};

const addCommentsLoadingIndicator = () => {
    const commentsList = document.getElementById('commentsList');
    const existingIndicator = commentsList.querySelector('.comments-loading');
    
    if (!existingIndicator && commentsList) {
        commentsList.insertAdjacentHTML('beforeend', `
            <div class="comments-loading">
                <div class="spinner-border spinner-border-sm" role="status">
                    <span class="visually-hidden">Chargement...</span>
                </div>
                <div class="mt-1">Chargement de plus de commentaires...</div>
            </div>
        `);
    }
};

const removeCommentsLoadingIndicator = () => {
    const loadingIndicator = document.querySelector('.comments-loading');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
};

// Gestionnaire de scroll pour l'infinite scroll
const setupInfiniteScroll = () => {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;
    
    commentsList.addEventListener('scroll', () => {
        const scrollTop = commentsList.scrollTop;
        const scrollHeight = commentsList.scrollHeight;
        const clientHeight = commentsList.clientHeight;
        
        // Déclencher le chargement quand on arrive à 80% du scroll
        if (scrollTop + clientHeight >= scrollHeight * 0.8) {
            if (!isLoadingComments && hasMoreComments) {
                loadComments(false);
            }
        }
    });
};

// Ajout de commentaire
const addComment = async () => {
    const commentInput = document.getElementById('commentInput');
    if (!commentInput) return;

    const contenu = commentInput.value.trim();
    if (!contenu) {
        alert('Veuillez saisir un commentaire');
        return;
    }

    if (!isConnected()) {
        alert('Vous devez être connecté pour commenter');
        return;
    }

    try {
        const token = getToken();
        const res = await fetch('/api/commentaires', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-AUTH-TOKEN': token
            },
            body: JSON.stringify({
                contenu: contenu,
                evenementId: parseInt(eventId)
            })
        });

        if (res.ok) {
            commentInput.value = ''; // Vider le champ
            await loadComments(true); // Recharger les commentaires
        } else {
            alert('Erreur lors de l\'ajout du commentaire');
        }
    } catch (error) {
        alert('Erreur lors de l\'ajout du commentaire');
    }
};

// Suppression de commentaire
const deleteComment = async (commentId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
        return;
    }

    try {
        const token = getToken();
        const res = await fetch(`/api/commentaires/${commentId}`, {
            method: 'DELETE',
            headers: {
                'X-AUTH-TOKEN': token
            }
        });

        if (res.ok) {
            await loadComments(true); // Recharger les commentaires
        } else {
            alert('Erreur lors de la suppression du commentaire');
        }
    } catch (error) {
        alert('Erreur lors de la suppression du commentaire');
    }
};

// Initialisation principale
const init = () => {
    if (eventId === null || isNaN(eventId)) {
        setState('error', 'ID d\'événement manquant ou invalide');
        return;
    }
    
    // Masquer les boutons admin et organisateur par défaut
    const adminContainer = document.querySelector('.admin-controls, .admin-buttons, [data-admin]');
    if (adminContainer) {
        adminContainer.style.display = 'none';
    }
    
    // Masquer spécifiquement les boutons de validation admin
    const adminValidationButtons = document.getElementById('adminValidationButtons');
    if (adminValidationButtons) {
        adminValidationButtons.style.display = 'none';
        adminValidationButtons.style.setProperty('display', 'none', 'important');
    }
    
    // Masquer les boutons organisateur par défaut
    const organizerButtons = document.getElementById('organizerButtons');
    if (organizerButtons) {
        organizerButtons.style.display = 'none';
        organizerButtons.style.visibility = 'hidden';
        organizerButtons.style.setProperty('display', 'none', 'important');
    }
    
    // Charger l'événement et les commentaires
    loadEvent();
    loadComments(true);
    
    // Configurer l'infinite scroll pour les commentaires
    setupInfiniteScroll();

    // Gestionnaire pour les commentaires
    document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.includes('Envoyer')) {
            btn.addEventListener("click", addComment);
        }
    });
};

// Démarrage
const start = () => {
    const eventName = document.getElementById("eventName");
    if (eventName) {
        init();
    } else {
        // Attendre que les éléments soient prêts
        const interval = setInterval(() => {
            if (document.getElementById("eventName")) {
                clearInterval(interval);
                init();
            }
        }, 100);
    }
}

// Fonction simple pour afficher les notifications
window.showNotification = (message, type = 'info') => {
    // Créer un élément de notification simple
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 9999;
        max-width: 300px;
        word-wrap: break-word;
        ${type === 'success' ? 'background-color: #28a745;' : ''}
        ${type === 'error' ? 'background-color: #dc3545;' : ''}
        ${type === 'info' ? 'background-color: #17a2b8;' : ''}
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Supprimer après 4 secondes
    setTimeout(() => {
        if (notification && notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 4000);
};

// Fonction pour démarrer un événement
window.startEvent = async () => {
    if (eventId === null || eventId === undefined) {
        showNotification('Erreur: ID de l\'événement non trouvé', 'error');
        return;
    }

    const token = getToken();
    if (!token) {
        showNotification('Vous devez être connecté pour effectuer cette action', 'error');
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
            showNotification('Événement démarré avec succès !', 'success');
            // Recharger l'événement pour mettre à jour l'affichage
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else {
            const errorData = await response.json();
            showNotification(errorData.message || errorData.error || 'Erreur lors du démarrage de l\'événement', 'error');
        }
    } catch (error) {
        console.error('Erreur lors du démarrage de l\'événement:', error);
        showNotification('Erreur de connexion', 'error');
    }
};

// Fonction pour rejoindre un événement démarré
window.joinEvent = async () => {
    if (eventId === null || eventId === undefined) {
        showNotification('Erreur: ID de l\'événement non trouvé', 'error');
        return;
    }

    const token = getToken();
    if (!token) {
        showNotification('Vous devez être connecté pour effectuer cette action', 'error');
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
            showNotification('Vous avez rejoint l\'événement avec succès !', 'success');
            
            // Optionnel : rediriger vers une page spécifique de l'événement
            // window.location.href = data.redirectUrl || `/evenement-live?id=${eventId}`;
        } else {
            const errorData = await response.json();
            showNotification(errorData.message || errorData.error || 'Erreur lors de la connexion à l\'événement', 'error');
        }
    } catch (error) {
        console.error('Erreur lors de la connexion à l\'événement:', error);
        showNotification('Erreur de connexion', 'error');
    }
};

// Initialisation automatique
if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", start);
} else {
    setTimeout(start, 50);
}

// Export pour le router SPA
export default start;
