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
}
