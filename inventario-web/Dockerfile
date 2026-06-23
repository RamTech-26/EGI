# Etapa 1: Build con Vite
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN ls -la /app/.env || echo "NO EXISTE .env EN EL CONTEXTO"
RUN cat /app/.env
RUN npm run build
RUN grep -o "192.168.49.2:30001\|localhost:8080" dist/assets/*.js
# Etapa 2: Servir con Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
