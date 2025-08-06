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
    public function show(int $id): JsonResponse
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
                    new OA\Property(property: 'email', type: 'string', format: 'email'),
                    new OA\Property(property: 'roles', type: 'string')
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
        if (isset($data['email'])) $user->setEmail($data['email']);
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
}
