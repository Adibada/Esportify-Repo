<?php

namespace App\Entity;

use App\Repository\ProfilsRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ProfilsRepository::class)]
class Profils
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $Name = null;

    #[ORM\Column(length: 255)]
    private ?string $Mail = null;

    #[ORM\Column(type: Types::DATE_IMMUTABLE)]
    private ?\DateTimeImmutable $Naissance = null;

    #[ORM\Column(length: 255)]
    private ?string $Password = null;

    #[ORM\ManyToMany(targetEntity: Evenements::class, mappedBy: 'competitors')]
    private Collection $participations;

    #[ORM\Column(length: 255)]
    private ?string $droits = null;

    public function __construct()
    {
        $this->participations = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->Name;
    }

    public function setName(string $Name): static
    {
        $this->Name = $Name;

        return $this;
    }

    public function getMail(): ?string
    {
        return $this->Mail;
    }

    public function setMail(string $Mail): static
    {
        $this->Mail = $Mail;

        return $this;
    }

    public function getNaissance(): ?\DateTimeImmutable
    {
        return $this->Naissance;
    }

    public function setNaissance(\DateTimeImmutable $Naissance): static
    {
        $this->Naissance = $Naissance;

        return $this;
    }

    public function getPassword(): ?string
    {
        return $this->Password;
    }

    public function setPassword(string $Password): static
    {
        $this->Password = $Password;

        return $this;
    }

    /**
     * @return Collection<int, Evenements>
     */
    public function getParticipations(): Collection
    {
        return $this->participations;
    }

    public function addParticipation(Evenements $participation): static
    {
        if (!$this->participations->contains($participation)) {
            $this->participations->add($participation);
            $participation->addCompetitor($this);
        }

        return $this;
    }

    public function removeParticipation(Evenements $participation): static
    {
        if ($this->participations->removeElement($participation)) {
            $participation->removeCompetitor($this);
        }

        return $this;
    }

    public function getDroits(): ?string
    {
        return $this->droits;
    }

    public function setDroits(string $droits): static
    {
        $this->droits = $droits;

        return $this;
    }
}
