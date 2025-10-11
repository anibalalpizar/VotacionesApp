@echo off
echo ============================
echo   Publishing Database - DEV
echo ============================

set SERVER=.
set DATABASE=appVotaciones
set DB_FOLDER=db

echo Connecting to database: %DATABASE%
echo Server: %SERVER%
echo.

if not exist "%DB_FOLDER%" (
    echo Error: Database folder '%DB_FOLDER%' does not exist!
    pause
    exit /b 1
)

echo ============================
echo   Cleaning existing data
echo ============================

(
echo USE [appVotaciones]
echo GO
echo PRINT 'Cleaning existing data...'
echo DELETE FROM [Votes]
echo DELETE FROM [AuditLog]
echo DELETE FROM [Candidates]
echo DELETE FROM [Elections]
echo DELETE FROM [Users]
echo PRINT 'Data cleaned successfully!'
echo GO
) > %DB_FOLDER%\00_cleanup.sql

echo Executing cleanup...
sqlcmd -S %SERVER% -d %DATABASE% -E -i %DB_FOLDER%\00_cleanup.sql

if %errorlevel% neq 0 (
    echo Error during cleanup!
    del %DB_FOLDER%\00_cleanup.sql
    pause
    exit /b %errorlevel%
)

del %DB_FOLDER%\00_cleanup.sql
echo Cleanup completed!
echo.

echo ============================
echo   Inserting seed data
echo ============================

echo [1/5] Inserting Users...
sqlcmd -S %SERVER% -d %DATABASE% -E -i %DB_FOLDER%\01_insert_users.sql
if %errorlevel% neq 0 goto error

echo.
echo [2/5] Inserting Elections...
sqlcmd -S %SERVER% -d %DATABASE% -E -i %DB_FOLDER%\02_insert_elections.sql
if %errorlevel% neq 0 goto error

echo.
echo [3/5] Inserting Candidates...
sqlcmd -S %SERVER% -d %DATABASE% -E -i %DB_FOLDER%\03_insert_candidates.sql
if %errorlevel% neq 0 goto error

echo.
echo [4/5] Inserting Votes...
sqlcmd -S %SERVER% -d %DATABASE% -E -i %DB_FOLDER%\04_insert_votes.sql
if %errorlevel% neq 0 goto error

echo.
echo [5/5] Inserting Audit Logs...
sqlcmd -S %SERVER% -d %DATABASE% -E -i %DB_FOLDER%\05_insert_auditlog.sql
if %errorlevel% neq 0 goto error

echo.
echo ============================
echo   SUCCESS!
echo   Database published successfully!
echo ============================
goto end

:error
echo.
echo ============================
echo   ERROR!
echo   Failed to publish database
echo ============================

:end
echo.
pause