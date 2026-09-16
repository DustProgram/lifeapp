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
valide auprès de HA (API Supervisor, avec repli sur le `login_flow`
officiel), rien n'est stocké. Si ton compte a la **double authentification**,
un champ « code de validation » apparaît automatiquement — entre le code à
6 chiffres de ton app (Mots de passe Apple, Google Authenticator…).

**Chaque utilisateur HA a son propre dashboard** (pages et widgets), stocké
dans `/data/dashboards/` et retrouvé depuis n'importe quel appareil.
Les tentatives de connexion sont consignées dans `/data/auth-log.jsonl` et
visibles dans l'onglet **Journal** de l'add-on.

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
