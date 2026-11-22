#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
TARGET_DIR="${CARGO_TARGET_DIR:-$ROOT_DIR/target}"
VERSION="$(awk -F'"' '/^version = / { print $2; exit }' "$ROOT_DIR/Cargo.toml")"
ARCH="$(uname -m)"
PKG_ROOT="$DIST_DIR/dhamma-echo_${VERSION}_${ARCH}"
TARBALL="$DIST_DIR/Dhamma.Echo_${VERSION}_${ARCH}.tar.gz"

cargo build --release --locked --manifest-path "$ROOT_DIR/Cargo.toml"

rm -rf "$PKG_ROOT" "$TARBALL"
mkdir -p "$PKG_ROOT/bin" "$PKG_ROOT/share/dhamma-echo" "$PKG_ROOT/share/applications" "$PKG_ROOT/share/icons/hicolor/128x128/apps"

cp "$TARGET_DIR/release/dhamma-echo-native" "$PKG_ROOT/bin/dhamma-echo-native"
chmod +x "$PKG_ROOT/bin/dhamma-echo-native"
cp "$ROOT_DIR/resources/dhamma.db" "$PKG_ROOT/share/dhamma-echo/dhamma.db"
cp "$ROOT_DIR/icons/128x128.png" "$PKG_ROOT/share/icons/hicolor/128x128/apps/dhamma-echo.png"

cat > "$PKG_ROOT/share/applications/dhamma-echo.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Dhamma Echo
Comment=A quiet desktop library for Dhamma talks
Exec=dhamma-echo-native
Icon=dhamma-echo
Categories=AudioVideo;Audio;Player;
Terminal=false
EOF

tar -C "$DIST_DIR" -czf "$TARBALL" "$(basename "$PKG_ROOT")"
echo "Packaged: $TARBALL"

if command -v dpkg-deb >/dev/null 2>&1; then
  DEB_ARCH="$(dpkg --print-architecture 2>/dev/null || echo amd64)"
  DEB_ROOT="$DIST_DIR/deb-stage"
  DEB_PATH="$DIST_DIR/Dhamma.Echo_${VERSION}_${DEB_ARCH}.deb"
  rm -rf "$DEB_ROOT" "$DEB_PATH"
  mkdir -p "$DEB_ROOT/DEBIAN" "$DEB_ROOT/usr/bin" "$DEB_ROOT/usr/share/dhamma-echo" "$DEB_ROOT/usr/share/applications" "$DEB_ROOT/usr/share/icons/hicolor/128x128/apps"
  cp "$PKG_ROOT/bin/dhamma-echo-native" "$DEB_ROOT/usr/bin/dhamma-echo-native"
  cp "$PKG_ROOT/share/dhamma-echo/dhamma.db" "$DEB_ROOT/usr/share/dhamma-echo/dhamma.db"
  cp "$PKG_ROOT/share/applications/dhamma-echo.desktop" "$DEB_ROOT/usr/share/applications/dhamma-echo.desktop"
  cp "$PKG_ROOT/share/icons/hicolor/128x128/apps/dhamma-echo.png" "$DEB_ROOT/usr/share/icons/hicolor/128x128/apps/dhamma-echo.png"
  cat > "$DEB_ROOT/DEBIAN/control" <<EOF
Package: dhamma-echo
Version: ${VERSION}
Section: sound
Priority: optional
Architecture: ${DEB_ARCH}
Maintainer: Aung Myo Kyaw
Description: A quiet desktop library for Dhamma talks
 Native GPUI desktop player for Dhamma talks with bundled read-only catalogue.
EOF
  dpkg-deb --build --root-owner-group "$DEB_ROOT" "$DEB_PATH" >/dev/null
  rm -rf "$DEB_ROOT"
  echo "Packaged: $DEB_PATH"
fi
