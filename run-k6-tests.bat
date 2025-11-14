@echo off
echo ========================================
echo Ejecutando Pruebas de Rendimiento K6
echo ========================================

set TARGET_URL=https://localhost:7290
set RESULTS_DIR=k6-results
set SCRIPTS_DIR=k6-tests

if not exist "%RESULTS_DIR%" mkdir %RESULTS_DIR%

k6 version >nul 2>&1
if errorlevel 1 (
    echo ERROR: K6 no esta instalado
    echo.
    echo Para instalar K6 con Chocolatey ejecuta:
    echo   choco install k6
    echo.
    echo O descarga desde: https://k6.io/docs/get-started/installation/
    echo.
    pause
    exit /b 1
)

echo.
echo K6 Version:
k6 version
echo.
echo Target URL: %TARGET_URL%
echo Resultados: %RESULTS_DIR%
echo.

echo Verificando que la API esta corriendo...
curl -s -k %TARGET_URL%/swagger/index.html >nul 2>&1
if errorlevel 1 (
    echo.
    echo WARNING: No se pudo conectar a %TARGET_URL%
    echo Asegurate de que tu API esta corriendo.
    echo.
    pause
)

echo.
echo ========================================
echo Ejecutando Smoke Test
echo ========================================
k6 run ^
  --out json=%RESULTS_DIR%/smoke-test-results.json ^
  --summary-export=%RESULTS_DIR%/smoke-test-summary.json ^
  -e TARGET_URL=%TARGET_URL% ^
  %SCRIPTS_DIR%/smoke-test.js

if errorlevel 1 (
    echo.
    echo ========================================
    echo ERROR: Smoke Test fallo
    echo ========================================
    echo Revisa los resultados en %RESULTS_DIR%
    pause
    exit /b 1
)

echo.
echo ========================================
echo Ejecutando Vote Test (HU6)
echo ========================================
k6 run ^
  --out json=%RESULTS_DIR%/vote-test-results.json ^
  --summary-export=%RESULTS_DIR%/vote-test-summary.json ^
  -e TARGET_URL=%TARGET_URL% ^
  %SCRIPTS_DIR%/vote-test.js

if errorlevel 1 (
    echo.
    echo ========================================
    echo ERROR: Vote Test fallo
    echo ========================================
    echo Revisa los resultados en %RESULTS_DIR%
    pause
    exit /b 1
)

echo.
echo ========================================
echo Pruebas completadas exitosamente!
echo ========================================
echo Resultados guardados en: %RESULTS_DIR%
echo.
echo Archivos generados:
dir /B %RESULTS_DIR%
echo.
pause