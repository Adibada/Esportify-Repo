<?php

namespace App\Entity;

use App\Repository\ParticipationRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: ParticipationRepository::class)]
#[ORM\Table(name: 'participations')]
class Participation
{
    public const GROUP_READ = 'participation:read';
    public const STATUT_EN_ATTENTE = 'en_attente';
    public const STATUT_VALIDE = 'valide';
    public const STATUT_REFUSE = 'refuse';

    public function __construct()
    {
        $this->statut = self::STATUT_EN_ATTENTE;
    }

    #[Groups([self::GROUP_READ])]
    #[ORM\Id]
    #[ORM\ManyToOne(inversedBy: 'participations')]
    #[ORM\JoinColumn(name: 'user_id', nullable: false)]
    private ?User $user = null;

    #[ORM\Id]
    #[ORM\ManyToOne(inversedBy: 'participations')]
    #[ORM\JoinColumn(name: 'evenements_id', nullable: false)]
    private ?Evenements $evenement = null;

    #[Groups([self::GROUP_READ])]
    #[ORM\Column(length: 50, nullable: false, options: ['default' => self::STATUT_EN_ATTENTE])]
    private string $statut = self::STATUT_EN_ATTENTE;

    #[Groups([self::GROUP_READ])]
    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $score = null;

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;
        return $this;
    }

    public function getEvenement(): ?Evenements
    {
        return $this->evenement;
    }

    public function setEvenement(?Evenements $evenement): static
    {
        $this->evenement = $evenement;
        return $this;
    }

    public function getStatut(): string
    {
        return $this->statut;
    }

    public function setStatut(string $statut): static
    {
        $this->statut = $statut;
        return $this;
    }

    public function getScore(): ?int
    {
        return $this->score;
    }

    public function setScore(?int $score): static
    {
        $this->score = $score;
        return $this;
    }
}
