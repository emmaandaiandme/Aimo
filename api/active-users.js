/**
 * Vercel Serverless — /api/active-users
 * Returns active visitor count from module-level in-memory map.
 * Note: resets on cold starts. Use Vercel KV for cross-instance persistence.
 */

const activeVisitorMap = new Map();
const ACTIVE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function cleanOldVisitors() {
  const cutoff = Date.now() - ACTIVE_WINDOW_MS;
  for (const [ip, data] of activeVisitorMap) {
    if (data.lastSeen < cutoff) activeVisitorMap.delete(ip);
  }
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  // Register caller as a visitor
  const ip = (
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    'unknown'
  ).split(',')[0].trim();

  const page = req.query.page || '/';
  const ua   = req.headers['user-agent'] || '';
  const isBot = /bot|crawl|spider|curl|wget|python|java|go-http|axios|node-fetch|HeadlessChrome/i.test(ua);

  if (!isBot && ip && ip !== 'unknown') {
    activeVisitorMap.set(ip, { lastSeen: Date.now(), page });
  }

  cleanOldVisitors();
  const count = activeVisitorMap.size;

  const pageDist = {};
  for (const [, data] of activeVisitorMap) {
    pageDist[data.page] = (pageDist[data.page] || 0) + 1;
  }

  return res.status(200).json({ count, pages: pageDist, window: '5m' });
}
