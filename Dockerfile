# ---------- 1) Build stage: compila el frontend ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Copia de manifiestos e instalación limpia (más cacheable)
COPY package*.json ./
RUN npm ci

# Copia el resto del código (frontend + server)
COPY . .

# Compila el frontend (React): genera /app/build
# - Para CRA: npm run build
# - Para Vite: npm run build (asegúrate de tener script "build" configurado)
RUN npm run build


# ---------- 2) Runtime stage: solo lo necesario para producción ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Variables típicas del backend (ajústalas en docker run / compose)
# KC_URL, KC_REALM, AZ_ALIAS son para el broker de Azure via Keycloak
ENV SERVER_PORT=4001 \
    KC_URL=https://auth.devcastellanos.site \
    KC_REALM=Login \
    AZ_ALIAS=azure

# Copiamos:
# - build/ del frontend
# - server/ con el código de la API
# - package.json para instalar deps de producción
COPY --from=builder /app/build ./build
COPY --from=builder /app/server ./server
COPY --from=builder /app/package*.json ./

# Instala SOLO producción
RUN npm ci --omit=dev

# Expone el puerto del backend
EXPOSE 4001

# Comando de inicio
CMD ["node", "server/index.js"]
