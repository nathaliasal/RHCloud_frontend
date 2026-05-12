#!/bin/sh
set -e

# Sustituye solo ${API_BACKEND_URL} — las variables internas de nginx ($uri, $host, etc.) quedan intactas
envsubst '${API_BACKEND_URL}' < /etc/nginx/nginx.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
