@echo off
echo Seeding medicines into database...
echo.

REM Requires DATABASE_URL to be set to your Neon/Postgres connection string
if "%DATABASE_URL%"=="" (
    echo Error: DATABASE_URL environment variable is not set.
    exit /b 1
)

REM Get the script directory
set SCRIPT_DIR=%~dp0

REM Run the seed file
psql "%DATABASE_URL%" -f "%SCRIPT_DIR%seeds\medicines_seed.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Medicines seeded successfully!
) else (
    echo.
    echo ❌ Error seeding medicines. Please check:
    echo    1. DATABASE_URL points at a reachable Postgres/Neon instance
    echo    2. The database in DATABASE_URL exists
    echo    3. psql is in your PATH
)

pause
