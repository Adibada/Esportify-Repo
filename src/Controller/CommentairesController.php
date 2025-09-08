<?php

namespace App\Controller;

use App\Entity\Commentaires;
use App\Entity\Evenements;
use App\Repository\CommentairesRepository;
use App\Repository\EvenementsRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use OpenApi\Attributes as OA;

#[Route('/api/commentaires', name: 'app_api_commentaires_')]
class CommentairesController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private SerializerInterface $serializer
    ) {}

    #[Route('/evenement/{id}', name: 'list_by_event', methods: ['GET'])]
    #[OA\Get(
        summary: 'Récupérer tous les commentaires d\'un événement',
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', description: 'ID de l\'événement', required: true)
        ],
        responses: [
            new OA\Response(response: 200, description: 'Liste des commentaires'),
            new OA\Response(response: 404, description: 'Événement introuvable')
        ]
    )]
    public function getCommentairesByEvenement(
        int $id,
        CommentairesRepository $commentaireRepository,
        EvenementsRepository $evenementsRepository
    ): JsonResponse {
        // Vérifier que l'événement existe
        $evenement = $evenementsRepository->find($id);
        if (!$evenement) {
            return $this->json(['error' => 'Événement introuvable'], Response::HTTP_NOT_FOUND);
        }

        $commentaires = $commentaireRepository->findByEvenementOrderedByDate($id);

        return $this->json($commentaires, Response::HTTP_OK, [], [
            'groups' => ['commentaire:read', 'user:public']
        ]);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    #[OA\Post(
        summary: 'Créer un nouveau commentaire',
        security: [['X-AUTH-TOKEN' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                type: 'object',
                required: ['contenu', 'evenementId'],
                properties: [
                    new OA\Property(property: 'contenu', type: 'string'),
                    new OA\Property(property: 'evenementId', type: 'integer'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Commentaire créé'),
            new OA\Response(response: 400, description: 'Données invalides'),
            new OA\Response(response: 401, description: 'Non authentifié'),
            new OA\Response(response: 404, description: 'Événement introuvable')
        ]
    )]
    public function createCommentaire(
        Request $request,
        EvenementsRepository $evenementsRepository
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Authentification requise'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true);

        // Validation des données
        if (empty($data['contenu']) || empty($data['evenementId'])) {
            return $this->json(['error' => 'Le contenu et l\'ID de l\'événement sont requis'], Response::HTTP_BAD_REQUEST);
        }

        // Vérifier que l'événement existe
        $evenement = $evenementsRepository->find($data['evenementId']);
        if (!$evenement) {
            return $this->json(['error' => 'Événement introuvable'], Response::HTTP_NOT_FOUND);
        }

        // Créer le commentaire
        $commentaire = new Commentaires();
        $commentaire->setContenu($data['contenu']);
        $commentaire->setAuteur($user);
        $commentaire->setEvenement($evenement);

        $this->entityManager->persist($commentaire);
        $this->entityManager->flush();

        return $this->json($commentaire, Response::HTTP_CREATED, [], [
            'groups' => ['commentaire:read', 'user:public']
        ]);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[OA\Delete(
        summary: 'Supprimer un commentaire',
        security: [['X-AUTH-TOKEN' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', description: 'ID du commentaire', required: true)
        ],
        responses: [
            new OA\Response(response: 204, description: 'Commentaire supprimé'),
            new OA\Response(response: 401, description: 'Non authentifié'),
            new OA\Response(response: 403, description: 'Non autorisé'),
            new OA\Response(response: 404, description: 'Commentaire introuvable')
        ]
    )]
    public function deleteCommentaire(
        int $id,
        CommentairesRepository $commentaireRepository
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Authentification requise'], Response::HTTP_UNAUTHORIZED);
        }

        $commentaire = $commentaireRepository->find($id);
        if (!$commentaire) {
            return $this->json(['error' => 'Commentaire introuvable'], Response::HTTP_NOT_FOUND);
        }

        // Vérifier que l'utilisateur est soit l'auteur du commentaire, soit un admin
        if ($commentaire->getAuteur() !== $user && !$this->isGranted('ROLE_ADMIN')) {
            return $this->json(['error' => 'Vous ne pouvez supprimer que vos propres commentaires'], Response::HTTP_FORBIDDEN);
        }

        $this->entityManager->remove($commentaire);
        $this->entityManager->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
