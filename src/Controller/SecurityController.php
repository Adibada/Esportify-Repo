<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Routing\Annotation\Route;
use App\Repository\UserRepository;
use OpenApi\Attributes as OA;

#[Route('/api', name: 'app_api_')]
#[OA\Tag(name: 'Security')]
class SecurityController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $manager,
        private SerializerInterface $serializer,
        private UserRepository $userRepository
    ) {}

    #[Route('/registration', name: 'registration', methods: ['POST'])]
    #[OA\Post(
        path: '/api/registration',
        summary: 'Enregistrer un nouvel utilisateur',
        tags: ['Security'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['username', 'mail', 'password'],
                properties: [
                    new OA\Property(property: 'username', type: 'string'),
                    new OA\Property(property: 'mail', type: 'string', format: 'email'),
                    new OA\Property(property: 'password', type: 'string', format: 'password'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Nouvel utilisateur créé'),
            new OA\Response(response: 400, description: 'Bad request'),
        ]
    )]
    public function register(Request $request, UserPasswordHasherInterface $passwordHasher): JsonResponse
    {
        try {
            $user = $this->serializer->deserialize($request->getContent(), User::class, 'json');
        } catch (\Exception) {
            return new JsonResponse(['message' => 'Invalid JSON'], Response::HTTP_BAD_REQUEST);
        }

        if (!$user->getUsername() || !$user->getMail() || !filter_var($user->getMail(), FILTER_VALIDATE_EMAIL) || !$user->getPassword()) {
            return new JsonResponse(['message' => 'Username, mail and password are required and mail must be valid'], Response::HTTP_BAD_REQUEST);
        }

        $user->setRoles(['ROLE_USER']);

        $user->setPassword($passwordHasher->hashPassword($user, $user->getPassword()));
        $user->setApiToken(bin2hex(random_bytes(32)));

        $this->manager->persist($user);
        $this->manager->flush();

        return new JsonResponse([
            'user' => $user->getUserIdentifier(),
            'apiToken' => $user->getApiToken(),
            'roles' => $user->getRoles(),
        ], Response::HTTP_CREATED);
    }

    #[Route('/login', name: 'login', methods: ['POST'])]
    #[OA\Post(
        path: '/api/login',
        summary: 'Connecter un utilisateur',
        tags: ['Security'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['username', 'password'],
                properties: [
                    new OA\Property(property: 'username', type: 'string'),
                    new OA\Property(property: 'password', type: 'string', format: 'password'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'User authenticated'),
            new OA\Response(response: 401, description: 'Invalid credentials'),
        ]
    )]
    public function login(Request $request, UserPasswordHasherInterface $passwordHasher): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $username = $data['username'] ?? null;
        $password = $data['password'] ?? null;

        if (!$username || !$password) {
            return new JsonResponse(['message' => 'Username and password are required'], Response::HTTP_BAD_REQUEST);
        }

        $user = $this->userRepository->findOneBy(['username' => $username]);
        if (!$user || !$passwordHasher->isPasswordValid($user, $password)) {
            return new JsonResponse(['message' => 'Invalid credentials'], Response::HTTP_UNAUTHORIZED);
        }

        return new JsonResponse([
            'user' => $user->getUserIdentifier(),
            'apiToken' => $user->getApiToken(),
            'roles' => $user->getRoles(),
        ]);
    }

    #[Route('/me', name: 'me', methods: ['GET'])]
    #[OA\Get(
        path: '/api/me',
        summary: 'Récupère les infos du user connecté via le token',
        tags: ['Security'],
        parameters: [
            new OA\Parameter(
                name: 'Authorization',
                in: 'header',
                required: true,
                description: 'Bearer token',
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
        $user = $this->userRepository->findOneBy(['apiToken' => $token]);
        if (!$user) {
            return new JsonResponse(['message' => 'User not found'], Response::HTTP_NOT_FOUND);
        }
        return new JsonResponse([
            'id' => $user->getId(),
            'user' => $user->getUserIdentifier(),
            'mail' => $user->getMail(),
            'roles' => $user->getRoles(),
        ]);
    }

    #[Route('/me/participations', name: 'me_participations', methods: ['GET'])]
    #[OA\Get(
        path: '/api/me/participations',
        summary: 'Récupère les participations du user connecté',
        tags: ['Security'],
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
    public function meParticipations(Request $request, SerializerInterface $serializer): JsonResponse
    {
        $token = $request->headers->get('X-AUTH-TOKEN');
        if (!$token) {
            return new JsonResponse(['message' => 'Missing X-AUTH-TOKEN header'], Response::HTTP_UNAUTHORIZED);
        }

        $user = $this->userRepository->findOneBy(['apiToken' => $token]);
        if (!$user) {
            return new JsonResponse(['message' => 'User not found'], Response::HTTP_NOT_FOUND);
        }

        // Récupérer les participations de l'utilisateur
        $participations = $user->getParticipations();

        $data = $serializer->serialize(
            $participations,
            'json',
            ['groups' => ['evenement:read', 'user:public']]
        );

        return new JsonResponse(json_decode($data), Response::HTTP_OK, []);
    }

    #[Route('/me', name: 'delete_me', methods: ['DELETE'])]
    #[OA\Delete(
        path: '/api/me',
        summary: 'Supprimer le compte de l\'utilisateur connecté',
        tags: ['Security'],
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

        $user = $this->userRepository->findOneBy(['apiToken' => $token]);
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
