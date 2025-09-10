// Modification du profil utilisateur
function initModifierProfil() {
    // Charger les données actuelles du profil
    loadCurrentProfileData();
    
    // Attacher les événements au formulaire
    attachFormEvents();
}

// Charger les données actuelles du profil
async function loadCurrentProfileData() {
    const token = getToken();
    
    if (!token) {
        navigate("/connexion");
        return;
    }

    try {
        const response = await fetch('/api/users/me', {
            headers: {
                'X-AUTH-TOKEN': token,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors du chargement du profil');
        }

        const userData = await response.json();
        
        // Garder les champs vides pour permettre à l'utilisateur de choisir ce qu'il veut modifier
        const profilNameInput = document.getElementById('profilNameInput');
        const emailInput = document.getElementById('emailInput');
        
        // Optionnel: afficher les valeurs actuelles comme placeholder
        if (profilNameInput) {
            profilNameInput.value = '';
        }
        
        if (emailInput) {
            emailInput.value = '';
        }

    } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        showMessage('Impossible de charger les données du profil', 'error');
    }
}

// Attacher les événements au formulaire
function attachFormEvents() {
    const form = document.querySelector('form');
    
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

// Gérer la soumission du formulaire
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const token = getToken();
    if (!token) {
        navigate("/connexion");
        return;
    }

    // Récupérer les données du formulaire
    const profilName = document.getElementById('profilNameInput')?.value.trim();
    const email = document.getElementById('emailInput')?.value.trim();
    const password = document.getElementById('PasswordInput')?.value;
    const passwordConfirm = document.getElementById('ValidatePasswordInput')?.value;

    // Validation côté client
    if (profilName && profilName.length < 3) {
        showMessage('Le nom d\'utilisateur doit contenir au moins 3 caractères', 'error');
        return;
    }

    if (email && !isValidEmail(email)) {
        showMessage('Veuillez entrer une adresse email valide', 'error');
        return;
    }

    if (password && password !== passwordConfirm) {
        showMessage('Les mots de passe ne correspondent pas', 'error');
        return;
    }

    if (password && password.length < 6) {
        showMessage('Le mot de passe doit contenir au moins 6 caractères', 'error');
        return;
    }

    // Vérifier qu'au moins un champ est renseigné pour modification
    if (!profilName && !email && !password) {
        showMessage('Veuillez renseigner au moins un champ à modifier', 'warning');
        return;
    }

    // Préparer les données à envoyer
    const updateData = {};
    
    // Ajouter seulement les champs modifiés
    if (profilName && profilName.trim()) {
        updateData.username = profilName.trim();
    }
    if (email && email.trim()) {
        updateData.mail = email.trim();
    }
    // Ajouter le mot de passe seulement s'il a été renseigné
    if (password) {
        updateData.password = password;
    }

    // Vérifier qu'au moins un champ est modifié
    if (Object.keys(updateData).length === 0) {
        showMessage('Aucune modification détectée', 'warning');
        return;
    }

    try {
        showMessage('Modification en cours...', 'info');
        
        // Désactiver le bouton de soumission
        const submitButton = event.target.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Mise à jour...';
        }

        const response = await fetch('/api/users/update', {
            method: 'PUT',
            headers: {
                'X-AUTH-TOKEN': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors de la mise à jour');
        }
        
        const result = await response.json();
        showMessage('Profil modifié avec succès !', 'success');
        
        // Vider les champs de mot de passe pour sécurité
        const passwordInput = document.getElementById('PasswordInput');
        const passwordConfirmInput = document.getElementById('ValidatePasswordInput');
        if (passwordInput) passwordInput.value = '';
        if (passwordConfirmInput) passwordConfirmInput.value = '';

        // Rediriger vers le profil après 2 secondes
        setTimeout(() => {
            navigate("/monProfil");
        }, 2000);

    } catch (error) {
        console.error('Erreur lors de la modification:', error);
        showMessage('Erreur lors de la modification du profil: ' + error.message, 'error');
    } finally {
        // Réactiver le bouton de soumission
        const submitButton = event.target.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Valider les modifications';
        }
    }
}

// Afficher un message à l'utilisateur
function showMessage(message, type = 'info') {
    // Chercher un conteneur existant ou en créer un
    let messageContainer = document.getElementById('messageContainer');
    
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'messageContainer';
        messageContainer.className = 'mb-3 w-50 mx-auto';
        
        // Insérer avant le formulaire
        const form = document.querySelector('form');
        if (form && form.parentNode) {
            form.parentNode.insertBefore(messageContainer, form);
        }
    }

    // Déterminer la classe CSS selon le type
    let alertClass = 'alert ';
    switch (type) {
        case 'success':
            alertClass += 'alert-success';
            break;
        case 'error':
            alertClass += 'alert-danger';
            break;
        case 'info':
        default:
            alertClass += 'alert-info';
            break;
    }

    messageContainer.innerHTML = `
        <div class="${alertClass} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;

    // Auto-masquer après 5 secondes pour les messages de succès et info
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            const alert = messageContainer.querySelector('.alert');
            if (alert) {
                alert.classList.remove('show');
                setTimeout(() => {
                    messageContainer.innerHTML = '';
                }, 300);
            }
        }, 5000);
    }
}

// Validation de l'email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Export par défaut pour le router
export default initModifierProfil;
