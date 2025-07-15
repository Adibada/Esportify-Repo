<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('api/evenements', name: 'app_api_evenements_')]

class EvenementsController extends AbstractController
{
    $evenement = new evenements;

    public function __construct(private EntityManagerInterface $manager, private EvenementRepository $repository)
    #[Route(name: 'new', methods: 'POST')]
    public function new(): Response
    {
        $evenement->setTitre( titre:'Near Machinica Speedrun' );
        $evenement->setDescription( description: 'blablablabla');
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
        if (!$evenement){
            throw new \Exception( message: "Aucun événement trouvé");
        }

        return $this->json(
            [ message => "evenement trouvé : {$evenement->getTitre()} for {$evenement->getId()} id"]);
    }

    #[Route('/', name: 'edit', methods: 'PUT')]
    public function edit(): Response
    {
         if (!$evenement){
            throw new \Exception( message: "Aucun événement trouvé");
        }

        $evenement->setTitre("Titre de l'événement mis à jour");

    }

    #[Route('/', name: 'delete', methods: 'DELETE')]
    public function delete(): Response
    {
         if (!$evenement){
            throw new \Exception( message: "Aucun événement trouvé");
        }

        return $this->json([ message => "Evenement supprimé"], status: Response::HTTP_NO_CONTENT);
    }
}
