# Stage 1: build React app
FROM node:20-alpine AS build

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar todo el código
COPY . .

# Construir la app para producción
RUN npm run build

# Stage 2: servir con NGINX
FROM nginx:alpine

# Copiar build al directorio de nginx
COPY --from=build /app/build /usr/share/nginx/html

# Exponer puerto 80
EXPOSE 80

# Iniciar nginx en foreground
CMD ["nginx", "-g", "daemon off;"]
