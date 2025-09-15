<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250915142720 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Renommer la table evenements_user en participations et conserver les données';
    }

    public function up(Schema $schema): void
    {
        // Créer la nouvelle table participations
        $this->addSql('CREATE TABLE participations (user_id INT NOT NULL, evenements_id INT NOT NULL, statut VARCHAR(50) DEFAULT \'en_attente\' NOT NULL, INDEX IDX_FDC6C6E8A76ED395 (user_id), INDEX IDX_FDC6C6E863C02CD4 (evenements_id), PRIMARY KEY(user_id, evenements_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE participations ADD CONSTRAINT FK_FDC6C6E8A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE participations ADD CONSTRAINT FK_FDC6C6E863C02CD4 FOREIGN KEY (evenements_id) REFERENCES evenements (id)');
        
        // Copier les données de l'ancienne table vers la nouvelle
        $this->addSql('INSERT INTO participations (user_id, evenements_id, statut) SELECT user_id, evenements_id, statut FROM evenements_user');
        
        // Supprimer l'ancienne table
        $this->addSql('ALTER TABLE evenements_user DROP FOREIGN KEY FK_3372CFE763C02CD4');
        $this->addSql('ALTER TABLE evenements_user DROP FOREIGN KEY FK_3372CFE7A76ED395');
        $this->addSql('DROP TABLE evenements_user');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE evenements_user (evenements_id INT NOT NULL, user_id INT NOT NULL, statut VARCHAR(50) CHARACTER SET utf8mb4 DEFAULT \'en_attente\' NOT NULL COLLATE `utf8mb4_unicode_ci`, INDEX IDX_3372CFE763C02CD4 (evenements_id), INDEX IDX_3372CFE7A76ED395 (user_id), PRIMARY KEY(user_id, evenements_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB COMMENT = \'\' ');
        $this->addSql('ALTER TABLE evenements_user ADD CONSTRAINT FK_3372CFE763C02CD4 FOREIGN KEY (evenements_id) REFERENCES evenements (id) ON UPDATE NO ACTION ON DELETE NO ACTION');
        $this->addSql('ALTER TABLE evenements_user ADD CONSTRAINT FK_3372CFE7A76ED395 FOREIGN KEY (user_id) REFERENCES user (id) ON UPDATE NO ACTION ON DELETE NO ACTION');
        $this->addSql('ALTER TABLE participations DROP FOREIGN KEY FK_FDC6C6E8A76ED395');
        $this->addSql('ALTER TABLE participations DROP FOREIGN KEY FK_FDC6C6E863C02CD4');
        $this->addSql('DROP TABLE participations');
    }
}
