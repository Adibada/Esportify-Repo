<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('api/users', name: 'app_api_users_')]
class UserController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $manager,
        private UserRepository $repository,
        private SerializerInterface $serializer
    ) {}

    #[Route('/user', name: 'index')]
    public function index(): Response
    {
        return $this->render('user/index.html.twig', [
            'controller_name' => 'UserController',
        ]);
    }

    #[Route('', name: 'new', methods: ['POST'])]
    public function new(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (empty($data['name']) || empty($data['mail']) || empty($data['password']) || empty($data['roles'])) {
            return $this->json(['error' => 'Champs obligatoires manquants'], Response::HTTP_BAD_REQUEST);
        }

        $user = new User();
        $user->setName($data['name']);
        $user->setEmail($data['mail']);

        if (!empty($data['naissance'])) {
            try {
                $dateNaissance = new \DateTimeImmutable($data['naissance']);
                $user->setNaissance($dateNaissance);
            } catch (\Exception $e) {
                return $this->json(['error' => 'Date de naissance invalide'], Response::HTTP_BAD_REQUEST);
            }
        }

        $user->setPassword($data['password']);
        $user->setRoles((array) $data['roles']);

        $this->manager->persist($user);
        $this->manager->flush();

        $jsonUser = $this->serializer->serialize($user, 'json');
        $location = $this->generateUrl('app_api_users_show', ['id' => $user->getId()], UrlGeneratorInterface::ABSOLUTE_URL);

        return new JsonResponse($jsonUser, Response::HTTP_CREATED, ['Location' => $location], true);
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(int $id): Response
    {
        $user = $this->repository->find($id);

        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $data = $this->serializer->serialize($user, 'json');
        return new JsonResponse($data, Response::HTTP_OK, [], true);
    }

    #[Route('/{id}', name: 'edit', methods: ['PUT'])]
    public function edit(Request $request, int $id): Response
    {
        $user = $this->repository->find($id);

        if (!$user) {
            return $this->json(['error' => 'Utilisateur non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (!empty($data['name'])) {
            $user->setName($data['name']);
        }
        if (!empty($data['mail'])) {
            $user->setEmail($data['mail']);
        }
        if (!empty($data['password'])) {
            $user->setPassword($data['password']);
        }
        if (!empty($data['roles'])) {
            $user->setRoles((array) $data['roles']);
        }

        $this->manager->flush();

        $jsonUser = $this->serializer->serialize($user, 'json');
        return new JsonResponse($jsonUser, Response::HTTP_OK, [], true);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id): Response
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
