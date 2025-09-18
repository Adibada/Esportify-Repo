<?php

namespace App\Tests\Entity;

use App\Entity\Evenements;
use App\Entity\User;
use App\Entity\Participation;
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

    public function testImages()
    {
        $evenement = new Evenements();
        $this->assertCount(0, $evenement->getImages());
        
        // Note: Pour tester addImage, il faudrait créer un objet ImageEvenement
        // mais ce test se contente de vérifier que la collection est initialisée
    }

    public function testNumberCompetitorsStartsAtZero()
    {
        $event = new Evenements();
        $this->assertSame(0, $event->getNumberCompetitors());
    }

    public function testAddParticipationIncrementsCounter()
    {
        $event = new Evenements();
        $user = new User();
        $participation = new Participation();
        $participation->setUser($user);
        $participation->setStatut(Participation::STATUT_VALIDE);

        $event->addParticipation($participation);

        $this->assertSame(1, $event->getNumberCompetitors());
    }

    public function testAddSameParticipationDoesNotDuplicate()
    {
        $event = new Evenements();
        $user = new User();
        $participation = new Participation();
        $participation->setUser($user);
        $participation->setStatut(Participation::STATUT_VALIDE);

        $event->addParticipation($participation);
        $event->addParticipation($participation);

        $this->assertSame(1, $event->getNumberCompetitors());
    }

    public function testRemoveParticipationDecrementsCounter()
    {
        $event = new Evenements();
        $user = new User();
        $participation = new Participation();
        $participation->setUser($user);
        $participation->setStatut(Participation::STATUT_VALIDE);

        $event->addParticipation($participation);
        $event->removeParticipation($participation);

        $this->assertSame(0, $event->getNumberCompetitors());
    }

    public function testOrganisateur()
    {
        $evenement = new Evenements();
        $organisateur = new User();

        $evenement->setOrganisateur($organisateur);
        $this->assertSame($organisateur, $evenement->getOrganisateur());
    }

    public function testIsEnCours()
    {
        $evenement = new Evenements();
        $start = new \DateTimeImmutable('2025-09-17 12:00:00');
        $end = new \DateTimeImmutable('2025-09-17 18:00:00');
        $evenement->setStart($start);
        $evenement->setEnd($end);

        // Pendant l'événement (15h00)
        $nowDuring = new \DateTimeImmutable('2025-09-17 15:00:00');
        $this->assertTrue($evenement->isEnCours($nowDuring));
        
        // 30 minutes avant le début (11h30) - doit être en cours
        $now30MinBefore = new \DateTimeImmutable('2025-09-17 11:30:00');
        $this->assertTrue($evenement->isEnCours($now30MinBefore));
        
        // 45 minutes avant le début (11h15) - ne doit pas être en cours
        $now45MinBefore = new \DateTimeImmutable('2025-09-17 11:15:00');
        $this->assertFalse($evenement->isEnCours($now45MinBefore));
        
        // Après la fin (20h00) - ne doit pas être en cours
        $nowAfter = new \DateTimeImmutable('2025-09-17 20:00:00');
        $this->assertFalse($evenement->isEnCours($nowAfter));
    }

    public function testGetStatutAttendu()
    {
        $evenement = new Evenements();
        $start = new \DateTimeImmutable('2025-09-17 12:00:00');
        $end = new \DateTimeImmutable('2025-09-17 18:00:00');
        $evenement->setStart($start);
        $evenement->setEnd($end);

        // Événement en attente reste en attente
        $evenement->setStatut(Evenements::STATUT_EN_ATTENTE);
        $this->assertSame(Evenements::STATUT_EN_ATTENTE, $evenement->getStatutAttendu());

        // Événement validé bien avant le début (10h00) reste validé
        $evenement->setStatut(Evenements::STATUT_VALIDE);
        $nowBefore = new \DateTimeImmutable('2025-09-17 10:00:00');
        $this->assertSame(Evenements::STATUT_VALIDE, $evenement->getStatutAttendu($nowBefore));

        // Événement validé 30 min avant le début (11h30) passe en cours
        $now30MinBefore = new \DateTimeImmutable('2025-09-17 11:30:00');
        $this->assertSame(Evenements::STATUT_EN_COURS, $evenement->getStatutAttendu($now30MinBefore));

        // Événement validé pendant (15h00) est en cours
        $nowDuring = new \DateTimeImmutable('2025-09-17 15:00:00');
        $this->assertSame(Evenements::STATUT_EN_COURS, $evenement->getStatutAttendu($nowDuring));

        // Événement validé après la fin (20h00) devient terminé
        $nowAfter = new \DateTimeImmutable('2025-09-17 20:00:00');
        $this->assertSame(Evenements::STATUT_TERMINE, $evenement->getStatutAttendu($nowAfter));
    }

    public function testStatutDemarreVersTermine()
    {
        $evenement = new Evenements();
        $start = new \DateTimeImmutable('2025-09-17 12:00:00');
        $end = new \DateTimeImmutable('2025-09-17 18:00:00');
        $evenement->setStart($start);
        $evenement->setEnd($end);

        // Événement démarré pendant la période reste démarré
        $evenement->setStatut(Evenements::STATUT_DEMARRE);
        $nowDuring = new \DateTimeImmutable('2025-09-17 15:00:00');
        $this->assertSame(Evenements::STATUT_DEMARRE, $evenement->getStatutAttendu($nowDuring));

        // Événement démarré après la fin devient terminé
        $nowAfter = new \DateTimeImmutable('2025-09-17 20:00:00');
        $this->assertSame(Evenements::STATUT_TERMINE, $evenement->getStatutAttendu($nowAfter));
    }

    public function testStatutTermineConstant()
    {
        $this->assertSame('termine', Evenements::STATUT_TERMINE);
    }

    public function testStatutEnCoursConstant()
    {
        $this->assertSame('en_cours', Evenements::STATUT_EN_COURS);
    }
}
