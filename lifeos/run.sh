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

exec node /app/server.js
