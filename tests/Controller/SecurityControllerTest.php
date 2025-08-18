<?php

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use App\Entity\User;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class SecurityControllerTest extends WebTestCase
{
    private $client;
    private $entityManager;
    private $passwordHasher;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $container = self::getContainer();
        $this->entityManager = $container->get('doctrine')->getManager();
        $this->passwordHasher = $container->get(UserPasswordHasherInterface::class);

        //Nettoyage
        $this->entityManager->createQuery('DELETE FROM App\Entity\User u')->execute();
    }

    private function createUser(string $username = 'testuser', string $mail = 'test@test.com', string $password = 'password123'): User
    {
        $user = new User();
        $user->setUsername($username);
        $user->setMail($mail);
        $hashed = $this->passwordHasher->hashPassword($user, $password);
        $user->setPassword($hashed);
        $user->setApiToken(bin2hex(random_bytes(32)));

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    public function testRegistration(): void
    {
        $payload = [
            'username' => 'newuser',
            'mail' => 'newuser@test.com',
            'password' => 'securepass'
        ];

        $this->client->request(
            'POST',
            '/api/registration',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($payload)
        );

        $response = $this->client->getResponse();
        $this->assertEquals(201, $response->getStatusCode());

        $data = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('user', $data);
        $this->assertArrayHasKey('apiToken', $data);
        $this->assertArrayHasKey('roles', $data);
    }

    public function testLoginSuccess(): void
    {
        $user = $this->createUser();

        $payload = [
            'username' => $user->getUserIdentifier(),
            'password' => 'password123'
        ];

        $this->client->request(
            'POST',
            '/api/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($payload)
        );

        $response = $this->client->getResponse();
        $this->assertEquals(200, $response->getStatusCode());

        $data = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('user', $data);
        $this->assertArrayHasKey('apiToken', $data);
        $this->assertArrayHasKey('roles', $data);
    }

    public function testLoginFail(): void
    {
        $payload = [
            'username' => 'wronguser',
            'password' => 'wrongpass'
        ];

        $this->client->request(
            'POST',
            '/api/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($payload)
        );

        $response = $this->client->getResponse();
        $this->assertEquals(401, $response->getStatusCode());

        $data = json_decode($response->getContent(), true);

        // Correspond à ton LoginFailureHandler
        $this->assertArrayHasKey('error', $data);
        $this->assertEquals('Invalid credentials', $data['error']);
    }

    public function testApiTokenAccess(): void
    {
        $user = $this->createUser();

        $this->client->request(
            'GET',
            '/api/protected-test',
            [],
            [],
            ['HTTP_X_AUTH_TOKEN' => $user->getApiToken()]
        );

        $response = $this->client->getResponse();
        $this->assertEquals(200, $response->getStatusCode());
    }

    public function testApiTokenFail(): void
    {
        $this->client->request(
            'GET',
            '/api/protected-test',
            [],
            [],
            ['HTTP_X_AUTH_TOKEN' => 'wrongtoken']
        );

        $response = $this->client->getResponse();
        $this->assertEquals(401, $response->getStatusCode());

        $data = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('error', $data);
        $this->assertEquals('Invalid or missing token', $data['error']);
    }
}
