<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;

class FrontendController extends AbstractController
{
    public function index(Request $request, string $reactRouting = null): Response
    {
        $path = $request->getPathInfo();

        // Si la route commence par /api, laisse Symfony gérer la route
        if (str_starts_with($path, '/api')) {
            return new Response('Not Found', 404); // NE PAS servir index.html
        }

        $indexFile = $this->getParameter('kernel.project_dir') . '/public/index.html';
        $html = file_get_contents($indexFile);

        return new Response($html, 200, ['Content-Type' => 'text/html']);
    }

}
