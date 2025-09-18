// creationEvenement.js
// === UTILITAIRES ===
const tokenCookieName = "accesstoken";
const getCookie = (name) => {
    const nameEQ = name + "=";
    return document.cookie.split(';')
        .map(c => c.trim())
        .find(c => c.indexOf(nameEQ) === 0)
        ?.substring(nameEQ.length) || null;
};

const getToken = () => getCookie(tokenCookieName);
const isConnected = () => getToken() !== null;
const getUserId = () => getCookie('userId') ? parseInt(getCookie('userId')) : null;
const getRole = () => getCookie('role');

// === VARIABLES GLOBALES ===
let uploadedImages = []; // Stockage des images uploadées avec leurs métadonnées
let imageIdCounter = 0; // Compteur pour les IDs uniques des images

// Fonctions d'accessibilité pour générer les labels dynamiques
function generateImageAlt(file) {
    if (file && file.name) {
        // Nettoyer le nom de fichier pour créer un alt text descriptif
        const cleanName = file.name
            .replace(/\.[^/.]+$/, '') // Supprimer l'extension
            .replace(/[-_]/g, ' ')     // Remplacer tirets et underscores par espaces
            .replace(/\b\w/g, l => l.toUpperCase()); // Mettre en forme de titre
        return `Aperçu: ${cleanName}`;
    }
    return 'Aperçu de l\'image';
}

function generateImageTitle(file) {
    if (file && file.name) {
        return `Fichier original: ${file.name}`;
    }
    return 'Aperçu de l\'image à uploader';
}

// === GESTION DES MESSAGES ===
const showMessage = (message, type = 'info') => {
    // Créer ou obtenir le conteneur de messages
    let messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'messageContainer';
        messageContainer.className = 'alert d-none';
        messageContainer.setAttribute('role', 'alert');
        
        // Insérer après le titre
        const title = document.querySelector('h2');
        if (title) {
            title.after(messageContainer);
        } else {
            // Fallback : insérer en haut du container
            const container = document.querySelector('.container');
            if (container) {
                container.prepend(messageContainer);
            }
        }
    }
    
    const alertTypes = {
        success: 'alert-success',
        error: 'alert-danger',
        warning: 'alert-warning',
        info: 'alert-info'
    };
    
    messageContainer.className = `alert ${alertTypes[type]} d-block`;
    messageContainer.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
        ${message}
    `;
    
    // Faire défiler vers le message
    messageContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Auto-hide pour les messages de succès
    if (type === 'success') {
        setTimeout(() => {
            messageContainer.classList.add('d-none');
        }, 5000);
    }
};

const hideMessage = () => {
    const messageContainer = document.getElementById('messageContainer');
    if (messageContainer) {
        messageContainer.classList.add('d-none');
    }
};

// === GESTION DE L'IMAGE ===
const toggleImageInput = () => {
    const imageType = document.querySelector('input[name="imageType"]:checked').value;
    const fileInput = document.getElementById('fileImageInput');
    const urlInput = document.getElementById('urlImageInput');
    
    if (imageType === 'file') {
        fileInput.style.display = 'block';
        urlInput.style.display = 'none';
        // Reset URL input
        document.getElementById('eventImageUrl').value = '';
    } else {
        fileInput.style.display = 'none';
        urlInput.style.display = 'block';
        // Reset file input
        document.getElementById('eventImageFile').value = '';
    }
};

// Rendre la fonction accessible globalement
window.toggleImageInput = toggleImageInput;

// === GESTION AVANCÉE DES IMAGES ===
const showImageManagementArea = () => {
    const imagesList = document.getElementById('imagesList');
    if (imagesList) imagesList.style.display = 'block';
};

const hideImageManagementArea = () => {
    if (uploadedImages.length === 0) {
        const imagesList = document.getElementById('imagesList');
        if (imagesList) imagesList.style.display = 'none';
    }
};

const updateImagesDisplay = () => {
    const imagesList = document.getElementById('imagesList');
    
    if (!imagesList) {
        console.warn('Element imagesList non trouvé');
        return;
    }
    
    if (uploadedImages.length === 0) {
        imagesList.innerHTML = '';
        return;
    }
    
    imagesList.innerHTML = uploadedImages.map((img, index) => `
        <div class="col-md-6 col-lg-4" data-image-id="${img.id}">
            <div class="card h-100">
                <div class="position-relative">
                    <img src="${img.url}" alt="${img.description || 'Image événement'}" 
                         class="card-img-top" style="height: 200px; object-fit: cover;">
                    <button type="button" class="btn btn-danger btn-sm position-absolute top-0 end-0 m-2" 
                            onclick="removeImage(${img.id})" title="Supprimer cette image">
                        <i class="fas fa-times"></i>
                    </button>
                    ${index === 0 ? '<div class="badge bg-primary position-absolute bottom-0 start-0 m-2">Image principale</div>' : ''}
                </div>
                <div class="card-body">
                    <div class="mb-2">
                        <label class="form-label text-sm">Description (alt text) :</label>
                        <input type="text" class="form-control form-control-sm" 
                               value="${img.description || ''}" 
                               onchange="updateImageDescription(${img.id}, this.value)"
                               placeholder="Décrivez cette image...">
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            ${img.isUrl ? 'URL' : 'Fichier'} • ${img.size || 'Taille inconnue'}
                        </small>
                        <div class="btn-group" role="group">
                            ${index > 0 ? `<button type="button" class="btn btn-outline-primary btn-sm" 
                                         onclick="moveImageUp(${img.id})" title="Monter">
                                <i class="fas fa-arrow-up"></i>
                            </button>` : ''}
                            ${index < uploadedImages.length - 1 ? `<button type="button" class="btn btn-outline-primary btn-sm" 
                                         onclick="moveImageDown(${img.id})" title="Descendre">
                                <i class="fas fa-arrow-down"></i>
                            </button>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
};

const handleFileSelection = async (input) => {
    const files = Array.from(input.files);
    if (files.length === 0) return;
    
    showMessage(`Upload de ${files.length} image(s) en cours...`, 'info');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const file of files) {
        try {
            await uploadImageFile(file);
            successCount++;
        } catch (error) {
            errorCount++;
            console.error('Erreur upload fichier:', error);
        }
    }
    
    // Réinitialiser l'input
    input.value = '';
    
    if (successCount > 0) {
        showMessage(`${successCount} image(s) ajoutée(s) avec succès${errorCount > 0 ? `, ${errorCount} échec(s)` : ''}`, errorCount > 0 ? 'warning' : 'success');
    } else if (errorCount > 0) {
        showMessage(`Échec de l'upload de toutes les images`, 'error');
    }
    
    setTimeout(hideMessage, 3000);
};

const uploadImageFile = async (file) => {
    try {
        // Validation du fichier
        if (file.size > 5 * 1024 * 1024) { // 5MB
            throw new Error(`Le fichier ${file.name} est trop volumineux (max 5MB)`);
        }
        
        if (!file.type.startsWith('image/')) {
            throw new Error(`Le fichier ${file.name} n'est pas une image`);
        }
        
        // Ajouter à la liste locale pour la prévisualisation
        const imageData = {
            id: imageIdCounter++,
            url: URL.createObjectURL(file), // URL temporaire pour l'affichage
            description: '',
            isUrl: false,
            originalName: file.name,
            size: formatFileSize(file.size),
            file: file, // Stocker le fichier pour l'upload final
            isNewFile: true // Marquer comme nouveau fichier à uploader
        };
        
        uploadedImages.push(imageData);
        updateImagesDisplay();
        
            } catch (error) {
            console.error('Erreur lors du traitement du fichier:', error);
            throw error;
        }
};

const addImageFromUrl = async () => {
    const urlInput = document.getElementById('eventImageUrl');
    if (!urlInput) return;
    
    const imageUrl = urlInput.value.trim();
    
    if (!imageUrl) {
        showMessage('Veuillez entrer une URL d\'image', 'warning');
        return;
    }
    
    if (!isValidImageUrl(imageUrl)) {
        showMessage('URL d\'image non valide', 'error');
        return;
    }
    
    try {
        showMessage('Ajout de l\'image par URL...', 'info');
        
        // Ajouter à la liste locale
        const imageData = {
            id: imageIdCounter++,
            url: imageUrl,
            description: '',
            isUrl: true,
            size: 'URL externe',
            isNewUrl: true // Marquer comme nouvelle URL à sauvegarder
        };
        
        uploadedImages.push(imageData);
        updateImagesDisplay();
        
        urlInput.value = '';
        hideMessage();
        
    } catch (error) {
        showMessage(`Erreur : ${error.message}`, 'error');
    }
};

const removeImage = async (imageId) => {
    const imageIndex = uploadedImages.findIndex(img => img.id === imageId);
    if (imageIndex === -1) return;
    
    if (!confirm(`Supprimer cette image définitivement ?`)) {
        return;
    }
    
    try {
        // Supprimer de l'affichage local
        uploadedImages.splice(imageIndex, 1);
        updateImagesDisplay();
        
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showMessage('Erreur lors de la suppression de l\'image', 'error');
    }
};

const updateImageDescription = async (imageId, description) => {
    const image = uploadedImages.find(img => img.id === imageId);
    if (!image) return;
    
    // Mettre à jour la description localement
    image.description = description;
};

const moveImageUp = (imageId) => {
    const index = uploadedImages.findIndex(img => img.id === imageId);
    if (index <= 0) return;
    
    [uploadedImages[index], uploadedImages[index - 1]] = [uploadedImages[index - 1], uploadedImages[index]];
    updateImagesDisplay();
};

const moveImageDown = (imageId) => {
    const index = uploadedImages.findIndex(img => img.id === imageId);
    if (index >= uploadedImages.length - 1) return;
    
    [uploadedImages[index], uploadedImages[index + 1]] = [uploadedImages[index + 1], uploadedImages[index]];
    updateImagesDisplay();
};

// Fonctions utilitaires
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const isValidImageUrl = (url) => {
    try {
        const urlObj = new URL(url);
        return ['http:', 'https:'].includes(urlObj.protocol) && 
               /\.(jpg|jpeg|png|gif|webp)$/i.test(urlObj.pathname);
    } catch {
        return false;
    }
};

// Rendre les fonctions accessibles globalement
window.handleFileSelection = handleFileSelection;
window.addImageFromUrl = addImageFromUrl;
window.removeImage = removeImage;
window.updateImageDescription = updateImageDescription;
window.moveImageUp = moveImageUp;
window.moveImageDown = moveImageDown;

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
        validateBtn.onclick = (e) => {
            e.preventDefault();
            if (validateForm()) {
                // Le modal s'ouvre automatiquement grâce à data-bs-target
            }
        };
    }
    
    // Gestionnaire pour le bouton de confirmation dans la modal
    const confirmCreateBtn = document.getElementById('confirmCreateBtn');
    if (confirmCreateBtn) {
        confirmCreateBtn.addEventListener('click', () => {
            console.log('Bouton de confirmation cliqué');
            createEvent();
        });
    } else {
        console.error('Bouton confirmCreateBtn non trouvé');
    }
    
    // Gestionnaire pour la sélection d'images (nouvelle méthode avancée)
    const imageFileInput = document.getElementById('eventImageFile');
    if (imageFileInput) {
        imageFileInput.addEventListener('change', (e) => handleFileSelection(e.target));
    }
    
    // Gestionnaire pour ajouter une URL d'image
    const addUrlBtn = document.getElementById('addImageUrlBtn');
    if (addUrlBtn) {
        addUrlBtn.addEventListener('click', addImageFromUrl);
    }
    
    // Gestionnaire pour ajouter URL avec Enter
    const imageUrlInput = document.getElementById('eventImageUrl');
    if (imageUrlInput) {
        imageUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addImageFromUrl();
            }
        });
    }
    
    // Configurer les gestionnaires de type d'image
    setupImageTypeHandlers();
}

// Configuration des gestionnaires pour le choix du type d'image
function setupImageTypeHandlers() {
    
    const imageTypeFile = document.getElementById('imageTypeFile');
    const imageTypeUrl = document.getElementById('imageTypeUrl');
    const imageFileContainer = document.getElementById('fileImageInput');
    const imageUrlContainer = document.getElementById('urlImageInput');
    
    
    if (imageTypeFile && imageTypeUrl && imageFileContainer && imageUrlContainer) {
        
        imageTypeFile.addEventListener('change', () => {
            if (imageTypeFile.checked) {
                imageFileContainer.style.display = 'block';
                imageUrlContainer.style.display = 'none';
                // Vider les URLs si on switch vers fichier
                // Note: les images uploadées restent dans uploadedImages jusqu'à suppression manuelle
                const imageUrlInput = document.getElementById('eventImageUrl');
                if (imageUrlInput) imageUrlInput.value = '';
            }
        });
        
        imageTypeUrl.addEventListener('change', () => {
            if (imageTypeUrl.checked) {
                imageFileContainer.style.display = 'none';
                imageUrlContainer.style.display = 'block';
                // Note: les images uploadées restent dans uploadedImages jusqu'à suppression manuelle
            }
        });
        
        // Gérer la sélection multiple de fichiers
        const imageFileInput = document.getElementById('eventImageFile');
        if (imageFileInput) {
            // Permettre la sélection multiple
            imageFileInput.setAttribute('multiple', 'multiple');
            imageFileInput.setAttribute('accept', 'image/*');
        }
        
        // État initial - fichier est sélectionné par défaut dans le HTML
        if (imageTypeFile.checked) {
            imageFileContainer.style.display = 'block';
            imageUrlContainer.style.display = 'none';
        } else if (imageTypeUrl.checked) {
            imageFileContainer.style.display = 'none';
            imageUrlContainer.style.display = 'block';
        }
    }
}

// === VALIDATION DU FORMULAIRE ===

// Créer ou obtenir le conteneur de prévisualisations
function getOrCreatePreviewContainer() {
    let container = document.getElementById('imagePreviewContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'imagePreviewContainer';
        container.style.cssText = 'margin-top: 10px; display: flex; flex-wrap: wrap; gap: 10px;';
        
        const fileContainer = document.getElementById('imageFileContainer');
        if (fileContainer) {
            fileContainer.appendChild(container);
        }
    }
    return container;
}

// Créer la prévisualisation d'une image
function createImagePreview(file, index, container) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const previewDiv = document.createElement('div');
        previewDiv.className = 'image-preview';
        previewDiv.style.cssText = 'position: relative; width: 100px; height: 100px; border: 2px solid #ddd; border-radius: 8px; overflow: hidden;';
        previewDiv.setAttribute('data-index', index);
        
        const img = document.createElement('img');
        img.src = e.target.result;
        img.alt = generateImageAlt(file);
        img.title = generateImageTitle(file);
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
        
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s;';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '×';
        deleteBtn.style.cssText = 'background: red; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 18px;';
        deleteBtn.onclick = () => removeImagePreview(index);
        
        overlay.appendChild(deleteBtn);
        
        previewDiv.appendChild(img);
        previewDiv.appendChild(overlay);
        
        previewDiv.onmouseenter = () => overlay.style.opacity = '1';
        previewDiv.onmouseleave = () => overlay.style.opacity = '0';
        
        container.appendChild(previewDiv);
        
        // Ajouter un indicateur pour la première image (considérée comme principale)
        if (index === 0) {
            const mainIndicator = document.createElement('div');
            mainIndicator.style.cssText = 'position: absolute; top: 2px; left: 2px; background: gold; color: black; padding: 2px 6px; border-radius: 4px; font-size: 10px; z-index: 15;';
            mainIndicator.textContent = '★ Principale';
            previewDiv.appendChild(mainIndicator);
        }
    };
    
    reader.readAsDataURL(file);
}

// Supprimer une prévisualisation
function removeImagePreview(index) {
    const preview = document.querySelector(`[data-index="${index}"]`);
    if (preview) {
        preview.remove();
    }
    
    // Mettre à jour l'input file
    const fileInput = document.getElementById('imageFile');
    if (fileInput && fileInput.files) {
        const dt = new DataTransfer();
        Array.from(fileInput.files).forEach((file, i) => {
            if (i !== index) {
                dt.items.add(file);
            }
        });
        fileInput.files = dt.files;
    }
}

// Nettoyer les prévisualisations
function clearImagePreviews() {
    const container = document.getElementById('imagePreviewContainer');
    if (container) {
        container.remove();
    }
}

// Ajouter les boutons de gestion
function addImageManagementButtons(container) {
    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.cssText = 'width: 100%; margin-top: 10px; text-align: center; color: #666; font-size: 12px;';
    buttonsDiv.innerHTML = '<p>Cliquez sur × pour supprimer une image. La première image sera l\'image principale.</p>';
    container.appendChild(buttonsDiv);
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
    if (uploadedImages.length === 0) {
        missingFields.push('Au moins une image de l\'événement');
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
    console.log('createEvent() appelée');
    const token = getToken();
    
    if (!token) {
        alert('Vous devez être connecté pour créer un événement');
        return;
    }
    
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
    
    // Gestion des images avec la nouvelle structure
    if (uploadedImages && uploadedImages.length > 0) {
        // Séparer les fichiers des URLs
        const imageFiles = uploadedImages.filter(img => !img.isUrl && img.file);
        const imageUrls = uploadedImages.filter(img => img.isUrl);
        
        // Ajouter les fichiers
        imageFiles.forEach((imageObj, index) => {
            formData.append('images[]', imageObj.file);
            formData.append('imageDescriptions[]', imageObj.description || '');
        });
        
        // Ajouter les URLs
        imageUrls.forEach((urlObj, index) => {
            formData.append('imageUrls[]', urlObj.url);
            formData.append('imageDescriptions[]', urlObj.description || '');
        });
        
        // La première image est considérée comme principale
        formData.append('mainImageIndex', '0');
    }

    // Créer d'abord l'événement
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
        // Les images ont déjà été incluses dans le FormData principal
        // Plus besoin d'upload séparé
        return data;
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

// Upload des images pour un événement créé
// Export par défaut pour le router
export default initPage;
