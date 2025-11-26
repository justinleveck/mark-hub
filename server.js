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

// Configure marked to use highlight.js for fenced code blocks
// Initialize Starry Night (GitHub syntax highlighter)
let starryNight;
let toHtml;

async function initHighlighter() {
  try {
    const { createStarryNight, all } = await import('@wooorm/starry-night');
    const { toHtml: th } = await import('hast-util-to-html');
    toHtml = th;
    starryNight = await createStarryNight(all);
    console.log('Starry Night highlighter initialized with all grammars');
  } catch (err) {
    console.error('Failed to initialize highlighter:', err);
  }
}

// Configure marked to use Starry Night
marked.setOptions({
  highlight(code, lang) {
    if (!starryNight || !lang) return code;

    const scope = starryNight.flagToScope(lang);
    if (!scope) return code;

    try {
      const tree = starryNight.highlight(code, scope);
      return toHtml(tree);
    } catch (err) {
      return code;
    }
  }
});

// Minimal GitHub-like highlight styles
// highlight.js CSS removed as github-markdown-css includes .pl- classes
const highlightStyles = '';

// Action menu styles and script
const actionMenuStyles = `
  .actions-flag {
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 100;
    opacity: 0.3;
    transition: opacity 0.3s ease;
  }
  .actions-flag:hover,
  .actions-flag.active {
    opacity: 1;
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
    const menu = document.getElementById('flagMenu');
    const flag = document.querySelector('.actions-flag');
    menu.classList.toggle('open');
    flag.classList.toggle('active', menu.classList.contains('open'));
  }
  function closeMenu() {
    document.getElementById('flagMenu').classList.remove('open');
    document.querySelector('.actions-flag').classList.remove('active');
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
          ${highlightStyles}
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
          ${highlightStyles}
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
        <script>
          // Vim-style keyboard navigation with visual mode and search
          (function() {
            let lastKeyTime = 0;
            let lastKey = '';
            let searchMode = false;
            let searchQuery = '';
            let searchMatches = [];
            let currentMatchIndex = -1;
            let visualMode = false;
            let helpVisible = false;
            
            // Create search input overlay
            const searchOverlay = document.createElement('div');
            searchOverlay.id = 'searchOverlay';
            searchOverlay.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#2d2d2d;color:#fff;padding:10px 20px;border-radius:5px;font-family:monospace;font-size:14px;z-index:10000;display:none;box-shadow:0 4px 6px rgba(0,0,0,0.3);';
            document.body.appendChild(searchOverlay);
            
            // Create help overlay
            const helpOverlay = document.createElement('div');
            helpOverlay.id = 'helpOverlay';
            helpOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:10001;display:none;overflow:auto;';
            helpOverlay.innerHTML = \`
              <div style="max-width:900px;margin:40px auto;background:#fff;border-radius:8px;padding:30px;box-shadow:0 8px 16px rgba(0,0,0,0.3);">
                <h2 style="margin-top:0;color:#24292e;font-size:24px;border-bottom:2px solid #e1e4e8;padding-bottom:10px;">MarkHub Keyboard Shortcuts</h2>
                
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:20px;">
                  <div>
                    <h3 style="color:#0366d6;font-size:16px;margin-bottom:10px;">Basic Navigation</h3>
                    <table style="width:100%;border-collapse:collapse;font-size:14px;">
                      <tr><td style="padding:6px;font-family:monospace;background:#f6f8fa;border:1px solid #e1e4e8;"><kbd>j</kbd></td><td style="padding:6px;border:1px solid #e1e4e8;">Scroll down</td></tr>
                      <tr><td style="padding:6px;font-family:monospace;background:#f6f8fa;border:1px solid #e1e4e8;"><kbd>k</kbd></td><td style="padding:6px;border:1px solid #e1e4e8;">Scroll up</td></tr>
                      <tr><td style="padding:6px;font-family:monospace;background:#f6f8fa;border:1px solid #e1e4e8;"><kbd>h</kbd></td><td style="padding:6px;border:1px solid #e1e4e8;">Scroll left</td></tr>
                      <tr><td style="padding:6px;font-family:monospace;background:#f6f8fa;border:1px solid #e1e4e8;"><kbd>l</kbd></td><td style="padding:6px;border:1px solid #e1e4e8;">Scroll right</td></tr>
                    </table>
                    
                    <h3 style="color:#0366d6;font-size:16px;margin:20px 0 10px;">Half-Page Scrolling</h3>
                    <table style="width:100%;border-collapse:collapse;font-size:14px;">
                      <tr><td style="padding:6px;font-family:monospace;background:#f6f8fa;border:1px solid #e1e4e8;"><kbd>d</kbd></td><td style="padding:6px;border:1px solid #e1e4e8;">Half page down</td></tr>
                      <tr><td style="padding:6px;font-family:monospace;background:#f6f8fa;border:1px solid #e1e4e8;"><kbd>u</kbd></td><td style="padding:6px;border:1px solid #e1e4e8;">Half page up</td></tr>
                      <tr><td style="padding:6px;font-family:monospace;background:#f6f8fa;border:1px solid #e1e4e8;"><kbd>e</kbd></td><td style="padding:6px;border:1px solid #e1e4e8;">Half page up</td></tr>
                    </table>
                    
                    <h3 style="color:#0366d6;font-size:16px;margin:20px 0 10px;">Full-Page Scrolling</h3>
                    <table style="width:100%;border-collapse:collapse;font-size:14px;">
                      <tr><td style="padding:6px;font-family:monospace;background:#f6f8fa;border:1px solid #e1e4e8;"><kbd>p</kbd></td><td style="padding:6px;border:1px solid #e1e4e8;">Full page down</td></tr>
                      <tr><td style="padding:6px;font-family:monospace;background:#f6f8fa;border:1px solid #e1e4e8;"><kbd>Ctrl+f</kbd></td><td style="padding:6px;border:1px solid #e1e4e8;">Full page down</td></tr>
                      <tr><td style="padding:6px;font-family:monospace;background:#f6f8fa;border:1px solid #e1e4e8;"><kbd>Ctrl+b</kbd></td><td style="padding:6px;border:1px solid #e1e4e8;">Full page up</td></tr>
                    </table>
                  </div>
                  
                  <div>
                    <h3 style="color:#0366d6;font-size:16px;margin-bottom:10px;">Jump Navigation</h3>
                    <table style="width:100%;border-collapse:collapse;font-size:14px;">
                      <tr><td style="padding:6px;font-family:monospace;background:#f6f8fa;border:1px solid #e1e4e8;"><kbd>gg</kbd></td><td style="padding:6px;border:1px solid #e1e4e8;">Jump to top</td></tr>
                      <tr><td style="padding:6px;font-family:monospace;background:#f6f8fa;border:1px solid #e1e4e8;"><kbd>G</kbd></td><td style="padding:6px;border:1px solid #e1e4e8;">Jump to bottom</td></tr>
                      <tr><td style="padding:6px;font-family:monospace;background:#f6f8fa;border:1px solid #e1e4e8;"><kbd>0</kbd></td><td style="padding:6px;border:1px solid #e1e4e8;">Jump to left edge</td></tr>
                      <tr><td style="padding:6px;font-family:monospace;background:#f6f8fa;border:1px solid #e1e4e8;"><kbd>$</kbd></td><td style="padding:6px;border:1px solid #e1e4e8;">Jump to right edge</td></tr>
                    </table>
                    
                    <h3 style="color:#0366d6;font-size:16px;margin:20px 0 10px;">Search</h3>
                    <table style="width:100%;border-collapse:collapse;font-size:14px;">
                      <tr><td style="padding:6px;font-family:monospace;background:#f6f8fa;border:1px solid #e1e4e8;"><kbd>/</kbd></td><td style="padding:6px;border:1px solid #e1e4e8;">Enter search mode</td></tr>
                      <tr><td style="padding:6px;font-family:monospace;background:#f6f8fa;border:1px solid #e1e4e8;"><kbd>n</kbd></td><td style="padding:6px;border:1px solid #e1e4e8;">Next match</td></tr>
                      <tr><td style="padding:6px;font-family:monospace;background:#f6f8fa;border:1px solid #e1e4e8;"><kbd>N</kbd></td><td style="padding:6px;border:1px solid #e1e4e8;">Previous match</td></tr>
                    </table>
                    
                    <h3 style="color:#0366d6;font-size:16px;margin:20px 0 10px;">Visual Mode</h3>
                    <table style="width:100%;border-collapse:collapse;font-size:14px;">
                      <tr><td style="padding:6px;font-family:monospace;background:#f6f8fa;border:1px solid #e1e4e8;"><kbd>v</kbd></td><td style="padding:6px;border:1px solid #e1e4e8;">Toggle visual mode</td></tr>
                    </table>
                    
                    <h3 style="color:#0366d6;font-size:16px;margin:20px 0 10px;">Help</h3>
                    <table style="width:100%;border-collapse:collapse;font-size:14px;">
                      <tr><td style="padding:6px;font-family:monospace;background:#f6f8fa;border:1px solid #e1e4e8;"><kbd>?</kbd></td><td style="padding:6px;border:1px solid #e1e4e8;">Show this help</td></tr>
                      <tr><td style="padding:6px;font-family:monospace;background:#f6f8fa;border:1px solid #e1e4e8;"><kbd>Esc</kbd></td><td style="padding:6px;border:1px solid #e1e4e8;">Close help/exit modes</td></tr>
                    </table>
                  </div>
                </div>
                
                <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e1e4e8;text-align:center;color:#586069;font-size:13px;">
                  Press <kbd style="background:#f6f8fa;padding:2px 6px;border:1px solid #d1d5da;border-radius:3px;font-family:monospace;">Esc</kbd> to close this help
                </div>
              </div>
            \`;
            document.body.appendChild(helpOverlay);
            
            function toggleHelp() {
              helpVisible = !helpVisible;
              helpOverlay.style.display = helpVisible ? 'block' : 'none';
            }
            
            helpOverlay.addEventListener('click', function(e) {
              if (e.target === helpOverlay) {
                toggleHelp();
              }
            });
            
            function enterSearchMode() {
              searchMode = true;
              searchQuery = '';
              searchOverlay.textContent = '/' + searchQuery;
              searchOverlay.style.display = 'block';
            }
            
            function exitSearchMode(clearResults = false) {
              searchMode = false;
              searchOverlay.style.display = 'none';
              if (clearResults) {
                clearSearchHighlights();
              }
            }
            
            function performSearch() {
              if (!searchQuery) return;
              
              // Clear previous highlights
              document.querySelectorAll('.vim-search-highlight').forEach(el => {
                el.outerHTML = el.innerHTML;
              });
              
              searchMatches = [];
              const regex = new RegExp(searchQuery, 'gi');
              const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                null,
                false
              );
              
              let node;
              while (node = walker.nextNode()) {
                // Skip script, style, and search overlay elements
                if (node.parentElement.closest('script, style, #searchOverlay, #helpOverlay')) continue;
                
                const text = node.textContent;
                let match;
                while ((match = regex.exec(text)) !== null) {
                  searchMatches.push({node, index: match.index, length: searchQuery.length});
                }
              }
              
              if (searchMatches.length > 0) {
                currentMatchIndex = 0;
                highlightMatches();
                scrollToMatch(0);
              }
            }
            
            function highlightMatches() {
              searchMatches.forEach((match, idx) => {
                const span = document.createElement('span');
                span.className = 'vim-search-highlight';
                span.style.cssText = idx === currentMatchIndex 
                  ? 'background:#ff9632;color:#000;font-weight:bold;' 
                  : 'background:#ffff00;color:#000;';
                
                const text = match.node.textContent;
                const before = text.substring(0, match.index);
                const highlighted = text.substring(match.index, match.index + match.length);
                const after = text.substring(match.index + match.length);
                
                const parent = match.node.parentNode;
                const beforeNode = document.createTextNode(before);
                const afterNode = document.createTextNode(after);
                span.textContent = highlighted;
                
                parent.insertBefore(beforeNode, match.node);
                parent.insertBefore(span, match.node);
                parent.insertBefore(afterNode, match.node);
                parent.removeChild(match.node);
              });
            }
            
            function scrollToMatch(index) {
              const highlights = document.querySelectorAll('.vim-search-highlight');
              if (highlights[index]) {
                highlights[index].scrollIntoView({behavior: 'smooth', block: 'center'});
              }
            }
            
            function nextMatch() {
              if (searchMatches.length === 0) return;
              
              // Update current highlight to normal style
              const highlights = document.querySelectorAll('.vim-search-highlight');
              if (highlights[currentMatchIndex]) {
                highlights[currentMatchIndex].style.cssText = 'background:#ffff00;color:#000;';
              }
              
              // Move to next match
              currentMatchIndex = (currentMatchIndex + 1) % searchMatches.length;
              
              // Highlight new current match
              if (highlights[currentMatchIndex]) {
                highlights[currentMatchIndex].style.cssText = 'background:#ff9632;color:#000;font-weight:bold;';
                highlights[currentMatchIndex].scrollIntoView({behavior: 'smooth', block: 'center'});
              }
            }
            
            function prevMatch() {
              if (searchMatches.length === 0) return;
              
              // Update current highlight to normal style
              const highlights = document.querySelectorAll('.vim-search-highlight');
              if (highlights[currentMatchIndex]) {
                highlights[currentMatchIndex].style.cssText = 'background:#ffff00;color:#000;';
              }
              
              // Move to previous match
              currentMatchIndex = currentMatchIndex - 1;
              if (currentMatchIndex < 0) currentMatchIndex = searchMatches.length - 1;
              
              // Highlight new current match
              if (highlights[currentMatchIndex]) {
                highlights[currentMatchIndex].style.cssText = 'background:#ff9632;color:#000;font-weight:bold;';
                highlights[currentMatchIndex].scrollIntoView({behavior: 'smooth', block: 'center'});
              }
            }
            
            function clearSearchHighlights() {
              document.querySelectorAll('.vim-search-highlight').forEach(el => {
                el.outerHTML = el.innerHTML;
              });
              searchMatches = [];
              currentMatchIndex = -1;
            }
            
            function toggleVisualMode() {
              visualMode = !visualMode;
              if (visualMode) {
                document.body.style.userSelect = 'text';
                searchOverlay.textContent = '-- VISUAL --';
                searchOverlay.style.display = 'block';
              } else {
                window.getSelection().removeAllRanges();
                searchOverlay.style.display = 'none';
                clearSearchHighlights();
              }
            }
            
            document.addEventListener('keydown', function(e) {
              // Handle search mode
              if (searchMode) {
                if (e.key === 'Escape') {
                  exitSearchMode(true);
                  e.preventDefault();
                } else if (e.key === 'Enter') {
                  exitSearchMode(false);
                  e.preventDefault();
                } else if (e.key === 'Backspace') {
                  searchQuery = searchQuery.slice(0, -1);
                  searchOverlay.textContent = '/' + searchQuery;
                  if (searchQuery) {
                    performSearch();
                  } else {
                    clearSearchHighlights();
                  }
                  e.preventDefault();
                } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                  searchQuery += e.key;
                  searchOverlay.textContent = '/' + searchQuery;
                  performSearch();
                  e.preventDefault();
                }
                return;
              }
              
              // Ignore if typing in input/textarea
              if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
              }
              
              const scrollAmount = 40;
              const pageScrollAmount = window.innerHeight * 0.85;
              const now = Date.now();
              
              // Handle 'gg' for top of page
              if (e.key === 'g' && lastKey === 'g' && (now - lastKeyTime) < 500) {
                window.scrollTo(0, 0);
                e.preventDefault();
                lastKey = '';
                return;
              }
              
              switch(e.key) {
                case '?':
                  toggleHelp();
                  e.preventDefault();
                  break;
                case '/':
                  enterSearchMode();
                  e.preventDefault();
                  break;
                case 'n':
                  nextMatch();
                  e.preventDefault();
                  break;
                case 'N':
                  prevMatch();
                  e.preventDefault();
                  break;
                case 'v':
                  toggleVisualMode();
                  e.preventDefault();
                  break;
                case 'Escape':
                  if (helpVisible) {
                    toggleHelp();
                    e.preventDefault();
                  } else if (visualMode) {
                    toggleVisualMode();
                    e.preventDefault();
                  } else if (searchMatches.length > 0) {
                    clearSearchHighlights();
                    e.preventDefault();
                  }
                  break;
                case 'j':
                  window.scrollBy(0, scrollAmount);
                  e.preventDefault();
                  break;
                case 'k':
                  window.scrollBy(0, -scrollAmount);
                  e.preventDefault();
                  break;
                case 'h':
                  window.scrollBy(-scrollAmount, 0);
                  e.preventDefault();
                  break;
                case 'l':
                  window.scrollBy(scrollAmount, 0);
                  e.preventDefault();
                  break;
                case 'd':
                  window.scrollBy(0, pageScrollAmount / 2);
                  e.preventDefault();
                  break;
                case 'u':
                case 'e':
                  window.scrollBy(0, -pageScrollAmount / 2);
                  e.preventDefault();
                  break;
                case 'f':
                  if (e.ctrlKey) {
                    window.scrollBy(0, pageScrollAmount);
                    e.preventDefault();
                  }
                  break;
                case 'b':
                  if (e.ctrlKey) {
                    window.scrollBy(0, -pageScrollAmount);
                    e.preventDefault();
                  }
                  break;
                case 'p':
                  window.scrollBy(0, pageScrollAmount);
                  e.preventDefault();
                  break;
                case 'g':
                  lastKey = 'g';
                  lastKeyTime = now;
                  break;
                case 'G':
                  window.scrollTo(0, document.body.scrollHeight);
                  e.preventDefault();
                  break;
                case '0':
                  window.scrollTo(0, window.scrollY);
                  e.preventDefault();
                  break;
                case '$':
                  window.scrollTo(document.body.scrollWidth, window.scrollY);
                  e.preventDefault();
                  break;
              }
            });
          })();
          
          // Signal to parent window (VSCode webview) that content is ready
          if (window.parent !== window) {
            window.parent.postMessage('markhub-ready', '*');
          }
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`Error reading file: ${error.message}`);
  }
});

// Start server on random available port
const server = app.listen(0, async () => {
  await initHighlighter();
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
