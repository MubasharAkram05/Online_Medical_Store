@echo off
echo Seeding medicines into database...
echo.

REM Replace these with your actual MySQL credentials
set DB_USER=root
set DB_PASSWORD=your_password
set DB_NAME=online_medical_store

REM Get the script directory
set SCRIPT_DIR=%~dp0

REM Run the seed file
mysql -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% < "%SCRIPT_DIR%seeds\medicines_seed.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Medicines seeded successfully!
) else (
    echo.
    echo ❌ Error seeding medicines. Please check:
    echo    1. MySQL is running
    echo    2. Database '%DB_NAME%' exists
    echo    3. Username and password are correct
    echo    4. MySQL is in your PATH
)

pause



