<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250715095224 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE evenements ADD organisateur_id INT NOT NULL');
        $this->addSql('ALTER TABLE evenements ADD CONSTRAINT FK_E10AD400D936B2FA FOREIGN KEY (organisateur_id) REFERENCES profils (id)');
        $this->addSql('CREATE INDEX IDX_E10AD400D936B2FA ON evenements (organisateur_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE evenements DROP FOREIGN KEY FK_E10AD400D936B2FA');
        $this->addSql('DROP INDEX IDX_E10AD400D936B2FA ON evenements');
        $this->addSql('ALTER TABLE evenements DROP organisateur_id');
    }
}
