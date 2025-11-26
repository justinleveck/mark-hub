# MarkHub

A simple, elegant markdown viewer with GitHub styling. View markdown files from URLs, local files, or drag-and-drop.

## Features

- 🎨 **GitHub-styled rendering** - Beautiful markdown rendering with official GitHub CSS
- 🌐 **URL support** - View Gist URLs or raw markdown URLs
- 📁 **Local file support** - Open markdown files from your filesystem
- 🖱️ **Drag & drop** - Drop markdown files directly into the browser
- 🔄 **Smart server reuse** - Reuses existing server instance when opening multiple files
- 🖨️ **Print/PDF export** - Built-in print and save as PDF functionality

## Installation

```bash
# Clone or download this repository
cd mark-hub

# Install dependencies
npm install

# Option 1: Use the install script (recommended)
./install.sh

# Option 2: Run locally without installing
chmod +x markhub
./markhub
```

The install script will:
- Copy the wrapper to `~/.local/bin/markhub`
- Configure it to point to your project directory
- Create an `m` alias for convenience
- Make sure `~/.local/bin` is in your PATH

## Usage

### Command-line options

```bash
# Show help
m -h
m --help

# Start with home page
m

# Open a local markdown file
m README.md
m ~/Documents/notes.md

# Open a Gist URL
m https://gist.github.com/username/gist-id

# Restart the server (useful after code changes)
m -r
m --restart

# Restart and open a file
m -r README.md

# Stop the server
m -s
m --stop

# Show current server port
m -p
m --port

# Show version
m -v
m --version
```

### Smart server behavior

- **First run**: Starts a new server on a random available port
- **Subsequent runs**: Detects existing server and reuses it (just opens a new browser tab)
- **Server persists**: Keep the server running and open multiple files without restarting

### Drag & Drop

1. Start the app with `./markhub`
2. Drag any `.md`, `.markdown`, or `.txt` file onto the drop zone
3. Or click the drop zone to select a file

### From the web interface

1. Paste a Gist URL or raw markdown URL into the input field
2. Click "Render" to view

## Examples

```bash
# View this README
./markhub README.md

# View a Gist
./markhub https://gist.github.com/example/abc123

# Start server and use drag-and-drop
./markhub
```

## Keyboard Shortcuts

MarkHub supports vim-style keyboard navigation for hands-free browsing:

### Basic Navigation
| Key | Action |
|-----|--------|
| `j` | Scroll down |
| `k` | Scroll up |
| `h` | Scroll left |
| `l` | Scroll right |

### Half-Page Scrolling
| Key | Action |
|-----|--------|
| `d` | Scroll half page down |
| `u` | Scroll half page up |
| `e` | Scroll half page up (alternative) |

### Full-Page Scrolling
| Key | Action |
|-----|--------|
| `p` | Scroll full page down |
| `Ctrl+f` | Scroll full page down |
| `Ctrl+b` | Scroll full page up |

### Jump Navigation
| Key | Action |
|-----|--------|
| `gg` | Jump to top of page |
| `G` | Jump to bottom of page |
| `0` | Jump to left edge |
| `$` | Jump to right edge |

### Search
| Key | Action |
|-----|--------|
| `/` | Enter search mode |
| `n` | Next search match |
| `N` | Previous search match |
| `Esc` | Exit search mode |

### Visual Mode
| Key | Action |
|-----|--------|
| `v` | Toggle visual mode (enable text selection) |
| `Esc` | Exit visual mode |

### Help
| Key | Action |
|-----|--------|
| `?` | Show keyboard shortcuts help |
| `Esc` | Close help |

These shortcuts work in both the browser and VS Code preview mode.

## Stopping the server

Press `Ctrl+C` in the terminal where the server is running, or use:
```bash
m -s
m --stop
```

## Editor Extension (VS Code / Windsurf / Antigravity)

An editor extension is included to preview markdown files directly in your editor using MarkHub.

### Install the extension

```bash
cd markhub-vscode
./install.sh
```

The install script will automatically detect and install to VS Code, Windsurf, and Antigravity if present. Then restart your editor.

### Using the extension

1. Open any markdown file
2. Press `Cmd+Shift+M` (Mac) or `Ctrl+Shift+M` (Windows/Linux)
3. Or click the preview icon in the editor toolbar
4. Or right-click and select "MarkHub: Preview Markdown"

The extension will automatically start the MarkHub server if it's not running and display your markdown with GitHub styling in a side panel.

## Technical Details

- **Backend**: Express.js server
- **Markdown parser**: marked
- **Styling**: github-markdown-css
- **Port**: Automatically selects an available port
- **Port tracking**: Stores port in `.markhub-port` for server reuse

## License

MIT © Justin Leveck

See [LICENSE](LICENSE) for more details.
