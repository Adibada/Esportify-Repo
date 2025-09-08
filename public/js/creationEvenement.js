// creationEvenement.js
// Initialisation de la page
function initPage() {
    
    // Vérification que l'utilisateur a les droits
    if (!isConnected()) {
        alert('Vous devez être connecté pour créer un événement.');
        window.navigate('/connexion');
        return;
    }
    
    const role = getRole();
    
    if (!role || (role !== 'ROLE_ORGANISATEUR' && role !== 'ROLE_ADMIN')) {
        alert('Vous n\'avez pas les droits pour créer un événement.');
        window.navigate('/');
        return;
    }
    
    // Attendre que le DOM soit complètement rendu
    setTimeout(() => {
        setupFormHandlers();
    }, 100);
}

// Configuration des gestionnaires d'événements du formulaire
function setupFormHandlers() {
    
    // Gestionnaire pour le bouton de validation (ouverture modal)
    const validateBtn = document.querySelector('[data-bs-target="#confirmationModal"]');
    if (validateBtn) {
        validateBtn.addEventListener('click', validateForm);
    }
    
    // Gestionnaire pour le bouton de sauvegarde dans le modal
    const saveBtn = document.querySelector('.modal-footer .btn-primary');
    if (saveBtn) {
        saveBtn.addEventListener('click', createEvent);
    }
    
    // Gestionnaires pour les options d'image
    setupImageTypeHandlers();
}

// Configuration des gestionnaires pour le choix du type d'image
function setupImageTypeHandlers() {
    
    const imageTypeFile = document.getElementById('imageTypeFile');
    const imageTypeUrl = document.getElementById('imageTypeUrl');
    const imageFileContainer = document.getElementById('imageFileContainer');
    const imageUrlContainer = document.getElementById('imageUrlContainer');
    
    
    if (imageTypeFile && imageTypeUrl && imageFileContainer && imageUrlContainer) {
        
        imageTypeFile.addEventListener('change', () => {
            if (imageTypeFile.checked) {
                imageFileContainer.style.display = 'block';
                imageUrlContainer.style.display = 'none';
                // Vider l'URL si on switch vers fichier
                document.getElementById('imageUrl').value = '';
            }
        });
        
        imageTypeUrl.addEventListener('change', () => {
            if (imageTypeUrl.checked) {
                imageFileContainer.style.display = 'none';
                imageUrlContainer.style.display = 'block';
                // Vider le fichier si on switch vers URL
                document.getElementById('imageFile').value = '';
            }
        });
        
        // État initial - afficher le conteneur d'URL par défaut
        imageUrlContainer.style.display = 'block';
        imageFileContainer.style.display = 'none';
    }
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
    const token = getToken();
    
    const formData = new FormData();
    
    // Données de base de l'événement
    const eventName = document.getElementById('eventName').value;
    const eventDetail = document.getElementById('eventDetail').value;
    const dateStart = document.getElementById('setDateStart').value;
    const dateEnd = document.getElementById('setDateEnd').value;
    
    formData.append('name', eventName);
    formData.append('detail', eventDetail);
    formData.append('dateStart', dateStart);
    formData.append('dateEnd', dateEnd);
    
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
            'X-AUTH-TOKEN': token
        },
        body: formData
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            // Récupérer le message d'erreur détaillé
            return response.text().then(text => {
                throw new Error(`Erreur ${response.status}: ${text}`);
            });
        }
    })
    .then(data => {
        // Fermer le modal avant la redirection
        const modal = document.getElementById('confirmationModal');
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
        }
        
        // Nettoyer les classes Bootstrap qui bloquent le scroll
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Supprimer le backdrop s'il existe
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        
        alert('Événement créé avec succès !');
        
        // Redirection vers la page de l'événement
        if (data.id) {
            window.navigate(`/evenement?id=${data.id}`);
        } else {
            window.navigate('/rechercheEvenements');
        }
    })
    .catch(error => {
        // Fermer le modal en cas d'erreur aussi
        const modal = document.getElementById('confirmationModal');
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) {
                bsModal.hide();
            }
        }
        
        // Nettoyer les classes Bootstrap qui bloquent le scroll
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Supprimer le backdrop s'il existe
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        
        alert('Erreur lors de la creation de l\'evenement. Veuillez ressayer.');
    });
}

// Export par défaut pour le router
export default initPage;
