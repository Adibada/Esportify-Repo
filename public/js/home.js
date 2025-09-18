function createEventSlide(event, isActive = false) {
    // Générer un attribut alt dynamique basé sur l'image principale
    const altText = event.mainImage?.originalName || `Image de l'événement: ${event.titre || 'Sans titre'}`;
    
    return `
    <div class="carousel-item event-carousel-item${isActive ? ' active' : ''}">
        <div class="row align-items-stretch p-2 h-100">
            <div class="col-md-6 mb-3 mb-md-0 d-flex justify-content-center align-items-center">
                <img src="${event.mainImageUrl || '/Images/images event/joueur et coach.jpg'}" class="event-carousel-img rounded-4" style="width: 98%; max-width: 420px; height: auto; max-height: 420px; object-fit: cover; border-radius: 1rem; box-shadow: 0 0 16px #0004;" alt="${altText}">
            </div>
            <div class="col-md-6 d-flex flex-column bg-dark bg-opacity-75 event-carousel-text-col">
                <div class="mb-4">
                    <h3 class="mb-0 fs-1 text-center">
                        <a href="/evenement?id=${event.id}" onclick="window.route(event)">${event.titre || 'Titre indisponible'}</a>
                    </h3>
                </div>
                <div class="d-flex flex-column justify-content-start flex-grow-1">
                    <p class="mb-2 fs-3">Début : ${new Date(event.start).toLocaleString()}</p>
                    <p class="mb-2 fs-3">Fin : ${new Date(event.end).toLocaleString()}</p>
                    <p class="mb-3 fs-2">${event.description || ''}</p>
                    <p class="mb-1">Organisateur : ${event.organisateur?.username || 'Non renseigné'}</p>
                    <p class="mb-0">Participants : ${event.numberCompetitors || 0}</p>
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

function createSearchSlideForUpcoming(isActive = false) {
    return `
    <div class="carousel-item${isActive ? ' active' : ''}">
        <div class="d-flex flex-column justify-content-center align-items-center p-5" style="height: 400px;">
            <a href="/rechercheEvenements" onclick="window.route(event)" class="btn btn-primary btn-lg">Voir tous les événements</a>
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
            
            // Initialiser le carrousel Bootstrap pour qu'il soit automatique
            const carouselElement = document.getElementById('eventCarousel');
            if (carouselElement && window.bootstrap) {
                new bootstrap.Carousel(carouselElement, {
                    interval: 5000, // Change toutes les 5 secondes
                    ride: true,     // Démarrage automatique
                    pause: 'hover'  // Pause au survol
                });
            }
        })
        .catch(err => {
            // Silently handle errors - carousel will remain empty
        });
}

// Fonction pour charger les événements à venir dans un carousel
function fillUpcomingEventCarousel() {
    fetch('/api/evenements')
        .then(res => res.json())
        .then(events => {
            const carouselInner = document.getElementById('upcomingEventCarouselInner');
            if (!carouselInner) return;
            carouselInner.innerHTML = '';
            
            if (!Array.isArray(events)) return;
            
            // Filtrer les événements à venir (date de début > maintenant)
            const now = new Date();
            const upcomingEvents = events
                .filter(event => new Date(event.start) > now)
                .sort((a, b) => new Date(a.start) - new Date(b.start))
                .slice(0, 3); // Prendre seulement les 3 premiers
            
            let slides = [];
            if (upcomingEvents.length > 0) {
                upcomingEvents.forEach((event, idx) => {
                    slides.push(createEventSlide(event, idx === 0));
                });
            }
            
            // Ajoute la slide "recherche" (active si aucun évènement)
            slides.push(createSearchSlideForUpcoming(slides.length === 0));
            carouselInner.innerHTML = slides.join('');
            
            // Initialiser le carrousel Bootstrap pour qu'il soit automatique
            const carouselElement = document.getElementById('upcomingEventCarousel');
            if (carouselElement && window.bootstrap) {
                new bootstrap.Carousel(carouselElement, {
                    interval: 6000, // Change toutes les 6 secondes
                    ride: true,     // Démarrage automatique
                    pause: 'hover'  // Pause au survol
                });
            }
        })
        .catch(err => {
            // Silently handle errors - carousel will remain empty
            const carouselInner = document.getElementById('upcomingEventCarouselInner');
            if (carouselInner) {
                carouselInner.innerHTML = `
                    <div class="carousel-item active">
                        <div class="card text-center">
                            <div class="card-body">
                                <h5 class="card-title text-danger">Erreur de chargement</h5>
                                <p class="card-text">Impossible de charger les événements à venir</p>
                                <button class="btn btn-outline-secondary" onclick="fillUpcomingEventCarousel()">Réessayer</button>
                            </div>
                        </div>
                    </div>
                `;
            }
        });
}

// Fonction pour initialiser les carrousels avec défilement automatique
function initCarousels() {
    // Initialiser le carrousel d'accueil
    const carouselExample = document.getElementById('carouselExample');
    if (carouselExample) {
        const carousel = new bootstrap.Carousel(carouselExample, {
            interval: 4000,
            ride: 'carousel'
        });
    }
    
    // Initialiser le carrousel d'événements en cours après un court délai
    setTimeout(() => {
        const eventCarousel = document.getElementById('eventCarousel');
        if (eventCarousel) {
            const carousel = new bootstrap.Carousel(eventCarousel, {
                interval: 5000,
                ride: 'carousel'
            });
        }
    }, 500);
    
    // Initialiser le carrousel d'événements à venir après un court délai
    setTimeout(() => {
        const upcomingEventCarousel = document.getElementById('upcomingEventCarousel');
        if (upcomingEventCarousel) {
            const carousel = new bootstrap.Carousel(upcomingEventCarousel, {
                interval: 6000,
                ride: 'carousel'
            });
        }
    }, 600);
}

// Exécution immédiate après injection
fillEventCarousel();
// Exécuter le chargement des événements à venir en carousel
fillUpcomingEventCarousel();
// Initialiser les carrousels
initCarousels();
