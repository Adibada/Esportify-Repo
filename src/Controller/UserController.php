<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Nelmio\ApiDocBundle\Annotation\Model;
use OpenApi\Attributes as OA;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
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
        foreach ($user->getParticipations() as $event) {
            $userData['participations'][] = [
                'id' => $event->getId(),
                'titre' => $event->getTitre(),
                'dateDebut' => $event->getStart()?->format('Y-m-d H:i:s'),
                'dateFin' => $event->getEnd()?->format('Y-m-d H:i:s'),
                'statut' => $event->getStatut(),
                'description' => $event->getDescription()
            ];
        }

        return $this->json($userData);
    }

    #[Route('/me', name: 'profile_me', methods: ['GET'])]
    #[OA\Get(
        summary: 'Récupérer le profil de l\'utilisateur connecté',
        security: [['X-AUTH-TOKEN' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Profil de l\'utilisateur'),
            new OA\Response(response: 401, description: 'Non authentifié'),
        ]
    )]
    public function getMyProfile(): JsonResponse
    {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Non authentifié'], 401);
        }

        return $this->json([
            'id' => $user->getId(),
            'username' => $user->getUsername(),
            'mail' => $user->getMail(),
            'roles' => $user->getRoles()
        ]);
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
}
