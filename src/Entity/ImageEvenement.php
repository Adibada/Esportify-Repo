<?php

namespace App\Entity;

use App\Repository\ImageEvenementRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: ImageEvenementRepository::class)]
#[ORM\Table(name: 'image_evenement')]
class ImageEvenement
{
    #[Groups(['evenement:read', 'image:read'])]
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[Groups(['evenement:read', 'image:read', 'image:write'])]
    #[ORM\Column(length: 255)]
    private ?string $filename = null;

    #[Groups(['evenement:read', 'image:read', 'image:write'])]
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $originalName = null;

    #[ORM\ManyToOne(inversedBy: 'images')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Evenements $evenement = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getFilename(): ?string
    {
        return $this->filename;
    }

    public function setFilename(string $filename): static
    {
        $this->filename = $filename;
        return $this;
    }

    public function getOriginalName(): ?string
    {
        return $this->originalName;
    }

    public function setOriginalName(?string $originalName): static
    {
        $this->originalName = $originalName;
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

    /**
     * Retourne l'URL complète de l'image
     */
    #[Groups(['evenement:read', 'image:read'])]
    public function getUrl(): string
    {
        $filename = trim($this->filename);
        // Si le filename commence par http, c'est déjà une URL complète
        if (str_starts_with($filename, 'http')) {
            return $filename;
        }
        
        // Sinon, c'est un fichier local
        return '/Images/images event/' . $filename;
    }

    /**
     * Retourne le chemin complet du fichier sur le serveur
     */
    public function getFullPath(): string
    {
        // Si c'est une URL externe, pas de chemin local
        if (str_starts_with($this->filename, 'http')) {
            return null;
        }
        
        return __DIR__ . '/../../public/Images/images event/' . $this->filename;
    }
}
