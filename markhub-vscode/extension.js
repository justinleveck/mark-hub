const vscode = require('vscode');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Path to the markhub command
const MARKHUB_COMMAND = path.join(os.homedir(), '.local', 'bin', 'markhub');
const PORT_FILE = path.join(os.homedir(), 'code', 'mark-hub', '.markhub-port');

/**
 * Get the current server port
 */
function getServerPort() {
    try {
        if (fs.existsSync(PORT_FILE)) {
            return fs.readFileSync(PORT_FILE, 'utf8').trim();
        }
    } catch (error) {
        console.error('Error reading port file:', error);
    }
    return null;
}

/**
 * Check if server is running
 */
function isServerRunning(port) {
    return new Promise((resolve) => {
        const http = require('http');
        const req = http.get(`http://localhost:${port}`, (res) => {
            resolve(true);
        });
        req.on('error', () => {
            resolve(false);
        });
        req.setTimeout(1000, () => {
            req.destroy();
            resolve(false);
        });
    });
}

/**
 * Start the MarkHub server if not running.
 * Reuse an existing working port if possible, otherwise start a new server
 * and wait until it is reachable on the random high port written to .markhub-port.
 */
function ensureServerRunning() {
    return new Promise(async (resolve, reject) => {
        try {
            const existingPort = getServerPort();

            // If we have a port in the file and the server responds, reuse it
            if (existingPort && await isServerRunning(existingPort)) {
                return resolve(existingPort);
            }

            // Otherwise start a fresh server and wait for a working port
            const port = await startServerAndWait();
            return resolve(port);
        } catch (error) {
            return reject(error);
        }
    });
}

/**
 * Start MarkHub (random port) and wait until .markhub-port exists
 * and the server responds on that port.
 */
function startServerAndWait() {
    return new Promise((resolve, reject) => {
        // Start markhub in no-browser mode; it will pick a random high port
        exec(`${MARKHUB_COMMAND} --no-browser > /dev/null 2>&1 &`, (error) => {
            if (error) {
                return reject(error);
            }
        });

        let attempts = 0;
        const maxAttempts = 20; // ~10 seconds

        const checkInterval = setInterval(async () => {
            const port = getServerPort();

            if (port && await isServerRunning(port)) {
                clearInterval(checkInterval);
                return resolve(port);
            }

            if (attempts++ > maxAttempts) {
                clearInterval(checkInterval);
                return reject(new Error('MarkHub server failed to start or respond'));
            }
        }, 500);
    });
}

/**
 * Open markdown file in MarkHub
 */
async function openInMarkHub(filePath, viewColumn = vscode.ViewColumn.Two) {
    try {
        // Ensure server is running
        const port = await ensureServerRunning();

        // Encode the file path and add embed parameter to hide control buttons
        const encodedPath = encodeURIComponent(filePath);
        const url = `http://localhost:${port}/local?file=${encodedPath}&embed=true`;

        // Create webview panel
        const panel = vscode.window.createWebviewPanel(
            'markhubPreview',
            `Preview: ${path.basename(filePath)}`,
            viewColumn,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        // Set the webview content to an iframe
        panel.webview.html = getWebviewContent(url);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open MarkHub preview: ${error.message}`);
    }
}

/**
 * Generate webview HTML content
 */
function getWebviewContent(url) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MarkHub Preview</title>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
        iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
    </style>
</head>
<body>
    <iframe src="${url}" sandbox="allow-scripts"></iframe>
</body>
</html>`;
}

/**
 * Activate the extension
 */
function activate(context) {
    console.log('MarkHub Preview extension is now active');

    // Register command for preview
    let previewCommand = vscode.commands.registerCommand('markhub.preview', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.languageId === 'markdown') {
            const filePath = editor.document.uri.fsPath;
            openInMarkHub(filePath, vscode.ViewColumn.Active);
        } else {
            vscode.window.showWarningMessage('Please open a markdown file first');
        }
    });

    // Register command for side-by-side preview
    let previewSideCommand = vscode.commands.registerCommand('markhub.previewSide', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.languageId === 'markdown') {
            const filePath = editor.document.uri.fsPath;
            openInMarkHub(filePath, vscode.ViewColumn.Two);
        } else {
            vscode.window.showWarningMessage('Please open a markdown file first');
        }
    });

    context.subscriptions.push(previewCommand);
    context.subscriptions.push(previewSideCommand);
}

/**
 * Deactivate the extension
 */
function deactivate() { }

module.exports = {
    activate,
    deactivate
};
