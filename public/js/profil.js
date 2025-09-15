// Affichage d'un profil utilisateur
function initProfil() {
    // Récupérer l'ID depuis les paramètres d'URL (SPA)
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');
    
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
        await displayProfile(data);
        
        // Charger les participations séparément pour une meilleure gestion
        loadUserParticipations(userId);

    } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        showError('Impossible de charger le profil utilisateur.');
    } finally {
        showLoading(false);
    }
}

// Charger les participations de l'utilisateur spécifique
async function loadUserParticipations(userId) {
    try {
        // Récupérer les participations depuis l'API
        const response = await fetch(`/api/users/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erreur lors du chargement des participations');
        }

        // Afficher les participations
        displayAllParticipations(data.participations || []);

    } catch (error) {
        console.error('Erreur lors du chargement des participations:', error);
        
        // Afficher un message d'erreur dans le conteneur
        const container = document.getElementById('participations');
        
        const errorMessage = `
            <div class="text-center py-3 text-danger">
                <div>Erreur lors du chargement des participations</div>
                <div class="mt-2">
                    <button class="btn btn-outline-secondary btn-sm" onclick="loadUserParticipations(${userId})">
                        Réessayer
                    </button>
                </div>
            </div>
        `;
        
        if (container) container.innerHTML = errorMessage;
    }
}

// Rendre la fonction accessible globalement pour le bouton "Réessayer"
window.loadUserParticipations = loadUserParticipations;

async function displayProfile(user) {
    // Nom d'utilisateur dans le titre - élément optionnel
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
        usernameElement.textContent = user.username || 'Utilisateur inconnu';
    }
    
    // Nom d'utilisateur dans le profil
    const profileUsernameElement = document.getElementById('profileUsername');
    if (profileUsernameElement) {
        profileUsernameElement.textContent = user.username || 'Non spécifié';
    }
    
    // Masquer la section "Membre depuis" car nous n'avons pas cette info
    const memberSinceElement = document.getElementById('memberSince');
    if (memberSinceElement) {
        memberSinceElement.parentElement.style.display = 'none';
    }
    
    // Statut utilisateur
    const userStatus = user.roles && user.roles.includes('ROLE_ORGANISATEUR') ? 'Organisateur' : 'Participant';
    const userStatusElement = document.getElementById('userStatus');
    if (userStatusElement) {
        userStatusElement.textContent = userStatus;
    }
    
    // Initialiser la section de gestion des rôles (async)
    await initializeRoleSelect(user);
    
    // Afficher le contenu du profil
    const profileContentElement = document.getElementById('profileContent');
    if (profileContentElement) {
        profileContentElement.classList.remove('d-none');
    }
}

function displayAllParticipations(participations) {
    const container = document.getElementById('participations');
    
    if (participations.length === 0) {
        container.innerHTML = '<p class="text-muted">Aucune participation.</p>';
        return;
    }

    // Trier les participations par date (plus récentes en premier)
    const sortedParticipations = participations.sort((a, b) => {
        const dateA = new Date(a.dateDebut);
        const dateB = new Date(b.dateDebut);
        return dateB - dateA;
    });

    const currentDate = new Date();

    const participationsHtml = sortedParticipations.map(participation => {
        const eventStartDate = new Date(participation.dateDebut);
        const eventEndDate = new Date(participation.dateFin || participation.dateDebut);
        
        // Déterminer le badge selon le statut de participation
        let statusBadge;
        switch (participation.statutParticipation) {
            case 'validee':
                statusBadge = '<span class="badge bg-success">Validée</span>';
                break;
            case 'refusee':
                statusBadge = '<span class="badge bg-danger">Refusée</span>';
                break;
            case 'en_attente':
            default:
                statusBadge = '<span class="badge bg-warning">En attente</span>';
                break;
        }

        return `
            <div class="participation-item mb-3">
                <div class="card">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-8">
                                <h6 class="card-title">${escapeHtml(participation.titre)}</h6>
                                <p class="card-text text-muted mb-1">
                                    <i class="fas fa-calendar"></i> ${formatDateTime(participation.dateDebut)}
                                </p>
                                <p class="card-text text-muted mb-0">
                                    ${statusBadge}
                                </p>
                            </div>
                            <div class="col-md-4 text-end">
                                <a href="/evenement?id=${participation.id}" onclick="route(event)" class="btn btn-sm btn-outline-primary">
                                    Voir l'événement
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = participationsHtml;
}

function showLoading(show) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const profileContent = document.getElementById('profileContent');
    
    if (show) {
        if (loadingIndicator) loadingIndicator.classList.remove('d-none');
        if (profileContent) profileContent.classList.add('d-none');
    } else {
        if (loadingIndicator) loadingIndicator.classList.add('d-none');
    }
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    if (loadingIndicator) loadingIndicator.classList.add('d-none');
    if (errorText) errorText.textContent = message;
    if (errorMessage) errorMessage.classList.remove('d-none');
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

// Fonctions pour la gestion des rôles
async function initializeRoleSelect(user) {
    const roleManagementSection = document.querySelector('.role-management');
    
    // Vérifier si l'utilisateur connecté est admin
    const isAdmin = await checkIfCurrentUserIsAdmin();
    
    if (!isAdmin) {
        // Masquer complètement la section si l'utilisateur n'est pas admin
        if (roleManagementSection) {
            roleManagementSection.style.display = 'none';
        }
        return;
    }
    
    // Afficher la section pour les admins
    if (roleManagementSection) {
        roleManagementSection.style.display = 'block';
    }
    
    const currentRoleElement = document.getElementById('currentRole');
    const roleSelectElement = document.getElementById('roleSelect');
    
    if (currentRoleElement && user.roles) {
        // Afficher le rôle actuel
        const roleDisplayName = getRoleDisplayName(user.roles);
        currentRoleElement.textContent = roleDisplayName;
    }
    
    if (roleSelectElement && user.roles) {
        // Sélectionner le rôle actuel dans le select
        const currentRole = getCurrentRole(user.roles);
        roleSelectElement.value = currentRole;
    }
}

// Vérifier si l'utilisateur connecté est administrateur
async function checkIfCurrentUserIsAdmin() {
    const token = getToken();
    if (!token) {
        return false; // Pas connecté
    }
    
    try {
        const response = await fetch('/api/users/me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-AUTH-TOKEN': token
            }
        });
        
        if (!response.ok) {
            return false; // Erreur ou non authentifié
        }
        
        const userData = await response.json();
        return userData.roles && userData.roles.includes('ROLE_ADMIN');
        
    } catch (error) {
        console.error('Erreur lors de la vérification des droits admin:', error);
        return false;
    }
}

function getCurrentRole(roles) {
    if (roles.includes('ROLE_ADMIN')) return 'ROLE_ADMIN';
    if (roles.includes('ROLE_ORGANISATEUR')) return 'ROLE_ORGANISATEUR';
    return 'ROLE_USER';
}

function getRoleDisplayName(roles) {
    if (roles.includes('ROLE_ADMIN')) return 'Administrateur';
    if (roles.includes('ROLE_ORGANISATEUR')) return 'Organisateur';
    return 'Utilisateur';
}

async function updateUserRole() {
    const roleSelectElement = document.getElementById('roleSelect');
    const updateBtn = document.getElementById('updateRoleBtn');
    
    if (!roleSelectElement) return;
    
    // Vérifier que l'utilisateur connecté est admin avant de procéder
    const isAdmin = await checkIfCurrentUserIsAdmin();
    if (!isAdmin) {
        showRoleUpdateMessage('Erreur: Seuls les administrateurs peuvent modifier les rôles', 'danger');
        return;
    }
    
    const newRole = roleSelectElement.value;
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');
    
    if (!userId) {
        showRoleUpdateMessage('Erreur: ID utilisateur non trouvé', 'danger');
        return;
    }
    
    // Récupérer le token depuis les cookies (fonction du main.js)
    const token = getToken();
    if (!token) {
        showRoleUpdateMessage('Erreur: Vous devez être connecté pour effectuer cette action', 'danger');
        return;
    }
    
    try {
        // Désactiver le bouton pendant la requête
        updateBtn.disabled = true;
        updateBtn.textContent = 'Mise à jour...';
        
        const response = await fetch(`/api/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-AUTH-TOKEN': token
            },
            body: JSON.stringify({
                role: newRole
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erreur lors de la mise à jour du rôle');
        }
        
        // Mettre à jour l'affichage du rôle actuel
        const currentRoleElement = document.getElementById('currentRole');
        if (currentRoleElement) {
            currentRoleElement.textContent = getRoleDisplayName([newRole]);
        }
        
        showRoleUpdateMessage('Rôle mis à jour avec succès', 'success');
        
    } catch (error) {
        console.error('Erreur lors de la mise à jour du rôle:', error);
        showRoleUpdateMessage('Erreur lors de la mise à jour du rôle: ' + error.message, 'danger');
    } finally {
        // Réactiver le bouton
        updateBtn.disabled = false;
        updateBtn.textContent = 'Mettre à jour le rôle';
    }
}

function showRoleUpdateMessage(message, type) {
    const messageElement = document.getElementById('roleUpdateMessage');
    const messageTextElement = document.getElementById('roleUpdateText');
    
    if (messageElement && messageTextElement) {
        messageTextElement.textContent = message;
        messageElement.className = `alert alert-${type}`;
        messageElement.classList.remove('d-none');
        
        // Masquer le message après 5 secondes
        setTimeout(() => {
            messageElement.classList.add('d-none');
        }, 5000);
    }
}

// Rendre la fonction accessible globalement pour le bouton
window.updateUserRole = updateUserRole;

// Export par défaut pour le router
export default initProfil;
