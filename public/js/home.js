console.log("home.js chargé !");

function createEventSlide(event, isActive = false) {
    const inscriptionButtonId = `inscription-btn-${event.id}`;
    
    return `
    <div class="carousel-item event-carousel-item${isActive ? ' active' : ''}">
        <div class="row align-items-stretch p-2 h-100">
            <div class="col-md-6 mb-3 mb-md-0 d-flex justify-content-center align-items-center">
                <img src="${event.image || '/Images/images event/joueur et coach.jpg'}" class="event-carousel-img rounded-4" style="width: 98%; max-width: 420px; height: auto; max-height: 420px; object-fit: cover; border-radius: 1rem; box-shadow: 0 0 16px #0004;" alt="Image évènement">
            </div>
            <div class="col-md-6 d-flex flex-column bg-dark bg-opacity-75 event-carousel-text-col">
                <div class="flex-grow-1">
                    <h3 class="mb-3 fs-1 text-center">
                        <a href="/evenement?id=${event.id}" onclick="window.route(event)">${event.titre || 'Titre indisponible'}</a>
                    </h3>
                </div>
                <div class="d-flex flex-column justify-content-between" style="min-height: 180px;">
                    <p class="mb-1 fs-3">Début : ${new Date(event.start).toLocaleString()}</p>
                    <p class="mb-1 fs-3">Fin : ${new Date(event.end).toLocaleString()}</p>
                    <p class="fs-2">${event.description || ''}</p>
                    <p>Organisateur : ${event.organisateur?.username || 'Non renseigné'}</p>
                    <p>Participants : ${event.numberCompetitors || 0}</p>
                </div>
                <div class="mt-auto d-flex flex-wrap justify-content-center gap-3 pb-3">
                    <button id="${inscriptionButtonId}" class="btn btn-outline-light mt-2 px-4 py-2">S'inscrire</button>
                </div>
            </div>
        </div>
    </div>
    `;
}

function createSearchSlide(isActive = false) {
    return `
    <div class="carousel-item${isActive ? ' active' : ''}">
        <div class="d-flex flex-column justify-content-center align-items-center p-5" style="height: 400px;">
            <h3 class="mb-4 fs-1 text-center">Voir tous les évènements</h3>
            <a href="/rechercheEvenements" onclick="window.route(event)" class="btn btn-primary btn-lg">Accéder à la recherche</a>
        </div>
    </div>
    `;
}

function fillEventCarousel() {
    fetch('/api/evenements/en-cours')
        .then(res => res.json())
        .then(events => {
            const carouselInner = document.getElementById('eventCarouselInner');
            if (!carouselInner) return;
            carouselInner.innerHTML = '';
            let slides = [];
            if (Array.isArray(events)) {
                events.slice(0, 3).forEach((event, idx) => {
                    slides.push(createEventSlide(event, idx === 0));
                });
            } else if (events) {
                slides.push(createEventSlide(events, true));
            }
            // Ajoute la slide "recherche" (active si aucun évènement)
            slides.push(createSearchSlide(slides.length === 0));
            carouselInner.innerHTML = slides.join('');
            
            // Attache les gestionnaires d'événements après avoir ajouté le contenu au DOM
            setTimeout(() => {
                attachInscriptionHandlers(events);
            }, 100);
        })
        .catch(err => console.error('Erreur chargement évènements en cours :', err));
}

// Fonction pour gérer l'inscription à un événement
function handleInscription(eventId) {
    // Vérifie si l'utilisateur est connecté
    if (!isConnected()) {
        // Redirige vers la page de connexion si non connecté en utilisant le système de routage
        window.location.assign('/connexion');
        return;
    }
    
    // Si l'utilisateur est connecté, traite l'inscription
    // TODO: Implémenter la logique d'inscription à l'événement
    console.log(`Inscription à l'événement ${eventId}`);
    alert('Fonctionnalité d\'inscription en cours de développement');
}

// Fonction pour attacher les gestionnaires d'événements aux boutons d'inscription
function attachInscriptionHandlers(events) {
    if (Array.isArray(events)) {
        events.forEach(event => {
            const button = document.getElementById(`inscription-btn-${event.id}`);
            if (button) {
                button.addEventListener('click', () => handleInscription(event.id));
            }
        });
    } else if (events && events.id) {
        const button = document.getElementById(`inscription-btn-${events.id}`);
        if (button) {
            button.addEventListener('click', () => handleInscription(events.id));
        }
    }
}

// Exécution immédiate après injection
fillEventCarousel();
