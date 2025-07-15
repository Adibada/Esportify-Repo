<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Doctrine\ORM\EntityManagerInterface;
use App\Repository\EvenementsRepository;
use App\Entity\Evenements;


#[Route('api/evenements', name: 'app_api_evenements_')]

class EvenementsController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $manager,
        private EvenementsRepository $repository
        ) {}

    #[Route('/', name: 'new', methods: 'POST')]
    
    public function new(): Response
    {
        $evenement = new Evenements;
        $evenement->setTitre('Near Machinica Speedrun' );
        $evenement->setDescription('blablablabla');
        $evenement->setStart( new\DateTimeImmutable());

        $this->manager->persist($evenement);
        $this->manager->flush();

        return $this->json(
            ['message' => "Event resource created with {$evenement->getId()} id"],
            status: Response::HTTP_CREATED,
        );
    }

    #[Route('/{id}', name: 'show', methods: 'GET')]
    public function show(int $id): Response
    {
        $evenement = $this->repository->find($id);

        if (!$evenement){
            throw new \Exception( message: "Aucun événement trouvé");
        }

        return $this->json(
            [ 'message' => "evenement trouvé : {$evenement->getTitre()} for {$evenement->getId()} id"]);
    }

    #[Route('/{id}', name: 'edit', methods: 'PUT')]
    public function edit(Request $request, int $id): Response
    {
        $evenement = $this->repository->find($id);

        if (!$evenement) {
            return $this->json(['message' => "Aucun événement trouvé"], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        $nouveauTitre = $data['titre'] ?? null;

        if (!$nouveauTitre) {
            return $this->json(['message' => "Titre manquant"], Response::HTTP_BAD_REQUEST);
        }

        $evenement->setTitre($nouveauTitre);
        $this->manager->flush();

        return $this->json(['message' => "Événement modifié avec succès"]); 

    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id): Response
    {
        $evenement = $this->repository->find($id);  

        if (!$evenement) {
            return $this->json(['message' => "Aucun événement trouvé"], Response::HTTP_NOT_FOUND);
        }

        $this->manager->remove($evenement);
        $this->manager->flush();

        return $this->json(['message' => "Événement supprimé"], Response::HTTP_NO_CONTENT);
    }
}
