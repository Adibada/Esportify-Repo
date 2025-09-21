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
const eventIdParam = new URLSearchParams(window.location.search).get('id');
const eventId = eventIdParam !== null ? parseInt(eventIdParam) : null;
let currentEvent = null;
let uploadedImages = []; // Stockage des images uploadées avec leurs métadonnées
let imageIdCounter = 0; // Compteur pour les IDs uniques des images
let imagesToDelete = []; // Images à supprimer lors de la sauvegarde

// === GESTION DES MESSAGES ===
const showMessage = (message, type = 'info') => {
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) return;
    
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
                               onchange="updateImageDescriptionLocal(${img.id}, this.value)"
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
        
        // Ne pas uploader immédiatement, juste ajouter à la liste locale
        const imageData = {
            id: imageIdCounter++,
            url: URL.createObjectURL(file), // URL temporaire pour l'affichage
            description: '',
            isUrl: false,
            originalName: file.name,
            size: formatFileSize(file.size),
            serverId: null, // Pas encore uploadé
            file: file, // Stocker le fichier pour l'upload final
            isNewFile: true // Marquer comme nouveau fichier à uploader
        };
        
        uploadedImages.push(imageData);
        updateImagesDisplay();
        
    } catch (error) {
        throw error;
    }
};

const addImageFromUrl = async () => {
    const urlInput = document.getElementById('eventImageUrl');
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
        
        // Ne pas uploader immédiatement, juste ajouter à la liste locale
        const imageData = {
            id: imageIdCounter++,
            url: imageUrl,
            description: '',
            isUrl: true,
            size: 'URL externe',
            serverId: null, // Pas encore sauvegardé
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
    
    const image = uploadedImages[imageIndex];
    
    if (!confirm(`Supprimer cette image définitivement ?`)) {
        return;
    }
    
    try {
        // Pour les images existantes (avec serverId), les ajouter à la liste de suppression
        if (image.serverId) {
            imagesToDelete.push({
                serverId: image.serverId,
                url: image.url,
                description: image.description
            });
        }
        
        // Supprimer de l'affichage local
        uploadedImages.splice(imageIndex, 1);
        updateImagesDisplay();
        
    } catch (error) {
        showMessage('Erreur lors de la suppression de l\'image', 'error');
    }
};

const updateImageDescriptionLocal = async (imageId, description) => {
    const image = uploadedImages.find(img => img.id === imageId);
    if (!image) return;
    
    // Mettre à jour la description localement
    // La sauvegarde se fera lors de la validation du formulaire
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

// Validation stricte d'URL d'image pour éviter les failles XSS
const isValidImageUrl = (url) => {
    try {
        const urlObj = new URL(url);
        // Refuser tout schéma non http(s)
        if (!['http:', 'https:'].includes(urlObj.protocol)) return false;
        // Refuser les URLs contenant javascript:, data:, vbscript:, etc.
        if (/^(javascript:|data:|vbscript:)/i.test(url)) return false;
        // Refuser les URLs avec des caractères suspects
        if (/["'<>]/.test(url)) return false;
        // Refuser les URLs avec des espaces
        if (/\s/.test(url)) return false;
        // Accepter uniquement les extensions d'image courantes
        if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(urlObj.pathname)) return false;
        return true;
    } catch {
        return false;
    }
};

// Rendre les fonctions accessibles globalement
window.handleFileSelection = handleFileSelection;
window.addImageFromUrl = addImageFromUrl;
window.removeImage = removeImage;
window.updateImageDescriptionLocal = updateImageDescriptionLocal;
window.moveImageUp = moveImageUp;
window.moveImageDown = moveImageDown;

// === VALIDATION ET FORMATAGE DES DATES ===
const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
};

const formatTimeForInput = (dateString) => {
    const date = new Date(dateString);
    return date.toTimeString().slice(0, 5);
};

const formatDateTimeForAPI = (date, time) => {
    return `${date}T${time}:00`;
};

const validateDates = (startDate, startTime, endDate, endTime) => {
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const now = new Date();
    
    if (start >= end) {
        return "La date de fin doit être postérieure à la date de début.";
    }
    
    if (start < now) {
        return "La date de début ne peut pas être dans le passé.";
    }
    
    return null;
};

// === CHARGEMENT DES DONNÉES ===
const loadEvent = async () => {
    if (!eventId && eventId !== 0) {
        showMessage("L'ID de l'événement est manquant dans l'URL.", 'error');
        return;
    }

    try {
        const token = getToken();
        if (!token) {
            showMessage("Vous devez être connecté pour modifier un événement.", 'error');
            setTimeout(() => window.location.href = '/connexion', 2000);
            return;
        }

        const res = await fetch(`/api/evenements/${eventId}`, {
            headers: { 'X-AUTH-TOKEN': token }
        });
        
        if (!res.ok) {
            throw new Error(`Erreur ${res.status}: ${res.statusText}`);
        }
        
        const event = await res.json();
        currentEvent = event;
        
        // Vérifier les permissions
        await checkPermissions(event);
        
        // Remplir le formulaire
        populateForm(event);
        
    } catch (err) {
        showMessage(`Erreur lors du chargement de l'événement : ${err.message}`, 'error');
    }
};

// === VÉRIFICATION DES PERMISSIONS ===
const checkPermissions = async (event) => {
    const role = getRole();
    
    // Administrateurs ont tous les droits
    if (role === 'ROLE_ADMIN') {
        showAdminActions();
        return;
    }
    
    // Récupérer l'utilisateur connecté via l'API /users/me
    try {
        const token = getToken();
        const userRes = await fetch('/api/users/me', {
            headers: { 'X-AUTH-TOKEN': token }
        });
        
        if (!userRes.ok) {
            throw new Error('Impossible de récupérer les données utilisateur');
        }
        
        const userData = await userRes.json();
        const userId = userData.id;
        
        // Vérifier si l'utilisateur est l'organisateur
        const userIdStr = String(userId);
        const organizerIdStr = String(event.organisateur?.id || '');
        
        if (event.organisateur && organizerIdStr !== userIdStr) {
            showMessage("Vous n'avez pas les droits pour modifier cet événement.", 'error');
            setTimeout(() => window.location.href = `/evenement?id=${eventId}`, 2000);
            return;
        }
        
    } catch (err) {
        showMessage("Erreur lors de la vérification des permissions.", 'error');
        setTimeout(() => window.location.href = `/evenement?id=${eventId}`, 2000);
    }
};

// === REMPLISSAGE DU FORMULAIRE ===
const populateForm = (event) => {
    // Champs de base
    document.getElementById('eventTitle').value = event.titre || '';
    document.getElementById('eventDescription').value = event.description || '';
    
    // Mettre à jour le badge de statut
    updateStatusBadge(event.statut);
    
    // Dates et heures
    if (event.start) {
        document.getElementById('eventStartDate').value = formatDateForInput(event.start);
        document.getElementById('eventStartTime').value = formatTimeForInput(event.start);
    }
    
    if (event.end) {
        document.getElementById('eventEndDate').value = formatDateForInput(event.end);
        document.getElementById('eventEndTime').value = formatTimeForInput(event.end);
    }
    
    // Lien de retour vers l'événement
    document.getElementById('returnToEventBtn').href = `/evenement?id=${eventId}`;
    
    // Charger les images existantes
    loadExistingImages(event);
};

const loadExistingImages = (event) => {
    uploadedImages = [];
    imagesToDelete = []; // Réinitialiser aussi la liste des suppressions
    imageIdCounter = 0;
    
    if (event.images && event.images.length > 0) {
        event.images.forEach((image, index) => {
            const imageData = {
                id: imageIdCounter++,
                url: image.url || image,
                description: image.description || image.originalName || '',
                isUrl: typeof image === 'string' && image.startsWith('http'),
                size: 'Image existante',
                serverId: image.id || null,
                // Ces images existent déjà, ne pas les traiter comme nouvelles
                isNewFile: false,
                isNewUrl: false,
                toDelete: false
            };
            
            uploadedImages.push(imageData);
        });
    }
    
    updateImagesDisplay();
};

const updateStatusBadge = (statut) => {
    const badge = document.getElementById('eventStatusBadge');
    if (!badge) return;
    
    // Nettoyer les classes précédentes
    badge.className = 'badge ms-2';
    
    switch (statut) {
        case 'en_attente':
            badge.classList.add('bg-warning', 'text-dark');
            badge.textContent = 'En attente';
            break;
        case 'valide':
            badge.classList.add('bg-success');
            badge.textContent = 'Validé';
            break;
        case 'refuse':
            badge.classList.add('bg-danger');
            badge.textContent = 'Refusé';
            break;
        case 'demarre':
            badge.classList.add('bg-info');
            badge.textContent = 'Démarré';
            break;
        case 'termine':
            badge.classList.add('bg-dark');
            badge.textContent = 'Terminé';
            break;
        default:
            badge.classList.add('bg-secondary');
            badge.textContent = 'Inconnu';
    }
};

// === GESTION DU FORMULAIRE ===
const handleFormSubmit = async (event) => {
    event.preventDefault();
    hideMessage();
    
    const form = document.getElementById('modifyEventForm');
    if (!form.checkValidity()) {
        event.stopPropagation();
        form.classList.add('was-validated');
        showMessage('Veuillez corriger les erreurs dans le formulaire.', 'error');
        return;
    }
    
    // Récupérer les données du formulaire
    const formData = new FormData(form);
    const startDate = formData.get('startDate');
    const startTime = formData.get('startTime');
    const endDate = formData.get('endDate');
    const endTime = formData.get('endTime');
    
    // Validation des dates
    const dateError = validateDates(startDate, startTime, endDate, endTime);
    if (dateError) {
        showMessage(dateError, 'error');
        return;
    }
    
    // Préparer les données pour l'API
    const eventData = {
        titre: formData.get('titre'),
        description: formData.get('description'),
        start: formatDateTimeForAPI(startDate, startTime),
        end: formatDateTimeForAPI(endDate, endTime)
    };
    
    // Détecter s'il y a des modifications d'images
    const hasImageChanges = imagesToDelete.length > 0 || 
                           uploadedImages.some(img => img.isNewFile || img.isNewUrl);
                           
    // Si seules les images ont changé, ajouter un marqueur pour forcer la modification
    if (hasImageChanges) {
        eventData._forceStatusChange = true;
    }
    
    try {
        const token = getToken();
        const saveBtn = document.getElementById('saveEventBtn');
        
        // Désactiver le bouton pendant l'envoi
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Sauvegarde...';
        
        // Mettre à jour l'événement principal (nécessaire pour changer le statut)
        // Même si seules les images ont changé, on appelle l'endpoint principal
        const hasImageChanges = imagesToDelete.length > 0 || 
                               uploadedImages.some(img => img.isNewFile || img.isNewUrl);
        
        const res = await fetch(`/api/evenements/${eventId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-AUTH-TOKEN': token
            },
            body: JSON.stringify(eventData)
        });
        
        if (res.ok) {
            try {
                // Traiter les images : upload des nouveaux fichiers, ajout des URLs, suppression des marquées
                await processImages();
                
                showMessage('Événement modifié avec succès ! <a href="/evenement?id=' + eventId + '&refresh=' + Date.now() + '" class="alert-link">Voir l\'événement mis à jour</a>', 'success');
                
                // Recharger les données pour mettre à jour l'affichage local
                setTimeout(() => {
                    loadEvent();
                }, 1000);
                
            } catch (imageError) {
                console.error('Erreur lors du traitement des images:', imageError);
                showMessage(
                    'Événement modifié avec succès mais erreur lors de la sauvegarde des images: ' + imageError.message + 
                    '<br><a href="/evenement?id=' + eventId + '&refresh=' + Date.now() + '" class="alert-link">Voir l\'événement</a>', 
                    'warning'
                );
                
                // Recharger quand même les données
                setTimeout(() => {
                    loadEvent();
                }, 1000);
            }
            
        } else {
            const errorData = await res.text();
            throw new Error(errorData || `Erreur ${res.status}`);
        }
        
    } catch (err) {
        showMessage(`Erreur lors de la modification : ${err.message}`, 'error');
    } finally {
        // Réactiver le bouton
        const saveBtn = document.getElementById('saveEventBtn');
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Enregistrer les modifications';
    }
};

const processImages = async () => {
    const token = getToken();
    
    try {
        
        // 1. Supprimer les images marquées pour suppression
        for (const image of imagesToDelete) {
            try {
                const response = await fetch(`/api/evenements/${eventId}/images/${image.serverId}`, {
                    method: 'DELETE',
                    headers: { 'X-AUTH-TOKEN': token }
                });
                
                const responseText = await response.text();
                
                if (response.ok) {
                } else {
                }
            } catch (error) {
            }
        }
        
        // Vider la liste des suppressions après traitement
        imagesToDelete = [];
        
        // 2. Uploader les nouveaux fichiers
        const newFiles = uploadedImages.filter(img => img.isNewFile && img.file);
        for (const imageData of newFiles) {
            try {
                const formData = new FormData();
                formData.append('image', imageData.file);
                if (imageData.description) {
                    formData.append('description', imageData.description);
                }
                
                const response = await fetch(`/api/evenements/${eventId}/image`, {
                    method: 'POST',
                    headers: { 'X-AUTH-TOKEN': token },
                    body: formData
                });
                
                const responseText = await response.text();
                
                if (response.ok) {
                    const result = JSON.parse(responseText);
                    
                    // L'entité ImageEvenement a été créée côté serveur avec la description
                    console.log('Image uploadée et sauvée:', result.imageEntity);
                    
                    // Mettre à jour l'objet local avec les informations du serveur
                    imageData.serverId = result.imageId;
                    imageData.url = result.imagePath;
                    imageData.isNewFile = false; // Plus considéré comme nouveau
                } else {
                    const errorText = await response.text();
                    throw new Error(`Erreur upload fichier "${imageData.file.name}": ${errorText}`);
                }
            } catch (error) {
                console.error('Erreur upload fichier:', error);
                throw error;
            }
        }
        
        // 3. Sauvegarder les nouvelles URLs
        const newUrls = uploadedImages.filter(img => img.isNewUrl && img.isUrl);
        for (const imageData of newUrls) {
            try {
                await saveImageWithDescription({
                    url: imageData.url,
                    description: imageData.description
                });
            } catch (error) {
                console.error('Erreur sauvegarde URL:', error);
                throw error;
            }
        }
        
        // 4. Mettre à jour les descriptions des images existantes (DÉSACTIVÉ - endpoint n'existe pas)
        // const existingImages = uploadedImages.filter(img => img.serverId && !img.isNewFile && !img.isNewUrl);
        
    } catch (error) {
        throw error;
    }
};

const saveImageWithDescription = async (imageData) => {
    const token = getToken();
    
    
    try {
        // L'endpoint attend FormData avec imageUrl et imageDescription
        const formData = new FormData();
        formData.append('imageUrl', imageData.url);
        formData.append('imageDescription', imageData.description || '');
        
        const response = await fetch(`/api/evenements/${eventId}/images`, {
            method: 'POST',
            headers: {
                'X-AUTH-TOKEN': token
                // Pas de Content-Type pour FormData
            },
            body: formData
        });
        
        const responseText = await response.text();
        
        if (!response.ok) {
            throw new Error('Erreur lors de la sauvegarde de l\'image: ' + responseText);
        }
        
        const result = JSON.parse(responseText);
        return result;
    } catch (error) {
        throw error;
    }
};

const updateImageOrder = async () => {
    try {
        const token = getToken();
        const imageOrder = uploadedImages.map(img => img.serverId).filter(Boolean);
        
        if (imageOrder.length === 0) return;
        
        await fetch(`/api/evenements/${eventId}/images/order`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-AUTH-TOKEN': token
            },
            body: JSON.stringify({ imageOrder })
        });
        
    } catch (error) {
        console.warn('Impossible de mettre à jour l\'ordre des images:', error);
    }
};

// === ACTIONS ADMINISTRATEUR ===
const showAdminActions = () => {
    const adminActions = document.getElementById('adminActions');
    if (adminActions) {
        adminActions.style.display = 'block';
    }
};

const handleDeleteEvent = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible et supprimera également toutes les participations associées.')) {
        return;
    }
    
    if (!confirm('Confirmation finale : Supprimer définitivement cet événement ?')) {
        return;
    }
    
    try {
        const token = getToken();
        const deleteBtn = document.getElementById('deleteEventBtn');
        
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Suppression...';
        
        const res = await fetch(`/api/evenements/${eventId}`, {
            method: 'DELETE',
            headers: { 'X-AUTH-TOKEN': token }
        });
        
        if (res.ok) {
            showMessage('Événement supprimé avec succès. Redirection...', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else {
            const errorData = await res.text();
            throw new Error(errorData || `Erreur ${res.status}`);
        }
        
    } catch (err) {
        showMessage(`Erreur lors de la suppression : ${err.message}`, 'error');
        const deleteBtn = document.getElementById('deleteEventBtn');
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = '<i class="fas fa-trash me-2"></i>Supprimer l\'événement';
    }
};

// === INITIALISATION ===
const init = () => {
    if (!isConnected()) {
        showMessage('Vous devez être connecté pour modifier un événement.', 'error');
        setTimeout(() => window.location.href = '/connexion', 2000);
        return;
    }
    
    if (eventId === null || isNaN(eventId)) {
        showMessage('ID d\'événement manquant ou invalide', 'error');
        return;
    }
    
    // Charger l'événement
    loadEvent();
    
    // Configurer le formulaire
    const form = document.getElementById('modifyEventForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Configurer le bouton de suppression
    const deleteBtn = document.getElementById('deleteEventBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', handleDeleteEvent);
    }
    
    // Validation en temps réel
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            if (input.checkValidity()) {
                input.classList.remove('is-invalid');
                input.classList.add('is-valid');
            } else {
                input.classList.remove('is-valid');
                input.classList.add('is-invalid');
            }
        });
    });
};

// Démarrage
const start = () => {
    const form = document.getElementById("modifyEventForm");
    if (form) {
        init();
    } else {
        // Attendre que les éléments soient prêts
        const interval = setInterval(() => {
            if (document.getElementById("modifyEventForm")) {
                clearInterval(interval);
                init();
            }
        }, 100);
        
        // Timeout après 5 secondes
        setTimeout(() => clearInterval(interval), 5000);
    }
};

// Export pour le router SPA
export default start;
