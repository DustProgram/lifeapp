# LifeOS — image Docker générique (NAS, Portainer, VPS…).
# L'add-on Home Assistant utilise son propre Dockerfile dans lifeos/.

FROM node:22-alpine AS builder
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    DATA_DIR=/data
WORKDIR /app
# Bundle standalone Next.js : serveur minimal + assets statiques.
COPY --from=builder /src/.next/standalone ./
COPY --from=builder /src/.next/static ./.next/static
COPY --from=builder /src/public ./public
VOLUME /data
EXPOSE 3000
CMD ["node", "server.js"]
