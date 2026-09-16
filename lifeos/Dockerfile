# Le contexte de build d'un add-on est ce dossier uniquement : on récupère
# donc le code de l'application en clonant le dépôt (branche par défaut).
ARG BUILD_FROM=node:22-alpine

FROM ${BUILD_FROM} AS builder
RUN apk add --no-cache git
RUN git clone --depth 1 https://github.com/DustProgram/lifeapp /src
WORKDIR /src
RUN npm ci
RUN npm run build

FROM ${BUILD_FROM}
ENV NODE_ENV=production
WORKDIR /app
# Bundle standalone Next.js : serveur minimal + assets statiques.
COPY --from=builder /src/.next/standalone ./
COPY --from=builder /src/.next/static ./.next/static
COPY --from=builder /src/public ./public
COPY run.sh /run.sh
RUN chmod +x /run.sh
CMD ["/run.sh"]
