$ErrorActionPreference = "SilentlyContinue"

$root = $PSScriptRoot
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

$svc = Get-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue
if ($svc -and $svc.Status -ne "Running") {
    Start-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue
}

Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c", "npm run dev > `"$backend\.dev.log`" 2>&1" `
    -WorkingDirectory $backend `
    -WindowStyle Hidden

Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c", "npm run dev > `"$frontend\.dev.log`" 2>&1" `
    -WorkingDirectory $frontend `
    -WindowStyle Hidden

Start-Sleep -Seconds 10

Start-Process "http://localhost:3000"
