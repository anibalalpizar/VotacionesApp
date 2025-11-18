@echo off
echo ========================================
echo Running K6 Performance Tests
echo ========================================

set TARGET_URL=https://localhost:7290
set RESULTS_DIR=k6-results
set SCRIPTS_DIR=k6-tests

if not exist "%RESULTS_DIR%" mkdir %RESULTS_DIR%

k6 version >nul 2>&1
if errorlevel 1 (
    echo ERROR: K6 is not installed
    echo.
    echo To install K6 with Chocolatey run:
    echo   choco install k6
    echo.
    echo Or download from: https://k6.io/docs/get-started/installation/
    echo.
    pause
    exit /b 1
)

echo.
echo K6 Version:
k6 version
echo.
echo Target URL: %TARGET_URL%
echo Results: %RESULTS_DIR%
echo.

echo Verifying API is running...
curl -s -k %TARGET_URL%/swagger/index.html >nul 2>&1
if errorlevel 1 (
    echo.
    echo WARNING: Could not connect to %TARGET_URL%
    echo Make sure your API is running.
    echo.
    pause
)

echo.
echo ========================================
echo Running Smoke Test
echo ========================================
k6 run ^
  --out json=%RESULTS_DIR%/smoke-test-results.json ^
  --summary-export=%RESULTS_DIR%/smoke-test-summary.json ^
  -e TARGET_URL=%TARGET_URL% ^
  %SCRIPTS_DIR%/smoke-test.js

if errorlevel 1 (
    echo.
    echo ========================================
    echo ERROR: Smoke Test failed
    echo ========================================
    echo Check results in %RESULTS_DIR%
    pause
    exit /b 1
)

echo.
echo ========================================
echo Running Vote Test (HU6)
echo ========================================
k6 run ^
  --out json=%RESULTS_DIR%/vote-test-results.json ^
  --summary-export=%RESULTS_DIR%/vote-test-summary.json ^
  -e TARGET_URL=%TARGET_URL% ^
  %SCRIPTS_DIR%/vote-test.js

if errorlevel 1 (
    echo.
    echo ========================================
    echo ERROR: Vote Test failed
    echo ========================================
    echo Check results in %RESULTS_DIR%
    pause
    exit /b 1
)

echo.
echo ========================================
echo Tests completed successfully!
echo ========================================
echo Results saved in: %RESULTS_DIR%
echo.
echo Generated files:
dir /B %RESULTS_DIR%
echo.
pause