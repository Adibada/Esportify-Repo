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

        const resultsHtml = users.map(user => `
            <div class="user-card mb-3">
                <div class="card">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-8">
                                <h5 class="card-title mb-1">${escapeHtml(user.username)}</h5>
                            </div>
                            <div class="col-md-4 text-end">
                                <a href="/profil?id=${user.id}" onclick="route(event)" class="btn btn-primary">
                                    Voir le profil
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

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
}

// Initialiser immédiatement si le DOM est déjà chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRechercheProfils);
} else {
    initRechercheProfils();
}

// Export par défaut pour le router
export default initRechercheProfils;
