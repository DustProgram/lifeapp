# LifeOS — Add-on Home Assistant

Espace personnel modulaire : widgets (notes Markdown, chronos/minuteurs
d'intervalles, check-lists quotidiennes, agenda du jour), grille drag & drop,
dark mode, et importation de routines JSON générées par une IA.

## Installation

1. **Paramètres → Modules complémentaires → Boutique des modules** →
   menu **⋮** (en haut à droite) → **Dépôts** → ajouter :
   `https://github.com/DustProgram/lifeapp`
2. La carte **LifeOS** apparaît dans la boutique → **Installer**
   (la première installation compile l'application, compte quelques minutes).
3. **Démarrer**, puis **Ouvrir l'interface Web** (port `3000`).

## Connexion

Utilise directement **tes identifiants Home Assistant** : l'add-on les
valide auprès du Supervisor (`auth_api`), rien n'est stocké.
Chaque tentative de connexion (réussie ou non) est consignée dans le journal
de sécurité, consultable dans l'app via l'icône 📋 (`/logs`).

## Dans la barre latérale HA (optionnel)

Ajoute un panel iframe dans `configuration.yaml` :

```yaml
panel_iframe:
  lifeos:
    title: LifeOS
    icon: mdi:view-dashboard
    url: http://IP_DE_TON_HA:3000
```

## Données

- `/data/session_secret` — secret de session généré au premier démarrage.
- `/data/auth-log.jsonl` — journal des connexions.
- Les pages et widgets du dashboard sont stockés dans le navigateur
  (localStorage), par appareil.

## Mise à jour

L'application est compilée depuis la branche par défaut du dépôt au moment
du build. Pour mettre à jour : boutique des modules → LifeOS →
**Reconstruire** (ou installer la nouvelle version quand le numéro change).

## Port

Le port publié (3000 par défaut) se change dans l'onglet **Configuration**
de l'add-on → « Réseau ».
