# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# ── Stage 2: serve ────────────────────────────────────────────────────────────
FROM nginx:alpine

# Valor por defecto; se puede sobreescribir en Dokploy con la variable API_BACKEND_URL
ENV API_BACKEND_URL=https://api.stalch.com

COPY --from=builder /app/dist /usr/share/nginx/html

# La imagen nginx procesa /etc/nginx/templates/*.conf.template con envsubst al arrancar
COPY nginx.template /etc/nginx/templates/default.conf.template

# Normalizar saltos de línea por si el archivo fue creado en Windows (CRLF → LF)
RUN sed -i 's/\r$//' /etc/nginx/templates/default.conf.template

EXPOSE 80
