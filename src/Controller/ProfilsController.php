<?php

namespace App\Controller;

use App\Entity\Profils;
use App\Repository\ProfilsRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;


#[Route('api/profils', name: 'app_api_profils_')]
class ProfilsController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $manager,
        private ProfilsRepository $repository,
        private SerializerInterface $serializer
    ) {}

    #[Route('', name: 'new', methods: ['POST'])]
    public function new(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        //Vérifications basiques
        if (empty($data['name']) || empty($data['mail']) || empty($data['password']) || empty($data['droits'])) {
            return $this->json(['error' => 'Champs obligatoires manquants'], Response::HTTP_BAD_REQUEST);
        }

        $profil = new Profils();
        $profil->setName($data['name']);
        $profil->setMail($data['mail']);
    
        //Naissance
        if (!empty($data['naissance'])) {
            try {
                $dateNaissance = new \DateTimeImmutable($data['naissance']);
                $profil->setNaissance($dateNaissance);
            } catch (\Exception $e) {
                return $this->json(['error' => 'Date de naissance invalide'], Response::HTTP_BAD_REQUEST);
            }
        }

        //Stockage du password en clair ici (pense à hasher en vrai prod !)
        $profil->setPassword($data['password']);
        $profil->setDroits($data['droits']);

        $this->manager->persist($profil);
        $this->manager->flush();

        $jsonProfil = $this->serializer->serialize($profil, 'json');
        $location = $this->generateUrl('app_api_profils_show', ['id' => $profil->getId()], UrlGeneratorInterface::ABSOLUTE_URL);

        return new JsonResponse($jsonProfil, Response::HTTP_CREATED, ['Location' => $location], true);
    }


    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(int $id): Response
    {
        $profil = $this->repository->find($id);

        if (!$profil) {
            return $this->json(['error' => 'Profil non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $data = $this->serializer->serialize($profil, 'json');

        return new JsonResponse($data, Response::HTTP_OK, [], true);
    }

    #[Route('/{id}', name: 'edit', methods: ['PUT'])]
    public function edit(Request $request, int $id): Response
    {
        $profil = $this->repository->find($id);

        if (!$profil) {
            return $this->json(['error' => 'Profil non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        //Mise à jour conditionnelle des champs (si présents)
        if (!empty($data['name'])) {
            $profil->setName($data['name']);
        }
        if (!empty($data['mail'])) {
            $profil->setMail($data['mail']);
        }
        if (!empty($data['naissance'])) {
            try {
                $dateNaissance = new \DateTimeImmutable($data['naissance']);
                $profil->setNaissance($dateNaissance);
            } catch (\Exception $e) {
                return $this->json(['error' => 'Date de naissance invalide'], Response::HTTP_BAD_REQUEST);
            }
        }
        if (!empty($data['password'])) {
            $profil->setPassword($data['password']);
        }
        if (!empty($data['droits'])) {
            $profil->setDroits($data['droits']);
        }

        $this->manager->flush();

        $jsonProfil = $this->serializer->serialize($profil, 'json');
        return new JsonResponse($jsonProfil, Response::HTTP_OK, [], true);
    }


    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id): Response
    {
        $profil = $this->repository->find($id);

        if (!$profil) {
            return $this->json(['error' => 'Profil non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $this->manager->remove($profil);
        $this->manager->flush();

        return $this->json(['message' => 'Profil supprimé'], Response::HTTP_OK);
    }
}
