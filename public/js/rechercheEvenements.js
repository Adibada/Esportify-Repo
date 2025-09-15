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

// Fonction pour effectuer la recherche
async function searchEvents(filters = {}, page = 1) {
    try {
        showLoadingState();
        
        const url = buildSearchUrl(filters, page);
        const token = getToken();
        
        const response = await fetch(url, {
            headers: token ? { 'X-AUTH-TOKEN': token } : {}
        });
        
        if (!response.ok) {
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Sauvegarder les filtres et la page courante
        currentFilters = { ...filters };
        currentPage = page;
        
        // Utiliser la nouvelle structure de réponse de l'API
        displayResults(data.events || [], data.totalCount || 0, data.page || page, data.totalPages || 1);
        
    } catch (error) {
        showErrorState(error.message);
    }
}

// Fonction pour afficher l'état de chargement
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

// Fonction pour afficher les résultats
function displayResults(events, total = 0, page = 1, totalPages = 1) {
    const resultsContainer = document.querySelector('.event-list');
    const titleElement = document.getElementById('event-title');
    
    if (!resultsContainer) return;
    
    // Mise à jour du titre avec le nombre de résultats
    if (titleElement) {
        titleElement.textContent = `Résultats de la recherche (${total} événement${total !== 1 ? 's' : ''} trouvé${total !== 1 ? 's' : ''})`;
    }
    
    if (!events || events.length === 0) {
        resultsContainer.innerHTML = `
            <li class="text-center py-4 text-muted">
                <i class="fas fa-search mb-2"></i>
                <div>Aucun événement trouvé</div>
                <small>Essayez de modifier vos critères de recherche</small>
            </li>
        `;
        return;
    }
    
    // Générer le HTML des résultats
    const eventsHTML = events.map(event => `
        <li class="event-in-list">
            <a href="/evenement?id=${event.id}" onclick="window.route(event)">
                <span class="event-name">${event.titre || 'Sans titre'}</span>
                <span class="separator">/</span>
                <span class="event-date">
                    <time datetime="${event.start}">${new Date(event.start).toLocaleDateString()}</time>
                </span>
                <span class="separator">/</span>
                <span class="event-participants">${event.numberCompetitors || 0} Participant${(event.numberCompetitors || 0) !== 1 ? 's' : ''}</span>
                ${event.organisateur ? `
                    <span class="separator">/</span>
                    <span class="event-organizer">par ${event.organisateur.username}</span>
                ` : ''}
            </a>
        </li>
    `).join('');
    
    resultsContainer.innerHTML = eventsHTML;
    
    // Ajouter la pagination si nécessaire
    if (totalPages > 1) {
        addPagination(total, page, totalPages);
    } else {
        removePagination();
    }
}

// Fonction pour ajouter la pagination
function addPagination(total, currentPage) {
    const totalPages = Math.ceil(total / itemsPerPage);
    
    // Supprimer l'ancienne pagination
    removePagination();
    
    if (totalPages <= 1) return;
    
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination-container mt-4 d-flex justify-content-center';
    paginationContainer.id = 'pagination';
    
    let paginationHTML = '<nav aria-label="Navigation des résultats"><ul class="pagination">';
    
    // Bouton précédent
    if (currentPage > 1) {
        paginationHTML += `
            <li class="page-item">
                <button class="page-link" onclick="searchEvents(currentFilters, ${currentPage - 1})">
                    Précédent
                </button>
            </li>
        `;
    }
    
    // Numéros de pages
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        paginationHTML += `
            <li class="page-item">
                <button class="page-link" onclick="searchEvents(currentFilters, 1)">1</button>
            </li>
        `;
        if (startPage > 2) {
            paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <button class="page-link" onclick="searchEvents(currentFilters, ${i})">${i}</button>
            </li>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
        paginationHTML += `
            <li class="page-item">
                <button class="page-link" onclick="searchEvents(currentFilters, ${totalPages})">${totalPages}</button>
            </li>
        `;
    }
    
    // Bouton suivant
    if (currentPage < totalPages) {
        paginationHTML += `
            <li class="page-item">
                <button class="page-link" onclick="searchEvents(currentFilters, ${currentPage + 1})">
                    Suivant
                </button>
            </li>
        `;
    }
    
    paginationHTML += '</ul></nav>';
    paginationContainer.innerHTML = paginationHTML;
    
    // Insérer après la liste des événements
    const eventList = document.querySelector('.event-list');
    if (eventList && eventList.parentNode) {
        eventList.parentNode.insertBefore(paginationContainer, eventList.nextSibling);
    }
}

// Fonction pour supprimer la pagination
function removePagination() {
    const existingPagination = document.getElementById('pagination');
    if (existingPagination) {
        existingPagination.remove();
    }
}

// Fonction pour réinitialiser tous les formulaires
function resetAllForms() {
    document.querySelectorAll('form').forEach(form => {
        form.reset();
    });
    currentFilters = {};
    currentPage = 1;
    
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
                searchEvents({ titre: eventName }, 1);
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
                searchEvents({ organisateur: organizerName }, 1);
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
                searchEvents(filters, 1);
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
                searchEvents({ dateStart: searchDateStart }, 1);
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
                searchEvents({ dateEnd: searchDateEnd }, 1);
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
    
    searchEvents(filters, 1);
}

// Fonction pour charger tous les événements au démarrage
function loadAllEvents() {
    searchEvents({}, 1);
}

// Initialisation de la page
function initializeSearchPage() {
    // Vérifier que les éléments essentiels existent
    const eventList = document.querySelector('.event-list');
    if (!eventList) {
        return false;
    }
    
    initializeSearchHandlers();
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
