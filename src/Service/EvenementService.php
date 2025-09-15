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
            fn(Participation $participation) => $participation->getStatut() !== Evenements::STATUT_REFUSE
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
            'validee',
            Evenements::STATUT_REFUSE
        ];
    }
}
