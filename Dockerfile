# Etapa 1: Construir la app
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Servir la app con Nginx
FROM nginx:alpine

# Copiar build al Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Configuración mínima de Nginx para React
RUN rm /etc/nginx/conf.d/default.conf && \
    echo 'server { \
        listen 80; \
        server_name _; \
        root /usr/share/nginx/html; \
        index index.html; \
        location / { try_files $uri /index.html; } \
    }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
