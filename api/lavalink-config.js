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
  const configuredRestPath = process.env.LAVALINK_REST_PATH || configured.restPath || '/v4';
  const configuredUrl = process.env.LAVALINK_URL;
  let baseUrl;
  let restPath;

  if (configuredUrl) {
    /*
     * Accept either:
     *   LAVALINK_URL=https://audio.example.com
     *   LAVALINK_URL=https://audio.example.com/v4
     * This prevents accidentally requesting /v4/v4 when a secure proxy
     * exposes Lavalink below a path.
     */
    const url = new URL(configuredUrl);
    const urlPath = url.pathname.replace(/\/+$/, '');
    baseUrl = `${url.protocol}//${url.host}`;
    restPath = urlPath && urlPath !== '/'
      ? urlPath
      : `/${String(configuredRestPath).replace(/^\/+|\/+$/g, '')}`;
  } else {
    baseUrl = `${protocol}://${host}`.replace(/\/+$/, '');
    restPath = `/${String(configuredRestPath).replace(/^\/+|\/+$/g, '')}`;
  }

  return {
    baseUrl,
    password: process.env.LAVALINK_PASS || 'glace',
    infoPath: restPath + (configured.infoPath || '/info'),
    statsPath: restPath + (configured.statsPath || '/stats'),
  };
}

module.exports = { getLavalinkConfig };
