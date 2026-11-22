$ErrorActionPreference = "Stop"

$RootDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$DistDir = Join-Path $RootDir "dist"

$CargoToml = Get-Content -Raw (Join-Path $RootDir "Cargo.toml")
if ($CargoToml -match 'version\s*=\s*"([^"]+)"') {
    $Version = $Matches[1]
} else {
    throw "Could not read version from Cargo.toml"
}

$TargetDir = if ($env:CARGO_TARGET_DIR) { $env:CARGO_TARGET_DIR } else { Join-Path $RootDir "target" }
cargo build --release --locked --manifest-path (Join-Path $RootDir "Cargo.toml")

$StageDir = Join-Path $DistDir "Dhamma Echo"
$ZipPath = Join-Path $DistDir "Dhamma.Echo_${Version}_x64.zip"

if (Test-Path $StageDir) { Remove-Item -Recurse -Force $StageDir }
if (Test-Path $ZipPath) { Remove-Item -Force $ZipPath }

New-Item -ItemType Directory -Force -Path (Join-Path $StageDir "resources") | Out-Null
Copy-Item (Join-Path $TargetDir "release\dhamma-echo-native.exe") (Join-Path $StageDir "dhamma-echo-native.exe")
Copy-Item (Join-Path $RootDir "resources\dhamma.db") (Join-Path $StageDir "resources\dhamma.db")
Copy-Item (Join-Path $RootDir "icons\icon.ico") (Join-Path $StageDir "resources\icon.ico")

Compress-Archive -Path $StageDir -DestinationPath $ZipPath -Force
Write-Host "Packaged: $ZipPath"
