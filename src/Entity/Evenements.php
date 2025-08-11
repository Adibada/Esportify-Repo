<?php

namespace App\Entity;

use ApiPlatform\Core\Annotation\ApiResource;
use ApiPlatform\Core\Annotation\ApiProperty;
use App\Repository\EvenementsRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ApiResource(
    normalizationContext: ['groups' => ['evenement:read']],
    denormalizationContext: ['groups' => ['evenement:write']]
)]
#[ORM\Entity(repositoryClass: EvenementsRepository::class)]
class Evenements
{
    public const STATUT_EN_ATTENTE = 'en_attente';
    public const STATUT_VALIDE = 'valide';

    #[Groups(['evenement:read'])]
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[Groups(['evenement:read', 'evenement:write'])]
    #[ORM\Column(length: 255)]
    private ?string $titre = null;

    #[Groups(['evenement:read', 'evenement:write'])]
    #[ORM\Column(type: Types::TEXT)]
    private ?string $description = null;

    #[Groups(['evenement:read', 'evenement:write'])]
    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $start = null;

    #[Groups(['evenement:read', 'evenement:write'])]
    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $end = null;

    #[Groups(['evenement:read'])]
    #[ApiProperty(readable: true, writable: false)]
    #[ORM\Column(length: 255)]
    private ?string $statut = self::STATUT_EN_ATTENTE;

    #[Groups(['evenement:read', 'evenement:write'])]
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $image = null;

    #[Groups(['evenement:read'])]
    #[ApiProperty(readable: true, writable: false)]
    public function getNumberCompetitors(): int
    {
        return $this->competitors->count();
    }

    #[Groups(['evenement:read'])]
    #[ORM\ManyToMany(targetEntity: User::class)]
    private Collection $competitors;

    #[Groups(['evenement:read'])]
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[ApiProperty(normalizationContext: ['groups' => ['user:public']])]
    private ?User $organisateur = null;

    public function __construct()
    {
        $this->competitors = new ArrayCollection();
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

    public function setImage(?string $image): static
    {
        $this->image = $image;
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
        }
        return $this;
    }

    public function removeCompetitor(User $competitor): static
    {
        $this->competitors->removeElement($competitor);
        return $this;
    }

    public function getOrganisateur(): ?User
    {
        return $this->organisateur;
    }

    public function setOrganisateur(?User $organisateur): self
    {
        $this->organisateur = $organisateur;
        return $this;
    }
}
