<#
  Installer Windows di Priority Planner (NSIS, un solo file .exe).
  Visual Studio 18 ha link.exe ma non le librerie CRT desktop complete: si usano CRT e Windows SDK
  "user-space" scaricati con xwin (come in GridApp).
  La CLI di Tauri si avvia con node e non con npx: la cartella "Skills&Plugins" contiene "&",
  che rompe i file .cmd di node_modules\.bin.
  Firma: certificato autofirmato "CN=Priority Planner" nell'archivio dell'utente (creato alla prima build,
  valido 5 anni). Tauri firma sia priority-planner.exe sia l'installer.
  Aggiornamenti: la chiave privata dell'updater (%USERPROFILE%\.tauri\priority-planner-updater.key, fuori dalla repo)
  firma l'installer per l'aggiornamento automatico e produce il file .sig accanto.
  Uso: powershell -NoProfile -ExecutionPolicy Bypass -File build-windows.ps1
  Risultato: installer\PriorityPlanner-<versione>-setup.exe (+ .sig) e installer\PriorityPlanner-certificato.cer
#>
$ErrorActionPreference = 'Continue'
Set-Location $PSScriptRoot

$xwin = @("$env:LOCALAPPDATA\spotimy-xwin\splat", "$env:LOCALAPPDATA\xwin\splat") | Where-Object { Test-Path "$_\crt\lib\x86_64\msvcrt.lib" } | Select-Object -First 1
if (-not $xwin) {
    Write-Host 'MANCA: le librerie Visual C++ (msvcrt.lib). Senza amministratore:'
    Write-Host '  cargo install xwin --locked'
    Write-Host '  xwin --accept-license splat --output "%LOCALAPPDATA%\spotimy-xwin\splat"'
    exit 1
}
if (-not (Test-Path 'node_modules\@tauri-apps\cli\tauri.js')) {
    Write-Host 'MANCANO le dipendenze JavaScript. ESEGUI: npm install'
    exit 1
}
$env:INCLUDE = "$xwin\crt\include;$xwin\sdk\include\ucrt;$xwin\sdk\include\um;$xwin\sdk\include\shared;$xwin\sdk\include\winrt;$xwin\sdk\include\cppwinrt"
$env:LIB = "$xwin\crt\lib\x86_64;$xwin\sdk\lib\um\x86_64;$xwin\sdk\lib\ucrt\x86_64"

$version = (Get-Content src-tauri\tauri.conf.json -Raw | ConvertFrom-Json).version
New-Item -ItemType Directory -Force installer | Out-Null

# Certificato di firma: riusa quello valido, altrimenti ne crea uno nuovo.
$subject = 'CN=Priority Planner'
$cert = Get-ChildItem Cert:\CurrentUser\My -CodeSigningCert | Where-Object { $_.Subject -eq $subject -and $_.NotAfter -gt (Get-Date).AddDays(30) } |
    Sort-Object NotAfter -Descending | Select-Object -First 1
if (-not $cert) {
    $cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject $subject -CertStoreLocation Cert:\CurrentUser\My `
        -KeyAlgorithm RSA -KeyLength 3072 -HashAlgorithm SHA256 -NotAfter (Get-Date).AddYears(5)
    Write-Host "Creato certificato di firma: $($cert.Thumbprint)"
}
$cer = 'installer\PriorityPlanner-certificato.cer'
Export-Certificate -Cert $cert -FilePath $cer | Out-Null
# Tauri non trova signtool da solo: gli si passa il comando completo (signtool del Windows SDK).
$signtool = Get-ChildItem "${env:ProgramFiles(x86)}\Windows Kits\10\bin\*\x64\signtool.exe" -ErrorAction SilentlyContinue |
    Sort-Object FullName -Descending | Select-Object -First 1
if (-not $signtool) { Write-Host 'MANCA: signtool.exe (Windows SDK). Installa "Windows 11 SDK" da Visual Studio Installer.'; exit 1 }
# Il timestamp tiene valida la firma anche dopo la scadenza del certificato (serve internet).
$signConfig = Join-Path $env:TEMP 'priority-planner-sign.json'
@{ bundle = @{ windows = @{ signCommand = @{ cmd = $signtool.FullName; args = @(
    'sign', '/sha1', $cert.Thumbprint, '/s', 'My', '/fd', 'sha256', '/tr', 'http://timestamp.digicert.com', '/td', 'sha256', '%1') } } } } |
    ConvertTo-Json -Depth 6 | Set-Content -Encoding ascii -LiteralPath $signConfig

# Chiave dell'updater: senza di lei l'app installata non accetterebbe questo installer come aggiornamento.
$updaterKey = Join-Path $env:USERPROFILE '.tauri\priority-planner-updater.key'
if (-not (Test-Path $updaterKey)) {
    Write-Host "MANCA la chiave dell'updater: $updaterKey"
    Write-Host '  Ripristinala dal backup. Se e'' persa davvero, generane una nuova e aggiorna "pubkey" in src-tauri\tauri.conf.json:'
    Write-Host "  node node_modules\@tauri-apps\cli\tauri.js signer generate --ci -p """" -w ""$updaterKey"""
    Write-Host '  ATTENZIONE: le app gia'' installate con la chiave vecchia non riceveranno piu'' aggiornamenti automatici.'
    exit 1
}
$env:TAURI_SIGNING_PRIVATE_KEY = $updaterKey
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ''

& node node_modules\@tauri-apps\cli\tauri.js build --bundles nsis --config $signConfig
if ($LASTEXITCODE -ne 0) { Write-Host 'Build Windows non riuscita: vedi gli errori sopra.'; exit $LASTEXITCODE }

$setup = Get-ChildItem "src-tauri\target\release\bundle\nsis\*_$($version)_x64-setup.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $setup) { Write-Host "Installer non trovato in src-tauri\target\release\bundle\nsis."; exit 1 }
$out = "installer\PriorityPlanner-$version-setup.exe"
Copy-Item $setup.FullName $out -Force
if (-not (Test-Path "$($setup.FullName).sig")) { Write-Host 'Firma per l''aggiornamento (.sig) non creata: vedi gli errori sopra.'; exit 1 }
Copy-Item "$($setup.FullName).sig" "$out.sig" -Force
$sig = Get-AuthenticodeSignature $out
if (-not $sig.SignerCertificate -or $sig.SignerCertificate.Thumbprint -ne $cert.Thumbprint) { Write-Host "Installer NON firmato ($($sig.Status)): vedi gli errori sopra."; exit 1 }
Write-Host ('=' * 70)
Write-Host "  INSTALLER WINDOWS PRONTO E FIRMATO: $((Resolve-Path $out).Path)  ($([math]::Round((Get-Item $out).Length / 1MB, 1)) MB)"
Write-Host "  Certificato: $((Resolve-Path $cer).Path)"
Write-Host '  Per togliere l''avviso su un PC: copia il .cer e, in PowerShell come amministratore, una volta sola:'
Write-Host '    Import-Certificate -FilePath PriorityPlanner-certificato.cer -CertStoreLocation Cert:\LocalMachine\Root'
Write-Host '    Import-Certificate -FilePath PriorityPlanner-certificato.cer -CertStoreLocation Cert:\LocalMachine\TrustedPublisher'
