// creationEvenement.js
console.log('Creation événement JS chargé - Version ' + Date.now());

// Initialisation de la page
function initPage() {
    console.log('Initialisation page création événement - DEBUT');
    
    // Vérification que l'utilisateur a les droits
    if (!isConnected()) {
        alert('Vous devez être connecté pour créer un événement.');
        window.navigate('/connexion');
        return;
    }
    
    const role = getRole();
    console.log('Debug - Rôle récupéré:', role);
    console.log('Debug - Cookie role brut:', getCookie('role'));
    
    if (!role || (role !== 'ROLE_ORGANISATEUR' && role !== 'ROLE_ADMIN')) {
        alert('Vous n\'avez pas les droits pour créer un événement.');
        window.navigate('/');
        return;
    }
    
    console.log('Appel setupFormHandlers...');
    // Attendre que le DOM soit complètement rendu
    setTimeout(() => {
        setupFormHandlers();
    }, 100);
    console.log('initPage terminé avec succès');
}

// Configuration des gestionnaires d'événements du formulaire
function setupFormHandlers() {
    console.log('setupFormHandlers - DEBUT');
    
    // Gestionnaire pour le bouton de validation (ouverture modal)
    const validateBtn = document.querySelector('[data-bs-target="#confirmationModal"]');
    console.log('Bouton validation trouvé:', validateBtn);
    if (validateBtn) {
        validateBtn.addEventListener('click', validateForm);
    }
    
    // Gestionnaire pour le bouton de sauvegarde dans le modal
    const saveBtn = document.querySelector('.modal-footer .btn-primary');
    console.log('Bouton sauvegarde trouvé:', saveBtn);
    if (saveBtn) {
        saveBtn.addEventListener('click', createEvent);
    }
    
    // Gestionnaires pour les options d'image
    console.log('Appel setupImageTypeHandlers...');
    setupImageTypeHandlers();
    console.log('setupFormHandlers terminé');
}

// Configuration des gestionnaires pour le choix du type d'image
function setupImageTypeHandlers() {
    console.log('setupImageTypeHandlers - DEBUT');
    console.log('Contenu du main-page:', document.getElementById('main-page'));
    console.log('Tous les éléments avec des IDs:', document.querySelectorAll('[id]'));
    
    const imageTypeFile = document.getElementById('imageTypeFile');
    const imageTypeUrl = document.getElementById('imageTypeUrl');
    const imageFileContainer = document.getElementById('imageFileContainer');
    const imageUrlContainer = document.getElementById('imageUrlContainer');
    
    console.log('Elements trouvés:');
    console.log('- imageTypeFile:', imageTypeFile);
    console.log('- imageTypeUrl:', imageTypeUrl);
    console.log('- imageFileContainer:', imageFileContainer);
    console.log('- imageUrlContainer:', imageUrlContainer);
    
    if (imageTypeFile && imageTypeUrl && imageFileContainer && imageUrlContainer) {
        console.log('Tous les éléments trouvés, ajout des listeners...');
        
        imageTypeFile.addEventListener('change', () => {
            console.log('Radio File sélectionné');
            if (imageTypeFile.checked) {
                imageFileContainer.style.display = 'block';
                imageUrlContainer.style.display = 'none';
                // Vider l'URL si on switch vers fichier
                document.getElementById('imageUrl').value = '';
                console.log('Interface fichier activée');
            }
        });
        
        imageTypeUrl.addEventListener('change', () => {
            console.log('Radio URL sélectionné');
            if (imageTypeUrl.checked) {
                imageFileContainer.style.display = 'none';
                imageUrlContainer.style.display = 'block';
                // Vider le fichier si on switch vers URL
                document.getElementById('imageFile').value = '';
                console.log('Interface URL activée');
            }
        });
        
        console.log('Listeners ajoutés avec succès');
    } else {
        console.error('Erreur: certains éléments sont manquants!');
    }
    
    console.log('setupImageTypeHandlers terminé');
}

// Validation du formulaire avant ouverture du modal
function validateForm() {
    const requiredFields = [
        { id: 'eventName', label: 'Nom de l\'événement' },
        { id: 'eventDetail', label: 'Détails de l\'événement' },
        { id: 'setDateStart', label: 'Date de début' },
        { id: 'setDateEnd', label: 'Date de fin' }
    ];
    
    const missingFields = [];
    
    // Validation des champs texte
    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (!element || !element.value.trim()) {
            missingFields.push(field.label);
        }
    });
    
    // Validation de l'image
    const imageTypeFile = document.getElementById('imageTypeFile');
    const imageTypeUrl = document.getElementById('imageTypeUrl');
    
    if (imageTypeFile && imageTypeFile.checked) {
        // Mode fichier
        const imageFile = document.getElementById('imageFile');
        if (!imageFile || !imageFile.files || imageFile.files.length === 0) {
            missingFields.push('Image de l\'événement (fichier)');
        }
    } else if (imageTypeUrl && imageTypeUrl.checked) {
        // Mode URL
        const imageUrl = document.getElementById('imageUrl');
        if (!imageUrl || !imageUrl.value.trim()) {
            missingFields.push('URL de l\'image de l\'événement');
        } else {
            // Validation basique de l'URL
            try {
                new URL(imageUrl.value.trim());
            } catch (e) {
                missingFields.push('URL d\'image valide');
            }
        }
    } else {
        missingFields.push('Image de l\'événement');
    }
    
    // Validation des dates
    const startDate = document.getElementById('setDateStart')?.value;
    const endDate = document.getElementById('setDateEnd')?.value;
    
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const now = new Date();
        
        if (start < now) {
            missingFields.push('La date de début doit être dans le futur');
        }
        
        if (end <= start) {
            missingFields.push('La date de fin doit être après la date de début');
        }
    }
    
    if (missingFields.length > 0) {
        showMissingFieldsModal(missingFields);
        return false;
    }
    
    return true;
}

// Affichage du modal des champs manquants
function showMissingFieldsModal(missingFields) {
    const listContainer = document.getElementById('missingFieldsList');
    if (listContainer) {
        listContainer.innerHTML = missingFields
            .map(field => `<li class="list-group-item">${field}</li>`)
            .join('');
        
        // Ouvrir le modal des champs manquants au lieu du modal de confirmation
        const uncompleteModal = new bootstrap.Modal(document.getElementById('uncompleteModal'));
        uncompleteModal.show();
    }
}

// Fonction pour créer l'événement
function createEvent() {
    const token = getCookie('auth_token');
    const formData = new FormData();
    
    // Données de base de l'événement
    formData.append('name', document.getElementById('eventName').value);
    formData.append('detail', document.getElementById('eventDetail').value);
    formData.append('dateStart', document.getElementById('setDateStart').value);
    formData.append('dateEnd', document.getElementById('setDateEnd').value);
    
    // Gestion de l'image selon le type sélectionné
    const imageTypeFile = document.getElementById('imageTypeFile');
    
    if (imageTypeFile && imageTypeFile.checked) {
        // Mode fichier
        const imageFile = document.getElementById('imageFile').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }
    } else {
        // Mode URL
        const imageUrl = document.getElementById('imageUrl').value.trim();
        if (imageUrl) {
            formData.append('imageUrl', imageUrl);
        }
    }
    
    fetch('/api/evenements', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Erreur lors de la creation de l\'evenement');
        }
    })
    .then(data => {
        console.log('Evenement cree avec succes:', data);
        // Redirection vers la page de l'événement
        if (data.id) {
            navigateTo(`/evenement/${data.id}`);
        } else {
            navigateTo('/rechercheEvenements');
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        alert('Erreur lors de la creation de l\'evenement. Veuillez ressayer.');
    });
}

// Fonctions utilitaires (si elles ne sont pas déjà disponibles globalement)
function getToken() {
    return getCookie('accesstoken');
}

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

function isConnected() {
    return !!getToken()?.trim();
}

function getRole() {
    return getCookie('role');
}

// Export par défaut pour le router
export default initPage;
