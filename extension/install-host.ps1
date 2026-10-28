# Builds the native-messaging host and registers it with Microsoft Edge for the current user.
# Run from anywhere:  powershell -ExecutionPolicy Bypass -File extension\install-host.ps1
# Uninstall:          powershell -ExecutionPolicy Bypass -File extension\install-host.ps1 -Uninstall
param([switch]$Uninstall)
$ErrorActionPreference = 'Stop'

$name = 'com.nexusvault.host'
# Fixed by the "key" in manifest.json, so it is the same on every machine when loaded unpacked.
$extensionId = 'jkgldpjmhklndjnniiflbbbecnbilkdl'
$regKey = "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\$name"
$installDir = Join-Path $env:LOCALAPPDATA 'NexusVault'

if ($Uninstall) {
    Remove-Item $regKey -ErrorAction SilentlyContinue
    Remove-Item $installDir -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host 'Host de Nexus Vault desinstalado.'
    return
}

$crate = Join-Path $PSScriptRoot '..\src-tauri' | Resolve-Path
cargo build --release --bin nexus-vault-host --manifest-path (Join-Path $crate 'Cargo.toml')
if ($LASTEXITCODE -ne 0) { throw 'cargo build falló' }

# Copy out of target/ so rebuilding never hits a locked exe while Edge is using it.
New-Item -ItemType Directory -Force $installDir | Out-Null
$exe = Join-Path $installDir 'nexus-vault-host.exe'
Copy-Item (Join-Path $crate 'target\release\nexus-vault-host.exe') $exe -Force

$manifestPath = Join-Path $installDir "$name.json"
@{
    name            = $name
    description     = 'Nexus Vault native messaging host'
    path            = $exe
    type            = 'stdio'
    allowed_origins = @("chrome-extension://$extensionId/")
} | ConvertTo-Json | Out-File -Encoding ascii $manifestPath

New-Item -Path $regKey -Force | Out-Null
Set-Item -Path $regKey -Value $manifestPath

Write-Host "Host instalado en $installDir"
Write-Host 'Ahora en Edge: edge://extensions > Modo de desarrollador > Cargar desempaquetada > carpeta extension'
