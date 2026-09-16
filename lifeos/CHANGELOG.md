# Changelog

Toutes les évolutions notables de LifeOS. Format inspiré de
[Keep a Changelog](https://keepachangelog.com/fr/), versions [SemVer](https://semver.org/lang/fr/).

## [0.1.10] — 2026-09-16

### Ajouté
- **Import multi-fichiers** : sélection de plusieurs `.json` d'un coup, avec
  résolution des conflits par fichier quand une page du même nom existe déjà —
  *Mettre à jour* (remplace le contenu en gardant verrou, disposition et
  planning), *Ajouter en double* ou *Ignorer*. Le copier-coller de JSON reste.
- **Description sur les check-lists** (≤ 300 caractères) affichée sous le
  titre — consignes techniques, contexte.

### Modifié
- Fiches d'exemple entièrement réécrites en version autonome : échauffements
  détaillés mouvement par mouvement, consignes sur chaque exercice et chaque
  position d'étirement, check-lists gommage/contours pour la routine soins.

## [0.1.9] — 2026-09-16

### Ajouté
- **Disposition « colonne ordonnée » par page** : l'ordre visuel suit l'ordre
  réel des blocs sur ordinateur, comme sur téléphone.
- **Mode Play ▶** : lecteur plein écran qui déroule les blocs un par un
  (flèches tactiles et clavier, barre de progression, points de navigation,
  bouton *Terminer*). Les timers lancés continuent de tourner d'un bloc à
  l'autre ; les médias hors du bloc courant se coupent.
- **Description sur les timers** (≤ 300 caractères) : consignes, charge,
  tempo, affichées sous le titre.

## [0.1.8] — 2026-09-16

### Ajouté
- **Verrou par page** 🔒 : fige la structure (déplacement, taille,
  suppression, configuration, ajout) tout en laissant l'usage quotidien
  (cocher, lancer les timers, son des vidéos). Bloque aussi la suppression de
  la page. Persisté par utilisateur.

## [0.1.7] — 2026-09-16

### Ajouté
- **Widget Média** : photo, GIF ou vidéo en boucle (mp4/webm), son optionnel,
  ajustement cover/contain. Optimisé : montage à l'approche de l'écran
  seulement, lecture coupée et GIF déchargés hors écran, liens de page Giphy
  convertis automatiquement en URL directe.
- **Planning hebdomadaire récurrent** : chaque page s'attribue à un ou
  plusieurs jours (pastilles L→D), bande « Ma semaine » dans la vue
  d'ensemble avec le jour courant mis en avant.
- Schéma d'import : widget `media` et champ `routine.days`.

## [0.1.6] — 2026-09-16

### Ajouté
- **Personnalisation des couleurs** : panneau 🎨 avec 6 préréglages (Nuit et
  Blanc restaurent les thèmes de base, plus Minuit, Sable, Forêt, Rose) et
  pipettes fond/cartes/texte/lignes/accent — par utilisateur (synchronisé) ou
  **par page**. Tons dérivés calculés automatiquement pour garder le
  contraste.
- Schéma d'import : champ `routine.theme` (une IA peut livrer une routine
  avec sa palette).

## [0.1.5] — 2026-09-16

### Ajouté
- **Interface mobile** : barre compacte (page courante, ＋, menu ⋮),
  drag & drop tactile par appui long, PWA installable sur l'écran d'accueil.
- **Vue d'ensemble** : le logo ▦ ouvre toutes les pages en cartes (résumé des
  widgets, renommage, suppression, nouvelle page, import).
- **Multi-utilisateur réel** : un dashboard par compte HA, stocké côté
  serveur (`/data/dashboards/`) et synchronisé entre appareils ; migration
  automatique de l'ancien état localStorage.

### Supprimé
- Page de logs in-app (`/logs`) — le journal reste dans
  `/data/auth-log.jsonl` et l'onglet Journal de l'add-on.

## [0.1.4] — 2026-09-16

### Ajouté
- **Double authentification (TOTP)** : champ « code de validation » affiché
  automatiquement quand Home Assistant l'exige ; flux complet en une requête.

## [0.1.3] — 2026-09-16

### Ajouté
- **Canal d'authentification de secours** : bascule automatique sur le
  `login_flow` officiel du cœur HA (réseau interne) quand l'API Supervisor
  refuse ; auto-diagnostic au démarrage dans le Journal de l'add-on.

## [0.1.2] — 2026-09-16

### Ajouté
- Diagnostics d'authentification : chaque tentative tracée dans le Journal de
  l'add-on avec le code HTTP du Supervisor ; nouvel essai en formulaire
  URL-encodé si le JSON est rejeté.

## [0.1.1] — 2026-09-16

### Corrigé
- Build de l'add-on : image `node:22-alpine` fixée (le `BUILD_FROM` du
  Supervisor pointait une base sans Node.js) ; anti-cache pour que les
  reconstructions récupèrent le code à jour.

## [0.1.0] — 2026-09-16

### Ajouté
- MVP initial : dashboard modulaire drag & drop (pages multiples, widgets
  note Markdown / timer / check-list / calendrier ICS), dark mode natif,
  moteur d'importation JSON (schéma v1 + Zod), authentification Home
  Assistant avec journal de connexions, add-on Home Assistant OS
  (aarch64/amd64).
