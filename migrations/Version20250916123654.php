<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250916123654 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajouter table image_evenement et migrer images existantes';
    }

    public function up(Schema $schema): void
    {
        // Créer la table image_evenement
        $this->addSql('CREATE TABLE image_evenement (id INT AUTO_INCREMENT NOT NULL, evenement_id INT NOT NULL, filename VARCHAR(255) NOT NULL, original_name VARCHAR(255) DEFAULT NULL, mime_type VARCHAR(100) DEFAULT NULL, size INT NOT NULL, is_main TINYINT(1) DEFAULT NULL, uploaded_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_D3A4B34AFD02F13 (evenement_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE image_evenement ADD CONSTRAINT FK_D3A4B34AFD02F13 FOREIGN KEY (evenement_id) REFERENCES evenements (id)');
        
        // Migrer les images existantes vers la nouvelle table
        $this->addSql("
            INSERT INTO image_evenement (evenement_id, filename, original_name, mime_type, size, is_main, uploaded_at)
            SELECT 
                e.id,
                SUBSTRING(e.image, LOCATE('/', e.image, -1) + 1) as filename,
                SUBSTRING(e.image, LOCATE('/', e.image, -1) + 1) as original_name,
                CASE
                    WHEN e.image LIKE '%.jpg' OR e.image LIKE '%.jpeg' THEN 'image/jpeg'
                    WHEN e.image LIKE '%.png' THEN 'image/png'
                    WHEN e.image LIKE '%.gif' THEN 'image/gif'
                    WHEN e.image LIKE '%.webp' THEN 'image/webp'
                    ELSE 'image/jpeg'
                END as mime_type,
                0 as size,
                1 as is_main,
                NOW() as uploaded_at
            FROM evenements e
            WHERE e.image IS NOT NULL AND e.image != ''
        ");
        
        $this->addSql('ALTER TABLE evenements CHANGE statut statut VARCHAR(255) DEFAULT \'en_attente\' NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE image_evenement DROP FOREIGN KEY FK_D3A4B34AFD02F13');
        $this->addSql('DROP TABLE image_evenement');
        $this->addSql('ALTER TABLE evenements CHANGE statut statut VARCHAR(255) DEFAULT \'en attente\' NOT NULL');
    }
}
