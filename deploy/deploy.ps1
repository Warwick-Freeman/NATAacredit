# Usage: .\deploy\deploy.ps1
# Run from the repo root.

$ErrorActionPreference = 'Stop'
$KeyPath = "C:\Users\wef.CMPHQ\NATAacredit\Hosting\N360Accredit.pem"
$server = "ubuntu@18.221.101.26"

Write-Host "==> Building frontend..."
npm run build

Write-Host "==> Publishing .NET API..."
Push-Location api
dotnet publish -c Release -o ./publish
Pop-Location

Write-Host "==> Uploading frontend..."
ssh -i $KeyPath $server "sudo mkdir -p /var/www/nexus && sudo chown ubuntu:ubuntu /var/www/nexus"
Compress-Archive -Path dist\* -DestinationPath dist.zip -Force
scp -i $KeyPath dist.zip "${server}:/tmp/nexus-dist.zip"
Remove-Item dist.zip
ssh -i $KeyPath $server "unzip -o /tmp/nexus-dist.zip -d /var/www/nexus && rm /tmp/nexus-dist.zip"

Write-Host "==> Uploading API..."
ssh -i $KeyPath $server "sudo mkdir -p /opt/nexus-api && sudo chown ubuntu:ubuntu /opt/nexus-api"
Compress-Archive -Path api\publish\* -DestinationPath api-publish.zip -Force
scp -i $KeyPath api-publish.zip "${server}:/tmp/nexus-api.zip"
Remove-Item api-publish.zip
ssh -i $KeyPath $server "unzip -o /tmp/nexus-api.zip -d /opt/nexus-api && rm /tmp/nexus-api.zip"
ssh -i $KeyPath $server "sudo chown -R www-data:www-data /opt/nexus-api"

Write-Host "==> Installing systemd service..."
scp -i $KeyPath deploy/nexus-api.service "${server}:/tmp/nexus-api.service"
ssh -i $KeyPath $server "sudo mv /tmp/nexus-api.service /etc/systemd/system/nexus-api.service"
ssh -i $KeyPath $server "sudo systemctl daemon-reload"
ssh -i $KeyPath $server "sudo systemctl enable nexus-api"
ssh -i $KeyPath $server "sudo systemctl restart nexus-api"

Write-Host "==> Installing nginx config..."
scp -i $KeyPath deploy/nginx.conf "${server}:/tmp/nexus-nginx.conf"
ssh -i $KeyPath $server "sudo mv /tmp/nexus-nginx.conf /etc/nginx/sites-available/nexus"
ssh -i $KeyPath $server "sudo ln -sf /etc/nginx/sites-available/nexus /etc/nginx/sites-enabled/nexus"
ssh -i $KeyPath $server "sudo rm -f /etc/nginx/sites-enabled/default"
ssh -i $KeyPath $server "sudo nginx -t && sudo systemctl reload nginx"

Write-Host ""
Write-Host "Deployed to http://18.221.101.26"
