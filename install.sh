#!/usr/bin/env bash
# Cartridge installer: downloads the latest AppImage, makes it executable and adds a menu entry.
# Usage: curl -fsSL https://raw.githubusercontent.com/abdu2304/cartridge/main/install.sh | bash
set -euo pipefail
DIR="$HOME/Applications"
APP="$DIR/Cartridge-x86_64.AppImage"
URL="https://github.com/abdu2304/cartridge/releases/latest/download/Cartridge-x86_64.AppImage"
ICON_URL="https://raw.githubusercontent.com/abdu2304/cartridge/main/build/icon.png"

mkdir -p "$DIR" "$HOME/.local/share/applications" "$HOME/.local/share/icons/hicolor/512x512/apps"
echo "Downloading Cartridge..."
curl -fL --progress-bar -o "$APP.part" "$URL"
mv "$APP.part" "$APP"
chmod +x "$APP"
curl -fsSL -o "$HOME/.local/share/icons/hicolor/512x512/apps/cartridge.png" "$ICON_URL" || true

cat > "$HOME/.local/share/applications/cartridge.desktop" <<DESKTOP
[Desktop Entry]
Name=Cartridge
Comment=Controller-first RomM client
Exec="$APP"
Icon=cartridge
Terminal=false
Type=Application
Categories=Game;
DESKTOP
update-desktop-database "$HOME/.local/share/applications" >/dev/null 2>&1 || true

echo
echo "Installed to $APP"
echo "Open Cartridge from your app menu, then use Settings > Steam > Add to Steam for Game Mode."
