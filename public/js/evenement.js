// Utilitaires
const getCookie = name => document.cookie.split(';').find(c => c.trim().startsWith(name + '='))?.split('=')[1] || null;
const getToken = () => getCookie("accesstoken");
const isConnected = () => !!getToken()?.trim();
const eventId = new URLSearchParams(window.location.search).get('id');

// États d'affichage
const setState = (type, content) => {
    const elem = document.getElementById("eventName");
    if (!elem) return;
    
    if (type === 'loading') {
        elem.innerHTML = 'Chargement... <div class="spinner-border spinner-border-sm ms-2"><span class="visually-hidden">Chargement...</span></div>';
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

// Mise à jour du DOM
const updateEvent = (event) => {
    // Image
    const img = document.querySelector('img[alt*="joueuse"], img[alt*="événement"], .bloc img');
    if (img && event.image) {
        img.src = event.image;
        img.alt = `Image de l'événement : ${event.titre}`;
    }

    // Éléments texte
    const updates = {
        eventName: event.titre || "Titre non disponible",
        eventDescription: event.description || "Aucune description disponible",
        eventOrganizer: `Organisateur : ${event.organisateur?.username || "Non renseigné"}`,
        numOfCompetitors: `Participants : ${event.numberCompetitors || 0}`,
        eventStatus: `Statut de validation : ${event.statut || "En attente"}`
    };

    Object.entries(updates).forEach(([id, content]) => {
        const elem = document.getElementById(id);
        if (elem) {
            const p = elem.querySelector("p");
            (p || elem).textContent = content;
        }
    });

    // Dates
    ['eventStart', 'eventEnd'].forEach((id, index) => {
        const elem = document.getElementById(id);
        const timeElem = elem?.querySelector("time");
        if (timeElem) {
            const dateKey = index === 0 ? 'start' : 'end';
            const prefix = index === 0 ? 'Début' : 'Fin';
            timeElem.textContent = `${prefix} : ${new Date(event[dateKey]).toLocaleString()}`;
            timeElem.setAttribute('datetime', event[dateKey]);
        }
    });

    // Bouton participation
    const btn = document.getElementById("participateBtn");
    if (btn) {
        btn.dataset.eventId = event.id;
        if (event.userParticipating) {
            btn.textContent = "Déjà inscrit";
            btn.disabled = true;
            btn.classList.add("btn-success");
            btn.classList.remove("btn-outline-light");
        }
    }

    document.title = `${event.titre} - Esportify`;
};

// API - Chargement événement
const loadEvent = async () => {
    if (!eventId && eventId !== '0') {
        setState('error', "L'ID de l'événement est manquant dans l'URL.");
        return;
    }

    setState('loading');
    
    try {
        const token = getToken();
        const res = await fetch(`/api/evenements/${eventId}`, {
            headers: token ? { 'X-AUTH-TOKEN': token } : {}
        });
        
        if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
        
        const event = await res.json();
        updateEvent(event);
    } catch (err) {
        setState('error', err.message);
    }
};

// API - Participation
const participer = async (eventId) => {
    const token = getToken();
    if (!token) {
        alert("Vous devez être connecté pour participer.");
        window.location.assign('/connexion');
        return;
    }

    const btn = document.getElementById("participateBtn");
    if (btn) {
        btn.disabled = true;
        btn.textContent = "Inscription en cours...";
    }

    try {
        const res = await fetch(`/api/evenements/${eventId}/participer`, {
            method: 'POST',
            headers: { 'X-AUTH-TOKEN': token, 'Content-Type': 'application/json' }
        });
        
        if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
        
        const data = await res.json();
        alert(data.message || "Inscription réussie !");
        
        // Mise à jour participants
        const numElem = document.getElementById("numOfCompetitors");
        if (numElem && data.numberCompetitors !== undefined) {
            (numElem.querySelector("p") || numElem).textContent = `Participants : ${data.numberCompetitors}`;
        }

        // Mise à jour bouton
        if (btn) {
            btn.textContent = "Déjà inscrit";
            btn.classList.add("btn-success");
            btn.classList.remove("btn-outline-light");
        }
    } catch (err) {
        alert(`Erreur lors de l'inscription: ${err.message}`);
        if (btn) {
            btn.disabled = false;
            btn.textContent = "Participer";
        }
    }
};

// API - Commentaires
const loadComments = async () => {
    if (!eventId) return;
    
    try {
        const res = await fetch(`/api/evenements/${eventId}/commentaires`);
        if (!res.ok) throw new Error('Erreur de chargement des commentaires');
        
        const comments = await res.json();
        const list = document.querySelector('#commentsList ul');
        if (!list) return;

        list.innerHTML = comments.length > 0 
            ? comments.map(c => `
                <li class="mb-3">
                    <strong>${c.author?.username || 'Utilisateur anonyme'}</strong>
                    <small class="text-muted">- ${new Date(c.createdAt).toLocaleString()}</small>
                    <br><span>${c.content || ''}</span>
                </li>`).join('')
            : '<li class="text-muted">Aucun commentaire pour le moment.</li>';
    } catch {
        const list = document.querySelector('#commentsList ul');
        if (list) list.innerHTML = '<li class="text-muted">Erreur de chargement des commentaires.</li>';
    }
};

const addComment = async () => {
    const token = getToken();
    if (!token) {
        alert("Vous devez être connecté pour commenter.");
        window.location.assign('/connexion');
        return;
    }

    const input = document.getElementById('commentInput');
    const content = input?.value.trim();
    
    if (!content) {
        alert("Veuillez saisir un commentaire.");
        return;
    }

    try {
        const res = await fetch(`/api/evenements/${eventId}/commentaires`, {
            method: 'POST',
            headers: { 'X-AUTH-TOKEN': token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        
        if (!res.ok) throw new Error('Erreur lors de l\'ajout du commentaire');
        
        alert('Commentaire ajouté avec succès !');
        input.value = '';
        loadComments();
    } catch (err) {
        alert(`Erreur lors de l'ajout du commentaire: ${err.message}`);
    }
};

// Initialisation
const init = () => {
    const essentialElements = ['eventName', 'eventStart', 'eventEnd', 'eventDescription', 'eventOrganizer', 'numOfCompetitors', 'eventStatus'];
    
    if (!essentialElements.every(id => document.getElementById(id))) {
        return false;
    }
    
    loadEvent();
    loadComments();

    // Gestionnaires d'événements
    document.getElementById("participateBtn")?.addEventListener("click", () => participer(eventId));
    
    document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.includes('Envoyer')) {
            btn.addEventListener("click", addComment);
        }
    });
    
    return true;
};

// Démarrage
const start = () => {
    const checkReady = () => document.getElementById("eventName") !== null;
    
    if (checkReady()) {
        init();
    } else {
        const interval = setInterval(() => {
            if (checkReady()) {
                clearInterval(interval);
                init();
            }
        }, 200);
        setTimeout(() => clearInterval(interval), 10000);
    }
};

// Lancement
document.readyState === 'loading' 
    ? document.addEventListener("DOMContentLoaded", start)
    : setTimeout(start, 100);
