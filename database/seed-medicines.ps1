# PowerShell script to seed medicines
# Usage: .\seed-medicines.ps1
# Requires DATABASE_URL to be set to your Neon/Postgres connection string

Write-Host "Seeding medicines into database..." -ForegroundColor Cyan
Write-Host ""

if (-not $env:DATABASE_URL) {
    Write-Host "❌ Error: DATABASE_URL environment variable is not set." -ForegroundColor Red
    exit 1
}

# Get the script directory
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$SEED_FILE = Join-Path $SCRIPT_DIR "seeds\medicines_seed.sql"

# Check if file exists
if (-not (Test-Path $SEED_FILE)) {
    Write-Host "❌ Error: Seed file not found at: $SEED_FILE" -ForegroundColor Red
    exit 1
}

# Run the seed file
$command = "psql `"$env:DATABASE_URL`" -f `"$SEED_FILE`""

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
        Write-Host "  1. DATABASE_URL points at a reachable Postgres/Neon instance" -ForegroundColor Yellow
        Write-Host "  2. The database in DATABASE_URL exists" -ForegroundColor Yellow
        Write-Host "  3. psql is in your PATH" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
