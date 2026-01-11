# Start Python ML Service
# Usage: powershell -ExecutionPolicy Bypass -File .\start-python-ml.ps1

param()

$ErrorActionPreference = 'Continue'
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force -ErrorAction SilentlyContinue

Write-Host "Starting Python ML Service..." -ForegroundColor Green

$mlPath = "c:\Users\MILKA JAMES\milka_hospital\meditrack\meditrack\ml_service"
$rootPath = "c:\Users\MILKA JAMES\milka_hospital\meditrack\meditrack"

Set-Location $rootPath

# Check if virtual environment exists
if (-not (Test-Path "$mlPath\venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    Set-Location $mlPath
    python -m venv venv
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to create virtual environment" -ForegroundColor Red
        exit 1
    }
    Write-Host "Virtual environment created successfully" -ForegroundColor Green
    Set-Location $rootPath
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& "$mlPath\venv\Scripts\Activate.ps1"

# Note: Activate.ps1 doesn't return exit code, so we just verify venv bin exists
if (-not (Test-Path "$mlPath\venv\Scripts\python.exe")) {
    Write-Host "Failed to activate virtual environment" -ForegroundColor Red
    exit 1
}

# Upgrade pip first (important for pre-built wheels)
Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip --quiet 2>$null

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Set-Location $mlPath
pip install -r requirements.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies" -ForegroundColor Red
    Write-Host "If scikit-learn fails, you may need Visual C++ Build Tools:" -ForegroundColor Yellow
    Write-Host "https://visualstudio.microsoft.com/visual-cpp-build-tools/" -ForegroundColor Cyan
    exit 1
}

Write-Host "Dependencies installed successfully" -ForegroundColor Green
Write-Host ""
Write-Host "Starting ML service on port 5001..." -ForegroundColor Green
Write-Host "Health check: http://localhost:5001/api/ml/health" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the service" -ForegroundColor Yellow
Write-Host ""

python app.py