<?php

namespace App\Entity;

use ApiPlatform\Core\Annotation\ApiResource;
use App\Repository\EvenementsRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use App\Entity\User;


/**
 * @ApiResource()
 */

#[ORM\Entity(repositoryClass: EvenementsRepository::class)]

class Evenements
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $titre = null;

    #[ORM\Column(type: 'text')]
    private ?string $description = null;

    #[ORM\Column(type: Types::DATE_IMMUTABLE)]
    private ?\DateTimeImmutable $start = null;

    #[ORM\Column(type: Types::DATE_IMMUTABLE)]
    private ?\DateTimeImmutable $end = null;

    #[ApiProperty(readable: true, writable: false)]
    #[ORM\Column(nullable: true)]
    private ?int $numberCompetitors = null;

    #[ApiProperty(readable: true, writable: false)]
    #[ORM\Column(length: 255)]
    private ?string $statut = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $image = null;

    #[ORM\ManyToMany(targetEntity: User::class, inversedBy: 'participations')]
    private Collection $competitors;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $organisateur = null;

    public function getOrganisateur(): ?User
    {
        return $this->organisateur;
    }

    public function setOrganisateur(?User $organisateur): self
    {
        $this->organisateur = $organisateur;
        return $this;
    }

    public function __construct()
    {
        $this->competitors = new ArrayCollection();
        $this->numberCompetitors = 0;
        $this->statut = self::STATUT_EN_ATTENTE;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitre(): ?string
    {
        return $this->titre;
    }

    public function setTitre(string $titre): static
    {
        $this->titre = $titre;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getStart(): ?\DateTimeImmutable
    {
        return $this->start;
    }

    public function setStart(\DateTimeImmutable $start): static
    {
        $this->start = $start;

        return $this;
    }

    public function getEnd(): ?\DateTimeImmutable
    {
        return $this->end;
    }

    public function setEnd(\DateTimeImmutable $end): static
    {
        $this->end = $end;

        return $this;
    }

    public const STATUT_EN_ATTENTE = 'en_attente';
    public const STATUT_VALIDE = 'valide';

    public function getStatut(): ?string
    {
        return $this->statut;
    }

    public function setStatut(string $statut): static
    {
        $this->statut = $statut;

        return $this;
    }

    public function getImage(): ?string
    {
        return $this->image;
    }

    public function setImage(string $image): static
    {
        $this->image = $image;

        return $this;
    }

        public function getNumberCompetitors(): ?int
    {
        return $this->numberCompetitors;
    }

    public function setNumberCompetitors(int $numberCompetitors): static
    {
        $this->numberCompetitors = $numberCompetitors;

        return $this;
    }

    public function getCompetitors(): Collection
    {
        return $this->competitors;
    }

    public function addCompetitor(User $competitor): static
    {
        if (!$this->competitors->contains($competitor)) {
            $this->competitors->add($competitor);
            $this->numberCompetitors++;
        }

        return $this;
    }

    public function removeCompetitor(User $competitor): static
    {
        if ($this->competitors->removeElement($competitor)) {
            $this->numberCompetitors = max(0, $this->numberCompetitors - 1);
        }

        return $this;
    }
}
