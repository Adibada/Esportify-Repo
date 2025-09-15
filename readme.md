# Esportify 🎮

Site web pour une entreprise fictive d'événements e-sport.  
**Exercice réalisé dans le cadre d'une évaluation en cours de formation.**

## 🛠️ Technologies utilisées

### Backend
- **PHP 8.x** avec **Symfony 6.x**
- **MySQL** pour la base de données
- **Doctrine ORM** pour la gestion des entités
- **API Platform** pour les endpoints REST
- **Nelmio API Doc** pour la documentation

### Frontend
- **HTML5** / **CSS3** / **JavaScript ES6+**
- **Bootstrap 5** pour le design responsive
- **Architecture SPA** (Single Page Application)
- **Routing côté client**

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

5. **Charger les fixtures (optionnel)**
   ```bash
   php bin/console doctrine:fixtures:load
   ```

6. **Lancer le serveur de développement**
   ```bash
   symfony server:start
   # ou
   php bin/console server:run
   ```

## 📚 Documentation API

La documentation interactive de l'API est accessible à l'adresse :
**[http://localhost:8000/api/doc](http://localhost:8000/api/doc)**

### Endpoints principaux
- `GET /api/evenements` - Liste des événements
- `GET /api/evenements/en-cours` - Événements en cours
- `GET /api/users/{id}` - Profil utilisateur
- `PUT /api/users/{id}/role` - Modifier le rôle (Admin uniquement)
- `POST /api/login` - Authentification
- `POST /api/registration` - Inscription

## 👤 Comptes de test

Plusieurs comptes sont disponibles pour tester les différentes fonctionnalités :

### 🔐 Administrateur
| Champ | Valeur |
|-------|--------|
| **Username** | `aaa` |
| **Email** | `aaa@exemple.com` |
| **Mot de passe** | `motdepasse` |
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

## 🎯 Fonctionnalités

### Pour tous les utilisateurs
- 🏠 **Page d'accueil** avec carrousels automatiques
- 🔍 **Recherche d'événements** avec filtres
- 👥 **Recherche de profils** utilisateurs
- 📅 **Consultation des événements** (détails, participants)
- 📝 **Inscription/Connexion**

## 📱 Design responsive

Le site est entièrement responsive et s'adapte aux différentes tailles d'écran :
- 💻 **Desktop** (1200px+)
- 📱 **Tablet** (768px - 1199px)
- 📱 **Mobile** (320px - 767px)

## 🔐 Sécurité

- **Authentification** par token API
- **Gestion des rôles** (USER, ORGANISATEUR, ADMIN)
- **Validation** des données côté serveur
- **Protection CSRF** avec Symfony
- **Hashage sécurisé** des mots de passe

## 🏗️ Architecture

```
public/
├── Images/           # Ressources images
├── js/              # Scripts JavaScript
├── Pages/           # Templates HTML
├── Router/          # Système de routage SPA
└── scss/            # Styles CSS

src/
├── Controller/      # Contrôleurs API
├── Entity/          # Entités Doctrine
├── Repository/      # Repositories
├── Security/        # Configuration sécurité
└── DataFixtures/    # Données de test
```

## 📄 Licence

Ce projet est réalisé dans un cadre éducatif.

## 👨‍💻 Auteur

**Adibada** - *Développement complet* - [GitHub](https://github.com/Adibada)

