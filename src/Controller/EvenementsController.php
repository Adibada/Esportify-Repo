<?php

namespace App\Controller;

use App\Entity\Evenements;
use App\Entity\Participation;
use App\Entity\ImageEvenement;
use App\Repository\EvenementsRepository;
use App\Repository\ParticipationRepository;
use App\Repository\UserRepository;
use App\Repository\ImageEvenementRepository;
use App\Service\EventStatusService;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('api/evenements', name: 'app_api_evenements_')]
class EvenementsController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $manager,
        private EvenementsRepository $repository,
        private SerializerInterface $serializer,
        private UrlGeneratorInterface $urlGenerator,
        private ParticipationRepository $participationRepository,
        private UserRepository $userRepository,
        private ImageEvenementRepository $imageRepository,
        private EventStatusService $eventStatusService
    ) {}

    /**
     * Vérifie si l'événement est accessible (validé, en cours ou démarré)
     */
    private function isEventAccessible(Evenements $evenement): bool
    {
        return in_array($evenement->getStatut(), [
            Evenements::STATUT_VALIDE,
            Evenements::STATUT_EN_COURS,
            Evenements::STATUT_DEMARRE
        ]);
    }

    #[IsGranted('ROLE_ORGANISATEUR')]
    #[Route('', name: 'new', methods: ['POST'])]
    #[OA\Post(
        summary: 'Créer un nouvel événement',
        security: [['X-AUTH-TOKEN' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                type: 'object',
                required: ['titre', 'description', 'start', 'end'],
                properties: [
                    new OA\Property(property: 'titre', type: 'string'),
                    new OA\Property(property: 'description', type: 'string'),
                    new OA\Property(property: 'start', type: 'string', format: 'date-time'),
                    new OA\Property(property: 'end', type: 'string', format: 'date-time'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Événement créé'),
            new OA\Response(response: 400, description: 'Données invalides'),
            new OA\Response(response: 403, description: 'Accès non autorisé'),
        ]
    )]
    public function new(Request $request): JsonResponse
    {
        $user = $this->getUser();

        if (!$this->isGranted('ROLE_ORGANISATEUR') && !$this->isGranted('ROLE_ADMIN')) {
            return $this->json(['error' => 'Accès non autorisé'], Response::HTTP_FORBIDDEN);
        }

        // Créer un nouvel événement
        $evenement = new Evenements();
        
        // Récupérer les données du formulaire
        $name = $request->request->get('name');
        $detail = $request->request->get('detail');
        $dateStart = $request->request->get('dateStart');
        $dateEnd = $request->request->get('dateEnd');
        
        // Validation des champs requis
        if (empty($name) || empty($detail) || empty($dateStart) || empty($dateEnd)) {
            return $this->json(['error' => 'Tous les champs sont requis'], Response::HTTP_BAD_REQUEST);
        }

        // Validation des dates
        try {
            $startDate = new \DateTimeImmutable($dateStart);
            $endDate = new \DateTimeImmutable($dateEnd);
            
            if ($endDate <= $startDate) {
                return $this->json(['error' => 'La date de fin doit être postérieure à la date de début'], Response::HTTP_BAD_REQUEST);
            }
            
            if ($startDate < new \DateTimeImmutable()) {
                return $this->json(['error' => 'La date de début ne peut pas être dans le passé'], Response::HTTP_BAD_REQUEST);
            }
        } catch (\Exception $e) {
            return $this->json(['error' => 'Format de date invalide'], Response::HTTP_BAD_REQUEST);
        }
        
        // Définir les propriétés de base
        $evenement->setTitre($name);
        $evenement->setDescription($detail);
        $evenement->setStart($startDate);
        $evenement->setEnd($endDate);
        $evenement->setOrganisateur($user);
        
        // Persister d'abord l'événement pour avoir un ID
        $this->manager->persist($evenement);
        $this->manager->flush();

        // Gestion des images
        $images = $request->files->get('images', []);
        $imageFile = $request->files->get('image'); // Support de l'ancienne API
        $imageUrl = $request->request->get('imageUrl'); // Une seule URL (ancienne API)
        $imageUrls = $request->request->get('imageUrls', []); // URLs multiples (nouvelle API)
        $imageDescription = $request->request->get('imageDescription'); // Description unique (ancienne API)
        $imageDescriptions = $request->request->get('imageDescriptions', []); // Descriptions multiples (nouvelle API)
        
        // Si on utilise l'ancienne API avec un seul fichier image
        if ($imageFile && empty($images)) {
            $images = [$imageFile];
        }
        
        if (!empty($images)) {
            try {
                foreach ($images as $index => $imgFile) {
                    // Utiliser la description correspondante ou retomber sur la description générale
                    $description = isset($imageDescriptions[$index]) ? $imageDescriptions[$index] : $imageDescription;
                    $this->handleImageUpload($imgFile, $evenement, $description);
                }
                $this->manager->flush();
            } catch (\Exception $e) {
                return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
            }
        } elseif (!empty($imageUrls)) {
            // Support des URLs multiples (nouvelle API)
            try {
                foreach ($imageUrls as $index => $url) {
                    if (filter_var($url, FILTER_VALIDATE_URL)) {
                        $imageEntity = new ImageEvenement();
                        $imageEntity->setFilename($url);
                        // Utiliser la description correspondante ou retomber sur la description générale
                        $description = isset($imageDescriptions[$index]) ? $imageDescriptions[$index] : $imageDescription;
                        $imageEntity->setOriginalName($description ?: ('URL: ' . parse_url($url, PHP_URL_HOST)));
                        $imageEntity->setEvenement($evenement);
                        
                        $this->manager->persist($imageEntity);
                    }
                }
                $this->manager->flush();
            } catch (\Exception $e) {
                return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
            }
        } elseif (!empty($imageUrl)) {
            // Support de l'ancienne API avec URL d'image (une seule)
            $imageEntity = new ImageEvenement();
            $imageEntity->setFilename($imageUrl);
            $imageEntity->setOriginalName($imageDescription ?: 'URL Image');
            $imageEntity->setEvenement($evenement);
            
            $this->manager->persist($imageEntity);
            $this->manager->flush();
        }

        $responseData = $this->serializer->serialize($evenement, 'json');
        $location = $this->urlGenerator->generate(
            'app_api_evenements_show',
            ['id' => $evenement->getId()],
            UrlGeneratorInterface::ABSOLUTE_URL
        );

        return new JsonResponse($responseData, Response::HTTP_CREATED, ['Location' => $location], true);
    }

    #[Route('/{id}', name: 'show', methods: ['GET'], requirements: ['id' => '\d+'])]
    #[OA\Get(
        summary: 'Afficher un événement par ID',
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
        ],
        responses: [
            new OA\Response(response: 200, description: 'Événement trouvé'),
            new OA\Response(response: 404, description: 'Événement non trouvé'),
        ]
    )]
    public function show(int $id): JsonResponse
    {
        $evenement = $this->repository->find($id);

        if (!$evenement) {
            return $this->json(['error' => 'Événement non trouvé'], Response::HTTP_NOT_FOUND);
        }

        // Mettre à jour le statut de l'événement en fonction de ses dates
        // $this->eventStatusService->updateEventStatus($evenement);
        // $this->manager->flush();

        $user = $this->getUser();
        
        // Vérifier les permissions pour les événements en attente
        if (!$this->isEventAccessible($evenement)) {
            if (!$user || (!$this->isGranted('ROLE_ADMIN') && !$this->isGranted('ROLE_ORGANISATEUR'))) {
                return $this->json(['error' => 'Événement non trouvé'], Response::HTTP_NOT_FOUND);
            }
        }

        // Sérialisation avec groupes pour exposer les champs nécessaires
        $data = $this->serializer->serialize(
            $evenement,
            'json',
            ['groups' => ['evenement:read', 'user:public']]
        );

        return new JsonResponse($data, Response::HTTP_OK, [], true);
    }


    #[IsGranted('ROLE_ORGANISATEUR')]
    #[Route('/{id}', name: 'edit', methods: ['PUT'])]
    #[OA\Put(
        summary: 'Modifier un événement',
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                type: 'object',
                properties: [
                    new OA\Property(property: 'titre', type: 'string'),
                    new OA\Property(property: 'description', type: 'string'),
                    new OA\Property(property: 'start', type: 'string', format: 'date-time'),
                    new OA\Property(property: 'end', type: 'string', format: 'date-time'),
                    new OA\Property(property: 'image', type: 'string', nullable: true)
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Événement modifié'),
            new OA\Response(response: 400, description: 'Données invalides'),
            new OA\Response(response: 404, description: 'Événement non trouvé'),
        ]
    )]
    public function edit(Request $request, int $id): Response
    {
        try {
            $evenement = $this->repository->find($id);

            if (!$evenement) {
                return $this->json(['error' => "Aucun événement trouvé"], Response::HTTP_NOT_FOUND);
            }

            // Vérifier que l'utilisateur peut modifier cet événement
            $user = $this->getUser();
            if (!$this->isGranted('ROLE_ADMIN') && $evenement->getOrganisateur() !== $user) {
                return $this->json(['error' => 'Vous n\'avez pas les droits pour modifier cet événement'], Response::HTTP_FORBIDDEN);
            }

            $data = json_decode($request->getContent(), true);
            
            if (!$data) {
                return $this->json(['error' => "Données invalides"], Response::HTTP_BAD_REQUEST);
            }

            // Log des données reçues pour debug
            error_log("Données reçues pour modification événement $id: " . print_r($data, true));

        // Mise à jour des champs
        if (isset($data['titre'])) {
            if (empty(trim($data['titre']))) {
                return $this->json(['error' => "Le titre ne peut pas être vide"], Response::HTTP_BAD_REQUEST);
            }
            $evenement->setTitre($data['titre']);
        }

        if (isset($data['description'])) {
            if (empty(trim($data['description']))) {
                return $this->json(['error' => "La description ne peut pas être vide"], Response::HTTP_BAD_REQUEST);
            }
            $evenement->setDescription($data['description']);
        }

        if (isset($data['start'])) {
            try {
                $startDate = new \DateTimeImmutable($data['start']);
                $evenement->setStart($startDate);
            } catch (\Exception $e) {
                return $this->json(['error' => "Format de date de début invalide"], Response::HTTP_BAD_REQUEST);
            }
        }

        if (isset($data['end'])) {
            try {
                $endDate = new \DateTimeImmutable($data['end']);
                $evenement->setEnd($endDate);
            } catch (\Exception $e) {
                return $this->json(['error' => "Format de date de fin invalide"], Response::HTTP_BAD_REQUEST);
            }
        }

        // Validation des dates
        if ($evenement->getStart() && $evenement->getEnd() && $evenement->getStart() >= $evenement->getEnd()) {
            return $this->json(['error' => "La date de fin doit être postérieure à la date de début"], Response::HTTP_BAD_REQUEST);
        }

        $this->manager->flush();

        $evenementData = $this->serializer->serialize($evenement, 'json', ['groups' => ['evenement_details']]);
        return new JsonResponse($evenementData, Response::HTTP_OK, [], true);
        
        } catch (\Exception $e) {
            error_log("Erreur lors de la modification de l'événement $id: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            return $this->json(['error' => 'Erreur interne du serveur: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/{id}/image', name: 'upload_image', methods: ['POST'])]
    #[OA\Post(
        summary: 'Upload image pour un événement',
        security: [['X-AUTH-TOKEN' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    type: 'object',
                    properties: [
                        new OA\Property(property: 'image', type: 'string', format: 'binary')
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Image uploadée avec succès'),
            new OA\Response(response: 404, description: 'Événement non trouvé'),
            new OA\Response(response: 400, description: 'Erreur lors de l\'upload')
        ]
    )]
    public function uploadImage(Request $request, int $id): Response
    {
        $evenement = $this->repository->find($id);

        if (!$evenement) {
            return $this->json(['error' => "Aucun événement trouvé"], Response::HTTP_NOT_FOUND);
        }

        // Vérifier que l'utilisateur peut modifier cet événement
        $user = $this->getUser();
        if (!$this->isGranted('ROLE_ADMIN') && $evenement->getOrganisateur() !== $user) {
            return $this->json(['error' => 'Vous n\'avez pas les droits pour modifier cet événement'], Response::HTTP_FORBIDDEN);
        }

        $imageFile = $request->files->get('image');
        
        if (!$imageFile) {
            return $this->json(['error' => 'Aucun fichier image fourni'], Response::HTTP_BAD_REQUEST);
        }

        // Validation du fichier
        $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!in_array($imageFile->getMimeType(), $allowedMimes)) {
            return $this->json(['error' => 'Format d\'image non supporté. Utilisez JPG, PNG ou GIF.'], Response::HTTP_BAD_REQUEST);
        }

        if ($imageFile->getSize() > 5 * 1024 * 1024) { // 5MB max
            return $this->json(['error' => 'Image trop volumineuse (max 5MB)'], Response::HTTP_BAD_REQUEST);
        }

        // Upload de l'image
        $uploadsDirectory = $this->getParameter('kernel.project_dir') . '/public/Images/images event/';
        if (!is_dir($uploadsDirectory)) {
            mkdir($uploadsDirectory, 0777, true);
        }

        $originalFilename = pathinfo($imageFile->getClientOriginalName(), PATHINFO_FILENAME);
        $safeFilename = transliterator_transliterate('Any-Latin; Latin-ASCII; [^A-Za-z0-9_] remove; Lower()', $originalFilename);
        $fileName = $safeFilename . '-' . uniqid() . '.' . $imageFile->guessExtension();

        try {
            $imageFile->move($uploadsDirectory, $fileName);
            $imagePath = '/Images/images event/' . $fileName;
            
            return $this->json([
                'message' => 'Image uploadée avec succès',
                'imagePath' => $imagePath
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Erreur lors du téléchargement de l\'image'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[IsGranted('ROLE_ADMIN')]
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[OA\Delete(
        summary: 'Supprimer un événement',
        security: [['X-AUTH-TOKEN' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
        ],
        responses: [
            new OA\Response(response: 200, description: 'Événement supprimé'),
            new OA\Response(response: 404, description: 'Événement non trouvé'),
        ]
    )]
    public function delete(int $id): Response
    {
        if (!$this->isGranted('ROLE_ORGANISATEUR') && !$this->isGranted('ROLE_ADMIN')) {
            return $this->json(['error' => 'Accès non autorisé'], Response::HTTP_FORBIDDEN);
        }

        $evenement = $this->repository->find($id);

        if (!$evenement) {
            return $this->json(['error' => "Aucun événement trouvé"], Response::HTTP_NOT_FOUND);
        }

        $this->manager->remove($evenement);
        $this->manager->flush();

        return $this->json(['message' => "Événement supprimé"], Response::HTTP_OK);
    }

    #[IsGranted('ROLE_ADMIN')]
    #[Route('/{id}/valider', name: 'evenement_valider', methods: ['PUT'])]
    #[OA\Put(
        summary: 'Valider un événement',
        security: [['X-AUTH-TOKEN' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
        ],
        responses: [
            new OA\Response(response: 200, description: 'Événement validé'),
            new OA\Response(response: 404, description: 'Événement non trouvé'),
        ]
    )]

    public function valider(Evenements $evenement, EntityManagerInterface $em): JsonResponse
    {
        $evenement->setStatut(Evenements::STATUT_VALIDE);
        $em->flush();

        return new JsonResponse([
            'message' => 'Événement validé avec succès',
            'statut' => $evenement->getStatut(),
        ]);
    }

    #[IsGranted('ROLE_ADMIN')]
    #[Route('/{id}/refuser', name: 'evenement_refuser', methods: ['PUT'])]
    #[OA\Put(
        summary: 'Refuser un événement',
        security: [['X-AUTH-TOKEN' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
        ],
        responses: [
            new OA\Response(response: 200, description: 'Événement refusé'),
            new OA\Response(response: 404, description: 'Événement non trouvé'),
        ]
    )]
    public function refuser(Evenements $evenement, EntityManagerInterface $em): JsonResponse
    {
        $evenement->setStatut('refusé');
        $em->flush();

        return new JsonResponse([
            'message' => 'Événement refusé',
            'statut' => $evenement->getStatut(),
        ]);
    }

    #[Route('/{id}/demarrer', name: 'evenement_demarrer', methods: ['PUT'])]
    #[OA\Put(
        summary: 'Démarrer un événement (organisateur uniquement)',
        security: [['X-AUTH-TOKEN' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
        ],
        responses: [
            new OA\Response(response: 200, description: 'Événement démarré'),
            new OA\Response(response: 403, description: 'Accès non autorisé'),
            new OA\Response(response: 404, description: 'Événement non trouvé'),
            new OA\Response(response: 400, description: 'Événement ne peut pas être démarré'),
        ]
    )]
    public function demarrer(Evenements $evenement): JsonResponse
    {
        $user = $this->getUser();
        
        // Debug : vérifier l'utilisateur
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non connecté'], Response::HTTP_UNAUTHORIZED);
        }
        
        $isAdmin = $this->isGranted('ROLE_ADMIN');
        
        // Simplification temporaire : permettre à tous les admins
        if (!$isAdmin) {
            return $this->json([
                'error' => 'Seul un admin peut tester cette fonctionnalité',
                'debug' => [
                    'user_id' => $user->getId(),
                    'user_email' => $user->getEmail(),
                    'user_roles' => $user->getRoles(),
                    'is_admin' => $isAdmin
                ]
            ], Response::HTTP_FORBIDDEN);
        }
        
        // Vérifier que l'utilisateur est l'organisateur ou un admin
        $isAdmin = $this->isGranted('ROLE_ADMIN');
        $isOrganizer = $evenement->getOrganisateur() === $user;
        
        if (!$isOrganizer && !$isAdmin) {
            return $this->json([
                'error' => 'Seul l\'organisateur ou un admin peut démarrer cet événement'
            ], Response::HTTP_FORBIDDEN);
        }
        
        // Vérifier que l'événement peut être démarré
        if (!$evenement->canBeStarted()) {
            return $this->json([
                'error' => 'Cet événement ne peut pas être démarré maintenant. Il doit être en cours (30 minutes avant le début jusqu\'à la fin) et avoir le statut "en_cours".'
            ], Response::HTTP_BAD_REQUEST);
        }
        
        // Démarrer l'événement
        $evenement->setStatut(Evenements::STATUT_DEMARRE);
        $this->manager->flush();

        return new JsonResponse([
            'message' => 'Événement démarré avec succès',
            'statut' => $evenement->getStatut(),
        ]);
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $user = $this->getUser();
        $qb = $this->repository->createQueryBuilder('e');
        
        // Si l'utilisateur n'est pas ADMIN ou ORGANISATEUR, ne montrer que les événements validés
        if (!$user || (!$this->isGranted('ROLE_ADMIN') && !$this->isGranted('ROLE_ORGANISATEUR'))) {
            $qb->where('e.statut = :statut')
               ->setParameter('statut', Evenements::STATUT_VALIDE);
        }
        
        $evenements = $qb->getQuery()->getResult();
        $data = $this->serializer->serialize(
            $evenements,
            'json',
            ['groups' => ['evenement:read', 'user:public']]
        );
        return new JsonResponse($data, Response::HTTP_OK, [], true);
    }

    #[Route('/search', name: 'search', methods: ['GET'])]
    #[OA\Get(
        summary: 'Rechercher des événements avec des critères avancés',
        parameters: [
            new OA\Parameter(
                name: 'titre',
                in: 'query',
                description: 'Recherche dans le titre de l\'événement',
                schema: new OA\Schema(type: 'string')
            ),
            new OA\Parameter(
                name: 'organisateur',
                in: 'query',
                description: 'Recherche par nom d\'organisateur',
                schema: new OA\Schema(type: 'string')
            ),
            new OA\Parameter(
                name: 'minParticipants',
                in: 'query',
                description: 'Nombre minimum de participants',
                schema: new OA\Schema(type: 'integer', minimum: 0)
            ),
            new OA\Parameter(
                name: 'maxParticipants',
                in: 'query',
                description: 'Nombre maximum de participants',
                schema: new OA\Schema(type: 'integer', minimum: 0)
            ),
            new OA\Parameter(
                name: 'dateStart',
                in: 'query',
                description: 'Événements après cette date',
                schema: new OA\Schema(type: 'string', format: 'date')
            ),
            new OA\Parameter(
                name: 'dateEnd',
                in: 'query',
                description: 'Événements avant cette date',
                schema: new OA\Schema(type: 'string', format: 'date')
            ),
            new OA\Parameter(
                name: 'page',
                in: 'query',
                description: 'Numéro de page',
                schema: new OA\Schema(type: 'integer', minimum: 1, default: 1)
            ),
            new OA\Parameter(
                name: 'limit',
                in: 'query',
                description: 'Nombre d\'éléments par page',
                schema: new OA\Schema(type: 'integer', minimum: 1, maximum: 50, default: 10)
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Liste des événements trouvés',
                content: new OA\JsonContent(
                    type: 'object',
                    properties: [
                        new OA\Property(property: 'events', type: 'array', items: new OA\Items(ref: '#/components/schemas/Evenement')),
                        new OA\Property(property: 'totalCount', type: 'integer', description: 'Nombre total d\'événements trouvés'),
                        new OA\Property(property: 'page', type: 'integer', description: 'Page actuelle'),
                        new OA\Property(property: 'limit', type: 'integer', description: 'Éléments par page'),
                        new OA\Property(property: 'totalPages', type: 'integer', description: 'Nombre total de pages')
                    ]
                )
            )
        ]
    )]
    public function search(Request $request): JsonResponse
    {
        $user = $this->getUser();
        $qb = $this->repository->createQueryBuilder('e');
        
        // Si l'utilisateur n'est pas ADMIN ou ORGANISATEUR, ne montrer que les événements validés
        if (!$user || (!$this->isGranted('ROLE_ADMIN') && !$this->isGranted('ROLE_ORGANISATEUR'))) {
            $qb->where('e.statut = :statut')
               ->setParameter('statut', Evenements::STATUT_VALIDE);
        }
        
        $paramCounter = 1;
        
        // Recherche par titre
        if ($titre = $request->query->get('titre')) {
            $qb->andWhere('LOWER(e.titre) LIKE :titre' . $paramCounter)
               ->setParameter('titre' . $paramCounter, '%' . strtolower($titre) . '%');
            $paramCounter++;
        }
        
        // Recherche par organisateur
        if ($organisateur = $request->query->get('organisateur')) {
            $qb->leftJoin('e.organisateur', 'u')
               ->andWhere('LOWER(u.username) LIKE :organisateur' . $paramCounter)
               ->setParameter('organisateur' . $paramCounter, '%' . strtolower($organisateur) . '%');
            $paramCounter++;
        }
        
        // Recherche par nombre de participants (minimum)
        if ($minParticipants = $request->query->get('minParticipants')) {
            if (is_numeric($minParticipants) && $minParticipants >= 0) {
                $qb->andWhere('e.numberCompetitors >= :minParticipants' . $paramCounter)
                   ->setParameter('minParticipants' . $paramCounter, (int)$minParticipants);
                $paramCounter++;
            }
        }
        
        // Recherche par nombre de participants (maximum)
        if ($maxParticipants = $request->query->get('maxParticipants')) {
            if (is_numeric($maxParticipants) && $maxParticipants >= 0) {
                $qb->andWhere('e.numberCompetitors <= :maxParticipants' . $paramCounter)
                   ->setParameter('maxParticipants' . $paramCounter, (int)$maxParticipants);
                $paramCounter++;
            }
        }
        
        // Recherche par date de début (événements après cette date)
        if ($dateStart = $request->query->get('dateStart')) {
            try {
                $startDate = new \DateTimeImmutable($dateStart);
                $qb->andWhere('e.start >= :dateStart' . $paramCounter)
                   ->setParameter('dateStart' . $paramCounter, $startDate);
                $paramCounter++;
            } catch (\Exception $e) {
                // Date invalide, on l'ignore
            }
        }
        
        // Recherche par date de fin (événements avant cette date)
        if ($dateEnd = $request->query->get('dateEnd')) {
            try {
                $endDate = new \DateTimeImmutable($dateEnd);
                // Ajouter 23:59:59 pour inclure toute la journée
                $endDate = $endDate->setTime(23, 59, 59);
                $qb->andWhere('e.start <= :dateEnd' . $paramCounter)
                   ->setParameter('dateEnd' . $paramCounter, $endDate);
                $paramCounter++;
            } catch (\Exception $e) {
                // Date invalide, on l'ignore
            }
        }
        
        // Tri par date de début (les plus récents d'abord)
        $qb->orderBy('e.start', 'DESC');
        
        // Pagination
        $page = max(1, (int)$request->query->get('page', 1));
        $limit = min(50, max(1, (int)$request->query->get('limit', 10)));
        $offset = ($page - 1) * $limit;
        
        // Compter le nombre total d'éléments
        $countQb = clone $qb;
        $totalCount = $countQb->select('COUNT(e.id)')->getQuery()->getSingleScalarResult();
        
        // Appliquer la pagination
        $qb->setFirstResult($offset)->setMaxResults($limit);
        
        $evenements = $qb->getQuery()->getResult();
        
        $data = $this->serializer->serialize(
            $evenements,
            'json',
            ['groups' => ['evenement:read', 'user:public']]
        );
        
        $events = json_decode($data, true);
        
        return $this->json([
            'events' => $events,
            'totalCount' => (int)$totalCount,
            'page' => $page,
            'limit' => $limit,
            'totalPages' => (int)ceil($totalCount / $limit)
        ]);
    }

    #[Route('/en-cours', name: 'current', methods: ['GET'])]
    public function current(): JsonResponse
    {
        // Option 1: Mise à jour complète (plus sûr mais plus lent)
        // $this->eventStatusService->updateAllEventsStatus();
        // $events = $this->eventStatusService->getCurrentEvents();
        
        // Option 2: Récupération directe des événements "en_cours" (plus rapide)
        // Faire une mise à jour périodique via cron recommandée
        $events = $this->eventStatusService->getEventsEnCours(3);
        
        if (!$events || count($events) === 0) {
            return $this->json([], Response::HTTP_OK);
        }
        
        $data = $this->serializer->serialize(
            $events,
            'json',
            ['groups' => ['evenement:read', 'user:public']]
        );
        return new JsonResponse(json_decode($data), Response::HTTP_OK, []);
    }

    #[Route('/{id}/participer', name: 'participate', methods: ['POST'], requirements: ['id' => '\d+'])]
    #[OA\Post(
        summary: 'Participer à un événement',
        security: [['X-AUTH-TOKEN' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
        ],
        responses: [
            new OA\Response(response: 200, description: 'Participation ajoutée'),
            new OA\Response(response: 400, description: 'Déjà participant ou action impossible'),
            new OA\Response(response: 401, description: 'Non authentifié'),
            new OA\Response(response: 404, description: 'Événement non trouvé'),
        ]
    )]
    public function participate(int $id): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
        }

        $evenement = $this->repository->find($id);
        if (!$evenement) {
            return $this->json(['error' => 'Événement non trouvé'], Response::HTTP_NOT_FOUND);
        }

        // Vérifier les permissions pour les événements en attente
        if (!$this->isEventAccessible($evenement)) {
            if (!$this->isGranted('ROLE_ADMIN') && !$this->isGranted('ROLE_ORGANISATEUR')) {
                return $this->json(['error' => 'Événement non trouvé'], Response::HTTP_NOT_FOUND);
            }
        }

        // Vérifier si l'utilisateur participe déjà
        $existingParticipation = $this->participationRepository->findByUserAndEvent($user, $evenement);
        if ($existingParticipation) {
            $status = $existingParticipation->getStatut();
            
            // Si le statut est null, le mettre à jour vers 'en_attente'
            if ($status === null || $status === '') {
                $existingParticipation->setStatut(Participation::STATUT_EN_ATTENTE);
                $this->manager->flush();
                $status = Participation::STATUT_EN_ATTENTE;
            }
            
            $message = match($status) {
                Participation::STATUT_EN_ATTENTE => 'Votre demande de participation est en attente de validation',
                Participation::STATUT_VALIDE => 'Vous participez déjà à cet événement',
                Participation::STATUT_REFUSE => 'Votre participation a été refusée',
                default => 'Statut de participation inconnu'
            };
            return $this->json(['error' => $message, 'statut' => $status], Response::HTTP_BAD_REQUEST);
        }

        // Créer une nouvelle participation
        $participation = new Participation();
        $participation->setUser($user);
        $participation->setEvenement($evenement);
        $participation->setStatut(Participation::STATUT_EN_ATTENTE);

        $this->manager->persist($participation);
        $this->manager->flush();

        return $this->json([
            'message' => 'Demande de participation soumise. En attente de validation par l\'organisateur.',
            'statut' => Participation::STATUT_EN_ATTENTE
        ]);
    }

    #[Route('/{id}/annuler-participation', name: 'cancel_participation', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    #[OA\Delete(
        summary: 'Annuler sa participation à un événement',
        security: [['X-AUTH-TOKEN' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
        ],
        responses: [
            new OA\Response(response: 200, description: 'Participation annulée'),
            new OA\Response(response: 400, description: 'Pas participant ou action impossible'),
            new OA\Response(response: 401, description: 'Non authentifié'),
            new OA\Response(response: 404, description: 'Événement non trouvé'),
        ]
    )]
    public function cancelParticipation(int $id): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
        }

        $evenement = $this->repository->find($id);
        if (!$evenement) {
            return $this->json(['error' => 'Événement non trouvé'], Response::HTTP_NOT_FOUND);
        }

        // Vérifier les permissions pour les événements en attente
        if (!$this->isEventAccessible($evenement)) {
            if (!$this->isGranted('ROLE_ADMIN') && !$this->isGranted('ROLE_ORGANISATEUR')) {
                return $this->json(['error' => 'Événement non trouvé'], Response::HTTP_NOT_FOUND);
            }
        }

        // Vérifier si l'utilisateur participe
        $participation = $this->participationRepository->findByUserAndEvent($user, $evenement);
        if (!$participation) {
            return $this->json(['error' => 'Vous ne participez pas à cet événement'], Response::HTTP_BAD_REQUEST);
        }

        // Supprimer la participation
        $this->manager->remove($participation);
        $this->manager->flush();

        return $this->json([
            'message' => 'Participation annulée avec succès',
            'participants' => $evenement->getNumberCompetitors()
        ]);
    }

    #[Route('/{id}/statut-participation', name: 'participation_status', methods: ['GET'], requirements: ['id' => '\d+'])]
    #[OA\Get(
        summary: 'Vérifier le statut de participation à un événement',
        security: [['X-AUTH-TOKEN' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
        ],
        responses: [
            new OA\Response(response: 200, description: 'Statut de participation'),
            new OA\Response(response: 401, description: 'Non authentifié'),
            new OA\Response(response: 404, description: 'Événement non trouvé'),
        ]
    )]
    public function participationStatus(int $id): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
        }

        $evenement = $this->repository->find($id);
        if (!$evenement) {
            return $this->json(['error' => 'Événement non trouvé'], Response::HTTP_NOT_FOUND);
        }

        // Vérifier les permissions pour les événements en attente
        if (!$this->isEventAccessible($evenement)) {
            if (!$this->isGranted('ROLE_ADMIN') && !$this->isGranted('ROLE_ORGANISATEUR')) {
                return $this->json(['error' => 'Événement non trouvé'], Response::HTTP_NOT_FOUND);
            }
        }

        $participation = $this->participationRepository->findByUserAndEvent($user, $evenement);
        $isOrganizer = $evenement->getOrganisateur() === $user;

        // Compter les participations validées
        $validatedCount = $this->participationRepository->countValidatedByEvent($evenement);

        return $this->json([
            'isParticipant' => $participation && $participation->getStatut() === 'validee',
            'participationStatut' => $participation ? $participation->getStatut() : null,
            'isOrganizer' => $isOrganizer,
            'participants' => $validatedCount
        ]);
    }

    #[Route('/{id}/participations', name: 'event_participations', methods: ['GET'], requirements: ['id' => '\d+'])]
    #[OA\Get(
        summary: 'Obtenir toutes les participations à un événement',
        security: [['X-AUTH-TOKEN' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
        ],
        responses: [
            new OA\Response(response: 200, description: 'Liste des participations'),
            new OA\Response(response: 401, description: 'Non authentifié'),
            new OA\Response(response: 403, description: 'Accès non autorisé'),
            new OA\Response(response: 404, description: 'Événement non trouvé'),
        ]
    )]
    public function getEventParticipations(int $id): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
        }

        $evenement = $this->repository->find($id);
        if (!$evenement) {
            return $this->json(['error' => 'Événement non trouvé'], Response::HTTP_NOT_FOUND);
        }

        // Seul l'organisateur ou un admin peut voir toutes les participations
        if ($evenement->getOrganisateur() !== $user && !$this->isGranted('ROLE_ADMIN')) {
            return $this->json(['error' => 'Accès non autorisé'], Response::HTTP_FORBIDDEN);
        }

        $participations = $this->participationRepository->findByEvent($evenement);
        
        $data = $this->serializer->serialize(
            $participations,
            'json',
            ['groups' => ['participation:read', 'user:public']]
        );

        return new JsonResponse($data, Response::HTTP_OK, [], true);
    }

    #[Route('/{id}/participants', name: 'event_participants_public', methods: ['GET'], requirements: ['id' => '\d+'])]
    #[OA\Get(
        summary: 'Obtenir la liste publique des participants validés d\'un événement',
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
        ],
        responses: [
            new OA\Response(response: 200, description: 'Liste de tous les participants'),
            new OA\Response(response: 404, description: 'Événement non trouvé'),
        ]
    )]
    public function getEventParticipantsPublic(int $id): JsonResponse
    {
        $evenement = $this->repository->find($id);
        if (!$evenement) {
            return $this->json(['error' => 'Événement non trouvé'], Response::HTTP_NOT_FOUND);
        }

        // Vérifier les permissions pour les événements en attente
        $user = $this->getUser();
        if (!$this->isEventAccessible($evenement)) {
            if (!$user || (!$this->isGranted('ROLE_ADMIN') && !$this->isGranted('ROLE_ORGANISATEUR'))) {
                return $this->json(['error' => 'Événement non trouvé'], Response::HTTP_NOT_FOUND);
            }
        }

        // Récupérer les participations non refusées (validées + en attente)
        $participations = $this->participationRepository->findNonRejectedByEvent($evenement);
        
        $data = $this->serializer->serialize(
            $participations,
            'json',
            ['groups' => ['participation:read', 'user:public']]
        );

        return new JsonResponse($data, Response::HTTP_OK, [], true);
    }

    #[Route('/{eventId}/participations/{userId}/valider', name: 'validate_participation', methods: ['POST'], requirements: ['eventId' => '\d+', 'userId' => '\d+'])]
    #[OA\Post(
        summary: 'Valider une participation à un événement',
        security: [['X-AUTH-TOKEN' => []]],
        parameters: [
            new OA\Parameter(name: 'eventId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'userId', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
        ],
        responses: [
            new OA\Response(response: 200, description: 'Participation validée'),
            new OA\Response(response: 401, description: 'Non authentifié'),
            new OA\Response(response: 403, description: 'Accès non autorisé'),
            new OA\Response(response: 404, description: 'Participation non trouvée'),
        ]
    )]
    public function validateParticipation(int $eventId, int $userId): JsonResponse
    {
        $currentUser = $this->getUser();
        if (!$currentUser) {
            return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
        }

        $evenement = $this->repository->find($eventId);
        if (!$evenement) {
            return $this->json(['error' => 'Événement non trouvé'], Response::HTTP_NOT_FOUND);
        }

        // Seul l'organisateur ou un admin peut valider une participation
        if ($evenement->getOrganisateur() !== $currentUser && !$this->isGranted('ROLE_ADMIN')) {
            return $this->json(['error' => 'Accès non autorisé'], Response::HTTP_FORBIDDEN);
        }

        $user = $this->userRepository->find($userId);
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
        }
        
        $participation = $this->participationRepository->findByUserAndEvent($user, $evenement);
        if (!$participation) {
            return $this->json(['error' => 'Participation non trouvée'], Response::HTTP_NOT_FOUND);
        }

        if ($participation->getStatut() === Participation::STATUT_VALIDE) {
            return $this->json(['error' => 'Participation déjà validée'], Response::HTTP_BAD_REQUEST);
        }

        $participation->setStatut(Participation::STATUT_VALIDE);
        $this->manager->flush();

        return $this->json(['message' => 'Participation validée avec succès']);
    }

    #[Route('/{eventId}/participations/{userId}/refuser', name: 'reject_participation', methods: ['POST'], requirements: ['eventId' => '\d+', 'userId' => '\d+'])]
    #[OA\Post(
        summary: 'Refuser une participation à un événement',
        security: [['X-AUTH-TOKEN' => []]],
        parameters: [
            new OA\Parameter(name: 'eventId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'userId', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
        ],
        responses: [
            new OA\Response(response: 200, description: 'Participation refusée'),
            new OA\Response(response: 401, description: 'Non authentifié'),
            new OA\Response(response: 403, description: 'Accès non autorisé'),
            new OA\Response(response: 404, description: 'Participation non trouvée'),
        ]
    )]
    public function rejectParticipation(int $eventId, int $userId): JsonResponse
    {
        $currentUser = $this->getUser();
        if (!$currentUser) {
            return $this->json(['error' => 'Non authentifié'], Response::HTTP_UNAUTHORIZED);
        }

        $evenement = $this->repository->find($eventId);
        if (!$evenement) {
            return $this->json(['error' => 'Événement non trouvé'], Response::HTTP_NOT_FOUND);
        }

        // Seul l'organisateur ou un admin peut refuser une participation
        if ($evenement->getOrganisateur() !== $currentUser && !$this->isGranted('ROLE_ADMIN')) {
            return $this->json(['error' => 'Accès non autorisé'], Response::HTTP_FORBIDDEN);
        }

        $user = $this->userRepository->find($userId);
        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
        }
        
        $participation = $this->participationRepository->findByUserAndEvent($user, $evenement);
        if (!$participation) {
            return $this->json(['error' => 'Participation non trouvée'], Response::HTTP_NOT_FOUND);
        }

        if ($participation->getStatut() === Participation::STATUT_REFUSE) {
            return $this->json(['error' => 'Participation déjà refusée'], Response::HTTP_BAD_REQUEST);
        }

        $participation->setStatut(Participation::STATUT_REFUSE);
        $this->manager->flush();

        return $this->json(['message' => 'Participation refusée']);
    }

    /**
     * Méthode utilitaire pour uploader et créer une ImageEvenement
     */
    private function handleImageUpload(\Symfony\Component\HttpFoundation\File\UploadedFile $imageFile, Evenements $evenement, ?string $customDescription = null): ?ImageEvenement
    {
        // Validation du type de fichier
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($imageFile->getMimeType(), $allowedTypes)) {
            throw new \InvalidArgumentException('Type de fichier non autorisé. Seuls les formats JPEG, PNG, GIF et WebP sont acceptés.');
        }
        
        // Validation de la taille (5MB max)
        if ($imageFile->getSize() > 5 * 1024 * 1024) {
            throw new \InvalidArgumentException('Le fichier est trop volumineux. Taille maximum: 5MB.');
        }
        
        // Upload de fichier
        $uploadsDirectory = $this->getParameter('kernel.project_dir') . '/public/Images/images event/';
        if (!is_dir($uploadsDirectory)) {
            mkdir($uploadsDirectory, 0755, true);
        }
        
        $originalFilename = pathinfo($imageFile->getClientOriginalName(), PATHINFO_FILENAME);
        $safeFilename = transliterator_transliterate('Any-Latin; Latin-ASCII; [^A-Za-z0-9_] remove; Lower()', $originalFilename);
        $fileName = $safeFilename . '-' . uniqid() . '.' . $imageFile->guessExtension();
        
        try {
            $imageFile->move($uploadsDirectory, $fileName);
            
            // Créer l'entité ImageEvenement
            $imageEntity = new ImageEvenement();
            $imageEntity->setFilename($fileName);
            // Utiliser la description personnalisée si fournie, sinon le nom original du fichier
            $imageEntity->setOriginalName($customDescription ?: $imageFile->getClientOriginalName());
            $imageEntity->setEvenement($evenement);
            
            $this->manager->persist($imageEntity);
            
            return $imageEntity;
        } catch (\Exception $e) {
            throw new \RuntimeException('Erreur lors du téléchargement de l\'image');
        }
    }

    #[Route('/{id}/images', name: 'upload_images', methods: ['POST'])]
    #[OA\Post(
        summary: 'Ajouter des images à un événement',
        security: [['X-AUTH-TOKEN' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
        ]
    )]
    public function uploadImages(Request $request, int $id): Response
    {
        $evenement = $this->repository->find($id);
        if (!$evenement) {
            return $this->json(['error' => 'Événement non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $user = $this->getUser();
        if (!$user || ($evenement->getOrganisateur() !== $user && !$this->isGranted('ROLE_ADMIN'))) {
            return $this->json(['error' => 'Non autorisé'], Response::HTTP_FORBIDDEN);
        }

        $images = $request->files->get('images', []);
        $imageUrl = $request->request->get('imageUrl');
        $imageDescription = $request->request->get('imageDescription'); // Nouveau paramètre
        
        if (empty($images) && empty($imageUrl)) {
            return $this->json(['error' => 'Aucune image ou URL fournie'], Response::HTTP_BAD_REQUEST);
        }

        $uploadedImages = [];
        
        try {
            // Traiter les fichiers images
            foreach ($images as $imageFile) {
                $imageEntity = $this->handleImageUpload($imageFile, $evenement, $imageDescription);
                $uploadedImages[] = $imageEntity;
            }
            
            // Traiter l'URL d'image
            if ($imageUrl && filter_var($imageUrl, FILTER_VALIDATE_URL)) {
                $imageEntity = new ImageEvenement();
                $imageEntity->setEvenement($evenement);
                $imageEntity->setFilename($imageUrl); // Stocker l'URL dans filename
                // Utiliser la description personnalisée si fournie, sinon le nom de domaine de l'URL
                $imageEntity->setOriginalName($imageDescription ?: ('URL: ' . parse_url($imageUrl, PHP_URL_HOST)));
                
                $this->manager->persist($imageEntity);
                $uploadedImages[] = $imageEntity;
            } elseif ($imageUrl) {
                throw new \Exception('URL d\'image invalide');
            }
            
            $this->manager->flush();
            
            return $this->json([
                'message' => 'Images ajoutées avec succès',
                'images' => array_map(fn($img) => [
                    'id' => $img->getId(),
                    'url' => $img->getUrl(),
                    'filename' => $img->getFilename()
                ], $uploadedImages)
            ]);
            
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }
    }

    #[Route('/{eventId}/images/{imageId}', name: 'delete_image', methods: ['DELETE'])]
    #[OA\Delete(
        summary: 'Supprimer une image d\'événement',
        security: [['X-AUTH-TOKEN' => []]],
        parameters: [
            new OA\Parameter(name: 'eventId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'imageId', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
        ]
    )]
    public function deleteImage(int $eventId, int $imageId): Response
    {
        $evenement = $this->repository->find($eventId);
        if (!$evenement) {
            return $this->json(['error' => 'Événement non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $user = $this->getUser();
        if (!$user || ($evenement->getOrganisateur() !== $user && !$this->isGranted('ROLE_ADMIN'))) {
            return $this->json(['error' => 'Non autorisé'], Response::HTTP_FORBIDDEN);
        }

        $image = $this->imageRepository->find($imageId);
        if (!$image || $image->getEvenement() !== $evenement) {
            return $this->json(['error' => 'Image non trouvée'], Response::HTTP_NOT_FOUND);
        }

        // Supprimer le fichier physique
        $filePath = $image->getFullPath();
        if (file_exists($filePath)) {
            unlink($filePath);
        }

        // Supprimer l'entité
        $this->manager->remove($image);
        $this->manager->flush();

        return $this->json(['message' => 'Image supprimée avec succès']);
    }
}