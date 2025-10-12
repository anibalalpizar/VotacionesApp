@echo off
echo ============================
echo   Publishing Database - DEV
echo ============================
set SERVER=.
set DATABASE=appVotaciones
set DB_FOLDER=db
set SCHEMA_FILE=script.sql

echo Connecting to database: %DATABASE%
echo Server: %SERVER%
echo.

if not exist "%DB_FOLDER%" (
    echo Error: Database folder '%DB_FOLDER%' does not exist!
    pause
    exit /b 1
)

if not exist "%DB_FOLDER%\%SCHEMA_FILE%" (
    echo Error: Schema file '%DB_FOLDER%\%SCHEMA_FILE%' does not exist!
    pause
    exit /b 1
)

echo ============================
echo   Recreating database
echo ============================
(
echo -- Drop database if exists
echo IF EXISTS ^(SELECT name FROM sys.databases WHERE name = N'%DATABASE%'^)
echo BEGIN
echo     ALTER DATABASE [%DATABASE%] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
echo     DROP DATABASE [%DATABASE%];
echo     PRINT 'Database dropped successfully!';
echo END
echo GO
echo.
echo -- Create database
echo CREATE DATABASE [%DATABASE%];
echo GO
echo PRINT 'Database created successfully!';
echo GO
) > %DB_FOLDER%\00_recreate_database.sql

echo Recreating database...
sqlcmd -S %SERVER% -E -i %DB_FOLDER%\00_recreate_database.sql
if %errorlevel% neq 0 (
    echo Error during database recreation!
    del %DB_FOLDER%\00_recreate_database.sql
    pause
    exit /b %errorlevel%
)
del %DB_FOLDER%\00_recreate_database.sql
echo Database recreated successfully!
echo.

echo ============================
echo   Creating database schema
echo ============================
echo Executing schema script...
sqlcmd -S %SERVER% -d %DATABASE% -E -i %DB_FOLDER%\%SCHEMA_FILE%
if %errorlevel% neq 0 (
    echo Error during schema creation!
    pause
    exit /b %errorlevel%
)
echo Schema created successfully!
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