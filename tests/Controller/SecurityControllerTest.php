<?php

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

class SecurityControllerTest extends WebTestCase
{
    private $client;
    private $entityManager;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->entityManager = self::$container->get(EntityManagerInterface::class);
        
        //Nettoie la base avant chaque test
        $users = $this->entityManager->getRepository(User::class)->findAll();
        foreach ($users as $user) {
            $this->entityManager->remove($user);
        }
        $this->entityManager->flush();
    }

    public function testRegisterSuccess(): void
    {
        $data = [
            'username' => 'testuser',
            'mail' => 'testuser@example.com',
            'password' => 'TestPass123!',
        ];

        $this->client->request(
            'POST',
            '/api/registration',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($data)
        );

        $response = $this->client->getResponse();
        $this->assertSame(201, $response->getStatusCode());

        $json = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('user', $json);
        $this->assertEquals('testuser', $json['user']);
        $this->assertArrayHasKey('apiToken', $json);
        $this->assertArrayHasKey('roles', $json);
        $this->assertIsArray($json['roles']);
    }

    public function testRegisterBadRequest(): void
    {
        //données incomplètes : password manquant
        $data = [
            'username' => 'testuser',
            'mail' => 'invalid-email-format',  //mail invalide aussi
        ];

        $this->client->request(
            'POST',
            '/api/registration',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($data)
        );

        $response = $this->client->getResponse();
        $this->assertSame(400, $response->getStatusCode());

        $json = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('message', $json);
        $this->assertStringContainsString('required', $json['message']);
    }

    public function testLoginSuccess(): void
    {
        //Crée un utilisateur en base pour tester login
        $user = new User();
        $user->setUsername('loginuser');
        $user->setMail('loginuser@example.com');

        //Hash le mot de passe manuellement
        $passwordHasher = self::$container->get('security.password_hasher');
        $hashedPassword = $passwordHasher->hashPassword($user, 'password123');
        $user->setPassword($hashedPassword);

        $user->setApiToken(bin2hex(random_bytes(32)));

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        //Requête login
        $data = [
            'username' => 'loginuser',
            'password' => 'password123',
        ];

        $this->client->request(
            'POST',
            '/api/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($data)
        );

        $response = $this->client->getResponse();

        $this->assertSame(200, $response->getStatusCode());

        $json = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('user', $json);
        $this->assertEquals('loginuser', $json['user']);
        $this->assertArrayHasKey('apiToken', $json);
        $this->assertArrayHasKey('roles', $json);
        $this->assertIsArray($json['roles']);
    }

    public function testLoginFail(): void
    {
        $data = [
            'username' => 'nonexistent',
            'password' => 'wrongpassword',
        ];

        $this->client->request(
            'POST',
            '/api/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($data)
        );

        $response = $this->client->getResponse();

        $this->assertSame(401, $response->getStatusCode());

        $json = json_decode($response->getContent(), true);

        if (is_array($json) && array_key_exists('message', $json)) {
            $this->assertEquals('Missing credentials', $json['message']);
        }
    }
}
