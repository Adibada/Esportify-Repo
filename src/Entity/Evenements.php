<?php

namespace App\Entity;

use ApiPlatform\Core\Annotation\ApiResource;
use ApiPlatform\Core\Annotation\ApiProperty;
use App\Repository\EvenementsRepository;
use App\Entity\Participation;
use App\Entity\ImageEvenement;
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
    public const STATUT_EN_ATTENTE = 'en_attente';
    public const STATUT_VALIDE = 'valide';
    public const STATUT_REFUSE = 'refuse';

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

    #[Groups([self::GROUP_READ])]
    #[ORM\OneToMany(mappedBy: 'evenement', targetEntity: ImageEvenement::class, orphanRemoval: true)]
    private Collection $images;

    public function __construct()
    {
        $this->commentaires = new ArrayCollection();
        $this->participations = new ArrayCollection();
        $this->images = new ArrayCollection();
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

    /**
     * Validation des dates : la fin doit être après le début
     */
    public function isValidDates(): bool
    {
        if ($this->start && $this->end) {
            return $this->end > $this->start;
        }
        return true;
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

    /**
     * @return Collection<int, ImageEvenement>
     */
    public function getImages(): Collection
    {
        return $this->images;
    }

    public function addImage(ImageEvenement $image): static
    {
        if (!$this->images->contains($image)) {
            $this->images->add($image);
            $image->setEvenement($this);
        }

        return $this;
    }

    public function removeImage(ImageEvenement $image): static
    {
        if ($this->images->removeElement($image) && $image->getEvenement() === $this) {
            $image->setEvenement(null);
        }

        return $this;
    }

    /**
     * Retourne la première image de l'événement (considérée comme principale)
     */
    #[Groups([self::GROUP_READ, User::GROUP_PUBLIC])]
    public function getMainImage(): ?ImageEvenement
    {
        // Retourner la première image (la première est considérée comme principale)
        return $this->images->first() ?: null;
    }

    /**
     * Retourne l'URL de la première image pour compatibilité avec l'ancien système
     */
    #[Groups([self::GROUP_READ, User::GROUP_PUBLIC])]
    public function getMainImageUrl(): ?string
    {
        $mainImage = $this->getMainImage();
        return $mainImage ? $mainImage->getUrl() : null;
    }
}
