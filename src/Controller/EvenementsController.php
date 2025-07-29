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
    #[OA\Post(
        summary: 'Créer un nouvel événement',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                type: 'object',
                required: ['titre', 'date', 'organisateur_id'],
                properties: [
                    new OA\Property(property: 'titre', type: 'string'),
                    new OA\Property(property: 'date', type: 'string', format: 'date-time'),
                    new OA\Property(property: 'organisateur_id', type: 'integer')
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Événement créé'),
            new OA\Response(response: 400, description: 'Données invalides'),
        ]
    )]
    public function new(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $evenement = $this->serializer->deserialize($request->getContent(), Evenements::class, 'json');

        if (!isset($data['organisateur_id'])) {
            return $this->json(['error' => 'organisateur_id manquant'], Response::HTTP_BAD_REQUEST);
        }

        $user = $this->manager->getRepository(\App\Entity\User::class)->find($data['organisateur_id']);

        if (!$user || strtolower($user->getDroits()) !== 'organisateur') {
            return $this->json(['error' => 'Ce user n\'a pas les droits organisateur.'], Response::HTTP_BAD_REQUEST);
        }

        $evenement->setOrganisateur($user);
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
    public function show(int $id): Response
    {
        $evenement = $this->repository->find($id);

        if (!$evenement){
            return $this->json(['error' => 'Événement non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $data = $this->serializer->serialize($evenement, 'json');
        return new JsonResponse($data, Response::HTTP_OK, [], true);
    }

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

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[OA\Delete(
        summary: 'Supprimer un événement',
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
        $evenement = $this->repository->find($id);

        if (!$evenement) {
            return $this->json(['error' => "Aucun événement trouvé"], Response::HTTP_NOT_FOUND);
        }

        $this->manager->remove($evenement);
        $this->manager->flush();

        return $this->json(['message' => "Événement supprimé"], Response::HTTP_OK);
    }
}
