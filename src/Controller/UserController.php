<?php

namespace App\Controller;

use App\Entity\User;
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
            return $this->json(['error' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $data = $this->serializer->serialize($user, 'json');
        return new JsonResponse($data, Response::HTTP_OK, [], true);
    }

    #[Route('/{id}', name: 'edit', methods: ['PUT'])]
    #[OA\Put(
        summary: 'Modifier un utilisateur',
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                type: 'object',
                properties: [
                    new OA\Property(property: 'mail', type: 'string', format: 'email'),
                    new OA\Property(property: 'roles',
                        type: 'array',
                        items: new OA\Items(
                            type: "string",
                            enum: ["USER", "ORGANISATEUR", "ADMIN"]
                        )
                    )
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Utilisateur modifié'),
            new OA\Response(response: 404, description: 'Utilisateur non trouvé'),
        ]
    )]

    public function edit(Request $request, int $id): JsonResponse
    {
        $user = $this->repository->find($id);

        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        if (isset($data['mail'])) $user->setmail($data['mail']);
        if (isset($data['roles'])) $user->setRoles($data['roles']);

        $this->manager->flush();

        $data = $this->serializer->serialize($user, 'json');
        return new JsonResponse($data, Response::HTTP_OK, [], true);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[OA\Delete(
        summary: 'Supprimer un utilisateur',
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))
        ],
        responses: [
            new OA\Response(response: 200, description: 'Utilisateur supprimé'),
            new OA\Response(response: 404, description: 'Utilisateur non trouvé'),
        ]
    )]
    public function delete(int $id): JsonResponse
    {
        $user = $this->repository->find($id);

        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $this->manager->remove($user);
        $this->manager->flush();

        return $this->json(['message' => 'Utilisateur supprimé'], Response::HTTP_OK);
    }

    //Renvoie les informations de l'utilisateur connecté
    #[Route('/monProfil', name: 'mon_profil', methods: ['GET'])]
    #[OA\Get(
    summary: 'Récupérer les informations du profil de l’utilisateur connecté',
    description: 'Renvoie les informations publiques de l’utilisateur connecté (username, rôle, participations)',
    responses: [
        new OA\Response(
            response: 200,
            description: 'Profil récupéré avec succès',
            content: new OA\JsonContent(
                type: 'object',
                properties: [
                    new OA\Property(property: 'username', type: 'string'),
                    new OA\Property(
                        property: 'roles',
                        type: 'array',
                        items: new OA\Items(type: 'string')
                    ),
                    new OA\Property(
                        property: 'participations',
                        type: 'array',
                        items: new OA\Items(type: 'object', properties: [
                            new OA\Property(property: 'nom', type: 'string')
                        ])
                    ),
                ]
            )
        ),
        new OA\Response(
            response: 401,
            description: 'Utilisateur non authentifié'
        )
    ],
    security: [['bearerAuth' => []]]
    )]
    public function monProfil(): Response
    {
        $user = $this->getUser();

        if (!$user) {
            return $this->json(['error' => 'Non authentifié'], 401);
        }
        return $this->json($user, 200, [], ['groups' => 'user:public']);
    }
}
