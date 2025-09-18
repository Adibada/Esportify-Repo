<?php

namespace App\Service;

use App\Entity\Evenements;
use App\Repository\EvenementsRepository;
use Doctrine\ORM\EntityManagerInterface;

class EventStatusService
{
    public function __construct(
        private EvenementsRepository $evenementsRepository,
        private EntityManagerInterface $entityManager
    ) {
    }

    /**
     * Met à jour le statut d'un événement en fonction de ses dates
     */
    public function updateEventStatus(Evenements $evenement, \DateTimeImmutable $now = null): bool
    {
        if ($now === null) {
            $now = new \DateTimeImmutable();
        }

        $currentStatus = $evenement->getStatut();
        $expectedStatus = $evenement->getStatutAttendu($now);

        // Si le statut a changé
        if ($currentStatus !== $expectedStatus) {
            $evenement->setStatut($expectedStatus);
            return true;
        }

        return false;
    }

    /**
     * Met à jour le statut de tous les événements qui nécessitent une vérification
     */
    public function updateAllEventsStatus(\DateTimeImmutable $now = null): int
    {
        if ($now === null) {
            $now = new \DateTimeImmutable();
        }

        $updatedCount = 0;

        // Récupérer tous les événements validés, en cours, démarrés ET en attente
        $events = $this->evenementsRepository->findBy([
            'statut' => [
                Evenements::STATUT_VALIDE,
                Evenements::STATUT_EN_COURS,
                Evenements::STATUT_DEMARRE,
                Evenements::STATUT_EN_ATTENTE  // Ajout des événements en attente
            ]
        ]);

        foreach ($events as $event) {
            if ($this->updateEventStatus($event, $now)) {
                $updatedCount++;
            }
        }

        // Sauvegarder les changements
        if ($updatedCount > 0) {
            $this->entityManager->flush();
        }

        return $updatedCount;
    }

    /**
     * Récupère tous les événements actuellement en cours
     * (événements avec statut 'démarré'/'en_cours' ou événements en cours selon leurs dates)
     */
    public function getCurrentEvents(\DateTimeImmutable $now = null): array
    {
        if ($now === null) {
            $now = new \DateTimeImmutable();
        }

        // Calculer le moment 30 minutes avant maintenant
        $nowMinus30Min = $now->sub(new \DateInterval('PT30M'));

        return $this->evenementsRepository->createQueryBuilder('e')
            ->where(
                '(e.statut IN (:currentStatuses)) OR ' .
                '(e.statut IN (:validStatuses) AND e.start <= :now AND e.end >= :nowMinus30Min)'
            )
            ->setParameter('currentStatuses', [Evenements::STATUT_DEMARRE, Evenements::STATUT_EN_COURS])
            ->setParameter('validStatuses', [Evenements::STATUT_VALIDE])
            ->setParameter('now', $now)
            ->setParameter('nowMinus30Min', $nowMinus30Min)
            ->orderBy('e.start', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Récupère les événements avec le statut "en_cours" ou "demarre" (plus efficace pour l'affichage)
     */
    public function getEventsEnCours(int $limit = null): array
    {
        $qb = $this->evenementsRepository->createQueryBuilder('e')
            ->where('e.statut IN (:statuts)')
            ->setParameter('statuts', [Evenements::STATUT_EN_COURS, Evenements::STATUT_DEMARRE])
            ->orderBy('e.start', 'ASC');

        if ($limit) {
            $qb->setMaxResults($limit);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Vérifie et met à jour le statut d'un événement spécifique
     */
    public function checkAndUpdateEventStatus(int $eventId, \DateTimeImmutable $now = null): ?Evenements
    {
        $event = $this->evenementsRepository->find($eventId);
        
        if (!$event) {
            return null;
        }

        $this->updateEventStatus($event, $now);
        $this->entityManager->flush();

        return $event;
    }

    /**
     * Refuse automatiquement les événements en attente dont la date de début est dépassée
     */
    public function refusePendingEventsAfterStartDate(\DateTimeImmutable $now = null): int
    {
        if ($now === null) {
            $now = new \DateTimeImmutable();
        }

        $refusedCount = 0;

        // Récupérer tous les événements en attente dont la date de début est dépassée
        $events = $this->evenementsRepository->createQueryBuilder('e')
            ->where('e.statut = :statut_en_attente')
            ->andWhere('e.start <= :now')
            ->setParameter('statut_en_attente', Evenements::STATUT_EN_ATTENTE)
            ->setParameter('now', $now)
            ->getQuery()
            ->getResult();

        foreach ($events as $event) {
            $event->setStatut(Evenements::STATUT_REFUSE);
            $refusedCount++;
        }

        // Sauvegarder les changements
        if ($refusedCount > 0) {
            $this->entityManager->flush();
        }

        return $refusedCount;
    }

    /**
     * Met à jour tous les statuts d'événements (gestion globale incluant refus automatique)
     */
    public function updateAllEventsStatusComplete(\DateTimeImmutable $now = null): array
    {
        if ($now === null) {
            $now = new \DateTimeImmutable();
        }

        $statusUpdated = $this->updateAllEventsStatus($now);
        $eventsRefused = $this->refusePendingEventsAfterStartDate($now);

        return [
            'status_updated' => $statusUpdated,
            'events_refused' => $eventsRefused,
            'total_changes' => $statusUpdated + $eventsRefused
        ];
    }
}
