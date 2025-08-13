<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api', name: 'app_api_test_')]
class TestProtectedController extends AbstractController
{
    #[Route('/protected-test', name: 'protected_test', methods: ['GET'])]
    public function protectedTest(): JsonResponse
    {
        // Cette route est protégée par la configuration de sécurité (IS_AUTHENTICATED_FULLY)
        $user = $this->getUser();

        return new JsonResponse([
            'message' => 'Access granted',
            'user' => $user ? $user->getUserIdentifier() : null,
        ]);
    }
}
