# Usage: .\deploy\deploy.ps1 [-Reseed]
# Run from the repo root.
# -Reseed: delete the database on the server so it reseeds on next startup

param([switch]$Reseed)

$ErrorActionPreference = 'Stop'
$KeyPath = "$PSScriptRoot\..\Hosting\N360Accredit.pem"
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

Write-Host "==> Uploading SOPs and forms (sop/)..."
ssh -i $KeyPath $server "sudo mkdir -p /opt/sop && sudo chown ubuntu:ubuntu /opt/sop"
tar -czf sop.tar.gz -C sop .
scp -i $KeyPath sop.tar.gz "${server}:/tmp/nexus-sop.tar.gz"
Remove-Item sop.tar.gz
ssh -i $KeyPath $server "tar -xzf /tmp/nexus-sop.tar.gz -C /opt/sop && rm /tmp/nexus-sop.tar.gz"

Write-Host "==> Uploading AASM workbook PDFs..."
ssh -i $KeyPath $server 'sudo mkdir -p "/opt/AASM workbooks" && sudo chown ubuntu:ubuntu "/opt/AASM workbooks"'
tar -czf workbooks.tar.gz -C "AASM workbooks" .
scp -i $KeyPath workbooks.tar.gz "${server}:/tmp/nexus-workbooks.tar.gz"
Remove-Item workbooks.tar.gz
ssh -i $KeyPath $server 'tar -xzf /tmp/nexus-workbooks.tar.gz -C "/opt/AASM workbooks" && rm /tmp/nexus-workbooks.tar.gz'

Write-Host "==> Uploading standards PDFs..."
$pdfs = Get-ChildItem -Path . -Filter "*.pdf" -File
if ($pdfs) {
    tar -czf standards.tar.gz $pdfs.Name
    scp -i $KeyPath standards.tar.gz "${server}:/tmp/nexus-standards.tar.gz"
    Remove-Item standards.tar.gz
    ssh -i $KeyPath $server "sudo tar -xzf /tmp/nexus-standards.tar.gz -C /opt && rm /tmp/nexus-standards.tar.gz"
}

Write-Host "==> Installing systemd service..."
scp -i $KeyPath deploy/nexus-api.service "${server}:/tmp/nexus-api.service"
ssh -i $KeyPath $server "sudo mv /tmp/nexus-api.service /etc/systemd/system/nexus-api.service"
ssh -i $KeyPath $server "sudo systemctl daemon-reload"
ssh -i $KeyPath $server "sudo systemctl enable nexus-api"

if ($Reseed) {
    Write-Host "==> Clearing database and data files (reseed on next startup)..."
    ssh -i $KeyPath $server "sudo rm -f /opt/nexus-api/nexus.db && sudo rm -rf /opt/nexus-api/data"
}

ssh -i $KeyPath $server "sudo systemctl restart nexus-api"

Write-Host "==> Uploading TLS certificate..."
# Note: Get-ChildItem -Include requires the path to end with \* to filter correctly
$allCerts   = Get-ChildItem cert\* -Include *.crt,*.pem,*.cer -File -ErrorAction SilentlyContinue
$certFile   = $allCerts | Where-Object { $_.Name -notmatch 'bundle|chain|intermediate|^gd_' } | Select-Object -First 1
$bundleFile = $allCerts | Where-Object { $_.Name -match  'bundle|chain|intermediate|^gd_' } | Select-Object -First 1
$keyFile    = Get-ChildItem cert\* -Include *.key -File -ErrorAction SilentlyContinue | Select-Object -First 1

if ($certFile -and $keyFile) {
    Write-Host "    Certificate : $($certFile.Name)"
    if ($bundleFile) { Write-Host "    Bundle      : $($bundleFile.Name)" }
    Write-Host "    Key         : $($keyFile.Name)"

    # Build full-chain cert (cert + intermediate bundle) into a temp file
    $tmpChain = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "nexus-chain.crt")
    if ($bundleFile) {
        $chain = (Get-Content $certFile.FullName -Raw) + "`n" + (Get-Content $bundleFile.FullName -Raw)
        [System.IO.File]::WriteAllText($tmpChain, $chain)
        Write-Host "    Full chain   : cert + bundle combined"
    } else {
        Copy-Item $certFile.FullName $tmpChain
    }

    scp -i $KeyPath $tmpChain          "${server}:/tmp/nexus.crt"
    scp -i $KeyPath $keyFile.FullName  "${server}:/tmp/nexus.key"
    Remove-Item $tmpChain
    ssh -i $KeyPath $server "sudo mv /tmp/nexus.crt /etc/ssl/certs/nexus.crt && sudo mv /tmp/nexus.key /etc/ssl/private/nexus.key && sudo chmod 644 /etc/ssl/certs/nexus.crt && sudo chmod 600 /etc/ssl/private/nexus.key"
} else {
    Write-Host "    No cert files found in cert/ - generating self-signed fallback..."
    ssh -i $KeyPath $server 'if [ ! -f /etc/ssl/certs/nexus.crt ]; then sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /tmp/nexus.key -out /tmp/nexus.crt -subj "/CN=nexus360/O=Nexus360/C=AU" && sudo mv /tmp/nexus.key /etc/ssl/private/nexus.key && sudo mv /tmp/nexus.crt /etc/ssl/certs/nexus.crt && sudo chmod 600 /etc/ssl/private/nexus.key; fi'
}

Write-Host "==> Installing nginx config..."
scp -i $KeyPath deploy/nginx.conf "${server}:/tmp/nexus-nginx.conf"
ssh -i $KeyPath $server "sudo mv /tmp/nexus-nginx.conf /etc/nginx/sites-available/nexus"
ssh -i $KeyPath $server "sudo ln -sf /etc/nginx/sites-available/nexus /etc/nginx/sites-enabled/nexus"
ssh -i $KeyPath $server "sudo rm -f /etc/nginx/sites-enabled/default"
ssh -i $KeyPath $server "sudo nginx -t && sudo systemctl reload nginx"

Write-Host ""
Write-Host "Deploy complete. https://acdem.nexus360.cloud"
