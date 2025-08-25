<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class FrontendController extends AbstractController
{
    #[Route('/{reactRouting}', name: 'app_front', requirements: ['reactRouting' => '.*'])]
    public function index(): Response
    {
        $indexFile = $this->getParameter('kernel.project_dir') . '/public/index.html';

        // Vérifie que le fichier existe
        if (!file_exists($indexFile)) {
            return new Response('<h1>index.html introuvable</h1>', 500);
        }

        // Retourne le contenu du fichier avec le bon Content-Type
        $html = file_get_contents($indexFile);
        return new Response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
        ]);
    }
}
