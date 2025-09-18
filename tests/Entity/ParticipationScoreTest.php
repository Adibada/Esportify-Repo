<?php

namespace App\Tests\Entity;

use App\Entity\Participation;
use App\Entity\User;
use App\Entity\Evenements;
use PHPUnit\Framework\TestCase;

class ParticipationScoreTest extends TestCase
{
    public function testScoreProperty(): void
    {
        $participation = new Participation();
        
        // Test valeur par défaut
        $this->assertNull($participation->getScore());
        
        // Test setter/getter
        $participation->setScore(100);
        $this->assertSame(100, $participation->getScore());
        
        // Test valeur nulle
        $participation->setScore(null);
        $this->assertNull($participation->getScore());
        
        // Test valeurs négatives (autorisées)
        $participation->setScore(-50);
        $this->assertSame(-50, $participation->getScore());
        
        // Test valeur zéro
        $participation->setScore(0);
        $this->assertSame(0, $participation->getScore());
    }

    public function testParticipationWithScore(): void
    {
        // Test création complète d'une participation avec score
        $user = new User();
        $user->setUsername('testuser');
        $user->setMail('test@example.com');
        $user->setPassword('password');

        $evenement = new Evenements();
        $evenement->setTitre('Test Event');
        $evenement->setDescription('Test Description');
        $evenement->setStart(new \DateTimeImmutable('2025-12-01 10:00:00'));
        $evenement->setEnd(new \DateTimeImmutable('2025-12-01 18:00:00'));

        $participation = new Participation();
        $participation->setUser($user);
        $participation->setEvenement($evenement);
        $participation->setScore(75);

        $this->assertSame($user, $participation->getUser());
        $this->assertSame($evenement, $participation->getEvenement());
        $this->assertSame(75, $participation->getScore());
        $this->assertSame(Participation::STATUT_EN_ATTENTE, $participation->getStatut());
    }
}
