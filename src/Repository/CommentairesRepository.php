<?php

namespace App\Repository;

use App\Entity\Commentaires;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Commentaires>
 */
class CommentairesRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Commentaires::class);
    }

    /**
     * Récupère tous les commentaires d'un événement, triés par date de création (plus récent en premier)
     */
    public function findByEvenementOrderedByDate(int $evenementId): array
    {
        return $this->createQueryBuilder('c')
            ->andWhere('c.evenement = :evenementId')
            ->setParameter('evenementId', $evenementId)
            ->orderBy('c.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Compte le nombre de commentaires d'un événement
     */
    public function countByEvenement(int $evenementId): int
    {
        return $this->createQueryBuilder('c')
            ->select('COUNT(c.id)')
            ->andWhere('c.evenement = :evenementId')
            ->setParameter('evenementId', $evenementId)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
