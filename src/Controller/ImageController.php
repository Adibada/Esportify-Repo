<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/uploads')]
class ImageController extends AbstractController
{
    #[Route('/{filename}', name: 'app_image_show', methods: ['GET'])]
    public function show(string $filename): Response
    {
        $imagePath = $this->getParameter('kernel.project_dir') . '/var/cache/uploads/' . $filename;
        
        if (!file_exists($imagePath)) {
            throw $this->createNotFoundException('Image not found');
        }
        
        return new BinaryFileResponse($imagePath);
    }
}
