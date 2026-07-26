/**
 * Vercel Serverless — /api/lavalink/info
 * Proxies GET /v4/info from the Lavalink node.
 * Set LAVALINK_HOST and LAVALINK_PASS in Vercel environment variables.
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  const host = process.env.LAVALINK_HOST;
  const pass = process.env.LAVALINK_PASS;

  if (!host || !pass) {
    return res.status(500).json({ error: 'LAVALINK_HOST or LAVALINK_PASS env var not set' });
  }

  try {
    const upstream = await fetch(`http://${host}/v4/info`, {
      headers: { Authorization: pass },
      signal: AbortSignal.timeout(8000),
    });

    if (!upstream.ok) {
      return res.status(502).json({ error: `Lavalink returned ${upstream.status}` });
    }

    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
