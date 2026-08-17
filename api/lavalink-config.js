const fs = require('fs');
const path = require('path');

function getLavalinkConfig() {
  let settings = {};
  try {
    settings = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'settings.json'), 'utf8'));
  } catch (_) {}

  const configured = settings.lavalink || {};
  const host = process.env.LAVALINK_HOST || configured.host || 'zac.hidencloud.com:24719';
  const protocol = process.env.LAVALINK_PROTOCOL || configured.protocol || 'http';
  const baseUrl = (process.env.LAVALINK_URL || `${protocol}://${host}`).replace(/\/+$/, '');
  const restPath = `/${String(configured.restPath || '/v4').replace(/^\/+|\/+$/g, '')}`;

  return {
    baseUrl,
    password: process.env.LAVALINK_PASS || 'glace',
    infoPath: restPath + (configured.infoPath || '/info'),
    statsPath: restPath + (configured.statsPath || '/stats'),
  };
}

module.exports = { getLavalinkConfig };