<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Doctrine\ORM\EntityManagerInterface;
use App\Repository\EvenementsRepository;
use App\Entity\Evenements;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\HttpFoundation\Request;

#[Route('api/evenements', name: 'app_api_evenements_')]

class EvenementsController extends AbstractController
{

    public function __construct(
    private EntityManagerInterface $manager,
    private EvenementsRepository $repository,
    private SerializerInterface $serializer,
    private UrlGeneratorInterface $urlGenerator
    ) {}

    #[Route('', name: 'new', methods: ['POST'])]
    public function new(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        //Désérialisation sans l'organisateur
        $evenement = $this->serializer->deserialize($request->getContent(), Evenements::class, 'json');

        //Vérification de la présence de l'organisateur_id
        if (!isset($data['organisateur_id'])) {
            return $this->json(['error' => 'organisateur_id manquant'], Response::HTTP_BAD_REQUEST);
        }

        //Recherche du user organisateur
        $user = $this->manager->getRepository(\App\Entity\User::class)->find($data['organisateur_id']);

        //Vérification de l'existence et des droits
        if (!$user || strtolower($user->getDroits()) !== 'organisateur') {
            return $this->json(['error' => 'Ce user n\'a pas les droits organisateur.'], Response::HTTP_BAD_REQUEST);
        }

        //Association du user organisateur
        $evenement->setOrganisateur($user);

        //Sauvegarde
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

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(int $id): Response
    {
        $evenement = $this->repository->find($id);

        if (!$evenement){
            return $this->json(
                ['error' => 'Événement non trouvé'],
                Response::HTTP_NOT_FOUND
            );
        }

        $data = $this->serializer->serialize($evenement, 'json');

        return new JsonResponse($data, Response::HTTP_OK, [], true);
    }

    #[Route('/{id}', name: 'edit', methods: ['PUT'])]
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


    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id): Response
    {
        $evenement = $this->repository->find($id);

        if (!$evenement) {
            return $this->json(['error' => "Aucun événement trouvé"], Response::HTTP_NOT_FOUND);
        }

        $this->manager->remove($evenement);
        $this->manager->flush();

        return $this->json(['message' => "Événement supprimé"], Response::HTTP_OK);
    }

}
