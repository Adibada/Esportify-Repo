<?php

namespace App\Service;

use App\Entity\Evenements;
use App\Entity\Participation;

class EvenementService
{
    /**
     * Compte le nombre de participants non refusés pour un événement
     */
    public function countActiveParticipants(Evenements $evenement): int
    {
        return $evenement->getParticipations()->filter(
            fn(Participation $participation) => $participation->getStatut() !== Participation::STATUT_REFUSE
        )->count();
    }

    /**
     * Vérifie si un événement est complet
     */
    public function isEventFull(Evenements $evenement, int $maxParticipants = null): bool
    {
        if ($maxParticipants === null) {
            return false;
        }
        
        return $this->countActiveParticipants($evenement) >= $maxParticipants;
    }

    /**
     * Retourne les statuts disponibles pour les participations
     */
    public function getAvailableStatuses(): array
    {
        return [
            Participation::STATUT_EN_ATTENTE,
            Participation::STATUT_VALIDE,
            Participation::STATUT_REFUSE
        ];
    }

    /**
     * Valide les données d'un événement
     */
    public function validateEvenement(Evenements $evenement): array
    {
        $errors = [];

        if (!$evenement->isValidDates()) {
            $errors[] = 'La date de fin doit être postérieure à la date de début';
        }

        if (!$evenement->getTitre()) {
            $errors[] = 'Le titre est requis';
        }

        if (!$evenement->getDescription()) {
            $errors[] = 'La description est requise';
        }

        return $errors;
    }
}
