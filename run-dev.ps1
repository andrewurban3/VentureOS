# Run after installing Node.js from https://nodejs.org
# Usage: Right-click -> Run with PowerShell, or: powershell -ExecutionPolicy Bypass -File run-dev.ps1

$nodePaths = @(
    "C:\Program Files\nodejs",
    "$env:ProgramFiles\nodejs",
    "$env:LOCALAPPDATA\Programs\node",
    "$env:APPDATA\npm"
)

$found = $false
foreach ($p in $nodePaths) {
    $expanded = [System.Environment]::ExpandEnvironmentVariables($p)
    if (Test-Path "$expanded\node.exe") {
        $env:Path = "$expanded;$expanded\..\npm;$env:Path"
        $found = $true
        Write-Host "Using Node at: $expanded"
        break
    }
}

if (-not $found) {
    Write-Host "Node.js not found. Install it from https://nodejs.org (LTS), then close and reopen this terminal and run:" -ForegroundColor Yellow
    Write-Host "  npm install"
    Write-Host "  npm run dev"
    exit 1
}

Set-Location $PSScriptRoot
if (-not (Test-Path "node_modules")) {
    Write-Host "Running npm install..."
    & npm install
}
Write-Host "Starting dev server..."
& npm run dev
