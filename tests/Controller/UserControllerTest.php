<?php

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class UserControllerTest extends WebTestCase
{
    private $client;
    private $entityManager;
    private $passwordHasher;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $container = static::getContainer();

        $this->entityManager = $container->get(EntityManagerInterface::class);
        $this->passwordHasher = $container->get(UserPasswordHasherInterface::class);

        // Nettoyage complet des utilisateurs avant chaque test
        foreach ($this->entityManager->getRepository(User::class)->findAll() as $user) {
            $this->entityManager->remove($user);
        }
        $this->entityManager->flush();
    }

    private function createUser(string $username, string $password, array $roles = ['ROLE_USER']): User
    {
        $user = new User();
        $user->setUsername($username);
        $user->setMail($username . '@example.com');
        $user->setRoles($roles);
        $user->setPassword($this->passwordHasher->hashPassword($user, $password));
        $user->setApiToken(bin2hex(random_bytes(32)));

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    public function testGetUserProfile(): void
    {
        $user = $this->createUser('profileuser', 'password123');

        $this->client->request(
            'GET',
            '/api/users/' . $user->getId(),
            [],
            [],
            [
                'HTTP_X_AUTH_TOKEN' => $user->getApiToken(),
                'CONTENT_TYPE' => 'application/json'
            ]
        );

        $response = $this->client->getResponse();
        $this->assertSame(200, $response->getStatusCode());

        $json = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('username', $json);
        $this->assertEquals('profileuser', $json['username']);
    }

    public function testGetUserProfileUnauthorized(): void
    {
        $user = $this->createUser('nouser', 'password123');

        $this->client->request(
            'GET',
            '/api/users/' . $user->getId(),
            [],
            [],
            ['CONTENT_TYPE' => 'application/json']
        );

        $this->assertSame(401, $this->client->getResponse()->getStatusCode());
    }

    public function testUpdateUserProfile(): void
    {
        $user = $this->createUser('edituser', 'password123');

        $newData = ['mail' => 'newmail@example.com'];

        $this->client->request(
            'PUT',
            '/api/users/' . $user->getId(),
            [],
            [],
            [
                'HTTP_X_AUTH_TOKEN' => $user->getApiToken(),
                'CONTENT_TYPE' => 'application/json'
            ],
            json_encode($newData)
        );

        $this->assertSame(200, $this->client->getResponse()->getStatusCode());

        $this->entityManager->clear();
        $updatedUser = $this->entityManager->getRepository(User::class)->find($user->getId());
        $this->assertEquals('newmail@example.com', $updatedUser->getMail());
    }
}
