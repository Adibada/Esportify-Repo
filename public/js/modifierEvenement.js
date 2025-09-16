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
        console.error("Erreur lors de la vérification des permissions:", err);
        showMessage("Erreur lors de la vérification des permissions.", 'error');
        setTimeout(() => window.location.href = `/evenement?id=${eventId}`, 2000);
    }
};

// === REMPLISSAGE DU FORMULAIRE ===
const populateForm = (event) => {
    // Champs de base
    document.getElementById('eventTitle').value = event.titre || '';
    document.getElementById('eventDescription').value = event.description || '';
    
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
    
    // Gestion des images actuelles
    if (event.mainImageUrl && event.mainImageUrl !== '/Images/images event/joueuses.jpg') {
        // Si l'image principale existe et commence par http, c'est une URL
        if (event.mainImageUrl.startsWith('http')) {
            document.getElementById('imageTypeUrl').checked = true;
            document.getElementById('eventImageUrl').value = event.mainImageUrl;
            toggleImageInput();
        } else {
            // Sinon c'est un fichier local, on garde le mode fichier par défaut
            document.getElementById('imageTypeFile').checked = true;
        }
    }
    
    // Affichage d'info sur les images existantes si il y en a plusieurs
    if (event.images && event.images.length > 1) {
        console.log(`Événement a ${event.images.length} images. La première est utilisée comme image principale.`);
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
    
    // Gérer les images (support multi-images)
    const imageType = document.querySelector('input[name="imageType"]:checked').value;
    const imageFiles = imageType === 'file' ? document.getElementById('eventImageFile').files : [];
    const imageUrl = imageType === 'url' ? document.getElementById('eventImageUrl').value : null;
    
    console.log('Type d\'image sélectionné:', imageType);
    console.log('Images à traiter:', imageFiles ? imageFiles.length : 0, 'fichiers');
    console.log('URL d\'image:', imageUrl);
    
    try {
        const token = getToken();
        const saveBtn = document.getElementById('saveEventBtn');
        
        // Désactiver le bouton pendant l'envoi
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Sauvegarde...';
        
        // Si de nouvelles images fichiers sont sélectionnées, les uploader
        if (imageFiles && imageFiles.length > 0) {
            const imageFormData = new FormData();
            
            Array.from(imageFiles).forEach((file, index) => {
                console.log(`Ajout image ${index}:`, file.name);
                imageFormData.append('images[]', file);
            });
            
            // Ajouter la description de l'image si fournie
            const imageDescription = document.getElementById('eventImageDescription').value.trim();
            if (imageDescription) {
                imageFormData.append('imageDescription', imageDescription);
            }
            
            console.log('Upload vers /api/evenements/' + eventId + '/images');
            const imageRes = await fetch(`/api/evenements/${eventId}/images`, {
                method: 'POST',
                headers: { 'X-AUTH-TOKEN': token },
                body: imageFormData
            });
            
            console.log('Réponse upload images:', imageRes.status);
            if (!imageRes.ok) {
                const errorText = await imageRes.text();
                console.error('Erreur upload images:', errorText);
                throw new Error('Erreur lors de l\'upload des images');
            } else {
                const imageData = await imageRes.json();
                console.log('Images uploadées avec succès:', imageData);
            }
        } else if (imageUrl && imageUrl.trim() !== '') {
            // Si une URL d'image est fournie, l'ajouter via l'API images
            console.log('Ajout d\'image par URL:', imageUrl);
            const imageFormData = new FormData();
            imageFormData.append('imageUrl', imageUrl.trim());
            
            // Ajouter la description de l'image si fournie
            const imageDescription = document.getElementById('eventImageDescription').value.trim();
            if (imageDescription) {
                imageFormData.append('imageDescription', imageDescription);
            }
            
            const imageRes = await fetch(`/api/evenements/${eventId}/images`, {
                method: 'POST',
                headers: { 'X-AUTH-TOKEN': token },
                body: imageFormData
            });
            
            console.log('Réponse ajout image URL:', imageRes.status);
            if (!imageRes.ok) {
                const errorText = await imageRes.text();
                console.error('Erreur ajout image URL:', errorText);
                throw new Error('Erreur lors de l\'ajout de l\'image par URL');
            } else {
                const imageData = await imageRes.json();
                console.log('Image URL ajoutée avec succès:', imageData);
            }
        }
        
        const res = await fetch(`/api/evenements/${eventId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-AUTH-TOKEN': token
            },
            body: JSON.stringify(eventData)
        });
        
        if (res.ok) {
            showMessage('Événement modifié avec succès !', 'success');
            
            // Recharger les données pour mettre à jour l'affichage
            setTimeout(() => {
                loadEvent();
            }, 1000);
            
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
