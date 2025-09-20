<?php
// Script pour créer un utilisateur de test avec mot de passe "test123"
echo password_hash('test123', PASSWORD_DEFAULT) . "\n";
