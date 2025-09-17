<?php

namespace App\Tests\Service;

use App\Entity\Evenements;
use App\Entity\User;
use App\Repository\EvenementsRepository;
use App\Service\EventStatusService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\MockObject\MockObject;

class EventStatusServiceTest extends TestCase
{
    private EventStatusService $eventStatusService;
    private MockObject $eventRepository;
    private MockObject $entityManager;

    protected function setUp(): void
    {
        $this->eventRepository = $this->createMock(EvenementsRepository::class);
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        
        $this->eventStatusService = new EventStatusService(
            $this->eventRepository,
            $this->entityManager
        );
    }

    public function testUpdateEventStatusToEnCours(): void
    {
        $event = new Evenements();
        $event->setTitre('Test Event');
        $event->setDescription('Test Description');
        $event->setStart(new \DateTimeImmutable('2025-09-17 12:00:00'));
        $event->setEnd(new \DateTimeImmutable('2025-09-17 18:00:00'));
        $event->setStatut(Evenements::STATUT_VALIDE);
        
        $user = new User();
        $event->setOrganisateur($user);

        $now = new \DateTimeImmutable('2025-09-17 15:00:00');

        $hasChanged = $this->eventStatusService->updateEventStatus($event, $now);

        $this->assertTrue($hasChanged);
        $this->assertEquals(Evenements::STATUT_EN_COURS, $event->getStatut());
    }

    public function testUpdateEventStatusNoChange(): void
    {
        $event = new Evenements();
        $event->setTitre('Test Event');
        $event->setDescription('Test Description');
        $event->setStart(new \DateTimeImmutable('2025-09-17 12:00:00'));
        $event->setEnd(new \DateTimeImmutable('2025-09-17 18:00:00'));
        $event->setStatut(Evenements::STATUT_EN_COURS);
        
        $user = new User();
        $event->setOrganisateur($user);

        $now = new \DateTimeImmutable('2025-09-17 15:00:00');

        $hasChanged = $this->eventStatusService->updateEventStatus($event, $now);

        $this->assertFalse($hasChanged);
        $this->assertEquals(Evenements::STATUT_EN_COURS, $event->getStatut());
    }

    public function testUpdateEventStatusBackToValide(): void
    {
        $event = new Evenements();
        $event->setTitre('Test Event');
        $event->setDescription('Test Description');
        $event->setStart(new \DateTimeImmutable('2025-09-17 12:00:00'));
        $event->setEnd(new \DateTimeImmutable('2025-09-17 18:00:00'));
        $event->setStatut(Evenements::STATUT_EN_COURS);
        
        $user = new User();
        $event->setOrganisateur($user);

        $now = new \DateTimeImmutable('2025-09-17 20:00:00'); // Après la fin

        $hasChanged = $this->eventStatusService->updateEventStatus($event, $now);

        $this->assertTrue($hasChanged);
        $this->assertEquals(Evenements::STATUT_VALIDE, $event->getStatut());
    }

    public function testEventEnAttenteRemainsEnAttente(): void
    {
        $event = new Evenements();
        $event->setTitre('Test Event');
        $event->setDescription('Test Description');
        $event->setStart(new \DateTimeImmutable('2025-09-17 12:00:00'));
        $event->setEnd(new \DateTimeImmutable('2025-09-17 18:00:00'));
        $event->setStatut(Evenements::STATUT_EN_ATTENTE);
        
        $user = new User();
        $event->setOrganisateur($user);

        $now = new \DateTimeImmutable('2025-09-17 15:00:00'); // Pendant l'événement

        $hasChanged = $this->eventStatusService->updateEventStatus($event, $now);

        $this->assertFalse($hasChanged);
        $this->assertEquals(Evenements::STATUT_EN_ATTENTE, $event->getStatut());
    }
}
