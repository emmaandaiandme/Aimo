const http = require('http');
const fs   = require('fs');
const path = require('path');
const url  = require('url');

const PORT           = 5000;
const DISCORD_SERVER = 'https://discord.gg/6jS5xDEZd';

const ROUTES = {
  '/':        'index.html',
  '/index':   'index.html',
  '/commands':'commands.html',
  '/premium': 'premium.html',
  '/privacy': 'privacy.html',
  '/terms':   'terms.html',
  '/updates': 'updates.html',
  '/discord': 'discord.html',
  '/invite':  'invite.html',
  '/vote':    'vote.html',
  '/owner':   'owner.html',
};

const PROTECTED = new Set([
  '/config.js',
  '/script.js',
  '/style.css',
  '/server.js',
]);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

function isDirectBrowserNav(req) {
  const dest   = req.headers['sec-fetch-dest'] || '';
  const accept = req.headers['accept'] || '';
  return dest === 'document' || (dest === '' && accept.includes('text/html'));
}

function serveFile(res, filePath, extraHeaders) {
  const ext  = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, Object.assign({ 'Content-Type': mime }, extraHeaders || {}));
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const pathname = (url.parse(req.url).pathname || '/').replace(/\/+$/, '') || '/';

  /* ── /download/:filename — force-download any project file ── */
  if (pathname.startsWith('/download/')) {
    const filename = path.basename(pathname.slice('/download/'.length));
    if (!filename) { res.writeHead(400); res.end(); return; }
    const fullPath = path.join(__dirname, filename);
    serveFile(res, fullPath, {
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return;
  }

  /* ── Block direct browser navigation to internal files ── */
  if (PROTECTED.has(pathname) && isDirectBrowserNav(req)) {
    res.writeHead(302, { Location: DISCORD_SERVER });
    res.end();
    return;
  }

  /* ── Route clean URLs → HTML files, then fall back to disk ── */
  const file     = ROUTES[pathname] || pathname.replace(/^\//, '');
  const fullPath = path.join(__dirname, file);
  serveFile(res, fullPath);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`AIMO server running on http://0.0.0.0:${PORT}`);
});
