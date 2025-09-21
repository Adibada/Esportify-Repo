<?php
/**
 * Configuration phpMyAdmin pour Platform.sh/Upsun
 * À utiliser avec le tunnel SSH actif sur le port 30000
 */

/* vim: set expandtab sw=4 ts=4 sts=4: */

//$cfg['blowfish_secret'] = 'upsun-platformsh-secret-key-for-esportify';

$i = 0;

/* Configuration pour la base de données Platform.sh via tunnel SSH */
$i++;
$cfg['Servers'][$i]['auth_type'] = 'config';
$cfg['Servers'][$i]['host'] = '127.0.0.1';
$cfg['Servers'][$i]['port'] = '30000';
$cfg['Servers'][$i]['connect_type'] = 'tcp';
$cfg['Servers'][$i]['user'] = 'user';
$cfg['Servers'][$i]['password'] = 'azerty';
$cfg['Servers'][$i]['only_db'] = 'main';
$cfg['Servers'][$i]['verbose'] = 'Esportify Production DB (Upsun)';

/* Configuration locale (MySQL par défaut) */
$i++;
$cfg['Servers'][$i]['auth_type'] = 'cookie';
$cfg['Servers'][$i]['host'] = 'localhost';
$cfg['Servers'][$i]['connect_type'] = 'tcp';
$cfg['Servers'][$i]['compress'] = false;
$cfg['Servers'][$i]['AllowNoPassword'] = true;
$cfg['Servers'][$i]['verbose'] = 'MySQL Local';

$cfg['DefaultLang'] = 'fr';
$cfg['ServerDefault'] = 1; // Utiliser Platform.sh par défaut
$cfg['UploadDir'] = '';
$cfg['SaveDir'] = '';

$cfg['Servers'][$i]['AllowRoot'] = true;
$cfg['ShowServerChoice'] = true;
