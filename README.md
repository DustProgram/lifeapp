# LifeOS — Personal Life OS & Routine Hub

Espace personnel modulaire, auto-hébergé, pensé pour piloter des routines
complexes (sport, skincare, focus…) avec des widgets : notes Markdown,
chronos/minuteurs d'intervalles, check-lists quotidiennes et agenda du jour.

Interface minimaliste (néo-brutalisme fonctionnel), **dark mode natif**,
grille **drag & drop**, et un **moteur d'importation JSON** : n'importe quelle
IA peut générer une page de routine complète à coller dans l'app.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4** — design tokens, dark mode classe + préférence système
- **Zustand** (persist) — état de la grille, stocké en local
- **dnd-kit** — réorganisation de la grille par glisser-déposer
- **Zod** — validation des imports de routines
- **node-ical** — lecture des flux ICS côté serveur (pas de CORS)

## Installation sur Home Assistant (recommandé — HA Green, Yellow, HA OS)

LifeOS s'installe comme un **add-on**, directement depuis l'interface HA :

1. **Paramètres → Modules complémentaires → Boutique des modules** →
   menu **⋮** → **Dépôts** → ajouter `https://github.com/DustProgram/lifeapp`

   [![Ajouter le dépôt à ma boutique d'add-ons](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2FDustProgram%2Flifeapp)

2. Installe la carte **LifeOS** (le premier build prend quelques minutes),
   démarre, puis **Ouvrir l'interface Web**.
3. Connecte-toi avec **tes identifiants Home Assistant** — l'add-on les
   valide via l'API du Supervisor, rien à configurer.

Détails dans [`lifeos/DOCS.md`](lifeos/DOCS.md).

## Démarrage manuel (serveur Node autonome)

```bash
npm install
cp .env.example .env.local   # puis édite les variables
npm run dev                  # http://localhost:3000
```

Production (IP fixe, à côté de Home Assistant) :

```bash
npm run build
npm start                    # écoute sur :3000
```

## Configuration (`.env.local`)

| Variable | Rôle |
|---|---|
| `HA_URL` | URL de ton Home Assistant (ex. `http://homeassistant.local:8123`). Active la connexion avec tes identifiants HA. |
| `APP_URL` | URL publique de LifeOS (utilisée comme `client_id` OAuth auprès de HA). |
| `APP_USER` / `APP_PASSWORD` | Fallback sans Home Assistant : compte local unique. |
| `SESSION_SECRET` | Secret de signature des sessions. Obligatoire en production (sinon régénéré à chaque redémarrage). |
| `DATA_DIR` | Dossier des données serveur (journal de connexions). Défaut : `./data`. |
| `ALLOW_HTTP` | `1` pour autoriser le cookie de session sans HTTPS (réseau local). |

## Fonctionnalités

### Authentification & journal de sécurité
La connexion est déléguée à Home Assistant via son API `login_flow` (celle des
apps mobiles officielles) : tes identifiants HA fonctionnent tels quels, aucun
token n'est stocké. Chaque tentative (réussie ou non) est consignée dans
`data/auth-log.jsonl` et consultable dans l'app (`/logs`) : date, utilisateur,
IP, user-agent, résultat.

Les comptes HA avec MFA ne sont pas encore supportés — utilise le fallback
`APP_USER`/`APP_PASSWORD` dans ce cas.

### Dashboard modulaire
- Pages multiples (onglets) : une page par routine.
- Widgets déplaçables (poignée ⠿), redimensionnables (sm/md/lg), supprimables.
- **Bloc texte** : Markdown complet.
- **Timer** : chrono libre, minuteur, ou mode *séries* (effort/repos × N) avec
  bips sonores — pensé pour la musculation.
- **Check-list** : progression, reset automatique chaque jour.
- **Calendrier** : événements du jour en lecture seule depuis un flux ICS
  (Google « adresse secrète iCal », iCloud public), bouton vers l'app native.

### Importation IA
Bouton **Importer** → colle un JSON conforme au
[schéma de routine v1](docs/ROUTINE_SCHEMA.md) → la page est construite avec
tous les widgets configurés. Exemples dans [`examples/`](examples/).

## Home Assistant

Deux options pour l'intégrer à HA :

- **Panel iframe** dans `configuration.yaml` :

  ```yaml
  panel_iframe:
    lifeos:
      title: LifeOS
      icon: mdi:view-dashboard
      url: http://IP_DU_SERVEUR:3000
  ```

- Ou simplement un raccourci vers l'IP fixe du serveur.

## Licence

MIT — projet open-source, contributions bienvenues.
