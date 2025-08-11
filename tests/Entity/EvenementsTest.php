<?php

namespace App\Tests\Entity;

use App\Entity\Evenements;
use App\Entity\User;
use PHPUnit\Framework\TestCase;

class EvenementsTest extends TestCase
{
    public function testTitre()
    {
        $evenement = new Evenements();
        $evenement->setTitre("Tournoi d'échecs");
        $this->assertSame("Tournoi d'échecs", $evenement->getTitre());
    }

    public function testDescription()
    {
        $evenement = new Evenements();
        $evenement->setDescription("Un grand tournoi d'échecs inter-écoles");
        $this->assertSame("Un grand tournoi d'échecs inter-écoles", $evenement->getDescription());
    }

    public function testStartAndEndDates()
    {
        $evenement = new Evenements();
        $start = new \DateTimeImmutable('2025-08-01 10:00:00');
        $end = new \DateTimeImmutable('2025-08-01 18:00:00');

        $evenement->setStart($start);
        $evenement->setEnd($end);

        $this->assertSame($start, $evenement->getStart());
        $this->assertSame($end, $evenement->getEnd());
    }

    public function testDefaultStatut()
    {
        $evenement = new Evenements();
        $this->assertSame(Evenements::STATUT_EN_ATTENTE, $evenement->getStatut());
    }

    public function testChangeStatut()
    {
        $evenement = new Evenements();
        $evenement->setStatut(Evenements::STATUT_VALIDE);
        $this->assertSame(Evenements::STATUT_VALIDE, $evenement->getStatut());
    }

    public function testImage()
    {
        $evenement = new Evenements();
        $evenement->setImage("image.png");
        $this->assertSame("image.png", $evenement->getImage());
    }

    public function testNumberCompetitorsStartsAtZero()
    {
        $event = new Evenements();
        $this->assertSame(0, $event->getNumberCompetitors());
    }

    public function testAddCompetitorIncrementsCounter()
    {
        $event = new Evenements();
        $user = new User();

        $event->addCompetitor($user);

        $this->assertSame(1, $event->getNumberCompetitors());
    }

    public function testAddSameCompetitorDoesNotDuplicate()
    {
        $event = new Evenements();
        $user = new User();

        $event->addCompetitor($user);
        $event->addCompetitor($user);

        $this->assertSame(1, $event->getNumberCompetitors());
    }

    public function testRemoveCompetitorDecrementsCounter()
    {
        $event = new Evenements();
        $user = new User();

        $event->addCompetitor($user);
        $event->removeCompetitor($user);

        $this->assertSame(0, $event->getNumberCompetitors());
    }

    public function testOrganisateur()
    {
        $evenement = new Evenements();
        $organisateur = new User();

        $evenement->setOrganisateur($organisateur);
        $this->assertSame($organisateur, $evenement->getOrganisateur());
    }
}
