const { getLavalinkConfig } = require('./lavalink-config');
const { requestJson } = require('./lavalink-client');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { baseUrl, password, infoPath } = getLavalinkConfig();

  try {
    const data = await requestJson(`${baseUrl}${infoPath}`, password);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({
      error: err.statusCode ? err.message : 'Lavalink request failed',
      code: err.statusCode ? undefined : (err.code || 'UPSTREAM_UNREACHABLE'),
    });
  }
};
