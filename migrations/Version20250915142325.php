<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250915142325 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE evenements_user DROP FOREIGN KEY FK_3372CFE763C02CD4');
        $this->addSql('ALTER TABLE evenements_user DROP FOREIGN KEY FK_3372CFE7A76ED395');
        $this->addSql('DROP INDEX `primary` ON evenements_user');
        $this->addSql('ALTER TABLE evenements_user ADD CONSTRAINT FK_3372CFE763C02CD4 FOREIGN KEY (evenements_id) REFERENCES evenements (id)');
        $this->addSql('ALTER TABLE evenements_user ADD CONSTRAINT FK_3372CFE7A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE evenements_user ADD PRIMARY KEY (user_id, evenements_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE evenements_user DROP FOREIGN KEY FK_3372CFE7A76ED395');
        $this->addSql('ALTER TABLE evenements_user DROP FOREIGN KEY FK_3372CFE763C02CD4');
        $this->addSql('DROP INDEX `PRIMARY` ON evenements_user');
        $this->addSql('ALTER TABLE evenements_user ADD CONSTRAINT FK_3372CFE7A76ED395 FOREIGN KEY (user_id) REFERENCES user (id) ON UPDATE NO ACTION ON DELETE CASCADE');
        $this->addSql('ALTER TABLE evenements_user ADD CONSTRAINT FK_3372CFE763C02CD4 FOREIGN KEY (evenements_id) REFERENCES evenements (id) ON UPDATE NO ACTION ON DELETE CASCADE');
        $this->addSql('ALTER TABLE evenements_user ADD PRIMARY KEY (evenements_id, user_id)');
    }
}
