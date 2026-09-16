# Schéma d'importation de routine (v1)

LifeOS peut construire une page de routine complète à partir d'un simple JSON
collé dans **Importer**. C'est le contrat que toute IA externe (ChatGPT,
Claude, Gemini…) doit respecter pour générer des routines compatibles.

- Schéma machine : [`schema/routine.schema.json`](../schema/routine.schema.json)
- Exemples prêts à coller : [`examples/`](../examples/)

## Prompt type à donner à une IA

> Génère un JSON conforme au schéma « LifeOS Routine Import v1 » pour une
> séance de musculation Push Day : un bloc note avec le programme, un timer
> d'intervalles par exercice (séries/effort/repos), et une check-list de fin
> de séance. Réponds uniquement avec le JSON.

Colle ensuite la réponse dans **Importer → Construire la page** : la page est
créée avec tous les widgets configurés, prêts à l'emploi.

## Structure

```json
{
  "version": 1,
  "routine": {
    "name": "Push Day",
    "icon": "💪",
    "description": "Séance pectoraux / épaules / triceps"
  },
  "widgets": [ /* 1 à 40 widgets, dans l'ordre d'affichage */ ]
}
```

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `version` | `1` | ✔ | Version du contrat. Toujours `1`. |
| `routine.name` | string ≤ 60 | ✔ | Nom de l'onglet créé. |
| `routine.icon` | string ≤ 8 | — | Un emoji pour l'onglet. |
| `routine.description` | string ≤ 500 | — | Réservé (non affiché pour l'instant). |
| `routine.theme` | objet | — | Palette de la page : `background`, `card`, `foreground`, `line`, `accent` en hex `#rrggbb`. Tout champ absent hérite du thème de l'utilisateur. Ex. `{ "accent": "#7aa2ff", "background": "#0a0f1e" }`. |
| `routine.days` | array | — | Jours de la semaine où la routine est planifiée, récurrents chaque semaine : `0` = lundi … `6` = dimanche. Ex. Push Day lundi et jeudi : `[0, 3]`. |
| `widgets[]` | array | ✔ | Les widgets, dans l'ordre de la grille. |

Chaque widget partage trois champs :

| Champ | Valeurs | Description |
|---|---|---|
| `type` | `note` \| `timer` \| `checklist` \| `calendar` | Type de widget. |
| `title` | string ≤ 80 | Titre affiché dans l'en-tête de la carte. |
| `size` | `sm` \| `md` \| `lg` (défaut `md`) | Largeur : 1 colonne, 2 colonnes, pleine largeur. |

## Widgets

### `note` — bloc texte Markdown

```json
{
  "type": "note",
  "title": "Programme",
  "size": "md",
  "config": { "markdown": "## Push Day\n1. Développé couché 4×8\n2. Dips 3×12" }
}
```

### `timer` — chrono / minuteur / intervalles

Trois modes via `config.mode` :

```json
{ "type": "timer", "title": "Chrono libre", "config": { "mode": "stopwatch" } }
```

```json
{ "type": "timer", "title": "Gainage", "config": { "mode": "countdown", "durationSec": 120 } }
```

```json
{
  "type": "timer",
  "title": "Développé couché",
  "config": { "mode": "interval", "sets": 4, "workSec": 40, "restSec": 90 }
}
```

Le mode `interval` enchaîne automatiquement `sets` phases d'effort
(`workSec` secondes) séparées par des repos (`restSec` secondes), avec bips
sonores aux transitions — idéal pour un programme de musculation.

### `checklist` — routine à cocher

```json
{
  "type": "checklist",
  "title": "Skincare — matin",
  "size": "sm",
  "config": {
    "items": ["Nettoyant", "Sérum vitamine C", { "label": "SPF 50", "done": false }],
    "resetDaily": true
  }
}
```

Les items acceptent la forme courte (string) ou objet. `resetDaily: true`
(défaut) décoche tout automatiquement chaque nouveau jour.

### `media` — photo, GIF ou vidéo en boucle

```json
{
  "type": "media",
  "title": "Démo : développé couché",
  "size": "sm",
  "config": {
    "url": "https://media.giphy.com/media/xxxxx/giphy.mp4",
    "sound": false,
    "fit": "cover"
  }
}
```

`url` pointe **directement** vers une image, un GIF ou une vidéo (mp4/webm) —
idéal pour montrer le geste d'un exercice. La lecture boucle, est muette par
défaut (`sound`), et **se coupe automatiquement quand le widget n'est plus à
l'écran** (aucune consommation en fond). Préférer la version `.mp4` d'un GIF,
beaucoup plus légère.

### `calendar` — événements du jour (lecture seule)

```json
{ "type": "calendar", "title": "Aujourd'hui", "config": {} }
```

`config.icsUrl` (flux ICS Google/iCloud) et `config.nativeUrl` (lien vers
l'app native) sont optionnels et configurables ensuite dans le widget.

## Règles de validation

- JSON strict (pas de commentaires, pas de virgule finale).
- Tout champ inconnu est refusé (`additionalProperties: false`).
- L'import est validé côté client (Zod) ; les erreurs sont listées champ par
  champ dans la boîte de dialogue.
