#!/bin/sh

set -e

CERT_DIR="/certs"
DAYS=825

if [ -f "$CERT_DIR/fullchain.pem" ] && [ -f "$CERT_DIR/privkey.pem" ]; then
  echo "TLS-сертификат уже существует, пропускаем генерацию."
  exit 0
fi

echo "Генерируем самоподписанный сертификат для ${NGINX_SERVER_NAME:-localhost}..."
openssl req -x509 -nodes -newkey rsa:2048 -days "$DAYS" \
  -keyout "$CERT_DIR/privkey.pem" \
  -out "$CERT_DIR/fullchain.pem" \
  -subj "/CN=${NGINX_SERVER_NAME:-localhost}" \
  -addext "subjectAltName=DNS:${NGINX_SERVER_NAME:-localhost},DNS:localhost,IP:127.0.0.1"

chmod 644 "$CERT_DIR/fullchain.pem"
chmod 600 "$CERT_DIR/privkey.pem"
echo "Готово."
