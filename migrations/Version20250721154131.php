<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250721154131 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE evenements (id INT AUTO_INCREMENT NOT NULL, organisateur_id INT NOT NULL, titre VARCHAR(255) NOT NULL, description LONGTEXT NOT NULL, start DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', end DATE NOT NULL COMMENT \'(DC2Type:date_immutable)\', lot VARCHAR(255) NOT NULL, number_competitors INT NOT NULL, statut VARCHAR(255) NOT NULL, image VARCHAR(255) NOT NULL, INDEX IDX_E10AD400D936B2FA (organisateur_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE evenements_user (evenements_id INT NOT NULL, user_id INT NOT NULL, INDEX IDX_3372CFE763C02CD4 (evenements_id), INDEX IDX_3372CFE7A76ED395 (user_id), PRIMARY KEY(evenements_id, user_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE user (id INT AUTO_INCREMENT NOT NULL, profil_name VARCHAR(180) NOT NULL, mail VARCHAR(255) NOT NULL, roles JSON NOT NULL, password VARCHAR(255) NOT NULL, UNIQUE INDEX UNIQ_8D93D649567B6EE4 (profil_name), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE evenements ADD CONSTRAINT FK_E10AD400D936B2FA FOREIGN KEY (organisateur_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE evenements_user ADD CONSTRAINT FK_3372CFE763C02CD4 FOREIGN KEY (evenements_id) REFERENCES evenements (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE evenements_user ADD CONSTRAINT FK_3372CFE7A76ED395 FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE evenements DROP FOREIGN KEY FK_E10AD400D936B2FA');
        $this->addSql('ALTER TABLE evenements_user DROP FOREIGN KEY FK_3372CFE763C02CD4');
        $this->addSql('ALTER TABLE evenements_user DROP FOREIGN KEY FK_3372CFE7A76ED395');
        $this->addSql('DROP TABLE evenements');
        $this->addSql('DROP TABLE evenements_user');
        $this->addSql('DROP TABLE user');
    }
}
