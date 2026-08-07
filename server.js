const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.ttf':  'font/ttf',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.map':  'application/json',
};

function serveFile(res, filePath, urlPath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.log(`  [404] NOT FOUND: ${urlPath} -> ${filePath}`);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`404 Not Found: ${urlPath}`);
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Cache-Control': 'public, max-age=3600',
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    });
    res.end();
    return;
  }

  let urlPath = req.url.split('?')[0];
  try { urlPath = decodeURIComponent(urlPath); } catch(e) {}

  const timestamp = new Date().toLocaleTimeString('pt-BR', {hour12: false});
  console.log(`[${timestamp}] ${req.method} ${urlPath}`);

  // Serve index.html for root
  if (urlPath === '/' || urlPath === '') {
    return serveFile(res, path.join(ROOT, 'index.html'), urlPath);
  }

  // Build a list of candidate file paths to try in order
  const candidates = [
    path.join(ROOT, urlPath),
  ];

  // For _next/static/chunks/* requests, also try:
  // 1. js/ directory (flat structure)
  // 2. _next/static/chunks/ (nested structure)
  if (urlPath.startsWith('/_next/static/chunks/pages/')) {
    const filename = path.basename(urlPath);
    candidates.push(path.join(ROOT, '_next', 'static', 'chunks', 'pages', filename));
    candidates.push(path.join(ROOT, 'js', filename));
  } else if (urlPath.startsWith('/_next/static/chunks/')) {
    const filename = path.basename(urlPath);
    candidates.push(path.join(ROOT, '_next', 'static', 'chunks', filename));
    candidates.push(path.join(ROOT, 'js', filename));
  } else if (urlPath.startsWith('/_next/static/css/')) {
    const filename = path.basename(urlPath);
    candidates.push(path.join(ROOT, '_next', 'static', 'css', filename));
    candidates.push(path.join(ROOT, 'css', filename));
  } else if (urlPath.startsWith('/_next/static/media/')) {
    const filename = path.basename(urlPath);
    candidates.push(path.join(ROOT, '_next', 'static', 'media', filename));
    candidates.push(path.join(ROOT, 'fonts', filename));
  } else if (urlPath.startsWith('/js/')) {
    const filename = path.basename(urlPath);
    candidates.push(path.join(ROOT, '_next', 'static', 'chunks', filename));
  } else if (urlPath.startsWith('/css/')) {
    const filename = path.basename(urlPath);
    candidates.push(path.join(ROOT, '_next', 'static', 'css', filename));
  }

  // Security: prevent path traversal
  for (const candidate of candidates) {
    if (!candidate.startsWith(ROOT)) continue;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return serveFile(res, candidate, urlPath);
    }
  }

  // For API calls (from the quiz), return empty 200 to prevent crashes
  if (urlPath.startsWith('/api/')) {
    console.log(`  [API stub] ${urlPath}`);
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end('{}');
    return;
  }

  // Fallback: serve index.html
  serveFile(res, path.join(ROOT, 'index.html'), urlPath);
});

server.listen(PORT, () => {
  console.log('');
  console.log('===========================================');
  console.log('  Servidor do Quiz Seca Jejum iniciado!');
  console.log('===========================================');
  console.log(`  Acesse: http://localhost:${PORT}`);
  console.log('  Pressione Ctrl+C para parar');
  console.log('===========================================');
  console.log('');
});
