<?php

namespace App\Controller;

use App\Entity\Evenements;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

class EvenementValidationController extends AbstractController
{
    #[Route('/api/evenements/{id}/valider', name: 'evenement_valider', methods: ['POST'])]
    public function valider(Evenements $evenement, EntityManagerInterface $em): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $evenement->setStatut(Evenements::STATUT_VALIDE);
        $em->flush();

        return new JsonResponse([
            'message' => 'Événement validé avec succès',
            'statut' => $evenement->getStatut(),
        ]);
    }
}
