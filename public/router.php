<?php
// Routeur pour le serveur PHP intégré - SPA support
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// Si c'est une route API, laisser Symfony gérer
if (strpos($uri, '/api/') === 0) {
    return false; // Passer au router Symfony
}

// Si le fichier existe physiquement, le servir
if ($uri !== '/' && file_exists(__DIR__ . $uri)) {
    return false; // Servir le fichier statique
}

// Pour toutes les autres routes (SPA), servir index.html
if (strpos($uri, '/public') === false) {
    readfile(__DIR__ . '/index.html');
    return true;
}

return false;
