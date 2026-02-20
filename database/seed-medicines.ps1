# PowerShell script to seed medicines
# Usage: .\seed-medicines.ps1

Write-Host "Seeding medicines into database..." -ForegroundColor Cyan
Write-Host ""

# Replace these with your actual MySQL credentials
$DB_USER = "root"
$DB_PASSWORD = "your_password"
$DB_NAME = "online_medical_store"

# Get the script directory
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$SEED_FILE = Join-Path $SCRIPT_DIR "seeds\medicines_seed.sql"

# Check if file exists
if (-not (Test-Path $SEED_FILE)) {
    Write-Host "❌ Error: Seed file not found at: $SEED_FILE" -ForegroundColor Red
    exit 1
}

# Run the seed file
$env:MYSQL_PWD = $DB_PASSWORD
$command = "mysql -u $DB_USER $DB_NAME < `"$SEED_FILE`""

try {
    Invoke-Expression $command
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Medicines seeded successfully!" -ForegroundColor Green
    }
    else {
        Write-Host ""
        Write-Host "❌ Error seeding medicines. Exit code: $LASTEXITCODE" -ForegroundColor Red
        Write-Host "Please check:" -ForegroundColor Yellow
        Write-Host "  1. MySQL is running" -ForegroundColor Yellow
        Write-Host "  2. Database '$DB_NAME' exists" -ForegroundColor Yellow
        Write-Host "  3. Username and password are correct" -ForegroundColor Yellow
        Write-Host "  4. MySQL is in your PATH" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}



