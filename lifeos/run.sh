#!/bin/sh
set -e

# /data est le stockage persistant de l'add-on : le secret de session y est
# généré au premier démarrage (les sessions survivent aux redémarrages), et
# le journal de connexions y est écrit.
SECRET_FILE=/data/session_secret
if [ ! -s "$SECRET_FILE" ]; then
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" > "$SECRET_FILE"
fi

export SESSION_SECRET="$(cat "$SECRET_FILE")"
export DATA_DIR=/data
# Accès en http:// sur le réseau local : cookie de session non "secure".
export ALLOW_HTTP=1
export HOSTNAME=0.0.0.0
export PORT=3000
# Canal d'auth de secours : le cœur HA via le réseau interne des add-ons.
export HA_URL="${HA_URL:-http://homeassistant:8123}"

# Auto-diagnostic visible dans l'onglet Journal de l'add-on.
if [ -n "$SUPERVISOR_TOKEN" ]; then
  echo "[lifeos] SUPERVISOR_TOKEN présent"
  if wget -q -O /dev/null --header="Authorization: Bearer $SUPERVISOR_TOKEN" http://supervisor/info; then
    echo "[lifeos] API Supervisor (/info) : OK"
  else
    echo "[lifeos] API Supervisor (/info) : KO — le token est rejeté par le Supervisor"
  fi
else
  echo "[lifeos] SUPERVISOR_TOKEN absent (mode hors add-on ?)"
fi
if wget -q -O /dev/null "$HA_URL/manifest.json"; then
  echo "[lifeos] Cœur HA joignable sur $HA_URL"
else
  echo "[lifeos] Cœur HA injoignable sur $HA_URL"
fi

exec node /app/server.js
