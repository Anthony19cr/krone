$ErrorActionPreference = "SilentlyContinue"

$root = $PSScriptRoot

$targets = Get-CimInstance Win32_Process -Filter "Name='node.exe' or Name='cmd.exe'" |
    Where-Object { $_.CommandLine -and $_.CommandLine -like "*$root*" }

foreach ($p in $targets) {
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
}
