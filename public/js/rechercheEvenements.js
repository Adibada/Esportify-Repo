// Fonctions utilitaires pour les cookies
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

// Récupération du token depuis le cookie
function getToken() {
    return getCookie("accesstoken");
}

// Variables globales pour la recherche
let currentFilters = {};
let currentPage = 1;
const itemsPerPage = 10;

// Variables pour l'infinite scroll
let isLoadingEvents = false;
let hasMoreEvents = true;
let allLoadedEvents = [];

// Fonction pour construire l'URL de recherche avec les paramètres
function buildSearchUrl(filters = {}, page = 1) {
    const params = new URLSearchParams();
    
    // Ajouter les filtres à l'URL
    Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
            params.append(key, filters[key]);
        }
    });
    
    // Ajouter la pagination
    params.append('page', page);
    params.append('limit', itemsPerPage);
    
    return `/api/evenements/search?${params.toString()}`;
}

// Fonction pour effectuer la recherche avec infinite scroll
async function searchEvents(filters = {}, reset = true) {
    if (isLoadingEvents || (!hasMoreEvents && !reset)) return;
    
    if (reset) {
        currentPage = 1;
        allLoadedEvents = [];
        hasMoreEvents = true;
    }
    
    isLoadingEvents = true;
    
    try {
        if (currentPage === 1 && reset) {
            showLoadingState();
        } else {
            addEventsLoadingIndicator();
        }
        
        const url = buildSearchUrl(filters, currentPage);
        const token = getToken();
        
        const response = await fetch(url, {
            headers: token ? { 'X-AUTH-TOKEN': token } : {}
        });
        
        if (!response.ok) {
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Sauvegarder les filtres
        currentFilters = { ...filters };
        
        // Mettre à jour les variables de pagination
        const events = data.events || [];
        hasMoreEvents = currentPage < (data.totalPages || 1);
        
        if (reset) {
            allLoadedEvents = events;
            displayResults(events, data.totalCount || 0, true);
        } else {
            allLoadedEvents = [...allLoadedEvents, ...events];
            displayResults(events, data.totalCount || 0, false);
        }
        
        currentPage++;
        
    } catch (error) {
        if (reset) {
            showErrorState(error.message);
        } else {
            console.error('Erreur lors du chargement des événements supplémentaires:', error);
        }
    } finally {
        isLoadingEvents = false;
        removeEventsLoadingIndicator();
    }
}

// Fonctions pour l'indicateur de chargement
function showLoadingState() {
    const resultsContainer = document.querySelector('.event-list');
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <li class="text-center py-4">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Recherche en cours...</span>
                </div>
                <div class="mt-2">Recherche en cours...</div>
            </li>
        `;
    }
}

function addEventsLoadingIndicator() {
    const resultsContainer = document.querySelector('.event-list');
    const existingIndicator = resultsContainer.querySelector('.events-loading');
    
    if (!existingIndicator && resultsContainer) {
        resultsContainer.insertAdjacentHTML('beforeend', `
            <li class="events-loading text-center py-3">
                <div class="spinner-border spinner-border-sm" role="status">
                    <span class="visually-hidden">Chargement...</span>
                </div>
                <div class="mt-1">Chargement d'autres événements...</div>
            </li>
        `);
    }
}

function removeEventsLoadingIndicator() {
    const loadingIndicator = document.querySelector('.events-loading');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

// Configuration de l'infinite scroll pour les événements
function setupEventsInfiniteScroll() {
    const resultsContainer = document.querySelector('.event-list');
    if (!resultsContainer) return;

    // Créer un conteneur scrollable si ce n'est pas déjà fait
    const parentContainer = resultsContainer.parentElement;
    if (parentContainer && !parentContainer.classList.contains('events-scroll-container')) {
        parentContainer.classList.add('events-scroll-container');
        parentContainer.style.cssText = `
            max-height: 600px; 
            overflow-y: auto; 
            border-radius: 0.375rem; 
            padding: 1rem;
        `;
        
        // Ajouter les styles de scrollbar
        const style = document.createElement('style');
        style.textContent = `
            .events-scroll-container::-webkit-scrollbar {
                width: 8px;
            }
            .events-scroll-container::-webkit-scrollbar-track {
                background: rgba(255,255,255,0.1);
                border-radius: 4px;
            }
            .events-scroll-container::-webkit-scrollbar-thumb {
                background: var(--bs-secondary);
                border-radius: 4px;
            }
            .events-scroll-container::-webkit-scrollbar-thumb:hover {
                background: color-mix(in srgb, var(--bs-secondary) 80%, black 20%);
            }
        `;
        document.head.appendChild(style);
    }

    // Ajouter l'event listener pour l'infinite scroll
    parentContainer.addEventListener('scroll', () => {
        const scrollTop = parentContainer.scrollTop;
        const scrollHeight = parentContainer.scrollHeight;
        const clientHeight = parentContainer.clientHeight;
        
        // Déclencher le chargement quand on arrive à 80% du scroll
        if (scrollTop + clientHeight >= scrollHeight * 0.8) {
            if (!isLoadingEvents && hasMoreEvents) {
                searchEvents(currentFilters, false);
            }
        }
    });
}

// Fonction pour afficher l'état d'erreur
function showErrorState(message) {
    const resultsContainer = document.querySelector('.event-list');
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <li class="text-center py-4 text-danger">
                <i class="fas fa-exclamation-triangle mb-2"></i>
                <div>Erreur lors de la recherche</div>
                <small class="text-muted">${message}</small>
                <div class="mt-3">
                    <button class="btn btn-primary btn-sm" onclick="location.reload()">Réessayer</button>
                </div>
            </li>
        `;
    }
}

// Fonction pour afficher les résultats avec infinite scroll
function displayResults(events, total = 0, reset = true) {
    const resultsContainer = document.querySelector('.event-list');
    const titleElement = document.getElementById('event-title');
    
    if (!resultsContainer) return;
    
    // Ajouter la classe pour le style du tableau
    resultsContainer.parentElement.classList.add('events-table');
    
    // Mise à jour du titre avec le nombre de résultats
    if (titleElement && reset) {
        titleElement.textContent = `Résultats de la recherche (${total} événement${total !== 1 ? 's' : ''} trouvé${total !== 1 ? 's' : ''})`;
    }
    
    if (reset && (!events || events.length === 0)) {
        resultsContainer.innerHTML = `
            <li class="text-center py-4 text-muted">
                <i class="fas fa-search mb-2"></i>
                <div>Aucun événement trouvé</div>
                <small>Essayez de modifier vos critères de recherche</small>
            </li>
        `;
        return;
    }
    
    // Si c'est un reset, ajouter l'en-tête du tableau
    let eventsHTML = '';
    if (reset) {
        eventsHTML += `
            <li>
                <div class="row py-2 border-bottom fw-bold text-muted small">
                    <div class="col-md-6">Titre de l'événement</div>
                    <div class="col-md-4">Dates</div>
                    <div class="col-md-2">Participants</div>
                </div>
            </li>
        `;
    }
    
    // Générer le HTML des résultats en format tableau
    eventsHTML += events.map(event => {
        const dateDebut = event.start ? new Date(event.start) : null;
        const dateFin = event.end ? new Date(event.end) : null;
        
        return `
            <li class="event-in-list">
                <div class="row align-items-center py-2">
                    <div class="col-md-6">
                        <a href="/evenement?id=${event.id}" onclick="window.route(event)" class="text-decoration-none fw-medium">
                            ${event.titre || 'Sans titre'}
                        </a>
                    </div>
                    <div class="col-md-4 text-muted small">
                        ${dateDebut ? `<div>Début: <time datetime="${event.start}">${dateDebut.toLocaleDateString()}</time></div>` : ''}
                        ${dateFin ? `<div>Fin: <time datetime="${event.end}">${dateFin.toLocaleDateString()}</time></div>` : ''}
                    </div>
                    <div class="col-md-2 text-center">
                        <span class="badge bg-info">${event.numberCompetitors || 0}</span>
                        <small class="d-block text-muted mt-1">participant${(event.numberCompetitors || 0) !== 1 ? 's' : ''}</small>
                    </div>
                </div>
            </li>
        `;
    }).join('');
    
    if (reset) {
        resultsContainer.innerHTML = eventsHTML;
    } else {
        // Ajouter les nouveaux événements à la liste existante (sans en-tête)
        resultsContainer.insertAdjacentHTML('beforeend', events.map(event => {
            const dateDebut = event.start ? new Date(event.start) : null;
            const dateFin = event.end ? new Date(event.end) : null;
            
            return `
                <li class="event-in-list">
                    <div class="row align-items-center py-2">
                        <div class="col-md-4">
                            <a href="/evenement?id=${event.id}" onclick="window.route(event)" class="text-decoration-none fw-medium">
                                ${event.titre || 'Sans titre'}
                            </a>
                        </div>
                        <div class="col-md-3 text-muted small">
                            ${dateDebut ? `<div>Début: <time datetime="${event.start}">${dateDebut.toLocaleDateString()}</time></div>` : ''}
                            ${dateFin ? `<div>Fin: <time datetime="${event.end}">${dateFin.toLocaleDateString()}</time></div>` : ''}
                        </div>
                        <div class="col-md-2 text-center">
                            <span class="badge bg-info">${event.numberCompetitors || 0}</span>
                            <small class="d-block text-muted mt-1">participant${(event.numberCompetitors || 0) !== 1 ? 's' : ''}</small>
                        </div>
                        <div class="col-md-3">
                            ${event.organisateur ? `
                                <span class="text-muted small">par</span>
                                <div class="fw-medium">${event.organisateur.username}</div>
                            ` : '<span class="text-muted small">Non défini</span>'}
                        </div>
                    </div>
                </li>
            `;
        }).join(''));
    }
}

// Fonction pour réinitialiser tous les formulaires
function resetAllForms() {
    document.querySelectorAll('form').forEach(form => {
        form.reset();
    });
    currentFilters = {};
    currentPage = 1;
    allLoadedEvents = [];
    hasMoreEvents = true;
    
    // Charger tous les événements
    searchEvents();
}

// Fonction pour initialiser les gestionnaires d'événements
function initializeSearchHandlers() {
    // Recherche par nom d'événement
    const searchEventNameForm = document.getElementById('searchEventName');
    if (searchEventNameForm) {
        searchEventNameForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const eventName = document.getElementById('eventName')?.value.trim();
            if (eventName) {
                searchEvents({ titre: eventName }, true);
            }
        });
    }
    
    // Recherche par nombre de participants
    const searchEventNumberForm = document.getElementById('searchEventNumberCompetitors');
    if (searchEventNumberForm) {
        searchEventNumberForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const minParticipants = document.getElementById('minParticipants')?.value;
            const maxParticipants = document.getElementById('maxParticipants')?.value;
            
            const filters = {};
            if (minParticipants) filters.minParticipants = parseInt(minParticipants);
            if (maxParticipants) filters.maxParticipants = parseInt(maxParticipants);
            
            if (Object.keys(filters).length > 0) {
                searchEvents(filters, true);
            }
        });
    }
    
    // Recherche par organisateur
    const searchEventOrganizerForm = document.getElementById('searchEventOrganizer');
    if (searchEventOrganizerForm) {
        searchEventOrganizerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const organizerName = document.getElementById('organizerName')?.value.trim();
            if (organizerName) {
                searchEvents({ organisateur: organizerName }, true);
            }
        });
    }
    
    // Recherche par date de début
    const formDateStartForm = document.getElementById('formDateStart');
    if (formDateStartForm) {
        formDateStartForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const searchDateStart = document.getElementById('searchDateStart')?.value;
            if (searchDateStart) {
                searchEvents({ dateStart: searchDateStart }, true);
            }
        });
    }
    
    // Recherche par date de fin
    const formDateEndForm = document.getElementById('formDateEnd');
    if (formDateEndForm) {
        formDateEndForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const searchDateEnd = document.getElementById('searchDateEnd')?.value;
            if (searchDateEnd) {
                searchEvents({ dateEnd: searchDateEnd }, true);
            }
        });
    }
    
    // Recherche combinée (utilise tous les champs remplis)
    const combinedSearchBtn = document.getElementById('combinedSearchBtn');
    if (combinedSearchBtn) {
        combinedSearchBtn.addEventListener('click', () => {
            performCombinedSearch();
        });
    }
    
    // Bouton reset
    const resetAllBtn = document.getElementById('resetAllBtn');
    if (resetAllBtn) {
        resetAllBtn.addEventListener('click', () => {
            resetAllForms();
        });
    }
    
    // Gérer la navigation par les touches
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            // Ctrl+Entrée pour lancer une recherche combinée
            performCombinedSearch();
        }
    });
}

// Fonction pour effectuer une recherche combinée
function performCombinedSearch() {
    const filters = {};
    
    // Récupérer tous les champs remplis
    const eventName = document.getElementById('eventName')?.value.trim();
    const organizerName = document.getElementById('organizerName')?.value.trim();
    const minParticipants = document.getElementById('minParticipants')?.value;
    const maxParticipants = document.getElementById('maxParticipants')?.value;
    const searchDateStart = document.getElementById('searchDateStart')?.value;
    const searchDateEnd = document.getElementById('searchDateEnd')?.value;
    
    if (eventName) filters.titre = eventName;
    if (organizerName) filters.organisateur = organizerName;
    if (minParticipants) filters.minParticipants = parseInt(minParticipants);
    if (maxParticipants) filters.maxParticipants = parseInt(maxParticipants);
    if (searchDateStart) filters.dateStart = searchDateStart;
    if (searchDateEnd) filters.dateEnd = searchDateEnd;
    
    if (Object.keys(filters).length === 0) {
        alert('Veuillez remplir au moins un critère de recherche.');
        return;
    }
    
    searchEvents(filters, true);
}

// Fonction pour charger tous les événements au démarrage
function loadAllEvents() {
    searchEvents({}, true);
}

// Initialisation de la page
function initializeSearchPage() {
    // Vérifier que les éléments essentiels existent
    const eventList = document.querySelector('.event-list');
    if (!eventList) {
        return false;
    }
    
    initializeSearchHandlers();
    setupEventsInfiniteScroll();
    loadAllEvents();
    
    return true;
}

// Fonction pour vérifier si les éléments DOM sont prêts
function checkDOMReady() {
    return document.querySelector('.event-list') !== null;
}

// Fonction pour attendre que le DOM soit prêt
function waitForDOM() {
    const checkInterval = setInterval(() => {
        if (checkDOMReady()) {
            clearInterval(checkInterval);
            initializeSearchPage();
        }
    }, 200);
    
    setTimeout(() => {
        clearInterval(checkInterval);
    }, 10000);
}

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
    if (!initializeSearchPage()) {
        waitForDOM();
    }
});

// Fallback si le DOM est déjà prêt
if (document.readyState === 'loading') {
    // Document en cours de chargement
} else {
    setTimeout(() => {
        if (!initializeSearchPage()) {
            waitForDOM();
        }
    }, 100);
}
