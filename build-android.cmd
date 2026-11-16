@echo off
rem Build Android di Priority Planner (APK arm64 per il tablet).
rem 1) controlla che ci siano tutti i componenti e dice cosa scaricare se mancano;
rem 2) prova la build ufficiale "tauri android build";
rem 3) se fallisce, spiega il motivo dal log e passa da sola a build-android-alt.ps1.
rem Scrive "APK ANDROID PRONTO" solo se l'APK esiste davvero.
setlocal
cd /d "%~dp0"
rem Percorsi relativi: la cartella "Skills&Plugins" contiene "&", che cmd tratta come separatore di comandi.
set "ALT=powershell -NoProfile -ExecutionPolicy Bypass -File build-android-alt.ps1"

echo ==^> Controllo componenti
%ALT% -CheckOnly
if errorlevel 1 goto end

if not exist build-logs mkdir build-logs
set "LOG=build-logs\android-tauri.log"
if exist "%LOCALAPPDATA%\spotimy-xwin\env.cmd" call "%LOCALAPPDATA%\spotimy-xwin\env.cmd"
if not defined ANDROID_HOME set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "NDK_HOME=%ANDROID_HOME%\ndk\27.3.13750724"
if exist "%LOCALAPPDATA%\AndroidToolchain\jdk-21\bin\java.exe" set "JAVA_HOME=%LOCALAPPDATA%\AndroidToolchain\jdk-21"
set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Links;%USERPROFILE%\.cargo\bin;%JAVA_HOME%\bin;%PATH%"

echo.
echo ==^> Tentativo 1: build ufficiale Tauri (log: %LOG%)
call node node_modules\@tauri-apps\cli\tauri.js android build --debug --apk --target aarch64 > "%LOG%" 2>&1
if errorlevel 1 goto fallback
for /r "src-tauri\gen\android\app\build\outputs\apk" %%F in (*.apk) do set "APK=%%F"
if not defined APK goto fallback
if not exist apk mkdir apk
for /f "usebackq delims=" %%V in (`powershell -NoProfile -Command "(Get-Content src-tauri\tauri.conf.json -Raw | ConvertFrom-Json).version"`) do set "VER=%%V"
copy /y "%APK%" "apk\PriorityPlanner_%VER%.apk" >nul
echo.
echo ======================================================================
echo   APK ANDROID PRONTO: apk\PriorityPlanner_%VER%.apk
echo   (debug, arm64, firmato con la chiave di debug di questo PC)
echo ======================================================================
goto end

:fallback
echo.
echo La build ufficiale non e' riuscita. Ecco perche':
%ALT% -Diagnose "%LOG%"
echo.
echo ==^> Tentativo 2: build alternativa (build-android-alt.ps1)
%ALT%

:end
echo.
if /i not "%~1"=="nopause" pause
endlocal
