<?php

namespace App\Command;

use App\Repository\UserRepository;
use App\Repository\EvenementsRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:debug-user-events',
    description: 'Debug user events to find why organized events are not showing',
)]
class DebugUserEventsCommand extends Command
{
    public function __construct(
        private UserRepository $userRepository,
        private EvenementsRepository $eventsRepository
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        // Récupérer tous les utilisateurs avec le rôle admin
        $users = $this->userRepository->findAll();
        
        $io->title('Debug: Utilisateurs et événements organisés');
        
        foreach ($users as $user) {
            $roles = $user->getRoles();
            if (in_array('ROLE_ADMIN', $roles)) {
                $io->section('Utilisateur ADMIN: ' . $user->getUsername() . ' (ID: ' . $user->getId() . ')');
                $io->text('Rôles: ' . implode(', ', $roles));
                $io->text('API Token: ' . ($user->getApiToken() ? 'Présent' : 'Absent'));
                
                $organizedEvents = $user->getEvenements();
                $io->text('Nombre d\'événements organisés: ' . $organizedEvents->count());
                
                foreach ($organizedEvents as $event) {
                    $io->text('- Event ID: ' . $event->getId() . ', Titre: ' . $event->getTitre() . ', Organisateur ID: ' . $event->getOrganisateur()->getId());
                }
                $io->newLine();
            }
        }

        // Vérifier tous les événements et leur organisateur
        $io->section('Tous les événements et leurs organisateurs:');
        $events = $this->eventsRepository->findAll();
        
        foreach ($events as $event) {
            $organisateur = $event->getOrganisateur();
            $io->text('Event ID: ' . $event->getId() . ' "' . $event->getTitre() . '" -> Organisateur: ' . $organisateur->getUsername() . ' (ID: ' . $organisateur->getId() . ')');
        }

        return Command::SUCCESS;
    }
}
