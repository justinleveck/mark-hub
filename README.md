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

# Make the wrapper script executable
chmod +x markhub
```

## Usage

### Start the app

```bash
# Start with home page
./markhub

# Open a local markdown file
./markhub README.md
./markhub /path/to/file.md

# Open a Gist URL
./markhub https://gist.github.com/username/gist-id

# Open a raw markdown URL
./markhub https://raw.githubusercontent.com/user/repo/main/README.md
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

## Stopping the server

Press `Ctrl+C` in the terminal where the server is running.

## Technical Details

- **Backend**: Express.js server
- **Markdown parser**: marked
- **Styling**: github-markdown-css
- **Port**: Automatically selects an available port
- **Port tracking**: Stores port in `.markhub-port` for server reuse

## License

ISC
