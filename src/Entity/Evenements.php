<?php

namespace App\Entity;

use ApiPlatform\Core\Annotation\ApiResource;
use ApiPlatform\Core\Annotation\ApiProperty;
use App\Repository\EvenementsRepository;
use App\Entity\Participation;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ApiResource(
    normalizationContext: ['groups' => [self::GROUP_READ]],
    denormalizationContext: ['groups' => [self::GROUP_WRITE]]
)]
#[ORM\Entity(repositoryClass: EvenementsRepository::class)]
class Evenements
{
    public const GROUP_READ = 'evenement:read';
    public const GROUP_WRITE = 'evenement:write';
    public const STATUT_EN_ATTENTE = 'en attente';
    public const STATUT_REFUSE = 'refusee';

    #[Groups([self::GROUP_READ])]
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[Groups([self::GROUP_READ, self::GROUP_WRITE, User::GROUP_PUBLIC])]
    #[ORM\Column(length: 255)]
    private ?string $titre = null;

    #[Groups([self::GROUP_READ, self::GROUP_WRITE, User::GROUP_PUBLIC])]
    #[ORM\Column(type: Types::TEXT)]
    private ?string $description = null;

    #[Groups([self::GROUP_READ, self::GROUP_WRITE, User::GROUP_PUBLIC])]
    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $start = null;

    #[Groups([self::GROUP_READ, self::GROUP_WRITE, User::GROUP_PUBLIC])]
    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $end = null;

    #[Groups([self::GROUP_READ, User::GROUP_PUBLIC])]
    #[ApiProperty(readable: true, writable: false)]
    #[ORM\Column(length: 255, options: ['default' => self::STATUT_EN_ATTENTE])]
    private ?string $statut = self::STATUT_EN_ATTENTE;

    #[Groups([self::GROUP_READ, self::GROUP_WRITE, User::GROUP_PUBLIC])]
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $image = null;

    #[Groups([self::GROUP_READ, User::GROUP_PUBLIC])]
    #[ApiProperty(readable: true, writable: false)]
    public function getNumberCompetitors(): int
    {
        return $this->participations->filter(
            fn(Participation $participation) => $participation->getStatut() !== self::STATUT_REFUSE
        )->count();
    }

    #[Groups([self::GROUP_READ, User::GROUP_PUBLIC])]
    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'evenements')]
    #[ORM\JoinColumn(nullable: false)]
    #[ApiProperty(normalizationContext: ['groups' => [User::GROUP_PUBLIC]])]
    private ?User $organisateur = null;

    #[ORM\OneToMany(mappedBy: 'evenement', targetEntity: Commentaires::class, orphanRemoval: true)]
    private Collection $commentaires;

    #[ORM\OneToMany(mappedBy: 'evenement', targetEntity: Participation::class, orphanRemoval: true)]
    private Collection $participations;

    public function __construct()
    {
        $this->commentaires = new ArrayCollection();
        $this->participations = new ArrayCollection();
        $this->statut = 'en attente';
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

    public function getOrganisateur(): ?User
    {
        return $this->organisateur;
    }

    public function setOrganisateur(?User $organisateur): self
    {
        $this->organisateur = $organisateur;
        return $this;
    }

    /**
     * @return Collection<int, Commentaires>
     */
    public function getCommentaires(): Collection
    {
        return $this->commentaires;
    }

    public function addCommentaire(Commentaires $commentaire): static
    {
        if (!$this->commentaires->contains($commentaire)) {
            $this->commentaires->add($commentaire);
            $commentaire->setEvenement($this);
        }

        return $this;
    }

    public function removeCommentaire(Commentaires $commentaire): static
    {
        if ($this->commentaires->removeElement($commentaire) && $commentaire->getEvenement() === $this) {
            $commentaire->setEvenement(null);
        }

        return $this;
    }

    public function getParticipations(): Collection
    {
        return $this->participations;
    }

    public function addParticipation(Participation $participation): static
    {
        if (!$this->participations->contains($participation)) {
            $this->participations->add($participation);
            $participation->setEvenement($this);
        }

        return $this;
    }

    public function removeParticipation(Participation $participation): static
    {
        if ($this->participations->removeElement($participation) && $participation->getEvenement() === $this) {
            $participation->setEvenement(null);
        }

        return $this;
    }
}
