<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Doctrine\ORM\EntityManagerInterface;
use App\Entity\User;
use OpenApi\Attributes as OA;

#[Route('/api', name: 'app_api_')]
#[OA\Tag(name: 'Security')]
class SecurityController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $manager,
        private SerializerInterface $serializer
    ) {}

    #[Route('/registration', name: 'registration', methods: ['POST'])]
    #[OA\Post(
        path: '/api/registration',
        summary: 'Enregistrer un nouvel utilisateur',
        tags: ["Security"],
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
            new OA\Response(
                response: 201,
                description: 'Nouvel utilisateur !',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'user', type: 'string'),
                        new OA\Property(property: 'apiToken', type: 'string'),
                        new OA\Property(
                            property: 'roles',
                            type: 'array',
                            items: new OA\Items(type: 'string')
                        ),
                    ]
                )
            ),
            new OA\Response(response: 400, description: 'Bad request'),
        ]
    )]
    public function register(Request $request, UserPasswordHasherInterface $passwordHasher): JsonResponse
    {
        try {
            $user = $this->serializer->deserialize($request->getContent(), User::class, 'json');
        } catch (\Exception $e) {
            return new JsonResponse(['message' => 'Invalid JSON'], Response::HTTP_BAD_REQUEST);
        }

        // Validation simple
        if (
            empty($user->getUsername()) ||
            empty($user->getMail()) ||
            !filter_var($user->getMail(), FILTER_VALIDATE_EMAIL) ||
            empty($user->getPassword())
        ) {
            return new JsonResponse(['message' => 'Username, mail and password are required and mail must be valid'], Response::HTTP_BAD_REQUEST);
        }

        // Hash password
        $hashedPassword = $passwordHasher->hashPassword($user, $user->getPassword());
        $user->setPassword($hashedPassword);

        // Générer apiToken
        $user->setApiToken(bin2hex(random_bytes(32)));

        $this->manager->persist($user);
        $this->manager->flush();

        return new JsonResponse(
            [
                'user' => $user->getUserIdentifier(),
                'apiToken' => $user->getApiToken(),
                'roles' => $user->getRoles(),
            ],
            Response::HTTP_CREATED
        );
    }

    #[Route('/login', name: 'login', methods: ['POST'])]
    #[OA\Post(
        path: '/api/login',
        summary: 'Connecter un utilisateur',
        tags: ["Security"],
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
            new OA\Response(
                response: 200,
                description: 'User authenticated',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'user', type: 'string'),
                        new OA\Property(property: 'apiToken', type: 'string'),
                        new OA\Property(
                            property: 'roles',
                            type: 'array',
                            items: new OA\Items(type: 'string')
                        ),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Invalid credentials'),
        ]
    )]
    public function login(#[CurrentUser] ?User $user): JsonResponse
    {
        if (null === $user) {
            return new JsonResponse(['message' => 'Missing credentials'], Response::HTTP_UNAUTHORIZED);
        }

        return new JsonResponse([
            'user'  => $user->getUserIdentifier(),
            'apiToken' => $user->getApiToken(),
            'roles' => $user->getRoles(),
        ]);
    }
}
