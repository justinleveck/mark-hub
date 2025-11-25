const express = require('express');
const fetch = require('node-fetch');
const { marked } = require('marked');
const fs = require('fs');
const path = require('path');
const open = require('open');

const app = express();
app.use(express.text({ limit: '10mb', type: 'text/plain' }));

const cssPath = require.resolve('github-markdown-css/github-markdown.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

// Action menu styles and script
const actionMenuStyles = `
  .actions-flag {
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 100;
  }
  .flag-toggle {
    padding: 4px 12px;
    border-radius: 999px;
    border: 1px solid #d0d7de;
    background: #f6f8fa;
    font-size: 12px;
    color: #57606a;
    cursor: pointer;
    transition: all 0.2s;
  }
  .flag-toggle:hover {
    background: #eaeef2;
    border-color: #afb8c1;
  }
  .flag-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background: #fff;
    border-radius: 8px;
    border: 1px solid #d0d7de;
    box-shadow: 0 8px 24px rgba(140,149,159,0.2);
    padding: 4px 0;
    min-width: 160px;
    opacity: 0;
    transform: translateY(-8px);
    pointer-events: none;
    transition: opacity 0.2s, transform 0.2s;
  }
  .flag-menu.open {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }
  .flag-menu button,
  .flag-menu a {
    display: block;
    width: 100%;
    padding: 8px 16px;
    border: none;
    background: none;
    text-align: left;
    font-size: 14px;
    color: #24292f;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.1s;
  }
  .flag-menu button:hover,
  .flag-menu a:hover {
    background: #f6f8fa;
  }
`;

const actionMenuScript = `
  function toggleMenu(e) {
    e.stopPropagation();
    document.getElementById('flagMenu').classList.toggle('open');
  }
  function closeMenu() {
    document.getElementById('flagMenu').classList.remove('open');
  }
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.actions-flag')) {
      closeMenu();
    }
  });
`;

const actionMenuHTML = `
<div class="actions-flag no-print">
  <button class="flag-toggle" onclick="toggleMenu(event)">⚙ Actions</button>
  <div class="flag-menu" id="flagMenu">
    <a href="/">New</a>
    <button onclick="window.print(); closeMenu()">Print / Save PDF</button>
  </div>
</div>
<script>${actionMenuScript}</script>
`;

// Serve favicon
app.get('/favicon.svg', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.sendFile(path.join(__dirname, 'favicon.svg'));
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>MarkHub</title>
      <link rel="icon" type="image/svg+xml" href="/favicon.svg">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; }
        input { width: 100%; padding: 10px; font-size: 16px; margin-bottom: 10px; }
        button { padding: 10px 20px; font-size: 16px; background: #2ea44f; color: white; border: none; border-radius: 6px; cursor: pointer; }
        button:hover { background: #2c974b; }
        #dropZone {
          border: 2px dashed #d1d5da;
          border-radius: 6px;
          padding: 40px;
          text-align: center;
          margin: 20px 0;
          background: #f6f8fa;
          transition: all 0.2s;
        }
        #dropZone.dragover {
          border-color: #2ea44f;
          background: #e6f7ed;
        }
        #dropZone p {
          margin: 0;
          color: #586069;
        }
        .divider {
          text-align: center;
          margin: 20px 0;
          color: #586069;
          position: relative;
        }
        .divider::before,
        .divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 45%;
          height: 1px;
          background: #d1d5da;
        }
        .divider::before { left: 0; }
        .divider::after { right: 0; }
        .logo {
          display: inline-block;
          width: 40px;
          height: 40px;
          vertical-align: middle;
          margin-right: 10px;
        }
        h1 {
          display: flex;
          align-items: center;
        }
      </style>
    </head>
    <body>
      <h1>
        <img src="/favicon.svg" alt="MarkHub" class="logo">
        MarkHub
      </h1>
      <p>Enter a Gist URL or Raw Markdown URL to view it with GitHub styling.</p>
      <form action="/view" method="get">
        <input type="text" name="url" placeholder="https://gist.github.com/..." required>
        <button type="submit">Render</button>
      </form>
      
      <div class="divider">OR</div>
      
      <div id="dropZone">
        <p>📄 Drag & drop a markdown file here</p>
      </div>
      
      <script>
        const dropZone = document.getElementById('dropZone');
        
        dropZone.addEventListener('dragover', (e) => {
          e.preventDefault();
          dropZone.classList.add('dragover');
        });
        
        dropZone.addEventListener('dragleave', () => {
          dropZone.classList.remove('dragover');
        });
        
        dropZone.addEventListener('drop', async (e) => {
          e.preventDefault();
          dropZone.classList.remove('dragover');
          
          const file = e.dataTransfer.files[0];
          if (!file) return;
          
          if (!file.name.match(/\.(md|markdown|txt)$/i)) {
            alert('Please drop a markdown file (.md, .markdown, or .txt)');
            return;
          }
          
          const text = await file.text();
          
          // Send markdown content to server
          const response = await fetch('/render', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: text
          });
          
          if (response.ok) {
            const html = await response.text();
            document.open();
            document.write(html);
            document.close();
          } else {
            alert('Error rendering markdown');
          }
        });
        
        // Also allow clicking to select file
        dropZone.addEventListener('click', () => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.md,.markdown,.txt';
          input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const text = await file.text();
            const response = await fetch('/render', {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain' },
              body: text
            });
            
            if (response.ok) {
              const html = await response.text();
              document.open();
              document.write(html);
              document.close();
            } else {
              alert('Error rendering markdown');
            }
          };
          input.click();
        });
      </script>
    </body>
    </html>
  `);
});

app.post('/render', (req, res) => {
  try {
    const markdown = req.body;
    if (!markdown) {
      return res.status(400).send('No markdown content provided');
    }

    const htmlContent = marked.parse(markdown);

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>MarkHub View</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <style>
          ${cssContent}
          .markdown-body {
            box-sizing: border-box;
            min-width: 200px;
            max-width: 980px;
            margin: 0 auto;
            padding: 45px;
          }
          @media (max-width: 767px) {
            .markdown-body {
              padding: 15px;
            }
          }
          @media print {
            .markdown-body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
          ${actionMenuStyles}
        </style>
      </head>
      <body class="markdown-body">
        ${actionMenuHTML}
        ${htmlContent}
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`Error rendering markdown: ${error.message}`);
  }
});

app.get('/view', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.redirect('/');

  try {
    let markdown = '';
    let fetchUrl = url;

    // Handle Gist UI URLs
    if (url.includes('gist.github.com') && !url.includes('/raw')) {
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split('/');
      if (parts.length >= 3) {
        fetchUrl = `https://gist.githubusercontent.com${urlObj.pathname}/raw`;
      }
    }

    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error('Failed to fetch content');
    const text = await response.text();

    if (text.trim().startsWith('<!DOCTYPE html>')) {
      return res.status(400).send('Error: The URL returned HTML instead of Markdown. Make sure it is a raw link or a public Gist.');
    }

    markdown = text;
    const htmlContent = marked.parse(markdown);

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>MarkHub View</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <style>
          ${cssContent}
          .markdown-body {
            box-sizing: border-box;
            min-width: 200px;
            max-width: 980px;
            margin: 0 auto;
            padding: 45px;
          }
          @media (max-width: 767px) {
            .markdown-body {
              padding: 15px;
            }
          }
          @media print {
            .markdown-body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
          ${actionMenuStyles}
        </style>
      </head>
      <body class="markdown-body">
        ${actionMenuHTML}
        ${htmlContent}
      </body>
      </html>
    `);

  } catch (error) {
    res.status(500).send(`Error fetching URL: ${error.message}`);
  }
});

// Endpoint to serve local markdown files
app.get('/local', (req, res) => {
  const { file, embed } = req.query;
  if (!file) return res.redirect('/');

  try {
    const filePath = path.resolve(file);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).send(`File not found: ${filePath}`);
    }

    // Read and render the markdown file
    const markdown = fs.readFileSync(filePath, 'utf8');
    const htmlContent = marked.parse(markdown);
    const fileName = path.basename(filePath);
    const isEmbed = embed === 'true';

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${fileName} - MarkHub</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <style>
          ${cssContent}
          .markdown-body {
            box-sizing: border-box;
            min-width: 200px;
            max-width: 980px;
            margin: 0 auto;
            padding: 45px;
          }
          @media (max-width: 767px) {
            .markdown-body {
              padding: 15px;
            }
          }
          @media print {
            .markdown-body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
          ${actionMenuStyles}
        </style>
      </head>
      <body class="markdown-body">
        ${!isEmbed ? actionMenuHTML : ''}
        ${htmlContent}
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`Error reading file: ${error.message}`);
  }
});

// Start server on random available port
const server = app.listen(0, () => {
  const port = server.address().port;
  console.log(`MarkHub running at http://localhost:${port}`);

  // Write port to file for the wrapper script to use
  const portFile = path.join(__dirname, '.markhub-port');
  fs.writeFileSync(portFile, port.toString());

  // Clean up port file on exit
  process.on('SIGINT', () => {
    if (fs.existsSync(portFile)) {
      fs.unlinkSync(portFile);
    }
    process.exit();
  });

  process.on('SIGTERM', () => {
    if (fs.existsSync(portFile)) {
      fs.unlinkSync(portFile);
    }
    process.exit();
  });

  // Check for initial argument - could be a URL or file path
  // Skip browser opening if MARKHUB_NO_BROWSER is set (used by editor extensions)
  const noBrowser = process.env.MARKHUB_NO_BROWSER === '1';

  if (!noBrowser) {
    const initialArg = process.argv[2];
    if (initialArg) {
      // Check if it's a file path
      if (fs.existsSync(initialArg)) {
        const absolutePath = path.resolve(initialArg);
        open(`http://localhost:${port}/local?file=${encodeURIComponent(absolutePath)}`);
      } else if (initialArg.startsWith('http://') || initialArg.startsWith('https://')) {
        // It's a URL
        open(`http://localhost:${port}/view?url=${encodeURIComponent(initialArg)}`);
      } else {
        console.error(`Error: File not found: ${initialArg}`);
        open(`http://localhost:${port}`);
      }
    } else {
      open(`http://localhost:${port}`);
    }
  }
});
