#!/bin/bash
# Install MarkHub Preview Extension

VSCODE_DIR="$HOME/.vscode/extensions/markhub-preview"
ANTIGRAVITY_DIR="$HOME/.antigravity/extensions/markhub-preview"
WINDSURF_DIR="$HOME/.windsurf/extensions/markhub-preview"

echo "Installing MarkHub Preview extension..."

# Function to install to a directory
install_to() {
    local dir=$1
    local editor=$2
    
    if [ -d "$dir" ]; then
        echo "Removing old $editor version..."
        rm -rf "$dir"
    fi
    
    echo "Installing to $editor..."
    mkdir -p "$dir"
    cp package.json "$dir/"
    cp extension.js "$dir/"
    cp README.md "$dir/"
    echo "✓ Installed to $editor"
}

# Install to VS Code if it exists
if [ -d "$HOME/.vscode" ]; then
    install_to "$VSCODE_DIR" "VS Code"
fi

# Install to Antigravity if it exists
if [ -d "$HOME/.antigravity" ]; then
    install_to "$ANTIGRAVITY_DIR" "Antigravity"
fi

# Install to Windsurf if it exists
if [ -d "$HOME/.windsurf" ]; then
    install_to "$WINDSURF_DIR" "Windsurf"
fi

echo ""
echo "✓ MarkHub Preview extension installed successfully!"
echo ""
echo "Please restart your editor to activate the extension."
echo ""
echo "Usage:"
echo "  - Open a markdown file"
echo "  - Press Cmd+Shift+M (Mac) or Ctrl+Shift+M (Windows/Linux)"
echo "  - Or click the preview icon in the editor toolbar"
