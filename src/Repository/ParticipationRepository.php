<?php

namespace App\Repository;

use App\Entity\Participation;
use App\Entity\User;
use App\Entity\Evenements;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Participation>
 */
class ParticipationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Participation::class);
    }

    /**
     * Trouve une participation par utilisateur et événement
     */
    public function findByUserAndEvent(User $user, Evenements $evenement): ?Participation
    {
        return $this->findOneBy([
            'user' => $user,
            'evenement' => $evenement
        ]);
    }

    /**
     * Trouve toutes les participations pour un événement
     */
    public function findByEvent(Evenements $evenement): array
    {
        return $this->findBy(['evenement' => $evenement]);
    }

    /**
     * Compte les participations validées pour un événement
     */
    public function countValidatedByEvent(Evenements $evenement): int
    {
        return $this->count([
            'evenement' => $evenement,
            'statut' => 'validee'
        ]);
    }

    /**
     * Trouve les participations en attente pour un événement
     */
    public function findPendingByEvent(Evenements $evenement): array
    {
        return $this->findBy([
            'evenement' => $evenement,
            'statut' => 'en_attente'
        ]);
    }

    /**
     * Trouve les participations validées pour un événement
     */
    public function findValidatedByEvent(Evenements $evenement): array
    {
        return $this->findBy([
            'evenement' => $evenement,
            'statut' => 'validee'
        ]);
    }

    /**
     * Trouve les participations non refusées pour un événement (validées + en attente)
     */
    public function findNonRejectedByEvent(Evenements $evenement): array
    {
        return $this->createQueryBuilder('p')
            ->where('p.evenement = :evenement')
            ->andWhere('p.statut != :refusee')
            ->setParameter('evenement', $evenement)
            ->setParameter('refusee', 'refusee')
            ->getQuery()
            ->getResult();
    }
}
