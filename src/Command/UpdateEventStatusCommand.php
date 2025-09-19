<?php

namespace App\Command;

use App\Service\EventStatusService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:update-event-status',
    description: 'Met à jour automatiquement les statuts des événements selon leurs dates',
)]
class UpdateEventStatusCommand extends Command
{
    private EventStatusService $eventStatusService;

    public function __construct(EventStatusService $eventStatusService)
    {
        $this->eventStatusService = $eventStatusService;
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $io->title('Mise à jour des statuts d\'événements');

        try {
            // Mettre à jour tous les statuts d'événements
            $results = $this->eventStatusService->updateAllEventsStatusComplete();
            
            $io->success('Mise à jour des statuts terminée avec succès !');
            
            // Afficher un résumé des modifications
            $totalChanges = $results['total_changes'];
            $statusUpdated = $results['status_updated'];
            $eventsRefused = $results['events_refused'];
            
            if ($totalChanges > 0) {
                $io->section('Résumé des modifications :');
                if ($statusUpdated > 0) {
                    $io->writeln("- {$statusUpdated} événement(s) ont eu leur statut mis à jour selon leurs dates");
                }
                if ($eventsRefused > 0) {
                    $io->writeln("- {$eventsRefused} événement(s) en attente ont été automatiquement refusés (date dépassée)");
                }
            } else {
                $io->note('Aucun événement n\'avait besoin d\'être mis à jour.');
            }

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $io->error('Erreur lors de la mise à jour des statuts : ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
