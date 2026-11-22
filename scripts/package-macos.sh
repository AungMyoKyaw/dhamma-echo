#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
TARGET_DIR="${CARGO_TARGET_DIR:-$ROOT_DIR/target}"
APP_NAME="Dhamma Echo"
APP_BUNDLE="$DIST_DIR/$APP_NAME.app"
VERSION="$(awk -F'"' '/^version = / { print $2; exit }' "$ROOT_DIR/Cargo.toml")"
ARCH="$(uname -m)"
if [ "$ARCH" = "arm64" ]; then
  ARCH_LABEL="aarch64"
else
  ARCH_LABEL="$ARCH"
fi
DMG_PATH="$DIST_DIR/Dhamma.Echo_${VERSION}_${ARCH_LABEL}.dmg"

cargo build --release --locked --manifest-path "$ROOT_DIR/Cargo.toml"

rm -rf "$APP_BUNDLE" "$DMG_PATH"
mkdir -p "$APP_BUNDLE/Contents/MacOS" "$APP_BUNDLE/Contents/Resources"

cp "$TARGET_DIR/release/dhamma-echo-native" "$APP_BUNDLE/Contents/MacOS/dhamma-echo-native"
chmod +x "$APP_BUNDLE/Contents/MacOS/dhamma-echo-native"
cp "$ROOT_DIR/resources/dhamma.db" "$APP_BUNDLE/Contents/Resources/dhamma.db"
cp "$ROOT_DIR/icons/icon.icns" "$APP_BUNDLE/Contents/Resources/AppIcon.icns"

cat > "$APP_BUNDLE/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleDisplayName</key>
  <string>Dhamma Echo</string>
  <key>CFBundleExecutable</key>
  <string>dhamma-echo-native</string>
  <key>CFBundleIconFile</key>
  <string>AppIcon</string>
  <key>CFBundleIdentifier</key>
  <string>com.aungmyokyaw.dhammaecho</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>Dhamma Echo</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>${VERSION}</string>
  <key>CFBundleVersion</key>
  <string>${VERSION}</string>
  <key>LSApplicationCategoryType</key>
  <string>public.app-category.music</string>
  <key>LSMinimumSystemVersion</key>
  <string>13.0</string>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>
EOF

codesign --force --deep --sign - "$APP_BUNDLE"
codesign --verify --deep --strict "$APP_BUNDLE"

DMG_STAGE="$(mktemp -d)"
trap 'rm -rf "$DMG_STAGE"' EXIT
cp -R "$APP_BUNDLE" "$DMG_STAGE/"
ln -s /Applications "$DMG_STAGE/Applications"
hdiutil create -volname "$APP_NAME" -srcfolder "$DMG_STAGE" -ov -format UDZO "$DMG_PATH" >/dev/null

echo "Packaged: $APP_BUNDLE"
echo "Packaged: $DMG_PATH"
