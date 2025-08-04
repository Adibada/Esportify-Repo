<?php

namespace App\Serializer;

use App\Entity\Evenements;
use Symfony\Component\Serializer\Normalizer\ObjectNormalizer;
use Symfony\Component\Serializer\Normalizer\ContextAwareNormalizerInterface;

class EvenementsNormalizer implements ContextAwareNormalizerInterface
{
    public function __construct(private ObjectNormalizer $normalizer) {}

    public function supportsNormalization($data, string $format = null, array $context = []): bool
    {
        return $data instanceof Evenements;
    }

    public function normalize($object, string $format = null, array $context = []): array
    {
        // Ajout d’un flag pour le contexte de l’organisateur
        $context['embedded_in_evenement'] = true;

        return $this->normalizer->normalize($object, $format, $context);
    }
}
