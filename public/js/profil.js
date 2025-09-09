// Affichage d'un profil utilisateur
function initProfil() {
    // Récupérer l'ID depuis les paramètres d'URL (SPA)
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');
    console.log('UserId récupéré:', userId);
    
    if (!userId) {
        showError('ID utilisateur manquant dans l\'URL.');
        return;
    }

    loadUserProfile(userId);
}

async function loadUserProfile(userId) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const profileContent = document.getElementById('profileContent');
    
    try {
        showLoading(true);
        
        // Récupérer les informations du profil
        const response = await fetch(`/api/users/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erreur lors du chargement du profil');
        }

        // La méthode show retourne déjà toutes les données nécessaires
        displayProfile(data);
        displayOrganizedEvents(data.evenements || []);
        displayParticipations(data.participations || []);

    } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        showError('Impossible de charger le profil utilisateur.');
    } finally {
        showLoading(false);
    }
}

function displayProfile(user) {
    // Nom d'utilisateur dans le titre
    document.getElementById('username').textContent = user.username || 'Utilisateur inconnu';
    document.getElementById('profileUsername').textContent = user.username || 'Non spécifié';
    
    // Masquer la section "Membre depuis" car nous n'avons pas cette info
    const memberSinceElement = document.getElementById('memberSince');
    if (memberSinceElement) {
        memberSinceElement.parentElement.style.display = 'none';
    }
    
    // Statut utilisateur
    const userStatus = user.roles && user.roles.includes('ROLE_ORGANISATEUR') ? 'Organisateur' : 'Participant';
    document.getElementById('userStatus').textContent = userStatus;
    
    // Afficher le contenu du profil
    document.getElementById('profileContent').classList.remove('d-none');
}

function displayOrganizedEvents(events) {
    const container = document.getElementById('organizedEvents');
    
    if (events.length === 0) {
        container.innerHTML = '<p class="text-muted">Aucun événement organisé.</p>';
        return;
    }

    const eventsHtml = events.map(event => `
        <div class="event-item mb-3">
            <div class="card">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <h6 class="card-title">${escapeHtml(event.title)}</h6>
                            <p class="card-text text-muted mb-1">
                                <i class="fas fa-calendar"></i> ${formatDateTime(event.dateDebut)}
                            </p>
                            <p class="card-text text-muted mb-0">
                                <i class="fas fa-map-marker-alt"></i> ${escapeHtml(event.lieu)}
                            </p>
                        </div>
                        <div class="col-md-4 text-end">
                            <a href="/evenement?id=${event.id}" class="btn btn-sm btn-outline-primary">
                                Voir l'événement
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = eventsHtml;
}

function displayParticipations(participations) {
    const container = document.getElementById('participations');
    
    if (participations.length === 0) {
        container.innerHTML = '<p class="text-muted">Aucune participation.</p>';
        return;
    }

    const participationsHtml = participations.map(participation => `
        <div class="participation-item mb-3">
            <div class="card">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <h6 class="card-title">${escapeHtml(participation.event.title)}</h6>
                            <p class="card-text text-muted mb-1">
                                <i class="fas fa-calendar"></i> ${formatDateTime(participation.event.dateDebut)}
                            </p>
                            <p class="card-text text-muted mb-0">
                                <i class="fas fa-map-marker-alt"></i> ${escapeHtml(participation.event.lieu)}
                            </p>
                        </div>
                        <div class="col-md-4 text-end">
                            <a href="/evenement?id=${participation.event.id}" class="btn btn-sm btn-outline-primary">
                                Voir l'événement
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = participationsHtml;
}

function showLoading(show) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const profileContent = document.getElementById('profileContent');
    
    if (show) {
        loadingIndicator.classList.remove('d-none');
        profileContent.classList.add('d-none');
    } else {
        loadingIndicator.classList.add('d-none');
    }
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    loadingIndicator.classList.add('d-none');
    errorText.textContent = message;
    errorMessage.classList.remove('d-none');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDateTime(dateString) {
    if (!dateString) return 'Date non spécifiée';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Export par défaut pour le router
export default initProfil;
