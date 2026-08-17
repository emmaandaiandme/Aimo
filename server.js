/**
 * AIMO Music Bot Website — Static File Server
 * Run with: node server.js
 */

const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');
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
// The uploaded project already contained this private webhook. Keep the
// environment override for deployments, while retaining the original setup.
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK || 'https://discord.com/api/webhooks/1530579742401757295/yr7W5mBV9J0yxQUuwGutQKLrhQ0ufRjFseMs3958ifnCPYw5cZK6FBhJZzTDTvcj9z3l';
const BOT_AVATAR  = 'https://cdn.discordapp.com/avatars/1483826024520089710/a_auto.png';

/* ─── Lavalink config ─────────────────────────────────────────────────── */
let APP_SETTINGS = {};
let APP_SETTINGS_MTIME = 0;
function loadSettings() {
  const settingsPath = path.join(__dirname, 'settings.json');
  try {
    const mtime = fs.statSync(settingsPath).mtimeMs;
    if (!APP_SETTINGS_MTIME || mtime !== APP_SETTINGS_MTIME) {
      APP_SETTINGS = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      APP_SETTINGS_MTIME = mtime;
    }
  } catch (error) {
    console.error('[settings] unable to read settings.json:', error.message);
    if (!APP_SETTINGS || typeof APP_SETTINGS !== 'object') APP_SETTINGS = {};
  }
  return APP_SETTINGS;
}
loadSettings();
const LAVALINK_SETTINGS = APP_SETTINGS.lavalink || {};
// Override via environment variables: LAVALINK_URL, LAVALINK_HOST and LAVALINK_PASS.
const LAVALINK_HOST = process.env.LAVALINK_HOST || LAVALINK_SETTINGS.host || 'zac.hidencloud.com:24719';
const LAVALINK_PROTOCOL = process.env.LAVALINK_PROTOCOL || LAVALINK_SETTINGS.protocol || 'http';
const LAVALINK_PASS = process.env.LAVALINK_PASS || 'glace';
const LAVALINK_URL = (process.env.LAVALINK_URL || `${LAVALINK_PROTOCOL}://${LAVALINK_HOST}`).replace(/\/+$/, '');
const COUNTRY_CODES = {
  india: 'in',
  france: 'fr',
};
const COUNTRY_NAMES = {
  in: 'India',
  fr: 'France',
};
function normalizeCountryRules(countryBlock) {
  const names = new Set();
  const codes = new Set();
  const labels = [];
  const toEntries = value => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(/[,;\n]+/);
    return [];
  };

  for (const entry of toEntries(countryBlock.countries)) {
    const item = entry && typeof entry === 'object'
      ? { name: entry.name || '', code: entry.code || '' }
      : { name: String(entry || '').trim(), code: '' };
    const name = String(item.name || '').trim();
    const code = String(item.code || '').trim().toLowerCase();
    if (name) {
      const normalizedName = name.toLowerCase();
      names.add(normalizedName);
      labels.push(name);
      if (COUNTRY_CODES[normalizedName]) codes.add(COUNTRY_CODES[normalizedName]);
      if (/^[a-z]{2}$/i.test(name)) codes.add(normalizedName);
    }
    if (/^[a-z]{2}$/i.test(code)) codes.add(code);
  }
  for (const entry of toEntries(countryBlock.countryCodes)) {
    const code = String(entry || '').trim().toLowerCase();
    if (/^[a-z]{2}$/.test(code)) codes.add(code);
  }

  return { names, codes, labels: [...new Set(labels)] };
}
const ACCESS_RED = 0xef4444;
const LOG_VISITOR_ACTIVITY = process.env.LOG_VISITOR_ACTIVITY !== 'false';
function getPublicSettings() {
  const settings = loadSettings();
  return {
    announcement: settings.announcement || {},
    botVersion: settings.botVersion || '',
    maintenance: settings.maintenance || {},
    statusBanner: settings.statusBanner || {},
    socialLinks: settings.socialLinks || {},
    recentIncidents: Array.isArray(settings.recentIncidents) ? settings.recentIncidents : [],
  };
}

function getAccessConfig() {
  const settings = loadSettings();
  return settings.countryBlock || {};
}

function saveSettings(nextSettings) {
  const settingsPath = path.join(__dirname, 'settings.json');
  const tempPath = `${settingsPath}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(nextSettings, null, 2)}\n`, 'utf8');
  fs.renameSync(tempPath, settingsPath);
  APP_SETTINGS = nextSettings;
  APP_SETTINGS_MTIME = fs.statSync(settingsPath).mtimeMs;
  // A rule change must take effect for existing sessions too.
  blockedSessionMap.clear();
}

/* ─── Active visitors tracker ────────────────────────────────────────── */
// Map of IP → { lastSeen: timestamp, page: string, country: string }
const activeVisitorMap = new Map();
const ACTIVE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const blockedSessionMap = new Map();
const deniedLogCache = new Map();
const ACCESS_SESSION_COOKIE = 'AIMO_ACCESS_SID';
const ACCESS_BLOCK_COOKIE = 'AIMO_ACCESS_BLOCK';
const BLOCKED_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const ACCESS_SIGNING_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

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

function parseCookies(req) {
  const header = req.headers.cookie || '';
  return header.split(';').reduce((cookies, part) => {
    const index = part.indexOf('=');
    if (index === -1) return cookies;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) {
      try { cookies[key] = decodeURIComponent(value); } catch (_) { cookies[key] = value; }
    }
    return cookies;
  }, {});
}

function appendCookie(res, cookie) {
  const current = res.getHeader('Set-Cookie');
  const values = current ? (Array.isArray(current) ? current : [current]) : [];
  res.setHeader('Set-Cookie', values.concat(cookie));
}

function cookieHeader(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`;
}

function getAccessSessionId(req, res) {
  const cookies = parseCookies(req);
  const existing = cookies[ACCESS_SESSION_COOKIE];
  if (existing && /^[A-Za-z0-9_-]{16,100}$/.test(existing)) return existing;

  const sessionId = `SID-${crypto.randomUUID().replace(/-/g, '')}`;
  appendCookie(res, cookieHeader(ACCESS_SESSION_COOKIE, sessionId, 86400));
  return sessionId;
}

function createBlockToken(sessionId, country, expiresAt) {
  const payload = Buffer.from(JSON.stringify({
    sessionId,
    country: country.name || country.code || 'Unknown',
    code: country.code || '',
    reason: country.reason || '',
    expiresAt,
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', ACCESS_SIGNING_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function readBlockToken(req) {
  const token = parseCookies(req)[ACCESS_BLOCK_COOKIE];
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const expected = crypto.createHmac('sha256', ACCESS_SIGNING_SECRET).update(parts[0]).digest('base64url');
  const actualBuffer = Buffer.from(parts[1]);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  try {
    const data = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    if (!data.expiresAt || data.expiresAt <= Date.now()) return null;
    return {
      sessionId: data.sessionId,
      country: { name: data.country || data.code || 'Unknown', code: data.code || '' },
      reason: data.reason || '',
      expiresAt: data.expiresAt,
    };
  } catch (_) {
    return null;
  }
}

function getClientIp(req) {
  const forwarded =
    req.headers['x-replit-user-ip'] ||
    req.headers['true-client-ip'] ||
    req.headers['x-client-ip'] ||
    req.headers['x-real-ip'] ||
    req.headers['x-forwarded-for'] ||
    req.socket.remoteAddress ||
    '';
  return String(forwarded).split(',')[0].trim();
}

function countryFromTrustedHeaders(req) {
  const headers = [
    'x-replit-country',
    'x-vercel-ip-country',
    'cf-ipcountry',
    'x-country-code',
    'x-geo-country',
  ];
  for (const name of headers) {
    const value = String(req.headers[name] || '').trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(value) && value !== 'XX') {
      return { name: COUNTRY_NAMES[value.toLowerCase()] || value, code: value };
    }
  }
  return {};
}

function normalizeIp(ip) {
  return String(ip || '').trim().replace(/^::ffff:/i, '').toLowerCase();
}

function ipIsBlocked(ip, accessConfig) {
  const normalized = normalizeIp(ip);
  const blockedIps = Array.isArray(accessConfig.blockedIps) ? accessConfig.blockedIps : [];
  return normalized && blockedIps.some(entry => normalizeIp(entry) === normalized);
}

function isPrivateOrLocalIp(ip) {
  return !ip ||
    ip === 'unknown' ||
    ip === '::1' ||
    /^127\./.test(ip) ||
    /^10\./.test(ip) ||
    /^192\.168\./.test(ip) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    /^fc[0-9a-f]{2}:/i.test(ip) ||
    /^fe80:/i.test(ip);
}

async function lookupCountry(ip) {
  if (isPrivateOrLocalIp(ip)) return {};
  try {
    const response = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, { signal: AbortSignal.timeout(4000) });
    const data = await response.json();
    if (data && data.success) return {
      ip: data.ip || ip,
      name: data.country || '',
      code: String(data.country_code || '').toUpperCase(),
      region: data.region || '',
      city: data.city || '',
      postal: data.postal || '',
      timezone: data.timezone && (data.timezone.id || data.timezone) || '',
      org: data.connection && (data.connection.org || data.connection.isp) || '',
      latitude: data.latitude,
      longitude: data.longitude,
      security: data.security || {},
    };
  } catch (_) {}
  try {
    const response = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, { signal: AbortSignal.timeout(4000) });
    const data = await response.json();
    if (data && !data.error) return {
      ip: data.ip || ip,
      name: data.country_name || '',
      code: String(data.country_code || '').toUpperCase(),
      region: data.region || '',
      city: data.city || '',
      postal: data.postal || '',
      timezone: data.timezone || '',
      org: data.org || data.asn || '',
      latitude: data.latitude,
      longitude: data.longitude,
      security: data.security || {},
    };
  } catch (_) {}
  return {};
}

function vpnDetected(geo) {
  const security = geo && geo.security;
  if (!security || typeof security !== 'object') return false;
  return Boolean(security.vpn || security.proxy || security.tor || security.hosting ||
    security.is_cloud_provider || security.is_proxy || security.is_tor);
}

function vpnLabel(geo) {
  const security = geo && geo.security;
  if (!vpnDetected(geo)) return 'No VPN/proxy signal';
  const labels = [];
  if (security.vpn) labels.push('VPN');
  if (security.proxy || security.is_proxy) labels.push('proxy');
  if (security.tor || security.is_tor) labels.push('Tor');
  if (security.hosting || security.is_cloud_provider) labels.push('hosting/cloud');
  return labels.length ? labels.join(' + ') : 'VPN/proxy signal';
}

function deviceFromUserAgent(ua) {
  if (/bot|crawl|spider|scraper|headless|curl|wget|python|axios|node-fetch/i.test(ua)) return 'Bot / crawler';
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua) && /Mobile/i.test(ua)) {
    const model = ua.match(/Android[^;)]*;\s*(?:[a-z]{2}-[a-z]{2};\s*)?([^;)]+?)(?:\s+Build\/[^;)]+)?[;)]/i);
    return model && model[1] ? `Android phone · ${model[1].trim()}` : 'Android phone';
  }
  if (/Android/i.test(ua)) return 'Android tablet';
  if (/Windows NT 10/i.test(ua)) return 'Windows 10/11 PC';
  if (/Windows NT/i.test(ua)) return 'Windows PC';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'Mac';
  if (/CrOS/i.test(ua)) return 'Chromebook';
  if (/Linux/i.test(ua)) return 'Linux PC';
  return 'Desktop / device not disclosed';
}

function browserFromUserAgent(ua, clientHints) {
  const value = String(ua || '');
  const hints = String(clientHints || '');
  if (!value && !hints) return 'Browser not disclosed';
  const browsers = [
    [/HeadlessChrome\/([\d.]+)/i, 'Headless Chrome'],
    [/EdgA?\/([\d.]+)/i, 'Microsoft Edge'],
    [/OPR\/([\d.]+)/i, 'Opera'],
    [/YaBrowser\/([\d.]+)/i, 'Yandex Browser'],
    [/UCBrowser\/([\d.]+)/i, 'UC Browser'],
    [/Vivaldi\/([\d.]+)/i, 'Vivaldi'],
    [/SamsungBrowser\/([\d.]+)/i, 'Samsung Internet'],
    [/FxiOS\/([\d.]+)/i, 'Firefox iOS'],
    [/Firefox\/([\d.]+)/i, 'Firefox'],
    [/CriOS\/([\d.]+)/i, 'Chrome iOS'],
    [/Chrome\/([\d.]+)/i, 'Chrome'],
    [/Chromium\/([\d.]+)/i, 'Chromium'],
    [/Version\/([\d.]+).*Safari/i, 'Safari'],
    [/Googlebot\/([\d.]+)/i, 'Googlebot'],
  ];
  for (const [pattern, name] of browsers) {
    const match = `${value} ${hints}`.match(pattern);
    if (match) return `${name} ${match[1]}`;
  }
  if (/Mozilla\/5\.0/i.test(value) && !/Chrome|Safari|Firefox|Edg|OPR/i.test(value)) {
    return 'Browser not disclosed (privacy-reduced UA)';
  }
  return 'Browser not disclosed';
}

function osFromUserAgent(ua) {
  const value = String(ua || '');
  if (/Windows NT 10/i.test(value)) return 'Windows 10/11';
  if (/Windows NT/i.test(value)) return 'Windows';
  if (/Android/i.test(value)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(value)) return 'iOS';
  if (/Macintosh|Mac OS X/i.test(value)) return 'macOS';
  if (/CrOS/i.test(value)) return 'ChromeOS';
  if (/Linux/i.test(value)) return 'Linux';
  return 'OS not disclosed';
}

function fieldValue(value, max = 900) {
  const text = String(value || 'Unknown').replace(/[`]/g, "'");
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function sanitizeClientInfo(info) {
  const clean = value => fieldValue(value || 'Not reported', 180);
  return {
    browser: clean(info.browser),
    os: clean(info.os),
    screen: clean(info.screen),
    viewport: clean(info.viewport),
    cores: clean(info.cores),
    memory: clean(info.memory),
    language: clean(info.language),
    network: clean(info.network),
  };
}

async function deliverDiscordPayload(payload, label) {
  if (!DISCORD_WEBHOOK) {
    console.warn(`[${label}] webhook is not configured`);
    return false;
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(DISCORD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(6000),
      });
      if (response.ok) {
        console.log(`[${label}] Discord accepted payload (${response.status})`);
        return true;
      }
      if (response.status === 429 && attempt === 0) {
        const retryAfter = Number(response.headers.get('retry-after') || 1);
        await new Promise(resolve => setTimeout(resolve, Math.min(retryAfter * 1000, 3000)));
        continue;
      }
      console.error(`[${label}] Discord rejected payload (${response.status})`);
      return false;
    } catch (error) {
      if (attempt === 1) console.error(`[${label}] webhook request failed: ${error.message}`);
    }
  }
  return false;
}

async function logDeniedAccess({ req, sessionId, country, reason, page, clientInfo }) {
  const ua = String(req.headers['user-agent'] || 'Unknown');
  const countryLabel = country.name || country.code || 'Unknown';
  const ip = getClientIp(req) || 'Not available';
  const cacheKey = `${sessionId}|${countryLabel}|${reason}|${clientInfo ? 'client' : 'server'}`;
  const previous = deniedLogCache.get(cacheKey) || 0;
  if (Date.now() - previous < 60000) return;
  deniedLogCache.set(cacheKey, Date.now());

  const payload = {
    username: 'AIMO Access Control',
    avatar_url: BOT_AVATAR,
    embeds: [{
      title: '🚫 User access denied',
      color: ACCESS_RED,
      fields: [
        { name: 'Reason', value: fieldValue(reason), inline: false },
        { name: 'Country', value: fieldValue(countryLabel), inline: true },
        { name: 'Session ID', value: `\`${fieldValue(sessionId, 100)}\``, inline: true },
        { name: 'IP address', value: `\`${fieldValue(ip, 100)}\``, inline: true },
        { name: 'Device', value: fieldValue(deviceFromUserAgent(ua)), inline: true },
        { name: 'Browser', value: fieldValue(browserFromUserAgent(ua, req.headers['sec-ch-ua'])), inline: true },
        { name: 'VPN / proxy', value: fieldValue(vpnLabel(country)), inline: true },
        { name: 'Page', value: `\`${fieldValue(page, 100)}\``, inline: true },
        { name: 'User agent', value: `\`\`\`\n${fieldValue(ua, 220)}\n\`\`\``, inline: false },
        { name: 'Lavalink node', value: `\`${fieldValue(LAVALINK_HOST, 120)}\``, inline: false },
      ],
      footer: { text: 'AIMO · country access control' },
      timestamp: new Date().toISOString(),
    }],
  };

  if (clientInfo && typeof clientInfo === 'object') {
    const reported = sanitizeClientInfo(clientInfo);
    payload.embeds[0].title = '🚫 User access denied · device details';
    payload.embeds[0].fields.push(
      { name: 'Reported OS', value: fieldValue(reported.os), inline: true },
      { name: 'Reported browser', value: fieldValue(reported.browser), inline: true },
      { name: 'Screen / viewport', value: fieldValue(`${reported.screen} / ${reported.viewport}`), inline: true },
      { name: 'CPU / memory', value: fieldValue(`${reported.cores} / ${reported.memory}`), inline: true },
      { name: 'Language', value: fieldValue(reported.language), inline: true },
      { name: 'Network', value: fieldValue(reported.network), inline: true },
    );
  }
  await deliverDiscordPayload(payload, 'access denied');
}

function renderDeniedPage(res, country, reason) {
  const accessConfig = getAccessConfig();
  const delay = Math.max(1, Number(accessConfig.redirectDelaySeconds) || 7);
  const message = String(accessConfig.message || "This website isn't available in your country.");
  const safeMessage = message.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const safeCountry = fieldValue(country.name || country.code || 'Unknown', 100);
  const safeSupportUrl = JSON.stringify(accessConfig.supportServer || DISCORD_URL);

  res.writeHead(451, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  return res.end(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="light">
  <link rel="icon" type="image/webp" href="/logo.webp">
  <title>Access unavailable — AIMO</title>
  <style>
    :root { color-scheme: light; font-family: Inter, system-ui, sans-serif; }
    * { box-sizing: border-box; }
    html, body { background-color: #f7f5ff; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px;
      background: radial-gradient(circle at 15% 10%, #ffffff, #f7f5ff 65%, #fdf1f8); color: #1a1a2e; }
    main { width: min(100%, 560px); padding: 44px 36px; text-align: center; border: 1px solid #e8e0f8;
      border-radius: 24px; background: rgba(255,255,255,.96); box-shadow: 0 24px 80px rgba(92,58,160,.16); }
    .icon { width: 64px; height: 64px; margin: 0 auto 22px; display: grid; place-items: center;
      border-radius: 18px; background: linear-gradient(135deg, #7c3aed, #ec4899); color: white; font-size: 30px;
      box-shadow: 0 10px 24px rgba(124,58,237,.24); }
    .icon svg { width: 34px; height: 34px; }
    h1 { margin: 0 0 14px; font-size: clamp(1.7rem, 5vw, 2.35rem); }
    p { color: #64748b; line-height: 1.65; margin: 10px 0; }
    .country { color: #7c3aed; font-weight: 700; }
    .reason { color: #db2777; font-weight: 600; font-size: .88rem; }
    .count { margin: 26px 0 22px; font-size: .95rem; color: #64748b; }
    a { display: inline-block; padding: 12px 20px; border-radius: 999px; background: #dc2626;
      color: white; text-decoration: none; font-weight: 700; }
    a:hover { background: #7c3aed; }
  </style>
</head>
<body>
  <main>
    <div class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 20 6v5c0 5.2-3.3 8.6-8 10-4.7-1.4-8-4.8-8-10V6l8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-4.8"/></svg></div>
    <h1>${safeMessage}</h1>
    <p>Access from <span class="country">${safeCountry}</span> is currently restricted.</p>
    <p class="reason">${fieldValue(reason || 'Access policy restriction', 160)}</p>
    <p class="count">Redirecting to the AIMO support server in <strong id="count">${delay}</strong> seconds.</p>
    <a id="support" href="${safeSupportUrl}" rel="noopener">Open support server</a>
  </main>
  <script>
    (function () {
      var details = {
        browser: (navigator.userAgentData && navigator.userAgentData.brands
          ? navigator.userAgentData.brands.map(function (brand) { return brand.brand + ' ' + brand.version; }).join(', ')
          : navigator.userAgent),
        os: navigator.userAgentData && navigator.userAgentData.platform
          ? navigator.userAgentData.platform
          : navigator.platform,
        screen: window.screen ? window.screen.width + '×' + window.screen.height : 'Not reported',
        viewport: window.innerWidth + '×' + window.innerHeight,
        cores: navigator.hardwareConcurrency ? navigator.hardwareConcurrency + ' cores' : 'Not reported',
        memory: navigator.deviceMemory ? navigator.deviceMemory + ' GB RAM' : 'Not reported',
        language: navigator.language || 'Not reported',
        network: navigator.connection && navigator.connection.effectiveType
          ? navigator.connection.effectiveType.toUpperCase()
          : 'Not reported'
      };
      var detailsBody = JSON.stringify(details);
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/access-details', new Blob([detailsBody], { type: 'application/json' }));
        } else {
          fetch('/api/access-details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: detailsBody,
            keepalive: true
          });
        }
      } catch (_) {}

      var remaining = ${delay};
      var count = document.getElementById('count');
      var support = ${safeSupportUrl};
      var timer = setInterval(function () {
        remaining -= 1;
        if (count) count.textContent = String(Math.max(remaining, 0));
        if (remaining <= 0) {
          clearInterval(timer);
          window.location.assign(support);
        }
      }, 1000);
    }());
  </script>
</body>
</html>`);
}

function shouldGatePage(urlPath) {
  if (urlPath.startsWith('/api/')) return false;
  if (urlPath === '/favicon.ico') return false;
  if (ROUTES[urlPath] === null) return false;
  return ROUTES[urlPath] !== undefined || !path.extname(urlPath) || path.extname(urlPath).toLowerCase() === '.html';
}

async function enforceCountryAccess(req, res, urlPath) {
  const accessConfig = getAccessConfig();
  const rules = normalizeCountryRules(accessConfig);
  if (accessConfig.enabled !== true && !accessConfig.blockVpn && (!Array.isArray(accessConfig.blockedIps) || accessConfig.blockedIps.length === 0)) return true;

  const sessionId = getAccessSessionId(req, res);
  const ip = getClientIp(req);
  const signedBlock = readBlockToken(req);
  if (signedBlock && signedBlock.expiresAt > Date.now()) {
    const reason = signedBlock.reason || `Access blocked by policy.`;
    blockedSessionMap.set(sessionId, { country: signedBlock.country, reason, expiresAt: signedBlock.expiresAt });
    await logDeniedAccess({ req, sessionId, country: signedBlock.country, reason, page: urlPath });
    renderDeniedPage(res, signedBlock.country, reason);
    return false;
  }
  const previousBlock = blockedSessionMap.get(sessionId);
  if (previousBlock && previousBlock.expiresAt > Date.now()) {
    await logDeniedAccess({ req, sessionId, country: previousBlock.country, reason: previousBlock.reason, page: urlPath });
    renderDeniedPage(res, previousBlock.country, previousBlock.reason);
    return false;
  }

  const country = countryFromTrustedHeaders(req);
  const geo = await lookupCountry(ip);
  if (!country.code || !country.name) Object.assign(country, geo);
  const blockedIp = ipIsBlocked(ip, accessConfig);
  const vpnBlocked = accessConfig.blockVpn === true && vpnDetected(geo);
  const countryKey = String(country.name || country.code || '').toLowerCase();
  const countryBlocked = rules.names.has(countryKey) || rules.codes.has(String(country.code || '').toLowerCase());
  if (!blockedIp && !vpnBlocked && (!accessConfig.enabled || !countryBlocked)) return true;

  const reason = blockedIp
    ? 'Access blocked by owner IP policy.'
    : vpnBlocked
      ? `Access blocked because a VPN/proxy signal was detected (${vpnLabel(geo)}).`
      : `Access blocked by country policy. Restricted countries: ${rules.labels.join(', ')}.`;
  blockedSessionMap.set(sessionId, {
    country,
    reason,
    expiresAt: Date.now() + BLOCKED_SESSION_TTL_MS,
  });
  appendCookie(res, cookieHeader(
    ACCESS_BLOCK_COOKIE,
    createBlockToken(sessionId, { ...country, reason }, Date.now() + BLOCKED_SESSION_TTL_MS),
    86400,
  ));
  await logDeniedAccess({ req, sessionId, country, reason, page: urlPath });
  renderDeniedPage(res, country, reason);
  return false;
}

/* ─── Server-side visitor logger ─────────────────────────────────────── */
const serverLogCache = new Map(); // IP+page → last-logged timestamp (60s dedup)

// Page view stats tracker (rolling 24h)
const pageViewStats = new Map(); // page → count (session only)

async function logServerVisitor(req, page) {
  try {
    const ip = getClientIp(req) || 'Not available';
    const ua = req.headers['user-agent'] || '';
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
    if (!LOG_VISITOR_ACTIVITY) return;

    const geo = await lookupCountry(ip);
    const cc = String(geo.code || '').toUpperCase();
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
      : 'Coordinates not available';

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
          { name: '🌍 Country',          value: flagEmoji + (geo.name || 'Country not available'),                 inline: true },
          { name: '🏙️ City / Region',   value: `${geo.city || 'Location not available'}, ${geo.region || '—'}`.trim(), inline: true },
          { name: '📮 Postal',           value: geo.postal    || 'Not available',                                 inline: true },
          { name: '🕐 Timezone',         value: geo.timezone || 'Not available',                                  inline: true },
          { name: '🏢 ISP / Org',        value: (geo.org || 'Organization not available').substring(0, 60),       inline: true },
          { name: '🛡️ VPN / proxy',      value: vpnLabel(geo),                                                     inline: true },
          { name: '🗺️ Coordinates',      value: mapsLink,                                                         inline: true },
          { name: '📄 Page',             value: `\`${page}\``,                                                    inline: true },
          { name: '🔗 Referrer',         value: referer.length > 80 ? referer.substring(0,80)+'…' : referer,      inline: true },
          { name: '🗣️ Language',         value: lang.substring(0, 50),                                            inline: true },
          { name: '👥 Active Now',       value: `**${activeNow}** visitor${activeNow !== 1 ? 's' : ''}`,          inline: true },
          { name: '📊 Page Views',       value: `\`${page}\` → **${pageViews}** | Total: **${totalViews}**`,      inline: true },
          { name: '🌐 Browser',           value: browserFromUserAgent(ua, req.headers['sec-ch-ua']),                inline: true },
          { name: '💻 OS',                value: osFromUserAgent(ua),                                               inline: true },
          { name: '📲 Device',            value: deviceFromUserAgent(ua),                                          inline: true },
          { name: isBot ? '🤖 Bot User Agent' : '🖥️ User Agent', value: '```\n' + (ua || 'User agent not disclosed').substring(0, 220) + '\n```', inline: false },
          { name: '📈 Top Pages (session)', value: topPages, inline: false },
        ],
        footer: { text: `AIMO Visitor Logger v4 · ${isBot ? '🤖 BOT' : '👤 Human'} · Active: ${activeNow} · ${new Date().toUTCString()}` },
        timestamp: new Date().toISOString()
      }]
    };

    await deliverDiscordPayload(payload, 'visitor log');

  } catch(e) {
    // Never crash the server for logging failures
  }
}

function readRequestBody(req, maxBytes = 100000) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      if (body.length <= maxBytes) body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function ownerAuthorized(query, body = {}) {
  return query.get('pass') === '078' || body.pass === '078';
}

function ownerAccessSnapshot() {
  const access = getAccessConfig();
  return {
    enabled: access.enabled === true,
    blockVpn: access.blockVpn === true,
    countries: Array.isArray(access.countries) ? access.countries : [],
    countryCodes: Array.isArray(access.countryCodes) ? access.countryCodes : [],
    blockedIps: Array.isArray(access.blockedIps) ? access.blockedIps : [],
    activeVisitors: getActiveCount(),
    updatedAt: new Date().toISOString(),
  };
}

async function sendClientDetailsLog(req, page, info) {
  const ip = getClientIp(req) || 'Not available';
  const geo = await lookupCountry(ip);
  const client = sanitizeClientInfo(info || {});
  const payload = {
    username: '🧰 AIMO System Details',
    avatar_url: BOT_AVATAR,
    embeds: [{
      title: `🧰 Visitor system details · \`${fieldValue(page, 100)}\``,
      color: 0x2563eb,
      fields: [
        { name: '🌐 IP address', value: `\`${fieldValue(ip, 100)}\``, inline: true },
        { name: '🌍 Location', value: fieldValue(geo.name || 'Location not available'), inline: true },
        { name: '🛡️ VPN / proxy', value: fieldValue(vpnLabel(geo)), inline: true },
        { name: '🌐 Browser', value: fieldValue(client.browser), inline: true },
        { name: '💻 OS', value: fieldValue(client.os), inline: true },
        { name: '🖥️ Screen', value: fieldValue(client.screen), inline: true },
        { name: '🔲 Viewport', value: fieldValue(client.viewport), inline: true },
        { name: '⚙️ CPU', value: fieldValue(client.cores), inline: true },
        { name: '💾 Memory', value: fieldValue(client.memory), inline: true },
        { name: '📶 Network', value: fieldValue(client.network), inline: true },
        { name: '🗣️ Language', value: fieldValue(client.language), inline: true },
        { name: '📄 Page', value: `\`${fieldValue(page, 100)}\``, inline: true },
        { name: '📝 User agent', value: '```\n' + fieldValue(req.headers['user-agent'] || 'User agent not disclosed', 220) + '\n```', inline: false },
      ],
      footer: { text: 'AIMO · client-reported system details' },
      timestamp: new Date().toISOString(),
    }],
  };
  return deliverDiscordPayload(payload, 'system details');
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

  // ── Public settings used by the status page ───────────────────────
  if (urlPath === '/api/settings') {
    res.setHeader('Cache-Control', 'no-store');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(getPublicSettings()));
  }

  // ── Client system details and denied-access enrichment ────────────
  if (urlPath === '/api/access-details' || urlPath === '/api/visitor-details') {
    if (req.method !== 'POST') { res.writeHead(405); return res.end('Method Not Allowed'); }
    try {
      const info = JSON.parse(await readRequestBody(req));
      const sessionId = getAccessSessionId(req, res);
      if (urlPath === '/api/access-details') {
        const blocked = blockedSessionMap.get(sessionId) || readBlockToken(req);
        if (blocked) {
          await logDeniedAccess({
            req,
            sessionId,
            country: blocked.country || { name: 'Restricted' },
            reason: blocked.reason || 'Access policy restriction',
            page: req.headers.referer || '/blocked',
            clientInfo: info,
          });
        }
      } else {
        await sendClientDetailsLog(req, req.headers.referer ? new URL(req.headers.referer).pathname : '/', info);
      }
      res.writeHead(204);
      return res.end();
    } catch (error) {
      console.error(`[${urlPath}]`, error.message);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid details payload' }));
    }
  }

  // ── Owner: live access-control management ─────────────────────────
  if (urlPath === '/api/owner/access') {
    if (req.method === 'GET') {
      if (!ownerAuthorized(query)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Unauthorized' }));
      }
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      return res.end(JSON.stringify(ownerAccessSnapshot()));
    }
    if (req.method !== 'POST') { res.writeHead(405); return res.end('Method Not Allowed'); }
    try {
      const body = JSON.parse(await readRequestBody(req));
      if (!ownerAuthorized(query, body)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Unauthorized' }));
      }
      const nextSettings = loadSettings();
      const access = { ...(nextSettings.countryBlock || {}) };
      access.countries = Array.isArray(access.countries) ? [...access.countries] : [];
      access.countryCodes = Array.isArray(access.countryCodes) ? [...access.countryCodes] : [];
      access.blockedIps = Array.isArray(access.blockedIps) ? [...access.blockedIps] : [];
      const value = String(body.value || '').trim();
      const normalized = value.toLowerCase();
      if (body.action === 'add-country' && value) {
        if (!access.countries.some(item => String(item && item.name || item).toLowerCase() === normalized)) {
          access.countries.push(value);
        }
        if (/^[a-z]{2}$/i.test(value) && !access.countryCodes.some(code => String(code).toLowerCase() === normalized)) {
          access.countryCodes.push(value.toUpperCase());
        }
      } else if (body.action === 'remove-country' && value) {
        access.countries = access.countries.filter(item => String(item && item.name || item).toLowerCase() !== normalized);
        access.countryCodes = access.countryCodes.filter(code => String(code).toLowerCase() !== normalized);
      } else if (body.action === 'add-ip' && value && /^[0-9a-f:.]+$/i.test(value)) {
        if (!access.blockedIps.some(ip => normalizeIp(ip) === normalizeIp(value))) access.blockedIps.push(value);
      } else if (body.action === 'remove-ip' && value) {
        access.blockedIps = access.blockedIps.filter(ip => normalizeIp(ip) !== normalizeIp(value));
      } else if (body.action === 'toggle-vpn') {
        access.blockVpn = body.enabled === true;
      } else if (body.action === 'toggle-enabled') {
        access.enabled = body.enabled === true;
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Unknown access-control action' }));
      }
      nextSettings.countryBlock = access;
      saveSettings(nextSettings);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      return res.end(JSON.stringify({ ok: true, access: ownerAccessSnapshot() }));
    } catch (error) {
      console.error('[owner access]', error.message);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid access-control request' }));
    }
  }

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
    if (!DISCORD_WEBHOOK) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Webhook logging is not configured.' }));
    }
    try {
      const payload = JSON.parse(await readRequestBody(req));
      const ok = await deliverDiscordPayload(payload, 'browser log');
      if (!ok) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Discord webhook rejected the event' }));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true }));
    } catch (error) {
      console.error('[log proxy]', error.message);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid webhook payload' }));
    }
  }

  // ── Lavalink proxy (server-side to bypass browser CORS) ──────────
  if (urlPath === '/api/lavalink/stats' || urlPath === '/api/lavalink/info') {
    if (!(await enforceCountryAccess(req, res, urlPath))) return;

    const endpoint = (LAVALINK_SETTINGS.restPath || '/v4') +
      (urlPath === '/api/lavalink/stats'
        ? (LAVALINK_SETTINGS.statsPath || '/stats')
        : (LAVALINK_SETTINGS.infoPath || '/info'));
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.writeHead(204); return res.end();
    }
    try {
      const llRes = await fetch(LAVALINK_URL + endpoint, {
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

  if (shouldGatePage(urlPath) && !(await enforceCountryAccess(req, res, urlPath))) return;

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
