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

# Packaging MSIX for Microsoft Store
$MsixPath = Join-Path $DistDir "Dhamma.Echo_${Version}_x64.msix"
if (Test-Path $MsixPath) { Remove-Item -Force $MsixPath }

$MsixStageDir = Join-Path $DistDir "msix-stage"
if (Test-Path $MsixStageDir) { Remove-Item -Recurse -Force $MsixStageDir }
New-Item -ItemType Directory -Force -Path $MsixStageDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $MsixStageDir "resources") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $MsixStageDir "Assets") | Out-Null

Copy-Item (Join-Path $TargetDir "release\dhamma-echo-native.exe") (Join-Path $MsixStageDir "dhamma-echo-native.exe")
Copy-Item (Join-Path $RootDir "resources\dhamma.db") (Join-Path $MsixStageDir "resources\dhamma.db")
Copy-Item (Join-Path $RootDir "resources\msix\Assets\*") (Join-Path $MsixStageDir "Assets") -Recurse

$Publisher = if ($env:MSIX_PUBLISHER) { $env:MSIX_PUBLISHER } else { "CN=F9A61C2C-016B-4569-AF3E-D8FB4CBCB150" }
$ManifestContent = Get-Content -Raw (Join-Path $RootDir "resources\msix\Package.appxmanifest.xml")
$ManifestContent = $ManifestContent.Replace('__APP_VERSION__', "${Version}.0")
$ManifestContent = $ManifestContent.Replace('__PUBLISHER__', $Publisher)
Set-Content -Path (Join-Path $MsixStageDir "AppxManifest.xml") -Value $ManifestContent -Encoding UTF8

$MakeAppxCandidates = @(
    (Get-Command "MakeAppx.exe" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -ErrorAction SilentlyContinue),
    (Get-ChildItem "C:\Program Files (x86)\Windows Kits\10\bin\*\x64\MakeAppx.exe" -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | Select-Object -ExpandProperty FullName -First 1),
    (Get-ChildItem "C:\Program Files\Windows Kits\10\bin\*\x64\MakeAppx.exe" -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | Select-Object -ExpandProperty FullName -First 1)
) | Where-Object { $_ -and (Test-Path $_) }

$MakeAppxPath = $MakeAppxCandidates | Select-Object -First 1
if ($MakeAppxPath) {
    & $MakeAppxPath pack /d $MsixStageDir /p $MsixPath /o /nv
    if ($LASTEXITCODE -ne 0) {
        throw "MakeAppx.exe failed with exit code $LASTEXITCODE"
    }
    Write-Host "Packaged: $MsixPath"
} else {
    Write-Warning "MakeAppx.exe not found. MSIX package was not generated."
}
Remove-Item -Recurse -Force $MsixStageDir
