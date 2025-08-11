<?php

namespace App\Tests\Entity;

use App\Entity\User;
use App\Entity\Evenements;
use PHPUnit\Framework\TestCase;
use Doctrine\Common\Collections\Collection;

class UserTest extends TestCase
{
    public function testUsername()
    {
        $user = new User();
        $user->setUsername('JohnDoe');
        $this->assertSame('JohnDoe', $user->getUsername());
        $this->assertSame('JohnDoe', $user->getUserIdentifier());
    }

    public function testMail()
    {
        $user = new User();
        $user->setMail('john@example.com');
        $this->assertSame('john@example.com', $user->getMail());
    }

    public function testPassword()
    {
        $user = new User();
        $user->setPassword('hashed_password');
        $this->assertSame('hashed_password', $user->getPassword());
    }

    public function testRolesDefaultContainsRoleUser()
    {
        $user = new User();
        $this->assertContains('ROLE_USER', $user->getRoles());
    }

    public function testRolesCustom()
    {
        $user = new User();
        $user->setRoles(['ROLE_ADMIN']);
        $roles = $user->getRoles();
        $this->assertContains('ROLE_ADMIN', $roles);
        $this->assertContains('ROLE_USER', $roles);
    }

    public function testApiTokenIsGeneratedByDefault()
    {
        $user = new User();
        $this->assertNotEmpty($user->getApiToken());
        $this->assertIsString($user->getApiToken());
        $this->assertSame(40, strlen($user->getApiToken()));
    }

    public function testSetApiToken()
    {
        $user = new User();
        $token = 'customtoken1234567890';
        $user->setApiToken($token);
        $this->assertSame($token, $user->getApiToken());
    }

    public function testParticipationsInitiallyEmpty()
    {
        $user = new User();
        $this->assertInstanceOf(Collection::class, $user->getParticipations());
        $this->assertCount(0, $user->getParticipations());
    }

    public function testAddParticipation()
    {
        $user = new User();
        $event = $this->createMock(Evenements::class);
        $event->expects($this->once())->method('addCompetitor')->with($user);

        $user->addParticipation($event);

        $this->assertCount(1, $user->getParticipations());
        $this->assertTrue($user->getParticipations()->contains($event));
    }

    public function testRemoveParticipation()
    {
        $user = new User();
        $event = $this->createMock(Evenements::class);

        $event->expects($this->once())->method('addCompetitor')->with($user);
        $event->expects($this->once())->method('removeCompetitor')->with($user);

        $user->addParticipation($event);
        $user->removeParticipation($event);

        $this->assertCount(0, $user->getParticipations());
    }

    public function testEraseCredentials()
    {
        $user = new User();
        $user->eraseCredentials();
        $this->addToAssertionCount(1);
    }

    public function testSaltIsAlwaysNull()
    {
        $user = new User();
        $this->assertNull($user->getSalt());
    }
}
