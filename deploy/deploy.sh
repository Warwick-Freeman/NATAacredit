#!/usr/bin/env bash
# Usage: ./deploy/deploy.sh /path/to/your-key.pem
# Run from the repo root.

set -e

KEY=${1:?Usage: deploy.sh /path/to/key.pem}
HOST="ubuntu@18.221.101.26"

echo "==> Building frontend..."
npm run build

echo "==> Publishing .NET API..."
(cd api && dotnet publish -c Release -o ./publish)

echo "==> Uploading frontend..."
ssh -i "$KEY" "$HOST" "sudo mkdir -p /var/www/nexus && sudo chown ubuntu:ubuntu /var/www/nexus"
rsync -az -e "ssh -i $KEY" dist/ "$HOST:/var/www/nexus/"

echo "==> Uploading API..."
ssh -i "$KEY" "$HOST" "sudo mkdir -p /opt/nexus-api && sudo chown ubuntu:ubuntu /opt/nexus-api"
rsync -az -e "ssh -i $KEY" api/publish/ "$HOST:/opt/nexus-api/"

echo "==> Installing systemd service..."
scp -i "$KEY" deploy/nexus-api.service "$HOST:/tmp/nexus-api.service"
ssh -i "$KEY" "$HOST" "
  sudo mv /tmp/nexus-api.service /etc/systemd/system/nexus-api.service
  sudo systemctl daemon-reload
  sudo systemctl enable nexus-api
  sudo systemctl restart nexus-api
"

echo "==> Installing nginx config..."
scp -i "$KEY" deploy/nginx.conf "$HOST:/tmp/nexus-nginx.conf"
ssh -i "$KEY" "$HOST" "
  sudo mv /tmp/nexus-nginx.conf /etc/nginx/sites-available/nexus
  sudo ln -sf /etc/nginx/sites-available/nexus /etc/nginx/sites-enabled/nexus
  sudo rm -f /etc/nginx/sites-enabled/default
  sudo nginx -t && sudo systemctl reload nginx
"

echo ""
echo "✓ Deployed to http://18.221.101.26"
