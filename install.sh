#!/bin/bash
# Installation script for MarkHub

INSTALL_DIR="$HOME/.local/bin"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Installing MarkHub..."

# Create install directory if it doesn't exist
mkdir -p "$INSTALL_DIR"

# Copy the wrapper script
cp "$SCRIPT_DIR/markhub" "$INSTALL_DIR/markhub"

# Update SCRIPT_DIR to point to the actual project directory
sed -i.bak "s|SCRIPT_DIR=\".*\"|SCRIPT_DIR=\"$SCRIPT_DIR\"|" "$INSTALL_DIR/markhub"
rm "$INSTALL_DIR/markhub.bak"

# Make it executable
chmod +x "$INSTALL_DIR/markhub"

# Create 'm' symlink
ln -sf "$INSTALL_DIR/markhub" "$INSTALL_DIR/m"

echo "✓ MarkHub installed successfully!"
echo "  Location: $INSTALL_DIR/markhub"
echo "  Alias: m"
echo ""
echo "Make sure $INSTALL_DIR is in your PATH."
echo "You can now run: m -h"
