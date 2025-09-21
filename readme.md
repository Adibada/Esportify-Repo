# Esportify 🎮

Site web pour une entreprise fictive d'événements e-sport.  
**Exercice réalisé dans le cadre d'une évaluation en cours de formation.**

## 🌐 Site de Production

**URL :** [https://main-bvxea6i-voxmustf43meq.fr-3.platformsh.site/](https://main-bvxea6i-voxmustf43meq.fr-3.platformsh.site/)

**Hébergement :** Upsun (Platform.sh) avec déploiement automatique via GitHub

## 🛠️ Technologies utilisées

### Backend
- **PHP 8.x** avec **Symfony 6.x**
- **MySQL 8.0** pour la base de données
- **Doctrine ORM** pour la gestion des entités
- **API Platform** pour les endpoints REST
- **Nelmio API Doc** pour la documentation Swagger
- **Service EventStatusService** pour la gestion automatique des statuts

### Frontend
- **HTML5** / **CSS3** / **JavaScript ES6+**
- **Bootstrap 5** pour le design responsive
- **Architecture SPA** (Single Page Application) avec routing côté client

### Infrastructure
- **Upsun (Platform.sh)** pour l'hébergement cloud
- **MySQL 8.0** en production
- **Système de fichiers persistant** pour les uploads d'images
- **Déploiement automatique** via GitHub Actions

## 🚀 Installation

### Prérequis
- **Apache**
- **MySQL 8.x**
- **PHP 8.x** avec extensions :
  - `pdo_mysql`
  - `intl`
  - `json`
- **Composer**

### Étapes d'installation

1. **Cloner le repository**
   ```bash
   git clone https://github.com/Adibada/Esportify-Repo.git
   cd Esportify-Repo
   ```

2. **Installer les dépendances**
   ```bash
   composer install
   ```

3. **Configuration de l'environnement**
   ```bash
   cp .env .env.local
   # Modifier les paramètres de base de données dans .env.local
   ```

4. **Créer la base de données**
   ```bash
   php bin/console doctrine:database:create
   php bin/console doctrine:migrations:migrate
   ```
5. **Lancer le serveur de développement**
   ```bash
   symfony server:start
   # ou
   php bin/console server:run
   ```

## 📚 Documentation API

La documentation interactive de l'API est accessible à l'adresse :
**[http://localhost:8000/api/doc](http://localhost:8000/api/doc)** (développement)
**[https://main-bvxea6i-voxmustf43meq.fr-3.platformsh.site/api/doc](https://main-bvxea6i-voxmustf43meq.fr-3.platformsh.site/api/doc)** (production)

## 👤 Comptes de test

Plusieurs comptes sont disponibles pour tester les différentes fonctionnalités :

### 🔐 Administrateur
| Champ | Valeur |
|-------|--------|
| **Username** | `aaa` |
| **Email** | `aaa@exemple.com` |
| **Mot de passe** | `azerty` |
| **Rôle** | `ROLE_ADMIN` |
| **API Token** | `123azerty` |

### 👑 Organisateur
| Champ | Valeur |
|-------|--------|
| **Username** | `adibada` |
| **Mot de passe** | `motdepasse` |
| **Rôle** | `ROLE_ORGANISATEUR` |

### 👤 Utilisateur standard
| Champ | Valeur |
|-------|--------|
| **Username** | `testuser` |
| **Mot de passe** | `azerty` |
| **Rôle** | `ROLE_USER` |


## 🔐 Sécurité et Permissions

- **Authentification** par token API sécurisé
- **Système de rôles hiérarchique** (USER < ORGANISATEUR < ADMIN)
- **Contrôle d'accès** par endpoint API
- **Validation stricte** des données côté serveur avec Symfony Validator
- **Protection CSRF** intégrée
- **Hashage sécurisé** des mots de passe avec bcrypt
- **Filtrage des événements** selon les permissions utilisateur
- **Gestion des statuts d'événements** automatisée et sécurisée

## 🏗️ Architecture

```
public/
├── Images/           # Ressources images statiques
├── js/              # Scripts JavaScript modulaires
│   ├── auth/        # Scripts authentification
│   │   ├── connexion.js     # Gestion rôles admin améliorée
│   │   ├── monProfil.js     # Panel admin + participations
│   │   └── ...
│   ├── creationEvenement.js # Upload images multiples
│   ├── evenement.js         # Modal admin participants
│   ├── modifierEvenement.js # Gestion images avancée  
│   ├── rechercheEvenements.js # Interface recherche corrigée
│   └── ...
├── Pages/           # Templates HTML du SPA
├── Router/          # Configuration routage client
└── scss/            # Styles CSS/SCSS

src/
├── Controller/      # Contrôleurs API REST
│   ├── EvenementsController.php # CRUD + admin participants
│   ├── ImageController.php      # Serveur images Symfony
│   ├── UserController.php       # Recherche utilisateurs
│   └── ...
├── Entity/          # Entités Doctrine avec relations
├── Repository/      # Repositories avec queries optimisées
├── Security/        # Authentificateurs et voters
├── Service/         # Services métier (EventStatusService)
└── DataFixtures/    # Jeux de données pour développement

var/
└── cache/
    └── uploads/     # Stockage images avec route Symfony
```