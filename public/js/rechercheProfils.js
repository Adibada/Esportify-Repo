// Variables pour l'infinite scroll
let isLoadingProfiles = false;
let hasMoreProfiles = true;
let currentProfilePage = 1;
let allLoadedProfiles = [];
let currentSearchTerm = '';
const profilesPerPage = 10;

// Recherche de profils
function initRechercheProfils() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const infoMessage = document.getElementById('infoMessage');
    const searchResults = document.getElementById('searchResults');

    // Event listeners
    if (searchButton) {
        searchButton.addEventListener('click', () => performSearch(true));
    }
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch(true);
            }
        });
    }

    // Initialiser l'infinite scroll
    setupProfilesInfiniteScroll();

    async function performSearch(reset = true) {
        const searchTerm = searchInput.value.trim();
        
        if (reset) {
            if (searchTerm === '') {
                showMessage('Veuillez saisir un terme de recherche.', 'warning');
                return;
            }

            if (searchTerm.length < 2) {
                showMessage('Le terme de recherche doit contenir au moins 2 caractères.', 'warning');
                return;
            }
            
            // Réinitialiser pour une nouvelle recherche
            currentProfilePage = 1;
            allLoadedProfiles = [];
            hasMoreProfiles = true;
            currentSearchTerm = searchTerm;
        }
        
        if (isLoadingProfiles || (!hasMoreProfiles && !reset)) return;
        
        isLoadingProfiles = true;
        
        if (reset) {
            showLoading(true);
            hideMessage();
            searchResults.innerHTML = '';
        } else {
            addProfilesLoadingIndicator();
        }

        try {
            const response = await fetch(`/api/users/search?query=${encodeURIComponent(currentSearchTerm)}&page=${currentProfilePage}&limit=${profilesPerPage}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erreur lors de la recherche');
            }

            // Simulation de pagination côté client car l'API ne semble pas la supporter
            // On récupère tous les utilisateurs et on les pagine côté client
            if (reset) {
                allLoadedProfiles = data;
            }
            
            const startIndex = (currentProfilePage - 1) * profilesPerPage;
            const endIndex = startIndex + profilesPerPage;
            const pageProfiles = allLoadedProfiles.slice(startIndex, endIndex);
            
            hasMoreProfiles = endIndex < allLoadedProfiles.length;
            
            displayResults(pageProfiles, reset);
            currentProfilePage++;

        } catch (error) {
            if (reset) {
                showMessage('Erreur lors de la recherche des profils.', 'danger');
            } else {
                console.error('Erreur lors du chargement des profils supplémentaires:', error);
            }
        } finally {
            isLoadingProfiles = false;
            showLoading(false);
            removeProfilesLoadingIndicator();
        }
    }

    function displayResults(users, reset = true) {
        if (reset && users.length === 0) {
            showMessage('Aucun utilisateur trouvé.', 'info');
            return;
        }

        // Affichage en liste avec usernames cliquables
        const resultsHtml = users.map(user => `
            <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                <div>
                    <a href="/profil?id=${user.id}" onclick="route(event)" class="text-decoration-none fw-bold text-primary user-link">
                        ${escapeHtml(user.username)}
                    </a>
                </div>
                <small class="text-muted">
                    <i class="fas fa-user me-1"></i>
                    ${formatUserRole(user.roles)}
                </small>
            </div>
        `).join('');

        if (reset) {
            searchResults.innerHTML = `
                <div class="results-list">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Résultats de recherche</h5>
                        </div>
                        <div class="card-body p-0">
                            <div class="list-group list-group-flush" id="profiles-list">
                                ${resultsHtml}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            showMessage(`${allLoadedProfiles.length} utilisateur(s) trouvé(s).`, 'success');
        } else {
            // Ajouter les nouveaux profils à la liste existante
            const profilesList = document.getElementById('profiles-list');
            if (profilesList) {
                profilesList.insertAdjacentHTML('beforeend', resultsHtml);
            }
        }
    }

    function showLoading(show) {
        if (show) {
            loadingIndicator.classList.remove('d-none');
        } else {
            loadingIndicator.classList.add('d-none');
        }
    }

    function showMessage(message, type = 'info') {
        if (!infoMessage) {
            console.warn('Element infoMessage not found');
            return;
        }
        infoMessage.className = `alert alert-${type} text-center`;
        infoMessage.textContent = message;
        infoMessage.classList.remove('d-none');
    }

    function hideMessage() {
        if (!infoMessage) {
            console.warn('Element infoMessage not found');
            return;
        }
        infoMessage.classList.add('d-none');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatUserRole(roles) {
        // Priorité des rôles (du plus important au moins important)
        const rolePriority = {
            'ROLE_ADMIN': 'Administrateur',
            'ROLE_ORGANISATEUR': 'Organisateur', 
            'ROLE_USER': 'Utilisateur'
        };

        // Trouver le rôle le plus élevé
        for (const roleKey in rolePriority) {
            if (roles.includes(roleKey)) {
                return rolePriority[roleKey];
            }
        }

        // Fallback si aucun rôle reconnu
        return 'Utilisateur';
    }

    // Fonctions pour l'indicateur de chargement des profils
    function addProfilesLoadingIndicator() {
        const searchResults = document.getElementById('searchResults');
        const existingIndicator = searchResults.querySelector('.profiles-loading');
        
        if (!existingIndicator && searchResults) {
            searchResults.insertAdjacentHTML('beforeend', `
                <div class="profiles-loading text-center py-3">
                    <div class="spinner-border spinner-border-sm" role="status">
                        <span class="visually-hidden">Chargement...</span>
                    </div>
                    <div class="mt-1">Chargement d'autres profils...</div>
                </div>
            `);
        }
    }

    function removeProfilesLoadingIndicator() {
        const loadingIndicator = document.querySelector('.profiles-loading');
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
    }

    // Configuration de l'infinite scroll pour les profils
    function setupProfilesInfiniteScroll() {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;

        // Observer les changements dans le DOM pour détecter l'ajout de la liste de résultats
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    const resultsList = searchResults.querySelector('.results-list');
                    if (resultsList) {
                        // Configurer le conteneur scrollable
                        const cardBody = resultsList.querySelector('.card-body');
                        if (cardBody && !cardBody.classList.contains('profiles-scroll-container')) {
                            cardBody.classList.add('profiles-scroll-container');
                            cardBody.style.cssText = `
                                max-height: 500px; 
                                overflow-y: auto;
                            `;
                            
                            // Ajouter les styles de scrollbar
                            const style = document.createElement('style');
                            style.textContent = `
                                .profiles-scroll-container::-webkit-scrollbar {
                                    width: 8px;
                                }
                                .profiles-scroll-container::-webkit-scrollbar-track {
                                    background: rgba(255,255,255,0.1);
                                    border-radius: 4px;
                                }
                                .profiles-scroll-container::-webkit-scrollbar-thumb {
                                    background: var(--bs-secondary);
                                    border-radius: 4px;
                                }
                                .profiles-scroll-container::-webkit-scrollbar-thumb:hover {
                                    background: color-mix(in srgb, var(--bs-secondary) 80%, black 20%);
                                }
                            `;
                            if (!document.querySelector('[data-profiles-scroll-styles]')) {
                                style.setAttribute('data-profiles-scroll-styles', 'true');
                                document.head.appendChild(style);
                            }

                            // Ajouter l'event listener pour l'infinite scroll
                            cardBody.addEventListener('scroll', () => {
                                const scrollTop = cardBody.scrollTop;
                                const scrollHeight = cardBody.scrollHeight;
                                const clientHeight = cardBody.clientHeight;
                                
                                // Déclencher le chargement quand on arrive à 80% du scroll
                                if (scrollTop + clientHeight >= scrollHeight * 0.8) {
                                    if (!isLoadingProfiles && hasMoreProfiles) {
                                        performSearch(false);
                                    }
                                }
                            });
                        }
                    }
                }
            });
        });

        observer.observe(searchResults, { childList: true, subtree: true });
    }
}

// Initialiser immédiatement si le DOM est déjà chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRechercheProfils);
} else {
    initRechercheProfils();
}

// Export par défaut pour le router
export default initRechercheProfils;
