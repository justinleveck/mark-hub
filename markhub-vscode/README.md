# MarkHub Preview Extension

Preview markdown files in VS Code / Windsurf / Antigravity using MarkHub with beautiful GitHub styling.

## Features

- 🎨 GitHub-styled markdown rendering
- 🔄 Automatic server management
- ⌨️ Keyboard shortcut: `Cmd+Shift+M` (Mac) or `Ctrl+Shift+M` (Windows/Linux)
- 👁️ Preview button in editor toolbar
- 📄 Side-by-side preview support

## Usage

### Preview Commands

1. **Side-by-Side Preview** (Recommended)
   - Click the preview icon in the editor toolbar
   - Or use keyboard shortcut: `Cmd+Shift+M` (Mac) / `Ctrl+Shift+M` (Windows/Linux)
   - Or open Command Palette (`Cmd+Shift+P`) and search for "MarkHub: Preview Markdown (Side by Side)"

2. **Full Preview**
   - Right-click in a markdown file and select "MarkHub: Preview Markdown"
   - Or open Command Palette and search for "MarkHub: Preview Markdown"

### Requirements

- MarkHub must be installed and the `markhub` command must be available at `~/.local/bin/markhub`
- Node.js must be installed

## Installation

Run the install script which will automatically detect and install to all compatible editors:

```bash
cd markhub-vscode
./install.sh
```

This will install the extension to:
- `~/.vscode/extensions/markhub-preview` (if VS Code is installed)
- `~/.windsurf/extensions/markhub-preview` (if Windsurf is installed)
- `~/.antigravity/extensions/markhub-preview` (if Antigravity is installed)

Then restart your editor.

## How It Works

The extension automatically:
1. Checks if the MarkHub server is running
2. Starts the server if needed
3. Opens your markdown file in a webview panel
4. Renders it with GitHub styling

## Uninstall

```bash
# Remove from VS Code
rm -rf ~/.vscode/extensions/markhub-preview

# Remove from Windsurf
rm -rf ~/.windsurf/extensions/markhub-preview

# Remove from Antigravity
rm -rf ~/.antigravity/extensions/markhub-preview
```

Then restart your editor.
