<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\Participation;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('api/users', name: 'app_api_users_')]
class UserController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $manager,
        private UserRepository $repository,
        private SerializerInterface $serializer
    ) {}

    #[Route('/search', name: 'search', methods: ['GET'])]
    #[OA\Get(
        summary: 'Rechercher des utilisateurs par nom',
        parameters: [
            new OA\Parameter(
                name: 'query',
                in: 'query',
                required: true,
                description: 'Terme de recherche',
                schema: new OA\Schema(type: 'string')
            )
        ],
        responses: [
            new OA\Response(response: 200, description: 'Liste des utilisateurs trouvés'),
            new OA\Response(response: 400, description: 'Paramètre de recherche manquant'),
        ]
    )]
    public function search(Request $request): JsonResponse
    {
        $query = $request->query->get('query');
        
        if (!$query || strlen($query) < 2) {
            return $this->json(['error' => 'Le terme de recherche doit contenir au moins 2 caractères'], 400);
        }

        $users = $this->repository->findByUsernameContaining($query);
        
        $result = array_map(function($user) {
            return [
                'id' => $user->getId(),
                'username' => $user->getUserIdentifier(),
                'roles' => $user->getRoles()
            ];
        }, $users);

        return $this->json($result);
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    #[OA\Get(
        summary: 'Afficher un utilisateur par ID',
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
        ],
        responses: [
            new OA\Response(response: 200, description: 'Utilisateur trouvé'),
            new OA\Response(response: 404, description: 'Utilisateur non trouvé'),
        ]
    )]
    public function show(string|int $id): JsonResponse
    {
        $user = $this->repository->find($id);

        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé'], 404);
        }

        $userData = [
            'id' => $user->getId(),
            'username' => $user->getUserIdentifier(),
            'mail' => $user->getMail(),
            'roles' => $user->getRoles(),
            'evenements' => [],
            'participations' => []
        ];

        // Ajouter les événements organisés par l'utilisateur
        foreach ($user->getEvenements() as $event) {
            $userData['evenements'][] = [
                'id' => $event->getId(),
                'titre' => $event->getTitre(),
                'dateDebut' => $event->getStart()?->format('Y-m-d H:i:s'),
                'dateFin' => $event->getEnd()?->format('Y-m-d H:i:s'),
                'statut' => $event->getStatut(),
                'description' => $event->getDescription()
            ];
        }

        // Ajouter les participations (événements où l'utilisateur participe)
        $participationRepository = $this->manager->getRepository(Participation::class);
        $participations = $participationRepository->findBy(['user' => $user]);
        
        foreach ($participations as $participation) {
            $event = $participation->getEvenement();
            $userData['participations'][] = [
                'id' => $event->getId(),
                'titre' => $event->getTitre(),
                'dateDebut' => $event->getStart()?->format('Y-m-d H:i:s'),
                'dateFin' => $event->getEnd()?->format('Y-m-d H:i:s'),
                'statut' => $event->getStatut(), // Statut de l'événement
                'description' => $event->getDescription(),
                'statutParticipation' => $participation->getStatut() // Statut de la participation
            ];
        }

        return $this->json($userData);
    }

    #[Route('/update', name: 'update_profile', methods: ['PUT'])]
    #[OA\Put(
        summary: 'Mettre à jour le profil de l\'utilisateur connecté',
        security: [['X-AUTH-TOKEN' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                type: 'object',
                properties: [
                    new OA\Property(property: 'username', type: 'string'),
                    new OA\Property(property: 'mail', type: 'string', format: 'email'),
                    new OA\Property(property: 'password', type: 'string'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Profil mis à jour avec succès'),
            new OA\Response(response: 400, description: 'Données invalides'),
            new OA\Response(response: 401, description: 'Non authentifié'),
        ]
    )]
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Non authentifié'], 401);
        }

        $data = json_decode($request->getContent(), true);

        // Validation des données
        if (!$data) {
            return $this->json(['error' => 'Données JSON invalides'], 400);
        }

        // Mettre à jour le nom d'utilisateur si fourni
        if (isset($data['username']) && !empty(trim($data['username']))) {
            $username = trim($data['username']);
            
            // Vérifier que le nom d'utilisateur n'est pas déjà pris par un autre utilisateur
            $existingUser = $this->repository->findOneBy(['username' => $username]);
            if ($existingUser && $existingUser->getId() !== $user->getId()) {
                return $this->json(['error' => 'Ce nom d\'utilisateur est déjà pris'], 400);
            }
            
            $user->setUsername($username);
        }

        // Mettre à jour l'email si fourni
        if (isset($data['mail']) && !empty(trim($data['mail']))) {
            $email = trim($data['mail']);
            
            // Validation de l'email
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return $this->json(['error' => 'Adresse email invalide'], 400);
            }
            
            // Vérifier que l'email n'est pas déjà pris par un autre utilisateur
            $existingUser = $this->repository->findOneBy(['mail' => $email]);
            if ($existingUser && $existingUser->getId() !== $user->getId()) {
                return $this->json(['error' => 'Cette adresse email est déjà utilisée'], 400);
            }
            
            $user->setMail($email);
        }

        // Mettre à jour le mot de passe si fourni
        if (isset($data['password']) && !empty($data['password'])) {
            $password = $data['password'];
            
            // Validation de la longueur du mot de passe
            if (strlen($password) < 6) {
                return $this->json(['error' => 'Le mot de passe doit contenir au moins 6 caractères'], 400);
            }
            
            // Hasher le nouveau mot de passe
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $user->setPassword($hashedPassword);
        }

        // Sauvegarder les modifications
        try {
            $this->manager->flush();
            
            return $this->json([
                'message' => 'Profil mis à jour avec succès',
                'user' => [
                    'id' => $user->getId(),
                    'username' => $user->getUsername(),
                    'mail' => $user->getMail(),
                    'roles' => $user->getRoles()
                ]
            ]);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Erreur lors de la sauvegarde'], 500);
        }
    }

    #[Route('/{id}/role', name: 'update_user_role', methods: ['PUT'])]
    #[OA\Put(
        summary: 'Modifier le rôle d\'un utilisateur (Admin uniquement)',
        security: [['X-AUTH-TOKEN' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                description: 'ID de l\'utilisateur',
                schema: new OA\Schema(type: 'integer')
            )
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                type: 'object',
                properties: [
                    new OA\Property(property: 'role', type: 'string', enum: ['ROLE_USER', 'ROLE_ORGANISATEUR', 'ROLE_ADMIN']),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Rôle mis à jour avec succès'),
            new OA\Response(response: 401, description: 'Non authentifié'),
            new OA\Response(response: 403, description: 'Accès refusé - Admin requis'),
            new OA\Response(response: 404, description: 'Utilisateur non trouvé'),
        ]
    )]
    public function updateUserRole(int $id, Request $request): JsonResponse
    {
        // Vérifier que l'utilisateur connecté est admin
        $currentUser = $this->getUser();
        if (!$currentUser) {
            return $this->json(['error' => 'Non authentifié'], 401);
        }

        if (!in_array('ROLE_ADMIN', $currentUser->getRoles())) {
            return $this->json(['error' => 'Accès refusé - Droits administrateur requis'], 403);
        }

        // Trouver l'utilisateur cible
        $targetUser = $this->repository->find($id);
        if (!$targetUser) {
            return $this->json(['error' => 'Utilisateur non trouvé'], 404);
        }

        // Empêcher de modifier son propre rôle
        if ($targetUser->getId() === $currentUser->getId()) {
            return $this->json(['error' => 'Vous ne pouvez pas modifier votre propre rôle'], 400);
        }

        $data = json_decode($request->getContent(), true);
        if (!$data) {
            return $this->json(['error' => 'Données JSON invalides'], 400);
        }

        $newRole = $data['role'] ?? '';
        $allowedRoles = ['ROLE_USER', 'ROLE_ORGANISATEUR', 'ROLE_ADMIN'];

        if (!in_array($newRole, $allowedRoles)) {
            return $this->json(['error' => 'Rôle invalide. Rôles autorisés: ' . implode(', ', $allowedRoles)], 400);
        }

        // Mettre à jour le rôle
        $targetUser->setRoles([$newRole]);

        try {
            $this->manager->flush();
            
            return $this->json([
                'message' => 'Rôle mis à jour avec succès',
                'user' => [
                    'id' => $targetUser->getId(),
                    'username' => $targetUser->getUsername(),
                    'roles' => $targetUser->getRoles()
                ]
            ]);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Erreur lors de la sauvegarde'], 500);
        }
    }

    #[Route('/me', name: 'me', methods: ['GET'])]
    #[OA\Get(
        path: '/api/users/me',
        summary: 'Récupère les infos du user connecté via le token',
        tags: ['Users'],
        parameters: [
            new OA\Parameter(
                name: 'X-AUTH-TOKEN',
                in: 'header',
                required: true,
                description: 'Token d\'authentification',
                schema: new OA\Schema(type: 'string')
            )
        ],
        responses: [
            new OA\Response(response: 200, description: 'Infos du user'),
            new OA\Response(response: 401, description: 'Token invalide'),
            new OA\Response(response: 404, description: 'User non trouvé'),
        ]
    )]
    public function me(Request $request): JsonResponse
    {
        $token = $request->headers->get('X-AUTH-TOKEN');
        if (!$token) {
            return new JsonResponse(['message' => 'Missing X-AUTH-TOKEN header'], Response::HTTP_UNAUTHORIZED);
        }
        
        $user = $this->repository->findOneBy(['apiToken' => $token]);
        if (!$user) {
            return new JsonResponse(['message' => 'User not found'], Response::HTTP_NOT_FOUND);
        }

        // Récupérer les participations avec leur statut
        $participationRepository = $this->manager->getRepository(Participation::class);
        $participations = $participationRepository->findBy(['user' => $user]);

        // Récupérer les événements organisés par l'utilisateur
        $organizedEvents = $user->getEvenements();
        $organizedEventsArray = [];
        
        foreach ($organizedEvents as $event) {
            $organizedEventsArray[] = [
                'id' => $event->getId(),
                'titre' => $event->getTitre(),
                'description' => $event->getDescription(),
                'dateDebut' => $event->getStart()?->format('Y-m-d H:i:s'),
                'dateFin' => $event->getEnd()?->format('Y-m-d H:i:s'),
                'statut' => $event->getStatut(),
                'nombreParticipants' => $event->getNumberCompetitors()
            ];
        }

        $data = [
            'id' => $user->getId(),
            'username' => $user->getUsername(),
            'mail' => $user->getMail(),
            'roles' => $user->getRoles(),
            'participations' => array_map(function($participation) {
                $event = $participation->getEvenement();
                return [
                    'id' => $event->getId(),
                    'titre' => $event->getTitre(),
                    'description' => $event->getDescription(),
                    'dateDebut' => $event->getStart()?->format('Y-m-d H:i:s'),
                    'dateFin' => $event->getEnd()?->format('Y-m-d H:i:s'),
                    'statut' => $participation->getStatut(),
                    'organisateur' => [
                        'id' => $event->getOrganisateur()->getId(),
                        'username' => $event->getOrganisateur()->getUsername()
                    ]
                ];
            }, $participations),
            'evenementsOrganises' => $organizedEventsArray
        ];

        return new JsonResponse($data);
    }

    #[Route('/me/participations', name: 'me_participations', methods: ['GET'])]
    #[OA\Get(
        path: '/api/users/me/participations',
        summary: 'Récupère les participations du user connecté',
        tags: ['Users'],
        parameters: [
            new OA\Parameter(
                name: 'X-AUTH-TOKEN',
                in: 'header',
                required: true,
                description: 'Token d\'authentification',
                schema: new OA\Schema(type: 'string')
            )
        ],
        responses: [
            new OA\Response(response: 200, description: 'Liste des participations'),
            new OA\Response(response: 401, description: 'Token invalide'),
        ]
    )]
    public function meParticipations(Request $request): JsonResponse
    {
        $token = $request->headers->get('X-AUTH-TOKEN');
        if (!$token) {
            return new JsonResponse(['message' => 'Missing X-AUTH-TOKEN header'], Response::HTTP_UNAUTHORIZED);
        }

        $user = $this->repository->findOneBy(['apiToken' => $token]);
        if (!$user) {
            return new JsonResponse(['message' => 'User not found'], Response::HTTP_NOT_FOUND);
        }

        // Récupérer les participations de l'utilisateur
        $participations = $user->getParticipations();

        $data = $this->serializer->serialize(
            $participations,
            'json',
            ['groups' => [Participation::GROUP_READ, User::GROUP_PUBLIC]]
        );

        return new JsonResponse(json_decode($data, true));
    }

    #[Route('/me', name: 'delete_me', methods: ['DELETE'])]
    #[OA\Delete(
        path: '/api/users/me',
        summary: 'Supprimer le compte de l\'utilisateur connecté',
        tags: ['Users'],
        parameters: [
            new OA\Parameter(
                name: 'X-AUTH-TOKEN',
                in: 'header',
                required: true,
                description: 'Token d\'authentification',
                schema: new OA\Schema(type: 'string')
            )
        ],
        responses: [
            new OA\Response(response: 204, description: 'Compte supprimé avec succès'),
            new OA\Response(response: 401, description: 'Token invalide'),
            new OA\Response(response: 404, description: 'Utilisateur introuvable')
        ]
    )]
    public function deleteMe(Request $request): JsonResponse
    {
        $token = $request->headers->get('X-AUTH-TOKEN');
        if (!$token) {
            return new JsonResponse(['message' => 'Missing X-AUTH-TOKEN header'], Response::HTTP_UNAUTHORIZED);
        }

        $user = $this->repository->findOneBy(['apiToken' => $token]);
        if (!$user) {
            return new JsonResponse(['message' => 'User not found'], Response::HTTP_NOT_FOUND);
        }

        // Anonymiser les commentaires de l'utilisateur avant suppression
        foreach ($user->getCommentaires() as $commentaire) {
            $commentaire->setAuteur(null); // Détache le commentaire de l'utilisateur
        }

        // Supprimer l'utilisateur (les commentaires restent mais anonymes)
        $this->manager->remove($user);
        $this->manager->flush();

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }
}
