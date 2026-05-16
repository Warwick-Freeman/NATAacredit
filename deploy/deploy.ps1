# Usage: .\deploy\deploy.ps1 [-Reseed]
# Run from the repo root.
# -Reseed: delete the database on the server so it reseeds on next startup

param([switch]$Reseed)

$ErrorActionPreference = 'Stop'
$KeyPath = "C:\Users\wef.CMPHQ\NATAacredit\Hosting\N360Accredit.pem"
$server = "ubuntu@18.221.101.26"

Write-Host "==> Building frontend..."
npm run build

Write-Host "==> Publishing .NET API..."
if (Test-Path api\publish) { Remove-Item -Recurse -Force api\publish }
Push-Location api
dotnet publish -c Release -o ./publish
Pop-Location

Write-Host "==> Uploading frontend..."
ssh -i $KeyPath $server "sudo mkdir -p /var/www/nexus && sudo chown -R ubuntu:ubuntu /var/www/nexus"
tar -czf dist.tar.gz -C dist .
scp -i $KeyPath dist.tar.gz "${server}:/tmp/nexus-dist.tar.gz"
Remove-Item dist.tar.gz
ssh -i $KeyPath $server "tar -xzf /tmp/nexus-dist.tar.gz -C /var/www/nexus && rm /tmp/nexus-dist.tar.gz"

Write-Host "==> Uploading API..."
ssh -i $KeyPath $server "sudo systemctl stop nexus-api; sudo mkdir -p /opt/nexus-api && sudo chown -R ubuntu:ubuntu /opt/nexus-api"
tar -czf api-publish.tar.gz -C api/publish .
scp -i $KeyPath api-publish.tar.gz "${server}:/tmp/nexus-api.tar.gz"
Remove-Item api-publish.tar.gz
ssh -i $KeyPath $server "tar -xzf /tmp/nexus-api.tar.gz -C /opt/nexus-api && rm /tmp/nexus-api.tar.gz"
ssh -i $KeyPath $server "sudo chown -R www-data:www-data /opt/nexus-api"

Write-Host "==> Installing systemd service..."
scp -i $KeyPath deploy/nexus-api.service "${server}:/tmp/nexus-api.service"
ssh -i $KeyPath $server "sudo mv /tmp/nexus-api.service /etc/systemd/system/nexus-api.service"
ssh -i $KeyPath $server "sudo systemctl daemon-reload"
ssh -i $KeyPath $server "sudo systemctl enable nexus-api"

if ($Reseed) {
    Write-Host "==> Clearing database (reseed on next startup)..."
    ssh -i $KeyPath $server "sudo rm -f /opt/nexus-api/nexus.db /opt/nexus-api/data/*"
}

ssh -i $KeyPath $server "sudo systemctl restart nexus-api"

Write-Host "==> Installing nginx config..."
scp -i $KeyPath deploy/nginx.conf "${server}:/tmp/nexus-nginx.conf"
ssh -i $KeyPath $server "sudo mv /tmp/nexus-nginx.conf /etc/nginx/sites-available/nexus"
ssh -i $KeyPath $server "sudo ln -sf /etc/nginx/sites-available/nexus /etc/nginx/sites-enabled/nexus"
ssh -i $KeyPath $server "sudo rm -f /etc/nginx/sites-enabled/default"
ssh -i $KeyPath $server "sudo nginx -t && sudo systemctl reload nginx"

Write-Host ""
Write-Host "Deployed to http://18.221.101.26"
