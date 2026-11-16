<#
  Pubblica una release di Priority Planner su GitHub (MrsKugla/PriorityPlanner).

  Prima di lanciarlo:
    1. versione aggiornata in package.json, src-tauri/Cargo.toml, src-tauri/tauri.conf.json;
    2. voce di quella versione in cima a versioni.txt;
    3. tutto committato (git status pulito).

  Cosa fa:
    1. controlla i punti sopra, GitHub CLI e che la versione non sia gia' pubblicata;
    2. crea l'installer Windows firmato (build-windows.ps1) e l'APK (build-android-alt.ps1);
    3. scrive latest.json, il file che l'app installata legge per sapere se c'e' un aggiornamento;
    4. crea il tag vX.Y.Z, fa push di commit e tag;
    5. crea la release con installer, firma .sig, APK, latest.json e certificato; le note sono la voce di versioni.txt.

  Uso: powershell -NoProfile -ExecutionPolicy Bypass -File release.ps1
  Opzione: -SoloWindows  pubblica senza APK (per esempio se l'ambiente Android non e' pronto).
#>
param([switch]$SoloWindows)
$ErrorActionPreference = 'Continue'
Set-Location $PSScriptRoot
$Repo = 'MrsKugla/PriorityPlanner'

function Stop-Release([string]$Motivo) {
    Write-Host ''
    Write-Host ('=' * 70) -ForegroundColor Red
    Write-Host "  RELEASE NON PUBBLICATA: $Motivo" -ForegroundColor Red
    Write-Host ('=' * 70) -ForegroundColor Red
    exit 1
}

# 1. Controlli
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { Stop-Release 'manca GitHub CLI. ESEGUI: winget install GitHub.cli' }
& gh auth status *> $null
if ($LASTEXITCODE -ne 0) { Stop-Release 'GitHub CLI non ha fatto l''accesso. ESEGUI una volta: gh auth login' }

$version = (Get-Content src-tauri\tauri.conf.json -Raw | ConvertFrom-Json).version
$pkg = (Get-Content package.json -Raw | ConvertFrom-Json).version
$cargo = (Select-String -Path src-tauri\Cargo.toml -Pattern '^version\s*=\s*"([^"]+)"' | Select-Object -First 1).Matches[0].Groups[1].Value
if ($pkg -ne $version -or $cargo -ne $version) { Stop-Release "versioni diverse: tauri.conf.json $version, package.json $pkg, Cargo.toml $cargo" }

$changelog = Get-Content versioni.txt -Encoding UTF8
if ($changelog[0] -notmatch "^$([regex]::Escape($version)) - \[") { Stop-Release "la prima voce di versioni.txt non e' la $version" }
$notes = New-Object System.Collections.Generic.List[string]
foreach ($riga in $changelog | Select-Object -Skip 1) { if ($riga.Trim() -eq '') { break }; $notes.Add($riga.Trim()) }

$sporco = & git status --porcelain
if ($sporco) { Stop-Release "ci sono modifiche non committate. ESEGUI: git add . ; git commit -m ""Versione $version""" }
$tag = "v$version"
if (& git tag -l $tag) { Stop-Release "il tag $tag esiste gia': aumenta la versione" }
& gh release view $tag --repo $Repo *> $null
if ($LASTEXITCODE -eq 0) { Stop-Release "la release $tag esiste gia' su GitHub" }

# 2. Build
Write-Host "==> Build Windows $version" -ForegroundColor Cyan
& powershell -NoProfile -ExecutionPolicy Bypass -File build-windows.ps1
if ($LASTEXITCODE -ne 0) { Stop-Release 'build Windows fallita (vedi sopra)' }
$setup = "installer\PriorityPlanner-$version-setup.exe"
$assets = @($setup, "$setup.sig", 'installer\PriorityPlanner-certificato.cer')
if (-not $SoloWindows) {
    Write-Host "==> Build Android $version" -ForegroundColor Cyan
    & powershell -NoProfile -ExecutionPolicy Bypass -File build-android-alt.ps1
    if ($LASTEXITCODE -ne 0) { Stop-Release 'build Android fallita (vedi sopra). Per pubblicare solo Windows: release.ps1 -SoloWindows' }
    $assets += "apk\PriorityPlanner_$version.apk"
}
foreach ($f in $assets) { if (-not (Test-Path $f)) { Stop-Release "file mancante: $f" } }

# 3. latest.json per l'aggiornamento automatico su Windows
$latest = 'installer\latest.json'
[ordered]@{
    version   = $version
    notes     = ($notes -join "`n")
    pub_date  = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    platforms = [ordered]@{
        'windows-x86_64' = [ordered]@{
            signature = (Get-Content "$setup.sig" -Raw).Trim()
            url       = "https://github.com/$Repo/releases/download/$tag/PriorityPlanner-$version-setup.exe"
        }
    }
} | ConvertTo-Json -Depth 5 | ForEach-Object { [IO.File]::WriteAllText((Join-Path $PSScriptRoot $latest), $_, (New-Object Text.UTF8Encoding $false)) }
$assets += $latest

# 4. Tag e push
Write-Host "==> Tag $tag e push" -ForegroundColor Cyan
& git tag -a $tag -m "Priority Planner $version"
& git push origin HEAD
if ($LASTEXITCODE -ne 0) { & git tag -d $tag | Out-Null; Stop-Release 'push del commit non riuscito' }
& git push origin $tag
if ($LASTEXITCODE -ne 0) { Stop-Release "push del tag $tag non riuscito" }

# 5. Release
Write-Host "==> Release $tag su GitHub" -ForegroundColor Cyan
$notesFile = Join-Path $env:TEMP "priority-planner-notes-$version.md"
[IO.File]::WriteAllText($notesFile, ($notes -join "`n"), (New-Object Text.UTF8Encoding $false))
& gh release create $tag @assets --repo $Repo --title "Priority Planner $version" --notes-file $notesFile --latest
if ($LASTEXITCODE -ne 0) { Stop-Release "creazione della release non riuscita (il tag $tag e' gia' su GitHub: rilancia solo 'gh release create')" }

Write-Host ''
Write-Host ('=' * 70) -ForegroundColor Green
Write-Host "  RELEASE $tag PUBBLICATA" -ForegroundColor Green
Write-Host "  https://github.com/$Repo/releases/tag/$tag" -ForegroundColor Green
Write-Host '  Le app installate la vedranno al prossimo avvio.' -ForegroundColor Green
Write-Host ('=' * 70) -ForegroundColor Green
