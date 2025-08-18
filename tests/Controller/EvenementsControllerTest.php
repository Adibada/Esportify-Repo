<?php

namespace App\Tests\Functional;

use App\Entity\Evenements;
use App\Entity\User;
use App\Repository\EvenementsRepository;
use App\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

class EvenementsControllerTest extends WebTestCase
{
    private $client;
    private $userRepo;
    private $evenementsRepo;
    private $entityManager;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $container = static::getContainer();
        $this->userRepo = $container->get(UserRepository::class);
        $this->evenementsRepo = $container->get(EvenementsRepository::class);
        $this->entityManager = $container->get('doctrine')->getManager();

        //Nettoyage
        foreach ($this->userRepo->findAll() as $user) {
            $this->entityManager->remove($user);
        }
        foreach ($this->evenementsRepo->findAll() as $event) {
            $this->entityManager->remove($event);
        }
        $this->entityManager->flush();
    }

//Mis en place

    private function createUser(string $username, string $role): User
    {
        $user = new User();
        $user->setUsername($username)
            ->setMail("$username@test.com")
            ->setRoles([$role])
            ->setPassword(password_hash('password', PASSWORD_BCRYPT));

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    private function getFirstEvenement(): Evenements
    {
        $evenements = $this->evenementsRepo->findAll();

        if (empty($evenements)) {
            $organisateur = $this->createUser('default_orga', 'ROLE_ORGANISATEUR');

            $evenement = new Evenements();
            $evenement->setTitre('Événement test')
                    ->setDescription('Description test')
                    ->setStart(new \DateTimeImmutable('2025-09-01 12:00:00'))
                    ->setEnd(new \DateTimeImmutable('2025-09-01 18:00:00'))
                    ->setOrganisateur($organisateur);

            $this->entityManager->persist($evenement);
            $this->entityManager->flush();

            return $evenement;
        }

        return $evenements[0];
    }


    private function getEvenementData(): array
    {
        return [
            'titre' => 'Test Evenement',
            'description' => 'Description test',
            'start' => '2025-09-01T12:00:00',
            'end' => '2025-09-01T18:00:00'
        ];
    }

//Tests des méthodes publiques

    public function testShowEvenementPublic(): void
    {
        $evenement = $this->getFirstEvenement();
        $this->client->request('GET', '/api/evenements/' . $evenement->getId());
        $this->assertResponseStatusCodeSame(Response::HTTP_OK);
    }

//Tests des méthodes d'organisateurs

    public function testCreateEvenementAsOrganisateur(): void
    {
        $organisateur = $this->createUser('organisateur1', 'ROLE_ORGANISATEUR');
        $this->client->loginUser($organisateur);

        $this->client->request(
            'POST',
            '/api/evenements',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($this->getEvenementData())
        );

        $this->assertResponseStatusCodeSame(Response::HTTP_CREATED);
    }

    public function testEditEvenementAsOrganisateur(): void
    {
        $organisateur = $this->createUser('organisateur2', 'ROLE_ORGANISATEUR');
        $this->client->loginUser($organisateur);

        $evenement = $this->getFirstEvenement();

        $this->client->request(
            'PUT',
            '/api/evenements/' . $evenement->getId(),
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['titre' => 'Titre modifié'])
        );

        $this->assertResponseStatusCodeSame(Response::HTTP_OK);
    }

//Tests des méthodes d'admin

    public function testDeleteEvenementAsAdmin(): void
    {
        $admin = $this->createUser('admin1', 'ROLE_ADMIN');
        $this->client->loginUser($admin);

        $evenement = $this->getFirstEvenement();

        $this->client->request('DELETE', '/api/evenements/' . $evenement->getId());
        $this->assertResponseStatusCodeSame(Response::HTTP_OK);
    }

    public function testValiderEvenementAsAdmin(): void
    {
        $admin = $this->createUser('admin2', 'ROLE_ADMIN');
        $this->client->loginUser($admin);

        $evenement = $this->getFirstEvenement();

        $this->client->request('PUT', '/api/evenements/' . $evenement->getId() . '/valider');
        $this->assertResponseStatusCodeSame(Response::HTTP_OK);
    }

    public function testEditEvenementNotFound(): void
    {
        $admin = $this->createUser('admin3', 'ROLE_ADMIN');
        $this->client->loginUser($admin);

        $this->client->request(
            'PUT',
            '/api/evenements/999999',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['titre' => 'Test'])
        );

        $this->assertResponseStatusCodeSame(Response::HTTP_NOT_FOUND);
    }
}
