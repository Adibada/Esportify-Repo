<?php

namespace App\Repository;

use App\Entity\ImageEvenement;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ImageEvenement>
 *
 * @method ImageEvenement|null find($id, $lockMode = null, $lockVersion = null)
 * @method ImageEvenement|null findOneBy(array $criteria, array $orderBy = null)
 * @method ImageEvenement[]    findAll()
 * @method ImageEvenement[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class ImageEvenementRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ImageEvenement::class);
    }

    /**
     * Trouve toutes les images d'un événement ordonnées par ID (la première sera considérée comme principale)
     */
    public function findByEvent(int $eventId): array
    {
        return $this->createQueryBuilder('i')
            ->andWhere('i.evenement = :eventId')
            ->setParameter('eventId', $eventId)
            ->orderBy('i.id', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Compte le nombre d'images pour un événement
     */
    public function countByEvent(int $eventId): int
    {
        return $this->createQueryBuilder('i')
            ->select('COUNT(i.id)')
            ->andWhere('i.evenement = :eventId')
            ->setParameter('eventId', $eventId)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
