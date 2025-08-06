<?php

namespace App\Security;

use App\Repository\UserRepository;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;
use Symfony\Component\Security\Core\User\UserProviderInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Credentials\PasswordCredentials;

class CustomAuthenticator extends AbstractAuthenticator
{
    private UserRepository $repository;
    private UserPasswordHasherInterface $passwordHasher;

    public function __construct(UserRepository $repository, UserPasswordHasherInterface $passwordHasher)
    {
        $this->repository = $repository;
        $this->passwordHasher = $passwordHasher;
    }

    public function supports(Request $request): ?bool
    {
        file_put_contents(__DIR__.'/log.txt', "supports() called\n", FILE_APPEND);
        return $request->headers->has('X-AUTH-TOKEN');

        //Auth via token
        if ($request->headers->has('X-AUTH-TOKEN')) {
            return true;
        }

        //Auth via username/password
        if ($request->getPathInfo() === '/api/login' && $request->isMethod('POST')) {
            return true;
        }

        return false;
    }

    public function authenticate(Request $request): Passport
    {
        // Auth via token
        if ($request->headers->has('X-AUTH-TOKEN')) {
            $apiToken = $request->headers->get('X-AUTH-TOKEN');

            $user = $this->repository->findOneBy(['apiToken' => $apiToken]);
            if (null === $user) {
                throw new UserNotFoundException();
            }

            return new SelfValidatingPassport(new UserBadge(
                $user->getUserIdentifier(),
                fn() => $user
            ));
        }

        // Auth via username/password
        $data = json_decode($request->getContent(), true);

        $username = $data['username'] ?? null;
        $password = $data['password'] ?? null;

        if (!$username || !$password) {
            throw new CustomUserMessageAuthenticationException('Username and password are required.');
        }

        return new Passport(
            new UserBadge($username, function ($userIdentifier) {
                $user = $this->repository->findOneBy(['username' => $userIdentifier]);
                if (!$user) {
                    throw new UserNotFoundException();
                }
                return $user;
            }),
            new PasswordCredentials($password)
        );
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return new JsonResponse([
            'message' => 'Authentication success',
        ]);
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        return new JsonResponse(
            ['message' => strtr($exception->getMessageKey(), $exception->getMessageData())],
            Response::HTTP_UNAUTHORIZED
        );
    }
}
