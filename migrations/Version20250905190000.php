<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration pour ajouter une valeur par défaut 'en attente' au statut des événements
 */
final class Version20250905190000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute une valeur par défaut "en attente" à la colonne statut de la table evenements';
    }

    public function up(Schema $schema): void
    {
        // Modification de la colonne statut pour ajouter une valeur par défaut
        $this->addSql('ALTER TABLE evenements MODIFY COLUMN statut VARCHAR(255) DEFAULT "en attente"');
        
        // Mise à jour des enregistrements existants qui ont un statut NULL ou vide
        $this->addSql('UPDATE evenements SET statut = "en attente" WHERE statut IS NULL OR statut = ""');
    }

    public function down(Schema $schema): void
    {
        // Suppression de la valeur par défaut
        $this->addSql('ALTER TABLE evenements MODIFY COLUMN statut VARCHAR(255)');
    }
}
