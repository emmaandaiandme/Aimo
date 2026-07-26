/**
 * AIMO Music Bot Website — Static File Server
 * Run with: node server.js
 */

const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const { execSync } = require('child_process');

const PORT = process.env.PORT || 5000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico':  'image/x-icon',
  '.svg':  'image/svg+xml',
  '.txt':  'text/plain; charset=utf-8',
  '.mp3':  'audio/mpeg',
  '.ogg':  'audio/ogg',
  '.wav':  'audio/wav',
  '.zip':  'application/zip',
};

const ROUTES = {
  '/':         'index.html',
  '/features': 'features.html',
  '/commands': 'commands.html',
  '/premium':  'premium.html',
  '/updates':  'updates.html',
  '/terms':    'terms.html',
  '/privacy':  'privacy.html',
  '/support':  'support.html',
  '/status':   'status.html',
  '/docs':     'docs.html',
  '/owner':    'owner.html',
  '/invite':   null,
  '/discord':  null,
  '/vote':     null,
};

const INVITE_URL  = 'https://discord.com/oauth2/authorize?client_id=1466757680311042060&permissions=2151009280&scope=bot%20applications.commands';
const DISCORD_URL = 'https://discord.gg/2S2u3QE4Tr';
const VOTE_URL    = 'https://top.gg/bot/1483826024520089710';
const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1530579742401757295/yr7W5mBV9J0yxQUuwGutQKLrhQ0ufRjFseMs3958ifnCPYw5cZK6FBhJZzTDTvcj9z3l';
const BOT_AVATAR  = 'https://cdn.discordapp.com/avatars/1483826024520089710/a_auto.png';

/* ─── Lavalink config ─────────────────────────────────────────────────── */
// Override via environment variables: LAVALINK_HOST and LAVALINK_PASS
const LAVALINK_HOST = process.env.LAVALINK_HOST || 'wally.hidencloud.com:24620';
const LAVALINK_PASS = process.env.LAVALINK_PASS || 'glace';
// Endpoints fetched by the proxy:
//   GET /api/lavalink/stats  →  http://<LAVALINK_HOST>/v4/stats
//   GET /api/lavalink/info   →  http://<LAVALINK_HOST>/v4/info

/* ─── Active visitors tracker ────────────────────────────────────────── */
// Map of IP → { lastSeen: timestamp, page: string, country: string }
const activeVisitorMap = new Map();
const ACTIVE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function cleanOldVisitors() {
  const cutoff = Date.now() - ACTIVE_WINDOW_MS;
  for (const [ip, data] of activeVisitorMap) {
    if (data.lastSeen < cutoff) activeVisitorMap.delete(ip);
  }
}

function getActiveCount() {
  cleanOldVisitors();
  return activeVisitorMap.size;
}

/* ─── Server-side visitor logger ─────────────────────────────────────── */
const serverLogCache = new Map(); // IP+page → last-logged timestamp (60s dedup)

// Page view stats tracker (rolling 24h)
const pageViewStats = new Map(); // page → count (session only)

async function logServerVisitor(req, page) {
  try {
    const ip = ((req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress || '').split(',')[0] || '').trim() || 'Unknown';
    const ua = req.headers['user-agent'] || 'Unknown';
    const referer = req.headers['referer'] || req.headers['referrer'] || 'Direct';
    const lang = req.headers['accept-language'] || 'Unknown';

    // Deduplicate: same IP + page within 60s
    const cacheKey = ip + '|' + page;
    const lastLog = serverLogCache.get(cacheKey) || 0;
    if (Date.now() - lastLog < 60000) {
      // Still update active visitors even for deduplicated requests
      activeVisitorMap.set(ip, { lastSeen: Date.now(), page });
      return;
    }
    serverLogCache.set(cacheKey, Date.now());
    // Clean cache entries older than 5 min
    if (serverLogCache.size > 2000) {
      const cutoff = Date.now() - 300000;
      for (const [k, v] of serverLogCache) if (v < cutoff) serverLogCache.delete(k);
    }

    // Detect bot/crawler from UA
    const isBot = /bot|crawl|spider|scraper|curl|wget|python-requests|python\/|java\/|go-http|libwww|axios|node-fetch|facebookexternalhit|Twitterbot|Googlebot|bingbot|YandexBot|HeadlessChrome|PhantomJS|Selenium|Puppeteer|playwright/i.test(ua) || !ua || ua === 'Unknown';

    // Track active visitors (humans only)
    if (!isBot) {
      activeVisitorMap.set(ip, { lastSeen: Date.now(), page, country: '' });
    }

    // Track page views
    pageViewStats.set(page, (pageViewStats.get(page) || 0) + 1);

    // Geo lookup server-side using visitor's real IP
    let geo = {};
    try {
      const geoRes = await fetch(`https://ipwho.is/${ip}`, { signal: AbortSignal.timeout(5000) });
      const geoData = await geoRes.json();
      if (geoData && geoData.success) {
        geo = geoData;
        // Update country in active visitor map
        if (!isBot && activeVisitorMap.has(ip)) {
          const entry = activeVisitorMap.get(ip);
          entry.country = geo.country_code || '';
          activeVisitorMap.set(ip, entry);
        }
      }
    } catch(e) {
      try {
        const geoRes2 = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(5000) });
        const geoData2 = await geoRes2.json();
        if (geoData2 && !geoData2.error) {
          geo = { ip: geoData2.ip, country_name: geoData2.country_name, country_code: geoData2.country_code, city: geoData2.city, region: geoData2.region, postal: geoData2.postal, timezone: geoData2.timezone, org: geoData2.org || geoData2.isp, latitude: geoData2.latitude, longitude: geoData2.longitude };
        }
      } catch(e2) {}
    }

    const cc = (geo.country_code || '').toUpperCase();
    let flagEmoji = '';
    if (cc.length === 2) {
      try {
        flagEmoji = String.fromCodePoint(0x1F1E6 + (cc.charCodeAt(0) - 65)) +
                    String.fromCodePoint(0x1F1E6 + (cc.charCodeAt(1) - 65)) + ' ';
      } catch(e) {}
    }

    const lat = geo.latitude;
    const lon = geo.longitude;
    const mapsLink = (lat && lon)
      ? `[${lat}, ${lon}](https://maps.google.com/?q=${lat},${lon})`
      : 'Unknown';

    // Page view totals for context
    const totalViews = Array.from(pageViewStats.values()).reduce((a, b) => a + b, 0);
    const pageViews  = pageViewStats.get(page) || 1;
    const activeNow  = getActiveCount();

    const color = isBot ? 0xf59e0b : 0x7c3aed;

    // Build page-breakdown string (top 5)
    const topPages = [...pageViewStats.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([p, n]) => `\`${p}\` — **${n}**`)
      .join('\n') || '—';

    const payload = {
      username: isBot ? '🤖 AIMO Bot Detector' : '🌐 AIMO Visitor Log',
      avatar_url: BOT_AVATAR,
      embeds: [{
        title: isBot
          ? `🤖 Bot / Crawler Detected — \`${page}\``
          : `👁️ New Visitor — \`${page}\``,
        color,
        thumbnail: { url: BOT_AVATAR },
        fields: [
          { name: '🌐 IP Address',      value: `\`${ip}\``,                                                      inline: true },
          { name: '🌍 Country',          value: flagEmoji + (geo.country_name || 'Unknown'),                       inline: true },
          { name: '🏙️ City / Region',   value: `${geo.city || '—'}, ${geo.region || '—'}`.trim(),                inline: true },
          { name: '📮 Postal',           value: geo.postal    || '—',                                             inline: true },
          { name: '🕐 Timezone',         value: (typeof geo.timezone === 'object' ? geo.timezone.id : geo.timezone) || '—', inline: true },
          { name: '🏢 ISP / Org',        value: (geo.org || geo.connection?.org || '—').substring(0, 60),         inline: true },
          { name: '🗺️ Coordinates',      value: mapsLink,                                                         inline: true },
          { name: '📄 Page',             value: `\`${page}\``,                                                    inline: true },
          { name: '🔗 Referrer',         value: referer.length > 80 ? referer.substring(0,80)+'…' : referer,      inline: true },
          { name: '🗣️ Language',         value: lang.substring(0, 50),                                            inline: true },
          { name: '👥 Active Now',       value: `**${activeNow}** visitor${activeNow !== 1 ? 's' : ''}`,          inline: true },
          { name: '📊 Page Views',       value: `\`${page}\` → **${pageViews}** | Total: **${totalViews}**`,      inline: true },
          { name: isBot ? '🤖 Bot User Agent' : '🖥️ User Agent', value: '```\n' + ua.substring(0, 220) + '\n```', inline: false },
          { name: '📈 Top Pages (session)', value: topPages, inline: false },
        ],
        footer: { text: `AIMO Visitor Logger v4 · ${isBot ? '🤖 BOT' : '👤 Human'} · Active: ${activeNow} · ${new Date().toUTCString()}` },
        timestamp: new Date().toISOString()
      }]
    };

    // Fire-and-forget
    fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000)
    }).catch(() => {});

  } catch(e) {
    // Never crash the server for logging failures
  }
}

function serveFile(res, filePath) {
  const stat = fs.statSync(filePath, { throwIfNoEntry: false });
  if (!stat || !stat.isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('404 Not Found');
  }
  const ext  = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';

  // Support range requests for audio
  const size  = stat.size;
  const range = res._requestRange;
  if (range && ext === '.mp3') {
    const parts     = range.replace(/bytes=/, '').split('-');
    const start     = parseInt(parts[0], 10);
    const end       = parts[1] ? parseInt(parts[1], 10) : size - 1;
    const chunkSize = (end - start) + 1;
    const stream    = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      'Content-Range':  `bytes ${start}-${end}/${size}`,
      'Accept-Ranges':  'bytes',
      'Content-Length': chunkSize,
      'Content-Type':   mime,
    });
    stream.pipe(res);
    return;
  }

  res.writeHead(200, {
    'Content-Type':  mime,
    'Accept-Ranges': 'bytes',
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
  });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  let urlPath = req.url.split('?')[0].replace(/\/+$/, '') || '/';
  const query = new URL(req.url, 'http://localhost').searchParams;

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // ── Active users API ─────────────────────────────────────────────
  if (urlPath === '/api/active-users') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    cleanOldVisitors();
    const count = activeVisitorMap.size;
    // Build page distribution
    const pageDist = {};
    for (const [, data] of activeVisitorMap) {
      pageDist[data.page] = (pageDist[data.page] || 0) + 1;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ count, pages: pageDist, window: '5m' }));
  }

  // ── Visitor / Activity log proxy ──────────────────────────────────
  if (urlPath === '/api/log') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.writeHead(204); return res.end();
    }
    if (req.method !== 'POST') { res.writeHead(405); return res.end('Method Not Allowed'); }
    let body = '';
    req.on('data', c => { if (body.length < 100000) body += c; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const dc = await fetch(DISCORD_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(12000)
        });
        if (dc.status === 429) {
          const retry = dc.headers.get('retry-after') || '5';
          res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': retry });
          return res.end(JSON.stringify({ error: 'rate_limited', retry_after: Number(retry) }));
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, status: dc.status }));
      } catch(e) {
        console.error('[log proxy]', e.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ── Lavalink proxy (server-side to bypass browser CORS) ──────────
  if (urlPath === '/api/lavalink/stats' || urlPath === '/api/lavalink/info') {
    const endpoint = urlPath === '/api/lavalink/stats' ? '/v4/stats' : '/v4/info';
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.writeHead(204); return res.end();
    }
    try {
      const llRes = await fetch('http://' + LAVALINK_HOST + endpoint, {
        headers: { 'Authorization': LAVALINK_PASS },
        signal: AbortSignal.timeout(8000)
      });
      if (!llRes.ok) throw new Error('Lavalink returned ' + llRes.status);
      const data = await llRes.json();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(data));
    } catch (e) {
      console.error('[Lavalink proxy]', e.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // Redirect favicon.ico → logo.webp
  if (urlPath === '/favicon.ico') {
    res.writeHead(302, { Location: '/logo.webp' });
    return res.end();
  }

  if (urlPath === '/invite') {
    res.writeHead(302, { Location: INVITE_URL });
    return res.end();
  }
  if (urlPath === '/discord') {
    res.writeHead(302, { Location: DISCORD_URL });
    return res.end();
  }
  if (urlPath === '/vote') {
    res.writeHead(302, { Location: VOTE_URL });
    return res.end();
  }

  // ── Owner: list files ───────────────────────────────────────────
  if (urlPath === '/owner/files') {
    const pass = query.get('pass');
    if (pass !== '078') {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Unauthorized' }));
    }
    const SKIP_DIRS = new Set(['.git', '.cache', '.local', '.agents', 'attached_assets', 'node_modules', 'aimo-website-extracted']);
    function listFiles(dir, base) {
      const results = [];
      let entries;
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch(e) { return results; }
      for (const entry of entries) {
        if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
        const rel = base ? base + '/' + entry.name : entry.name;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) { results.push(...listFiles(full, rel)); }
        else {
          try {
            const st = fs.statSync(full);
            results.push({ file: rel, size: st.size, mtime: st.mtime.toISOString() });
          } catch(e) {}
        }
      }
      return results;
    }
    const files = listFiles(__dirname, '');
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify(files));
  }

  // ── Owner: download individual file ─────────────────────────────
  if (urlPath === '/owner/download-file') {
    const pass = query.get('pass');
    const file = query.get('file');
    if (pass !== '078') {
      res.writeHead(401, { 'Content-Type': 'text/plain' });
      return res.end('Unauthorized');
    }
    if (!file || file.includes('..') || file.startsWith('/') || file.startsWith('.')) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      return res.end('Invalid file path');
    }
    const dlPath = path.join(__dirname, file);
    const dlStat = fs.statSync(dlPath, { throwIfNoEntry: false });
    if (!dlStat || !dlStat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('File not found');
    }
    const ext2 = path.extname(dlPath).toLowerCase();
    const mime2 = MIME[ext2] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': mime2,
      'Content-Disposition': `attachment; filename="${path.basename(file)}"`,
      'Content-Length': dlStat.size,
      'Cache-Control': 'no-store',
    });
    return fs.createReadStream(dlPath).pipe(res);
  }

  // ── Owner ZIP download ──────────────────────────────────────────
  if (urlPath === '/owner/download') {
    const pass = query.get('pass');
    if (pass !== '078') {
      res.writeHead(401, { 'Content-Type': 'text/plain' });
      return res.end('Unauthorized');
    }
    try {
      const zipPath = '/tmp/aimo-website.zip';
      execSync(
        `cd "${__dirname}" && rm -f "${zipPath}" && zip -r "${zipPath}" . ` +
        `--exclude "*.zip" ` +
        `--exclude ".git/*" ` +
        `--exclude ".cache/*" ` +
        `--exclude ".local/*" ` +
        `--exclude ".agents/*" ` +
        `--exclude "attached_assets/*" ` +
        `--exclude "aimo-website-extracted/*" ` +
        `--exclude "node_modules/*"`,
        { timeout: 45000 }
      );
      const stat = fs.statSync(zipPath);
      res.writeHead(200, {
        'Content-Type':        'application/zip',
        'Content-Disposition': 'attachment; filename="aimo-website.zip"',
        'Content-Length':      stat.size,
        'Cache-Control':       'no-store',
      });
      fs.createReadStream(zipPath).pipe(res);
    } catch (e) {
      console.error('ZIP error:', e.message);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Failed to create ZIP: ' + e.message);
    }
    return;
  }

  // Store range header for audio streaming
  res._requestRange = req.headers.range;

  if (ROUTES[urlPath] !== undefined) {
    if (ROUTES[urlPath] === null) return;
    const filePath = path.join(__dirname, ROUTES[urlPath]);
    // Server-side visitor log for ALL HTML page visits (including bots)
    logServerVisitor(req, urlPath);
    return serveFile(res, filePath);
  }

  const staticPath = path.join(__dirname, decodeURIComponent(urlPath));
  if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
    if (path.extname(staticPath).toLowerCase() === '.html') {
      logServerVisitor(req, urlPath);
    }
    return serveFile(res, staticPath);
  }

  const htmlPath = staticPath + '.html';
  if (fs.existsSync(htmlPath)) {
    logServerVisitor(req, urlPath);
    return serveFile(res, htmlPath);
  }

  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>404 — AIMO</title>
  <link rel="stylesheet" href="/style.css">
  <style>body{display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:40px}</style>
  </head><body>
  <div>
    <h1 style="font-family:Poppins,sans-serif;font-size:3rem;font-weight:900;color:#7c3aed">404</h1>
    <p style="color:#64748b;margin:12px 0 24px">This page doesn't exist.</p>
    <a href="/" style="background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;padding:12px 28px;border-radius:100px;text-decoration:none;font-family:Poppins,sans-serif;font-weight:700">Back to Home</a>
  </div>
  </body></html>`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ AIMO Website running → http://0.0.0.0:${PORT}`);
  console.log(`📊 Server-side visitor tracking: ACTIVE`);
  console.log(`👥 Active users endpoint: /api/active-users`);
  console.log(`🔗 Webhook proxy: /api/log → Discord`);
});
