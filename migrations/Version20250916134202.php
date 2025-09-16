<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250916134202 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE image_evenement DROP mime_type, DROP size, DROP is_main, DROP uploaded_at');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE image_evenement ADD mime_type VARCHAR(100) DEFAULT NULL, ADD size INT NOT NULL, ADD is_main TINYINT(1) DEFAULT NULL, ADD uploaded_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\'');
    }
}
