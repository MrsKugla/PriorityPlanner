<#
  Build Android alternativa di Priority Planner (APK arm64 per il tablet).

  Non usa "tauri android build": compila la libreria Rust per conto suo e fa assemblare
  l'APK a Gradle. Cosi' evita i due blocchi tipici di Windows:
    - i privilegi per i symlink (Modalita' sviluppatore) richiesti dalla CLI di Tauri;
    - le librerie Visual C++ incomplete, sostituite dalla copia "user-space" scaricata con xwin.

  Uso:
    powershell -ExecutionPolicy Bypass -File build-android-alt.ps1              -> build completa
    powershell -ExecutionPolicy Bypass -File build-android-alt.ps1 -CheckOnly   -> controlla solo cosa manca
    powershell -ExecutionPolicy Bypass -File build-android-alt.ps1 -Diagnose <log>  -> spiega un log fallito

  Alla fine dice "APK ANDROID PRONTO" solo se il file .apk esiste davvero ed e' firmato.
#>
param(
    [switch]$CheckOnly,
    [string]$Diagnose
)
$ErrorActionPreference = 'Continue'
Set-Location $PSScriptRoot

$Target = 'aarch64-linux-android'
$Abi = 'arm64-v8a'
$Flavor = 'Arm64'
$NdkVersion = '27.3.13750724'
$Package = 'it.priorityplanner.app'
$LibName = 'priority_planner_lib'
$LogDir = Join-Path $PSScriptRoot 'build-logs'
$OutDir = Join-Path $PSScriptRoot 'apk'

function Say([string]$Text, [string]$Color = 'Gray') { Write-Host $Text -ForegroundColor $Color }
function Fail-Box([string[]]$Lines, [string]$Title = 'BUILD ANDROID NON RIUSCITA - NESSUN APK E'' STATO CREATO') {
    Say ''
    Say '======================================================================' Red
    Say "  $Title" Red
    Say '======================================================================' Red
    $Lines | ForEach-Object { Say "  $_" Yellow }
    Say ''
}

# ---------------------------------------------------------------------------
# Diagnosi: legge un log e traduce gli errori noti in "cosa scaricare".
# ---------------------------------------------------------------------------
$KnownErrors = @(
    @{ Pattern = "excpt\.h|C1083|msvcrt\.lib|kernel32\.lib|ucrt\.lib|vcruntime\.lib|LNK1104|LNK1181"
       Help = @(
        'Mancano le librerie/header di Visual C++ (CRT o Windows SDK) per compilare la parte Rust.',
        'SCARICA una delle due:',
        '  A) Visual Studio Installer > Modifica > "Sviluppo di applicazioni desktop con C++",',
        '     con "MSVC v14x x64/x86" e "Windows 11 SDK" spuntati.',
        '     Oppure: winget install Microsoft.VisualStudio.2022.BuildTools --override "--add Microsoft.VisualStudio.Workload.VCTools --includeRecommended --passive"',
        '  B) Senza amministratore (xwin):',
        '     cargo install xwin --locked',
        '     xwin --accept-license splat --output "%LOCALAPPDATA%\spotimy-xwin\splat"') },
    @{ Pattern = "linker ``link\.exe`` not found|link\.exe.*not found|program not found.*link"
       Help = @(
        'Manca il linker Microsoft (link.exe).',
        'SCARICA: Visual Studio Build Tools con "Sviluppo di applicazioni desktop con C++":',
        '  winget install Microsoft.VisualStudio.2022.BuildTools --override "--add Microsoft.VisualStudio.Workload.VCTools --includeRecommended --passive"') },
    @{ Pattern = "target may not be installed|can't find crate for ``(core|std)``"
       Help = @('Manca il target Rust per Android.', "ESEGUI: rustup target add $Target") },
    @{ Pattern = "os error 1314|A required privilege is not held|symbolic link is not allowed|Failed to create a symbolic link"
       Help = @(
        'Windows non concede di creare symlink (serve la Modalita'' sviluppatore).',
        'Non serve fare nulla: build-android-alt.ps1 copia la libreria invece del symlink.',
        'In alternativa: Impostazioni > Sistema > Per sviluppatori > Modalita'' sviluppatore = Attivata.') },
    @{ Pattern = "Unsupported class file major version|JAVA_HOME is set to an invalid|requires Java 17|Java 21|No Java compiler"
       Help = @('JDK sbagliato o mancante: serve JDK 17-21 (consigliato 21).', 'SCARICA: winget install EclipseAdoptium.Temurin.21.JDK') },
    @{ Pattern = "SDK location not found|ANDROID_HOME (is not set|environment variable)|Failed to find Platform SDK|Failed to install the following Android SDK"
       Help = @(
        'Android SDK mancante o incompleto.',
        'SCARICA da Android Studio > SDK Manager, oppure con sdkmanager:',
        '  sdkmanager "platform-tools" "platforms;android-37.0" "build-tools;37.0.0"') },
    @{ Pattern = "NDK (is )?not (found|installed)|No version of NDK|NDK_HOME (is not set|environment variable)|failed to find tool.*clang|linker ``[^``]*-clang(\.cmd)?`` not found"
       Help = @("Android NDK $NdkVersion mancante o non trovato.", "SCARICA: sdkmanager ""ndk;$NdkVersion""") },
    @{ Pattern = "Could not resolve|Could not GET|Could not download|UnknownHostException|Connection timed out"
       Help = @('Gradle non riesce a scaricare le dipendenze: serve connessione a internet alla prima build.') },
    @{ Pattern = "Cannot find module|ERR_MODULE_NOT_FOUND|'vite' is not recognized|tsc.*not recognized"
       Help = @('Dipendenze JavaScript mancanti.', 'ESEGUI nella cartella del progetto: npm install') },
    @{ Pattern = "error TS\d+|\[vite\].*error|Build failed in"
       Help = @('Errore nel codice dell''interfaccia (TypeScript/Vite), non nell''ambiente Android: vedi le righe "error" del log.') },
    @{ Pattern = "failed to open icon"
       Help = @('Mancano le icone dell''app (src-tauri\icons).', 'ESEGUI: npm run tauri icon src-tauri\app-icon.svg') },
    @{ Pattern = "error\[E\d+\]"
       Help = @('Errore di compilazione Rust nel codice dell''app, non un componente mancante: vedi le righe "error[E...]" del log.') }
)
function Explain-Log([string]$Path) {
    if (!(Test-Path $Path)) { return @("Log non trovato: $Path") }
    $text = Get-Content -Raw -LiteralPath $Path
    $out = New-Object System.Collections.Generic.List[string]
    foreach ($k in $KnownErrors) {
        if ($text -match $k.Pattern) { $k.Help | ForEach-Object { $out.Add($_) }; $out.Add('') }
    }
    if ($out.Count -eq 0) {
        $out.Add('Errore non riconosciuto automaticamente. Ultime righe di errore del log:')
        Select-String -LiteralPath $Path -Pattern 'error|FAILURE|failed' -CaseSensitive:$false |
            Select-Object -Last 8 | ForEach-Object { $out.Add('  ' + $_.Line.Trim()) }
    }
    $out.Add("Log completo: $Path")
    return $out
}
if ($Diagnose) { Fail-Box (Explain-Log $Diagnose) 'MOTIVO DEL FALLIMENTO (dal log)'; exit 1 }

# ---------------------------------------------------------------------------
# Controllo preliminare: elenca TUTTO cio' che manca prima di iniziare.
# ---------------------------------------------------------------------------
$missing = New-Object System.Collections.Generic.List[string]
function Need([string]$What, [string[]]$How) { $missing.Add("MANCA: $What"); $How | ForEach-Object { $missing.Add("   $_") }; $missing.Add('') }

$env:PATH = "$env:LOCALAPPDATA\Microsoft\WinGet\Links;$env:USERPROFILE\.cargo\bin;$env:PATH"
if (!(Get-Command npm.cmd -ErrorAction SilentlyContinue)) { Need 'Node.js / npm' @('SCARICA: winget install OpenJS.NodeJS.LTS') }
elseif (!(Test-Path (Join-Path $PSScriptRoot 'node_modules\vite\bin\vite.js'))) { Need 'dipendenze del progetto (node_modules)' @('ESEGUI: npm install') }
if (!(Get-Command cargo -ErrorAction SilentlyContinue)) { Need 'Rust (cargo/rustup)' @('SCARICA: https://rustup.rs  (oppure: winget install Rustlang.Rustup)') }
elseif ((& rustup target list --installed 2>$null) -notcontains $Target) { Need "target Rust $Target" @("ESEGUI: rustup target add $Target") }

if (!$env:ANDROID_HOME) { $env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:NDK_HOME = Join-Path $env:ANDROID_HOME "ndk\$NdkVersion"
$jdk = Join-Path $env:LOCALAPPDATA 'AndroidToolchain\jdk-21'
if (Test-Path "$jdk\bin\java.exe") { $env:JAVA_HOME = $jdk }
if (!$env:JAVA_HOME -or !(Test-Path "$env:JAVA_HOME\bin\java.exe")) { Need 'JDK 21' @('SCARICA: winget install EclipseAdoptium.Temurin.21.JDK', 'poi imposta JAVA_HOME alla sua cartella') }
if (!(Test-Path "$env:ANDROID_HOME\platform-tools")) { Need "Android SDK in $env:ANDROID_HOME" @('SCARICA: Android Studio (SDK Manager) oppure i "command-line tools" da developer.android.com/studio', 'poi: sdkmanager "platform-tools" "platforms;android-37.0" "build-tools;37.0.0"') }
if (!(Get-ChildItem "$env:ANDROID_HOME\platforms" -Directory -ErrorAction SilentlyContinue | Where-Object Name -match '^android-3[6-9]')) { Need 'piattaforma Android 36 o 37' @('ESEGUI: sdkmanager "platforms;android-37.0"') }
$buildTools = Get-ChildItem "$env:ANDROID_HOME\build-tools" -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
if (!$buildTools) { Need 'Android build-tools' @('ESEGUI: sdkmanager "build-tools;37.0.0"') }
$ndkLinker = Join-Path $env:NDK_HOME "toolchains\llvm\prebuilt\windows-x86_64\bin\$($Target)24-clang.cmd"
if (!(Test-Path $ndkLinker)) { Need "Android NDK $NdkVersion" @("ESEGUI: sdkmanager ""ndk;$NdkVersion""  (o da Android Studio > SDK Tools > NDK)") }

# Linker Microsoft: serve per gli script di build Rust che girano su Windows.
$linkExe = Get-ChildItem 'C:\Program Files*\Microsoft Visual Studio\*\*\VC\Tools\MSVC\*\bin\Hostx64\x64\link.exe' -ErrorAction SilentlyContinue |
    Sort-Object FullName -Descending | Select-Object -First 1
if (!$linkExe) {
    Need 'linker Microsoft link.exe (Visual C++)' @(
        'SCARICA: Visual Studio Build Tools con "Sviluppo di applicazioni desktop con C++":',
        'winget install Microsoft.VisualStudio.2022.BuildTools --override "--add Microsoft.VisualStudio.Workload.VCTools --includeRecommended --passive"')
}
# Librerie CRT + Windows SDK: quelle di Visual Studio se complete, altrimenti la copia xwin.
$xwin = @("$env:LOCALAPPDATA\spotimy-xwin\splat", "$env:LOCALAPPDATA\xwin\splat") | Where-Object { Test-Path "$_\crt\lib\x86_64\msvcrt.lib" } | Select-Object -First 1
$crtSource = $null
if ($xwin -and (Test-Path "$xwin\crt\include\excpt.h") -and (Test-Path "$xwin\sdk\lib\um\x86_64\kernel32.lib")) {
    $crtSource = "xwin ($xwin)"
    $env:INCLUDE = "$xwin\crt\include;$xwin\sdk\include\ucrt;$xwin\sdk\include\um;$xwin\sdk\include\shared;$xwin\sdk\include\winrt;$xwin\sdk\include\cppwinrt"
    $env:LIB = "$xwin\crt\lib\x86_64;$xwin\sdk\lib\um\x86_64;$xwin\sdk\lib\ucrt\x86_64"
} elseif ($linkExe) {
    $msvc = $linkExe.Directory.Parent.Parent.Parent.FullName
    $kits = 'C:\Program Files (x86)\Windows Kits\10'
    $sdkVer = Get-ChildItem "$kits\Lib" -Directory -ErrorAction SilentlyContinue | Where-Object { Test-Path "$($_.FullName)\um\x64\kernel32.lib" } | Sort-Object Name -Descending | Select-Object -First 1
    if ((Test-Path "$msvc\lib\x64\msvcrt.lib") -and (Test-Path "$msvc\include\excpt.h") -and $sdkVer) {
        $crtSource = "Visual Studio ($msvc)"
        $v = $sdkVer.Name
        $env:INCLUDE = "$msvc\include;$kits\Include\$v\ucrt;$kits\Include\$v\um;$kits\Include\$v\shared;$kits\Include\$v\winrt"
        $env:LIB = "$msvc\lib\x64;$kits\Lib\$v\um\x64;$kits\Lib\$v\ucrt\x64"
    }
}
if (!$crtSource) {
    Need 'librerie Visual C++ (msvcrt.lib, excpt.h) e Windows SDK (kernel32.lib)' @(
        'SCARICA una delle due:',
        'A) Visual Studio Installer > Modifica > "Sviluppo di applicazioni desktop con C++" (MSVC x64/x86 + Windows 11 SDK)',
        'B) senza amministratore:  cargo install xwin --locked',
        '                          xwin --accept-license splat --output "%LOCALAPPDATA%\spotimy-xwin\splat"')
}

if ($missing.Count -gt 0) {
    Fail-Box (@('Prima di compilare mancano questi componenti:', '') + $missing + @('Installali e rilancia lo script.'))
    exit 1
}
Say "Controllo ambiente OK: link.exe = $($linkExe.FullName)" Green
Say "                        librerie C++ = $crtSource" Green
if ($CheckOnly) { exit 0 }

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
$env:PATH = "$($linkExe.DirectoryName);$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
$env:VCINSTALLDIR = $linkExe.Directory.Parent.Parent.Parent.Parent.Parent.Parent.FullName + '\'
$prefix = 'CARGO_TARGET_' + $Target.ToUpperInvariant().Replace('-', '_')
[Environment]::SetEnvironmentVariable("$($prefix)_LINKER", $ndkLinker, 'Process')
[Environment]::SetEnvironmentVariable("$($prefix)_RUSTFLAGS", '-Clink-arg=-landroid -Clink-arg=-llog -Clink-arg=-lOpenSLES', 'Process')
$project = Join-Path $PSScriptRoot 'src-tauri\gen\android'
$generated = Join-Path $project ('app\src\main\java\' + $Package.Replace('.', '\') + '\generated')
New-Item -ItemType Directory -Force -Path $generated, $LogDir, $OutDir | Out-Null
$env:TAURI_ANDROID_PROJECT_PATH = $project
$env:TAURI_ANDROID_PACKAGE_UNESCAPED = $Package
$env:WRY_ANDROID_PACKAGE = $Package
$env:WRY_ANDROID_LIBRARY = $LibName
$env:WRY_ANDROID_KOTLIN_FILES_OUT_DIR = $generated
$log = Join-Path $LogDir ("android-alt-{0:yyyyMMdd-HHmmss}.log" -f (Get-Date))

function Step([string]$Title, [scriptblock]$Command) {
    Say ''
    Say "==> $Title" Cyan
    "`n==> $Title" | Out-File -LiteralPath $log -Append -Encoding utf8
    # Native stderr arrives as ErrorRecords: keep only their text so the log stays readable.
    & $Command 2>&1 | ForEach-Object { if ($_ -is [System.Management.Automation.ErrorRecord]) { $_.Exception.Message } else { "$_" } } | Tee-Object -FilePath $log -Append
    if ($LASTEXITCODE -ne 0) {
        Fail-Box (@("Passaggio fallito: $Title", '') + (Explain-Log $log))
        exit 1
    }
}

Step '1/4 Interfaccia (npm run build)' { & npm.cmd run build }
# Optimised Rust (--release): smaller APK and faster pen response; the APK itself stays debug-signed.
Step '2/4 Libreria Rust per Android arm64' { & cargo build --release --manifest-path src-tauri/Cargo.toml --target $Target --features tauri/custom-protocol --lib }
$so = Join-Path $PSScriptRoot "src-tauri\target\$Target\release\lib$LibName.so"
$jniDir = Join-Path $project "app\src\main\jniLibs\$Abi"
New-Item -ItemType Directory -Force -Path $jniDir | Out-Null
$dest = Join-Path $jniDir "lib$LibName.so"
if ((Test-Path $dest) -and (Get-Item $dest).LinkType) { Remove-Item -LiteralPath $dest }
Copy-Item -LiteralPath $so -Destination $dest -Force
# Debug packaging rewrites the previous APK in place and keeps the space of removed files as dead gaps
# (a stale 127 MB debug library inflated the APK to 134 MB): start from no APK at all.
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue (Join-Path $project 'app\build\outputs\apk'), (Join-Path $project 'app\build\intermediates\apk'), (Join-Path $project 'app\build\intermediates\incremental\packageArm64Debug')
# The official CLI writes tauri.properties; without it Gradle falls back to version 1.0 / code 1.
# Same versionCode formula as Tauri: MAJOR*1000000 + MINOR*1000 + PATCH.
$appVersion = (Get-Content -Raw (Join-Path $PSScriptRoot 'src-tauri\tauri.conf.json') | ConvertFrom-Json).version
$v = $appVersion.Split('.') | ForEach-Object { [int]$_ }
Set-Content -Encoding ascii -LiteralPath (Join-Path $project 'app\tauri.properties') -Value @("tauri.android.versionName=$appVersion", "tauri.android.versionCode=$($v[0] * 1000000 + $v[1] * 1000 + $v[2])")
Say "Versione APK: $appVersion" Cyan
# gradlew.bat non regge "&" nel percorso (Skills&Plugins): stesso wrapper, avviato direttamente con java.
$wrapperJar = Join-Path $project 'gradle\wrapper\gradle-wrapper.jar'
Step '3/4 Pacchetto APK (Gradle)' { & "$env:JAVA_HOME\bin\java.exe" -Xmx64m -Xms64m "-Dorg.gradle.appname=gradlew" -classpath $wrapperJar org.gradle.wrapper.GradleWrapperMain -p $project ":app:assemble$($Flavor)Debug" -x ":app:rustBuild$($Flavor)Debug" --no-daemon }

$built = Get-ChildItem (Join-Path $project 'app\build\outputs\apk') -Recurse -Filter '*.apk' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (!$built) { Fail-Box (@('Gradle ha finito ma non ha prodotto nessun .apk.') + (Explain-Log $log)); exit 1 }
$version = (Get-Content (Join-Path $PSScriptRoot 'src-tauri\tauri.conf.json') -Raw | ConvertFrom-Json).version
$final = Join-Path $OutDir "PriorityPlanner_$version.apk"
Copy-Item -LiteralPath $built.FullName -Destination $final -Force
Step '4/4 Verifica firma APK' { & (Join-Path $buildTools.FullName 'apksigner.bat') verify --verbose $final }

Say ''
Say '======================================================================' Green
Say '  APK ANDROID PRONTO' Green
Say '======================================================================' Green
Say "  File:  $final  ($([math]::Round((Get-Item $final).Length / 1MB, 1)) MB)" Green
Say '  Tipo:  debug, arm64 (tablet e telefono Android), firmato con la chiave di debug di questo PC.' Green
Say '  Copialo sul tablet e aprilo (consenti "installa app sconosciute").' Green
Say "  Log:   $log" Green
exit 0
