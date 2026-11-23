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
$ZipPath = Join-Path $DistDir "Dhamma.Echo_${Version}_windows-x64.zip"
$SetupExeName = "Dhamma.Echo_${Version}_windows-x64-setup"
$SetupExePath = Join-Path $DistDir "${SetupExeName}.exe"
$IconPath = Join-Path $RootDir "icons\icon.ico"

if (Test-Path $StageDir) { Remove-Item -Recurse -Force $StageDir }
if (Test-Path $ZipPath) { Remove-Item -Force $ZipPath }
if (Test-Path $SetupExePath) { Remove-Item -Force $SetupExePath }

New-Item -ItemType Directory -Force -Path (Join-Path $StageDir "resources") | Out-Null
Copy-Item (Join-Path $TargetDir "release\dhamma-echo-native.exe") (Join-Path $StageDir "dhamma-echo-native.exe")
Copy-Item (Join-Path $RootDir "resources\dhamma.db") (Join-Path $StageDir "resources\dhamma.db")
Copy-Item $IconPath (Join-Path $StageDir "resources\icon.ico")

Compress-Archive -Path $StageDir -DestinationPath $ZipPath -Force
Write-Host "Packaged: $ZipPath"

$IsccCandidates = @(
    (Get-Command "ISCC.exe" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -ErrorAction SilentlyContinue),
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
    "C:\Program Files\Inno Setup 6\ISCC.exe"
) | Where-Object { $_ -and (Test-Path $_) }

$IsccPath = $IsccCandidates | Select-Object -First 1
if (-not $IsccPath) {
    throw "Inno Setup compiler (ISCC.exe) not found. Install Inno Setup 6 to build the Windows installer."
}

$IssPath = Join-Path $DistDir "dhamma-echo.iss"
$IssContent = @"
[Setup]
AppId={{B4E7E4B6-7D9C-4E12-9F8A-4E2A9D7B3C01}
AppName=Dhamma Echo
AppVersion=$Version
AppPublisher=Aung Myo Kyaw
AppPublisherURL=https://github.com/AungMyoKyaw/dhamma-echo
DefaultDirName={autopf}\Dhamma Echo
DefaultGroupName=Dhamma Echo
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
OutputDir=$DistDir
OutputBaseFilename=$SetupExeName
SetupIconFile=$IconPath
UninstallDisplayIcon={app}\dhamma-echo-native.exe
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "$StageDir\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Dhamma Echo"; Filename: "{app}\dhamma-echo-native.exe"; IconFilename: "{app}\resources\icon.ico"
Name: "{group}\Uninstall Dhamma Echo"; Filename: "{uninstallexe}"
Name: "{autodesktop}\Dhamma Echo"; Filename: "{app}\dhamma-echo-native.exe"; IconFilename: "{app}\resources\icon.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\dhamma-echo-native.exe"; Description: "{cm:LaunchProgram,Dhamma Echo}"; Flags: nowait postinstall skipifsilent
"@

Set-Content -Path $IssPath -Value $IssContent -Encoding UTF8
& $IsccPath $IssPath
if ($LASTEXITCODE -ne 0) {
    throw "ISCC.exe failed with exit code $LASTEXITCODE"
}
Remove-Item -Force $IssPath
Write-Host "Packaged: $SetupExePath"
