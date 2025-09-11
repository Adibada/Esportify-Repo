// Recherche de profils
function initRechercheProfils() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const infoMessage = document.getElementById('infoMessage');
    const searchResults = document.getElementById('searchResults');

    // Event listeners
    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    async function performSearch() {
        const searchTerm = searchInput.value.trim();
        
        if (searchTerm === '') {
            showMessage('Veuillez saisir un terme de recherche.', 'warning');
            return;
        }

        if (searchTerm.length < 2) {
            showMessage('Le terme de recherche doit contenir au moins 2 caractères.', 'warning');
            return;
        }

        showLoading(true);
        hideMessage();
        searchResults.innerHTML = '';

        try {
            const response = await fetch(`/api/users/search?query=${encodeURIComponent(searchTerm)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erreur lors de la recherche');
            }

            displayResults(data);

        } catch (error) {
            showMessage('Erreur lors de la recherche des profils.', 'danger');
        } finally {
            showLoading(false);
        }
    }

    function displayResults(users) {
        if (users.length === 0) {
            showMessage('Aucun utilisateur trouvé.', 'info');
            return;
        }

        // Affichage en liste avec usernames cliquables
        const resultsHtml = `
            <div class="results-list">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Résultats de recherche</h5>
                    </div>
                    <div class="card-body p-0">
                        <div class="list-group list-group-flush">
                            ${users.map(user => `
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
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        searchResults.innerHTML = resultsHtml;
        showMessage(`${users.length} utilisateur(s) trouvé(s).`, 'success');
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
}

// Initialiser immédiatement si le DOM est déjà chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRechercheProfils);
} else {
    initRechercheProfils();
}

// Export par défaut pour le router
export default initRechercheProfils;
