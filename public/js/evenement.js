// evenement.js - Version optimisée

// Récupération de l'ID depuis l'URL
const eventId = new URLSearchParams(window.location.search).get('id');

// États d'affichage
const setState = (type, content) => {
    const elem = document.getElementById("eventName");
    if (!elem) return;
    
    if (type === 'loading') {
        elem.innerHTML = 'Chargement en cours... <div class="spinner-border spinner-border-sm ms-2"><span class="visually-hidden">Chargement...</span></div>';
    } else if (type === 'error') {
        elem.innerHTML = `
            <span class="text-danger">Erreur de chargement</span>
            <div class="mt-2"><small class="text-muted">${content}</small></div>
            <div class="mt-3">
                <button class="btn btn-primary" onclick="location.href='/'">Retour à l'accueil</button>
                <button class="btn btn-secondary ms-2" onclick="location.reload()">Réessayer</button>
            </div>`;
    }
};

// Mise à jour complète du DOM
const updateEvent = (event) => {
    // Image
    const img = document.querySelector('img[alt*="joueuse"], img[alt*="événement"], .bloc img');
    if (img && event.image) {
        img.src = event.image;
        img.alt = `Image de l'événement : ${event.titre}`;
    }

    // Mise à jour des éléments
    const updates = [
        { id: "eventName", content: event.titre },
        { id: "eventDescription", content: event.description },
        { id: "eventOrganizer", content: event.organisateur?.nom },
        { id: "numOfCompetitors", content: `Participants : ${event.numberCompetitors || 0}` },
        { id: "eventStart", content: new Date(event.start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
        { id: "eventEnd", content: new Date(event.end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
        { id: "eventStatus", content: event.statut }
    ];

    updates.forEach(({ id, content }) => {
        const elem = document.getElementById(id);
        if (elem && content) {
            if (elem.tagName === 'INPUT' || elem.tagName === 'TEXTAREA') {
                elem.value = content;
            } else {
                elem.textContent = content;
            }
        }
    });

    // Gérer les boutons admin
    if (isConnected()) {
        updateAdminButtons(event);
    }
};

// Chargement de l'événement
const loadEvent = async () => {
    if (!eventId) {
        setState('error', "L'ID de l'événement est manquant dans l'URL.");
        return;
    }

    setState('loading');
    
    try {
        const token = getToken();
        const res = await fetch(`/api/evenements/${eventId}`, {
            headers: token ? { 'X-AUTH-TOKEN': token } : {}
        });
        
        if (!res.ok) {
            throw new Error(`Erreur ${res.status}: ${res.statusText}`);
        }
        
        const event = await res.json();
        updateEvent(event);
        
        // Vérifier le statut de participation si connecté
        if (isConnected()) {
            const status = await checkParticipationStatus(eventId);
            updateParticipationButton(status);
        }
        
    } catch (err) {
        setState('error', err.message);
    }
};

// Vérification du statut de participation
const checkParticipationStatus = async (eventId) => {
    const token = getToken();
    if (!token) return { isParticipant: false, isOrganizer: false };

    try {
        const res = await fetch(`/api/evenements/${eventId}/participation-status`, {
            headers: { 'X-AUTH-TOKEN': token }
        });
        return res.ok ? await res.json() : { isParticipant: false, isOrganizer: false };
    } catch (err) {
        return { isParticipant: false, isOrganizer: false };
    }
};

// Mise à jour du bouton de participation
const updateParticipationButton = (status) => {
    const btn = document.querySelector("#participateBtn, .btn-participate, [data-participate]");
    if (!btn) return;

    if (status.isParticipant) {
        btn.textContent = "Annuler ma participation";
        btn.className = "btn btn-warning";
        btn.onclick = () => cancelParticipation(eventId);
    } else if (status.isOrganizer) {
        btn.textContent = "Organisateur";
        btn.className = "btn btn-secondary";
        btn.disabled = true;
    } else {
        btn.textContent = "Participer";
        btn.className = "btn btn-success";
        btn.onclick = () => participer(eventId);
    }
};

// Participation à l'événement
const participer = async (eventId) => {
    const token = getToken();
    if (!token) {
        alert('Vous devez être connecté pour participer.');
        return;
    }

    try {
        const res = await fetch(`/api/evenements/${eventId}/participer`, {
            method: 'POST',
            headers: { 'X-AUTH-TOKEN': token }
        });

        if (res.ok) {
            await refreshEventData();
            alert('Participation confirmée !');
        } else {
            const error = await res.text();
            alert(`Erreur : ${error}`);
        }
    } catch (err) {
        alert('Erreur lors de la participation.');
    }
};

// Annulation de participation
const cancelParticipation = async (eventId) => {
    const token = getToken();
    if (!token) return;

    if (!confirm('Êtes-vous sûr de vouloir annuler votre participation ?')) return;

    try {
        const res = await fetch(`/api/evenements/${eventId}/annuler-participation`, {
            method: 'DELETE',
            headers: { 'X-AUTH-TOKEN': token }
        });

        if (res.ok) {
            await refreshEventData();
            alert('Participation annulée.');
        } else {
            const error = await res.text();
            alert(`Erreur : ${error}`);
        }
    } catch (err) {
        alert('Erreur lors de l\'annulation.');
    }
};

// Mise à jour du compteur de participants
const updateParticipantCount = (count) => {
    const numElem = document.getElementById("numOfCompetitors");
    if (numElem) {
        const p = numElem.querySelector("p") || numElem;
        p.textContent = `Participants : ${count || 0}`;
    }
};

// Mise à jour rapide après participation/annulation
const refreshEventData = async () => {
    try {
        const res = await fetch(`/api/evenements/${eventId}`, {
            headers: getToken() ? { 'X-AUTH-TOKEN': getToken() } : {}
        });
        
        if (res.ok) {
            const event = await res.json();
            updateParticipantCount(event.numberCompetitors);
            
            if (isConnected()) {
                const status = await checkParticipationStatus(eventId);
                updateParticipationButton(status);
            }
        }
    } catch (err) {
        setTimeout(() => location.reload(), 1000);
    }
};

// Validation d'événement (Admin)
const validateEvent = async (eventId) => {
    const token = getToken();
    if (!token) return;

    if (!confirm('Valider cet événement ?')) return;

    try {
        const res = await fetch(`/api/evenements/${eventId}/valider`, {
            method: 'PUT',
            headers: { 'X-AUTH-TOKEN': token }
        });

        if (res.ok) {
            alert('Événement validé avec succès !');
            location.reload();
        } else {
            const error = await res.text();
            alert(`Erreur : ${error}`);
        }
    } catch (err) {
        alert('Erreur lors de la validation.');
    }
};

// Rejet d'événement (Admin)
const rejectEvent = async (eventId) => {
    const token = getToken();
    if (!token) return;

    if (!confirm('Rejeter cet événement ? Cette action est irréversible.')) return;

    try {
        const res = await fetch(`/api/evenements/${eventId}/rejeter`, {
            method: 'PUT',
            headers: { 'X-AUTH-TOKEN': token }
        });

        if (res.ok) {
            alert('Événement rejeté.');
            window.navigate('/');
        } else {
            const error = await res.text();
            alert(`Erreur : ${error}`);
        }
    } catch (err) {
        alert('Erreur lors du rejet.');
    }
};

// Vérification des droits admin
const checkAdminRights = () => {
    const role = getCookie('role');
    return role === 'ROLE_ADMIN' || role === 'ROLE_ORGANISATEUR';
};

// Mise à jour des boutons admin
const updateAdminButtons = (event) => {
    if (!checkAdminRights()) return;

    const adminContainer = document.querySelector('.admin-controls, .admin-buttons, [data-admin]');
    if (!adminContainer) return;

    adminContainer.style.display = 'block';

    if (event.statut === 'en attente') {
        adminContainer.innerHTML = `
            <div class="mt-3 p-3 border rounded bg-light">
                <h6>Actions administrateur :</h6>
                <button class="btn btn-success me-2" onclick="validateEvent('${eventId}')">Valider</button>
                <button class="btn btn-danger" onclick="rejectEvent('${eventId}')">Rejeter</button>
            </div>`;
    }
};

// Chargement des commentaires
const loadComments = async () => {
    // Implémentation simplifiée - à développer si nécessaire
};

// Ajout de commentaire
const addComment = async () => {
    // Implémentation simplifiée - à développer si nécessaire
};

// Initialisation principale
const init = () => {
    if (!eventId) {
        setState('error', 'ID d\'événement manquant');
        return;
    }
    
    // Masquer les boutons admin par défaut
    const adminContainer = document.querySelector('.admin-controls, .admin-buttons, [data-admin]');
    if (adminContainer) {
        adminContainer.style.display = 'none';
    }
    
    // Charger l'événement et les commentaires
    loadEvent();
    loadComments();

    // Gestionnaire pour les commentaires
    document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.includes('Envoyer')) {
            btn.addEventListener("click", addComment);
        }
    });
};

// Démarrage
const start = () => {
    const eventName = document.getElementById("eventName");
    if (eventName) {
        init();
    } else {
        // Attendre que les éléments soient prêts
        const interval = setInterval(() => {
            if (document.getElementById("eventName")) {
                clearInterval(interval);
                init();
            }
        }, 100);
        
        // Timeout après 5 secondes
        setTimeout(() => clearInterval(interval), 5000);
    }
};

// Initialisation automatique
if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", start);
} else {
    setTimeout(start, 50);
}

// Export pour le router SPA
export default start;
