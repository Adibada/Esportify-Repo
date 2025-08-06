<?php

namespace App\Serializer;

use Symfony\Component\Serializer\Normalizer\ContextAwareNormalizerInterface;
use Symfony\Component\Serializer\Normalizer\ObjectNormalizer;
use App\Entity\User;

class UserNormalizer implements ContextAwareNormalizerInterface
{
    private ObjectNormalizer $normalizer;

    public function __construct(ObjectNormalizer $normalizer){
        $this->normalizer = $normalizer;
    }

    public function supportsNormalization($data, string $format = null, array $context = []): bool
    {
        return $data instanceof User;
    }

    public function normalize($object, string $format = null, array $context = []): array
    {
        // Si on est dans un contexte d'embed dans un Evenement
        if (($context['embedded_in_evenement'] ?? false) === true) {
            // On renvoie seulement ce qu'on veut (évite le password et apiToken)
            return [
                'id' => $object->getId(),
                'username' => $object->getUsername(),
                'mail' => $object->getMail(),
            ];
        }

        // Sinon comportement normal
        return $this->normalizer->normalize($object, $format, $context);
    }
}
