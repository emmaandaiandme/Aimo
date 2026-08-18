/**
 * Vercel Serverless — /api/log
 * Proxies POST payloads to the Discord web  hook.
 * Set DISCORD_WEBHOOK in Vercel environment variables.
 * Fallback: hardcoded webhook URL (not recommended for production).
 */

const FALLBACK_WEBHOOK = 'https://discord.com/api/webhooks/1530579742401757295/yr7W5mBV9J0yxQUuwGutQKLrhQ0ufRjFseMs3958ifnCPYw5cZK6FBhJZzTDTvcj9z3l';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK || FALLBACK_WEBHOOK;

  try {
    const payload = req.body; // Vercel parses JSON body automatically

    const dc = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12000),
    });

    if (dc.status === 429) {
      const retryAfter = dc.headers.get('retry-after') || '5';
      return res.status(429).json({ error: 'rate_limited', retry_after: Number(retryAfter) });
    }

    return res.status(200).json({ ok: true, status: dc.status });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
