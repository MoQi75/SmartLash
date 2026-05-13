$ErrorActionPreference = "Stop"

$backendDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $backendDir
$pythonExe = Join-Path $backendDir ".venv\Scripts\python.exe"

$frontendDir = Get-ChildItem -Path $rootDir -Directory |
    Where-Object { Test-Path (Join-Path $_.FullName "vite.config.js") } |
    Select-Object -First 1 -ExpandProperty FullName

if (-not (Test-Path $pythonExe)) {
    throw "Backend virtual environment not found: $pythonExe"
}

if (-not $frontendDir) {
    throw "Web frontend directory not found under: $rootDir"
}

$env:npm_config_cache = Join-Path $rootDir ".npm-cache"

Write-Host "Building SmartLash web frontend into Django frontend_dist ..."
Push-Location $frontendDir
npm.cmd run build:backend
Pop-Location

Write-Host "Starting SmartLash Django single-entry web server on http://0.0.0.0:8002 ..."
Push-Location $backendDir
& $pythonExe manage.py runserver 0.0.0.0:8002
Pop-Location
