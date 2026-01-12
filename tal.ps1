# Genera certificat per localhost amb EKU de Server Authentication
$cert = New-SelfSignedCertificate `
  -DnsName "localhost","127.0.0.1","::1" `
  -FriendlyName "Ex02 Dev Localhost" `
  -CertStoreLocation "Cert:\CurrentUser\My" `
  -NotAfter (Get-Date).AddYears(2) `
  -KeyExportPolicy Exportable `
  -KeyAlgorithm RSA -KeyLength 2048 `
  -KeyUsage DigitalSignature, KeyEncipherment `
  -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1")

# Carpeta de destí: al costat del script
$targetDir = Join-Path $PSScriptRoot "certs"

if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

$pfxPath = Join-Path $targetDir "localhost.pfx"
$cerPath = Join-Path $targetDir "localhost.cer"

$pwd = ConvertTo-SecureString -String "changeit" -AsPlainText -Force
Export-PfxCertificate -Cert "Cert:\CurrentUser\My\$($cert.Thumbprint)" -FilePath $pfxPath -Password $pwd | Out-Null
Export-Certificate   -Cert "Cert:\CurrentUser\My\$($cert.Thumbprint)" -FilePath $cerPath | Out-Null
Import-Certificate -FilePath $cerPath -CertStoreLocation "Cert:\CurrentUser\Root" | Out-Null

Write-Host "✅ Certificat generat amb èxit!" -ForegroundColor Green
Write-Host "   PFX (amb clau privada): $pfxPath" -ForegroundColor Cyan
Write-Host "   CER (públic):           $cerPath" -ForegroundColor Cyan
Write-Host "   Certificat importat al magatzem 'Root' de l'usuari actual." -ForegroundColor Cyan
