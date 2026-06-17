const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

const DISCORD_SERVER = 'https://discord.gg/6jS5xDEZd';
const INVITE_URL = 'https://discord.com/oauth2/authorize?client_id=1483826024520089710&permissions=8&integration_type=0&scope=bot';
const VOTE_URL = 'https://top.gg/bot/1483826024520089710/vote';

var visitStats = {
  total: 0,
  byCountry: {}
};

function isDirectBrowserNav(req) {
  var dest = req.headers['sec-fetch-dest'];
  if (dest) return dest === 'document' || dest === 'iframe' || dest === 'frame';
  var mode = req.headers['sec-fetch-mode'];
  if (mode) return mode === 'navigate';
  var accept = req.headers['accept'] || '';
  return accept.includes('text/html') && !accept.includes('text/css');
}

app.use(express.json({ limit: '16kb' }));

app.get('/server.js', function (req, res) {
  return res.redirect(302, DISCORD_SERVER);
});

['/script.js', '/cookie.js', '/style.css'].forEach(function (file) {
  app.get(file, function (req, res, next) {
    if (isDirectBrowserNav(req)) return res.redirect(302, DISCORD_SERVER);
    next();
  });
});

app.post('/api/visit', function (req, res) {
  var body = req.body || {};
  var cc = (body.country_code || 'XX').toString().toUpperCase().replace(/[^A-Z]/g, '').substring(0, 2);
  var cn = (body.country_name || 'Unknown').toString().substring(0, 60);
  var flag = (body.flag || '').toString().substring(0, 8);
  visitStats.total++;
  if (!visitStats.byCountry[cc]) {
    visitStats.byCountry[cc] = { count: 0, name: cn, flag: flag };
  }
  visitStats.byCountry[cc].count++;
  res.json({ ok: true, total: visitStats.total, countryCount: visitStats.byCountry[cc].count });
});

app.get('/api/stats', function (req, res) {
  var sorted = Object.entries(visitStats.byCountry)
    .sort(function (a, b) { return b[1].count - a[1].count; })
    .slice(0, 10)
    .map(function (e) { return { code: e[0], name: e[1].name, flag: e[1].flag, count: e[1].count }; });
  res.json({ total: visitStats.total, topCountries: sorted });
});

app.use(express.static(path.join(__dirname), {
  index: false,
  extensions: ['html']
}));

var routes = {
  '/':         'index.html',
  '/commands': 'commands.html',
  '/premium':  'premium.html',
  '/discord':  'discord.html',
  '/updates':  'updates.html',
  '/owner':    'owner.html',
  '/privacy':  'privacy.html',
  '/terms':    'terms.html',
  '/invite':   'invite.html',
  '/vote':     'vote.html'
};

for (var route in routes) {
  (function (r, f) {
    app.get(r, function (req, res) {
      res.sendFile(path.join(__dirname, f));
    });
  })(route, routes[route]);
}

app.use(function (req, res) {
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', function () {
  console.log('AIMO Music website running on port ' + PORT);
});
