// creationEvenement.js
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
    
    // Gestionnaire pour la sélection multiple d'images
    const imageFileInput = document.getElementById('imageFile');
    if (imageFileInput) {
        imageFileInput.addEventListener('change', handleMultipleImageSelection);
    }
    
    // Gestionnaire pour supprimer toutes les images
    const clearImagesBtn = document.getElementById('clearImagesBtn');
    if (clearImagesBtn) {
        clearImagesBtn.addEventListener('click', clearAllImages);
    }
    
    // Gestionnaires pour les URLs
    const addUrlBtn = document.getElementById('addUrlBtn');
    if (addUrlBtn) {
        addUrlBtn.addEventListener('click', addImageUrl);
    }
    
    const clearUrlsBtn = document.getElementById('clearUrlsBtn');
    if (clearUrlsBtn) {
        clearUrlsBtn.addEventListener('click', clearAllUrls);
    }
    
    // Gestionnaire pour ajouter URL avec Enter
    const imageUrlInput = document.getElementById('imageUrl');
    if (imageUrlInput) {
        imageUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addImageUrl();
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
    const imageFileContainer = document.getElementById('imageFileContainer');
    const imageUrlContainer = document.getElementById('imageUrlContainer');
    
    
    if (imageTypeFile && imageTypeUrl && imageFileContainer && imageUrlContainer) {
        
        imageTypeFile.addEventListener('change', () => {
            if (imageTypeFile.checked) {
                imageFileContainer.style.display = 'block';
                imageUrlContainer.style.display = 'none';
                // Vider les URLs si on switch vers fichier
                clearAllUrls();
                document.getElementById('imageUrl').value = '';
            }
        });
        
        imageTypeUrl.addEventListener('change', () => {
            if (imageTypeUrl.checked) {
                imageFileContainer.style.display = 'none';
                imageUrlContainer.style.display = 'block';
                // Vider les fichiers si on switch vers URL
                clearAllImages();
            }
        });
        
        // Gérer la sélection multiple de fichiers
        const imageFileInput = document.getElementById('imageFile');
        if (imageFileInput) {
            // La gestion est déjà configurée dans setupFormHandlers
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
    const imageTypeFile = document.getElementById('imageTypeFile');
    const imageTypeUrl = document.getElementById('imageTypeUrl');
    
    if (imageTypeFile && imageTypeFile.checked) {
        // Mode fichier - vérifier qu'au moins une image est sélectionnée
        if (!selectedImages || selectedImages.length === 0) {
            missingFields.push('Au moins une image de l\'événement');
        }
    } else if (imageTypeUrl && imageTypeUrl.checked) {
        // Mode URL - vérifier qu'au moins une URL est ajoutée
        if (!selectedUrls || selectedUrls.length === 0) {
            missingFields.push('Au moins une URL d\'image');
        }
    } else {
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
    
    // Gestion des images selon le type sélectionné
    const imageTypeFile = document.getElementById('imageTypeFile');
    
    if (imageTypeFile && imageTypeFile.checked) {
        // Mode fichier - utiliser les images sélectionnées
        if (selectedImages && selectedImages.length > 0) {
            // Ajouter toutes les images sélectionnées avec leurs descriptions
            selectedImages.forEach((imageObj, index) => {
                formData.append('images[]', imageObj.file);
                formData.append('imageDescriptions[]', imageObj.description || '');
            });
            
            // La première image est considérée comme principale
            formData.append('mainImageIndex', '0');
        }
    } else {
        // Mode URL - utiliser les URLs sélectionnées
        if (selectedUrls && selectedUrls.length > 0) {
            // Envoyer les URLs avec leurs descriptions
            selectedUrls.forEach((urlObj, index) => {
                formData.append('imageUrls[]', urlObj.url);
                formData.append('imageDescriptions[]', urlObj.description || '');
            });
            
            // La première URL est considérée comme principale
            formData.append('mainImageIndex', '0');
        }
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
        // Si on a des images en mode fichier, les uploader séparément
        if (imageTypeFile && imageTypeFile.checked && data.id) {
            return uploadEventImages(data.id, token).then(() => data);
        }
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
async function uploadEventImages(eventId, token) {
    const imageFiles = document.getElementById('imageFile').files;
    if (!imageFiles || imageFiles.length === 0) {
        return Promise.resolve();
    }

    const uploadFormData = new FormData();
    
    // Ajouter toutes les images (la première sera considérée comme principale)
    Array.from(imageFiles).forEach((file) => {
        uploadFormData.append('images[]', file);
    });

    try {
        const response = await fetch(`/api/evenements/${eventId}/images`, {
            method: 'POST',
            headers: {
                'X-AUTH-TOKEN': token
            },
            body: uploadFormData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur upload images ${response.status}: ${errorText}`);
        }

        return response.json();
    } catch (error) {
        console.error('Erreur lors de l\'upload des images:', error);
        // Ne pas faire échouer la création d'événement si l'upload d'images échoue
        alert('Événement créé, mais erreur lors de l\'upload des images. Vous pourrez les ajouter plus tard.');
        return Promise.resolve();
    }
}

// === GESTION DES IMAGES MULTIPLES ===
let selectedImages = []; // Structure: [{file, description}]
let selectedUrls = []; // Structure: [{url, description}]
let maxImages = 10; // Limite du nombre d'images

function handleMultipleImageSelection(event) {
    const files = Array.from(event.target.files);
    const validImages = [];
    const errors = [];
    
    // Validation des fichiers
    files.forEach((file, index) => {
        if (selectedImages.length + validImages.length >= maxImages) {
            errors.push(`Limite de ${maxImages} images atteinte`);
            return;
        }
        
        // Vérifier le type
        if (!file.type.startsWith('image/')) {
            errors.push(`${file.name}: Type de fichier non supporté`);
            return;
        }
        
        // Vérifier la taille (5MB)
        if (file.size > 5 * 1024 * 1024) {
            errors.push(`${file.name}: Fichier trop volumineux (max 5MB)`);
            return;
        }
        
        validImages.push({file: file, description: ''});
    });
    
    // Ajouter les images valides
    selectedImages = selectedImages.concat(validImages);
    
    // Afficher les erreurs s'il y en a
    if (errors.length > 0) {
        alert('Certaines images n\'ont pas pu être ajoutées :\n' + errors.join('\n'));
    }
    
    // Mettre à jour l'aperçu
    updateImagePreview();
    
    // Réinitialiser l'input pour permettre la re-sélection
    event.target.value = '';
}

function updateImagePreview() {
    const container = document.getElementById('imagePreviewContainer');
    const grid = document.getElementById('imagePreviewGrid');
    
    if (selectedImages.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    grid.innerHTML = '';
    
    selectedImages.forEach((imageObj, index) => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-12 mb-3'; // Plus large pour inclure le champ description
        
        const card = document.createElement('div');
        card.className = 'card';
        
        // Container pour l'image
        const imageContainer = document.createElement('div');
        imageContainer.className = 'position-relative';
        imageContainer.style.cssText = 'height: 120px;';
        
        // Image preview
        const img = document.createElement('img');
        img.className = 'card-img-top h-100';
        img.style.cssText = 'object-fit: cover; cursor: pointer;';
        img.alt = generateImageAlt(imageObj.file);
        img.title = generateImageTitle(imageObj.file);
        
        // Créer l'aperçu
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target.result;
        };
        reader.readAsDataURL(imageObj.file);
        
        // Bouton de suppression
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn btn-sm btn-danger position-absolute top-0 end-0 m-1';
        removeBtn.style.cssText = 'z-index: 10; opacity: 0.9;';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.onclick = () => removeImage(index);
        
        // Indicateur d'image principale
        const mainIndicator = document.createElement('span');
        mainIndicator.className = 'badge bg-primary position-absolute bottom-0 start-0 m-1';
        mainIndicator.style.cssText = 'font-size: 0.7em; opacity: 0.9;';
        if (index === 0) {
            mainIndicator.textContent = 'Principale';
        } else {
            mainIndicator.textContent = `#${index + 1}`;
        }
        
        imageContainer.appendChild(img);
        imageContainer.appendChild(removeBtn);
        imageContainer.appendChild(mainIndicator);
        
        // Corps de la carte avec le champ description
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body p-2';
        
        const descInput = document.createElement('input');
        descInput.type = 'text';
        descInput.className = 'form-control form-control-sm';
        descInput.placeholder = 'Description de cette image (optionnel)';
        descInput.value = imageObj.description || '';
        descInput.addEventListener('input', (e) => {
            selectedImages[index].description = e.target.value;
        });
        
        const label = document.createElement('label');
        label.className = 'form-label';
        label.innerHTML = '<small class="text-muted">Description :</small>';
        
        cardBody.appendChild(label);
        cardBody.appendChild(descInput);
        
        card.appendChild(imageContainer);
        card.appendChild(cardBody);
        col.appendChild(card);
        grid.appendChild(col);
    });
}

function removeImage(index) {
    selectedImages.splice(index, 1);
    updateImagePreview();
}

function clearAllImages() {
    selectedImages = [];
    updateImagePreview();
    document.getElementById('imageFile').value = '';
}

// === GESTION DES URLs MULTIPLES ===
function addImageUrl() {
    const urlInput = document.getElementById('imageUrl');
    const url = urlInput.value.trim();
    
    if (!url) {
        alert('Veuillez saisir une URL d\'image');
        return;
    }
    
    // Vérifier la limite
    if (selectedUrls.length >= maxImages) {
        alert(`Limite de ${maxImages} images atteinte`);
        return;
    }
    
    // Vérifier si l'URL est déjà ajoutée
    if (selectedUrls.some(urlObj => urlObj.url === url)) {
        alert('Cette URL a déjà été ajoutée');
        return;
    }
    
    // Validation basique de l'URL
    try {
        new URL(url);
    } catch (e) {
        alert('URL invalide');
        return;
    }
    
    // Validation asynchrone de l'image
    validateImageUrl(url).then(isValid => {
        if (isValid) {
            selectedUrls.push({url: url, description: ''});
            updateUrlList();
            urlInput.value = '';
            urlInput.focus();
        } else {
            alert('L\'URL ne pointe pas vers une image valide ou accessible');
        }
    });
}

function validateImageUrl(url) {
    return new Promise((resolve) => {
        const img = new Image();
        
        const timeout = setTimeout(() => {
            resolve(false);
        }, 10000); // 10 secondes de timeout
        
        img.onload = () => {
            clearTimeout(timeout);
            resolve(true);
        };
        
        img.onerror = () => {
            clearTimeout(timeout);
            resolve(false);
        };
        
        img.src = url;
    });
}

function updateUrlList() {
    const container = document.getElementById('urlListContainer');
    const list = document.getElementById('urlList');
    
    if (selectedUrls.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    list.innerHTML = '';
    
    selectedUrls.forEach((urlObj, index) => {
        const item = document.createElement('div');
        item.className = 'list-group-item';
        
        const row = document.createElement('div');
        row.className = 'd-flex align-items-center mb-2';
        
        // Aperçu de l'image
        const imagePreview = document.createElement('img');
        imagePreview.src = urlObj.url;
        imagePreview.className = 'me-3 rounded';
        imagePreview.style.cssText = 'width: 60px; height: 60px; object-fit: cover;';
        imagePreview.alt = `Aperçu image ${index + 1}`;
        
        // Informations sur l'URL
        const content = document.createElement('div');
        content.className = 'flex-grow-1 me-2';
        
        const urlDisplay = document.createElement('div');
        urlDisplay.className = 'fw-bold text-truncate';
        urlDisplay.style.cssText = 'max-width: 300px;';
        urlDisplay.textContent = urlObj.url;
        urlDisplay.title = urlObj.url;
        
        const badge = document.createElement('span');
        badge.className = 'badge bg-secondary mt-1';
        badge.textContent = index === 0 ? 'Image principale' : `Image #${index + 1}`;
        
        content.appendChild(urlDisplay);
        content.appendChild(badge);
        
        // Bouton de suppression
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn btn-sm btn-outline-danger';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.onclick = () => removeUrl(index);
        
        row.appendChild(imagePreview);
        row.appendChild(content);
        row.appendChild(removeBtn);
        
        // Champ description sous l'image
        const descContainer = document.createElement('div');
        descContainer.className = 'ms-3';
        
        const label = document.createElement('label');
        label.className = 'form-label';
        label.innerHTML = '<small class="text-muted">Description :</small>';
        
        const descInput = document.createElement('input');
        descInput.type = 'text';
        descInput.className = 'form-control form-control-sm';
        descInput.placeholder = 'Description de cette image (optionnel)';
        descInput.value = urlObj.description || '';
        descInput.addEventListener('input', (e) => {
            selectedUrls[index].description = e.target.value;
        });
        
        descContainer.appendChild(label);
        descContainer.appendChild(descInput);
        
        item.appendChild(row);
        item.appendChild(descContainer);
        list.appendChild(item);
    });
}

function removeUrl(index) {
    selectedUrls.splice(index, 1);
    updateUrlList();
}

function clearAllUrls() {
    selectedUrls = [];
    updateUrlList();
    document.getElementById('imageUrl').value = '';
}

// Export par défaut pour le router
export default initPage;
