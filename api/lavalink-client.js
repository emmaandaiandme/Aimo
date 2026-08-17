const http = require('http');
const https = require('https');

function requestJson(url, password, timeoutMs = 8000) {
  const target = new URL(url);
  const transport = target.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const request = transport.request(target, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: password,
      },
    }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          const error = new Error(`Lavalink returned ${response.statusCode}`);
          error.statusCode = response.statusCode;
          reject(error);
          return;
        }

        try {
          resolve(JSON.parse(body));
        } catch (_) {
          reject(new Error('Lavalink returned invalid JSON'));
        }
      });
    });

    request.setTimeout(timeoutMs, () => {
      const error = new Error('Lavalink request timed out');
      error.code = 'ETIMEDOUT';
      request.destroy(error);
    });
    request.on('error', reject);
    request.end();
  });
}

module.exports = { requestJson };