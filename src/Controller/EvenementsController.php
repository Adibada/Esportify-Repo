<?php

namespace App\Controller;

use App\Entity\Evenements;
use App\Repository\EvenementsRepository;
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
use Sensio\Bundle\FrameworkExtraBundle\Configuration\ParamConverter;

#[Route('api/evenements', name: 'app_api_evenements_')]
class EvenementsController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $manager,
        private EvenementsRepository $repository,
        private SerializerInterface $serializer,
        private UrlGeneratorInterface $urlGenerator
    ) {}

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
        
        // Définir les propriétés de base
        $evenement->setTitre($name);
        $evenement->setDescription($detail);
        $evenement->setStart(new \DateTimeImmutable($dateStart));
        $evenement->setEnd(new \DateTimeImmutable($dateEnd));
        $evenement->setOrganisateur($user);
        
        // Gestion de l'image
        $imageFile = $request->files->get('image');
        $imageUrl = $request->request->get('imageUrl');
        
        if ($imageFile) {
            // Upload de fichier
            $uploadsDirectory = $this->getParameter('kernel.project_dir') . '/public/Images/images event/';
            if (!is_dir($uploadsDirectory)) {
                mkdir($uploadsDirectory, 0777, true);
            }
            
            $originalFilename = pathinfo($imageFile->getClientOriginalName(), PATHINFO_FILENAME);
            $safeFilename = transliterator_transliterate('Any-Latin; Latin-ASCII; [^A-Za-z0-9_] remove; Lower()', $originalFilename);
            $fileName = $safeFilename . '-' . uniqid() . '.' . $imageFile->guessExtension();
            
            try {
                $imageFile->move($uploadsDirectory, $fileName);
                $evenement->setImage('Images/images event/' . $fileName);
            } catch (\Exception $e) {
                return $this->json(['error' => 'Erreur lors du téléchargement de l\'image'], Response::HTTP_INTERNAL_SERVER_ERROR);
            }
        } elseif (!empty($imageUrl)) {
            // URL d'image
            $evenement->setImage($imageUrl);
        } else {
            return $this->json(['error' => 'Une image est requise'], Response::HTTP_BAD_REQUEST);
        }

        $this->manager->persist($evenement);
        $this->manager->flush();

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

        $user = $this->getUser();
        
        // Vérifier les permissions pour les événements en attente
        if ($evenement->getStatut() !== 'valide') {
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
                    new OA\Property(property: 'titre', type: 'string')
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Événement modifié'),
            new OA\Response(response: 400, description: 'Titre manquant'),
            new OA\Response(response: 404, description: 'Événement non trouvé'),
        ]
    )]
    public function edit(Request $request, int $id): Response
    {
        $evenement = $this->repository->find($id);

        if (!$evenement) {
            return $this->json(['error' => "Aucun événement trouvé"], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        $nouveauTitre = $data['titre'] ?? null;

        if (!$nouveauTitre) {
            return $this->json(['error' => "Titre manquant"], Response::HTTP_BAD_REQUEST);
        }

        $evenement->setTitre($nouveauTitre);
        $this->manager->flush();

        $data = $this->serializer->serialize($evenement, 'json');
        return new JsonResponse($data, Response::HTTP_OK, [], true);
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
        $evenement->setStatut('valide');
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

    #[Route('/{id}/participer', name: 'participer_evenement', methods: ['POST'])]
    public function participer(int $id, EvenementsRepository $repoEvenements): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) return $this->json(['error' => 'Non authentifié'], 401);

        $event = $repoEvenements->find($id);
        if (!$event) return $this->json(['error' => 'Événement introuvable'], 404);

        $user->addParticipation($event);
        $this->manager->flush();

        return $this->json([
            'message' => "Participation enregistrée",
            'numberCompetitors' => $event->getNumberCompetitors()
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
               ->setParameter('statut', 'valide');
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
               ->setParameter('statut', 'valide');
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
        $now = new \DateTimeImmutable();
        $qb = $this->repository->createQueryBuilder('e');
        $qb->where('e.start <= :now')
           ->andWhere('e.end >= :now')
           ->andWhere('e.statut = :statut')
           ->setParameter('now', $now)
           ->setParameter('statut', 'valide')
           ->setMaxResults(3); // Limite à 3 évènements
        $events = $qb->getQuery()->getResult();
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
        if ($evenement->getStatut() !== 'valide') {
            if (!$this->isGranted('ROLE_ADMIN') && !$this->isGranted('ROLE_ORGANISATEUR')) {
                return $this->json(['error' => 'Événement non trouvé'], Response::HTTP_NOT_FOUND);
            }
        }

        // Vérifier si l'utilisateur participe déjà
        if ($evenement->getCompetitors()->contains($user)) {
            return $this->json(['error' => 'Vous participez déjà à cet événement'], Response::HTTP_BAD_REQUEST);
        }

        // Vérifier si l'utilisateur n'est pas l'organisateur
        if ($evenement->getOrganisateur() === $user) {
            return $this->json(['error' => 'L\'organisateur ne peut pas participer à son propre événement'], Response::HTTP_BAD_REQUEST);
        }

        // Ajouter la participation
        $evenement->addCompetitor($user);
        $this->manager->flush();

        return $this->json([
            'message' => 'Participation ajoutée avec succès',
            'participants' => $evenement->getNumberCompetitors()
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
        if ($evenement->getStatut() !== 'valide') {
            if (!$this->isGranted('ROLE_ADMIN') && !$this->isGranted('ROLE_ORGANISATEUR')) {
                return $this->json(['error' => 'Événement non trouvé'], Response::HTTP_NOT_FOUND);
            }
        }

        // Vérifier si l'utilisateur participe
        if (!$evenement->getCompetitors()->contains($user)) {
            return $this->json(['error' => 'Vous ne participez pas à cet événement'], Response::HTTP_BAD_REQUEST);
        }

        // Retirer la participation
        $evenement->removeCompetitor($user);
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
        if ($evenement->getStatut() !== 'valide') {
            if (!$this->isGranted('ROLE_ADMIN') && !$this->isGranted('ROLE_ORGANISATEUR')) {
                return $this->json(['error' => 'Événement non trouvé'], Response::HTTP_NOT_FOUND);
            }
        }

        $isParticipant = $evenement->getCompetitors()->contains($user);
        $isOrganizer = $evenement->getOrganisateur() === $user;

        return $this->json([
            'isParticipant' => $isParticipant,
            'isOrganizer' => $isOrganizer,
            'participants' => $evenement->getNumberCompetitors()
        ]);
    }
}


