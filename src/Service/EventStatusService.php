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
     * Met à jour le statut de tous les événements validés
     */
    public function updateAllEventsStatus(\DateTimeImmutable $now = null): int
    {
        if ($now === null) {
            $now = new \DateTimeImmutable();
        }

        $updatedCount = 0;

        // Récupérer tous les événements validés, en cours ou démarrés
        $events = $this->evenementsRepository->findBy([
            'statut' => [Evenements::STATUT_VALIDE, Evenements::STATUT_EN_COURS, Evenements::STATUT_DEMARRE]
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
     * (30 minutes avant le début jusqu'à la fin)
     */
    public function getCurrentEvents(\DateTimeImmutable $now = null): array
    {
        if ($now === null) {
            $now = new \DateTimeImmutable();
        }

        // Calculer le moment 30 minutes avant maintenant
        $nowMinus30Min = $now->sub(new \DateInterval('PT30M'));

        return $this->evenementsRepository->createQueryBuilder('e')
            ->where('e.start >= :nowMinus30Min')
            ->andWhere('e.start <= :nowPlus30Min')
            ->andWhere('e.end >= :now')
            ->andWhere('e.statut IN (:validStatuses)')
            ->setParameter('nowMinus30Min', $nowMinus30Min)
            ->setParameter('nowPlus30Min', $now->add(new \DateInterval('PT30M')))
            ->setParameter('now', $now)
            ->setParameter('validStatuses', [Evenements::STATUT_VALIDE, Evenements::STATUT_EN_COURS])
            ->getQuery()
            ->getResult();
    }

    /**
     * Récupère les événements avec le statut "en_cours" (plus efficace pour l'affichage)
     */
    public function getEventsEnCours(int $limit = null): array
    {
        $qb = $this->evenementsRepository->createQueryBuilder('e')
            ->where('e.statut = :statut')
            ->setParameter('statut', Evenements::STATUT_EN_COURS)
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
}
