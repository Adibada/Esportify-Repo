<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('api/jeux', name: 'app_api_jeux_')]

class JeuxController extends AbstractController
{
    #[Route(name: 'new', methods: 'POST')]
    public function new(): Response
    {
        $Jeu = new Jeux;
        $Jeu->setTitre( titre: 'dfsdfs' );
        $Jeu->setDescription( description: 'blablablabla');
        $Jeu->setPlatfrom( platfrom: 'pc');

        return $this->json(
            ['message' => "Event resource created with {$jeu->getId()} id"],
            status: Response::HTTP_CREATED,
        );
    }

    #[Route('/show', name: 'show', methods: 'GET')]
    public function show(): Response
    {
        return $this->json(['message' => 'evenement BDD']);
    }

    #[Route('/', name: 'edit', methods: 'PUT')]
    public function edit(): Response
    {
        
    }

    #[Route('/', name: 'delete', methods: 'DELETE')]
    public function delete(): Response
    {
        
    }
}