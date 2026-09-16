# Image Node fixée explicitement : le Supervisor injecte BUILD_FROM
# (ghcr.io/home-assistant/base) qui ne contient pas Node.js — on l'ignore.
ARG BUILD_FROM=ignored

FROM node:22-alpine AS builder
RUN apk add --no-cache git
# Anti-cache : ce fichier change à chaque commit sur la branche par défaut,
# ce qui force un nouveau clone lors des reconstructions.
ADD https://api.github.com/repos/DustProgram/lifeapp/commits?per_page=1 /tmp/head.json
# Le contexte de build d'un add-on est ce dossier uniquement : on récupère
# donc le code de l'application en clonant le dépôt (branche par défaut).
RUN git clone --depth 1 https://github.com/DustProgram/lifeapp /src
WORKDIR /src
RUN npm ci
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
# Bundle standalone Next.js : serveur minimal + assets statiques.
COPY --from=builder /src/.next/standalone ./
COPY --from=builder /src/.next/static ./.next/static
COPY --from=builder /src/public ./public
COPY run.sh /run.sh
RUN chmod +x /run.sh
CMD ["/run.sh"]
