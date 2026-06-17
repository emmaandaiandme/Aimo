(function () {

  /* ═══════════════════════════════════════════════
     DISCORD WEBHOOK — VISITOR LOGGER
  ═══════════════════════════════════════════════ */
  var WEBHOOK = 'https://discord.com/api/webhooks/1493159705281953852/bna3L4mZDbvlTLb9UXJUCM3LB0TziJOEhsG0sghKMNvJfZz3M68q92HRcF-7sDfJDl1X';

  function detectBrowser(ua) {
    if (/Edg\//i.test(ua))              return 'Microsoft Edge';
    if (/OPR\/|Opera/i.test(ua))        return 'Opera';
    if (/SamsungBrowser/i.test(ua))     return 'Samsung Browser';
    if (/YaBrowser/i.test(ua))          return 'Yandex Browser';
    if (/UCBrowser/i.test(ua))          return 'UC Browser';
    if (/CriOS/i.test(ua))             return 'Chrome (iOS)';
    if (/FxiOS/i.test(ua))             return 'Firefox (iOS)';
    if (/Firefox/i.test(ua))           return 'Firefox';
    if (/Brave/i.test(ua))             return 'Brave';
    if (/DuckDuckGo/i.test(ua))        return 'DuckDuckGo';
    if (/Vivaldi/i.test(ua))           return 'Vivaldi';
    if (/Chrome/i.test(ua))            return 'Chrome';
    if (/Safari/i.test(ua))            return 'Safari';
    if (/MSIE|Trident/i.test(ua))      return 'Internet Explorer';
    if (/HeadlessChrome/i.test(ua))    return 'Headless Chrome';
    return 'Unknown';
  }

  function detectOS(ua) {
    if (/Windows NT 10\.0/i.test(ua))  return 'Windows 10 / 11';
    if (/Windows NT 6\.3/i.test(ua))   return 'Windows 8.1';
    if (/Windows NT 6\.2/i.test(ua))   return 'Windows 8';
    if (/Windows NT 6\.1/i.test(ua))   return 'Windows 7';
    if (/Windows NT 6\.0/i.test(ua))   return 'Windows Vista';
    if (/Windows NT 5/i.test(ua))      return 'Windows XP';
    if (/Windows/i.test(ua))           return 'Windows';
    var macVer = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/i);
    if (macVer)                         return 'macOS ' + macVer[1].replace(/_/g, '.');
    var iosVer = ua.match(/OS (\d+[._]\d+[._]?\d*) like Mac/i);
    if (iosVer)                         return 'iOS ' + iosVer[1].replace(/_/g, '.');
    if (/iPhone|iPad|iPod/i.test(ua))  return 'iOS';
    var andVer = ua.match(/Android (\d+\.?\d*)/i);
    if (andVer)                         return 'Android ' + andVer[1];
    if (/Android/i.test(ua))           return 'Android';
    if (/CrOS/i.test(ua))              return 'Chrome OS';
    if (/Ubuntu/i.test(ua))            return 'Ubuntu Linux';
    if (/Fedora/i.test(ua))            return 'Fedora Linux';
    if (/Debian/i.test(ua))            return 'Debian Linux';
    if (/Linux/i.test(ua))             return 'Linux';
    if (/Tizen/i.test(ua))             return 'Tizen (Samsung TV)';
    if (/webOS/i.test(ua))             return 'webOS (LG TV)';
    if (/FreeBSD/i.test(ua))           return 'FreeBSD';
    return 'Unknown';
  }

  function detectDevice(ua) {
    var w = screen.width, h = screen.height;
    var maxDim = Math.max(w, h), minDim = Math.min(w, h);
    var hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    var isBot = /HeadlessChrome/i.test(ua) || navigator.webdriver ||
      /bot|crawl|spider|scraper|curl|wget|python-requests|java\/|go-http|libwww|axios|node-fetch|facebookexternalhit|Twitterbot|Googlebot|bingbot/i.test(ua);

    if (isBot)                          return '🤖 Bot / Crawler';
    if (/PlayStation 5/i.test(ua))      return '🎮 PlayStation 5';
    if (/PlayStation 4|PlayStation/i.test(ua)) return '🎮 PlayStation 4';
    if (/Xbox Series/i.test(ua))        return '🎮 Xbox Series X/S';
    if (/Xbox/i.test(ua))               return '🎮 Xbox';
    if (/Nintendo Switch/i.test(ua))    return '🎮 Nintendo Switch';
    if (/Nintendo/i.test(ua))           return '🎮 Nintendo';
    if (/SmartTV|SMART-TV|Tizen|HbbTV|BRAVIA|NetCast|NETCAST/i.test(ua)) return '📺 Smart TV';
    if (/webOS/i.test(ua))              return '📺 LG Smart TV';
    if (/Roku/i.test(ua))               return '📺 Roku';
    if (/Oculus|Quest/i.test(ua))       return '🥽 VR Headset';
    if (/CrOS/i.test(ua))               return '💻 Chromebook';

    var isIPad = /iPad/i.test(ua) || (/Macintosh/i.test(ua) && hasTouch && maxDim <= 1366);
    if (isIPad)                         return '📟 iPad';
    if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return '📟 Android Tablet';
    if (/Tablet/i.test(ua))             return '📟 Tablet';
    if (hasTouch && minDim >= 600 && maxDim <= 1400 && !/iPhone|iPod|Android.*Mobile/i.test(ua)) return '📟 Tablet';

    if (/iPhone/i.test(ua))             return '📱 iPhone';
    if (/iPod/i.test(ua))               return '📱 iPod Touch';
    if (/Android.*Mobile/i.test(ua))    return '📱 Android Phone';
    if (/Mobi/i.test(ua) || (hasTouch && maxDim < 768)) return '📱 Mobile Phone';

    if (/Macintosh|Mac OS X/i.test(ua)) return '🍎 Mac';
    if (/Windows NT/i.test(ua))         return '🖥️ Windows PC';
    if (/Ubuntu|Fedora|Debian|Linux/i.test(ua)) return '🐧 Linux PC';
    if (/FreeBSD/i.test(ua))            return '🐡 FreeBSD';

    return '🖥️ Desktop';
  }

  function getNetworkInfo() {
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return 'N/A';
    var parts = [];
    if (conn.effectiveType) parts.push(conn.effectiveType.toUpperCase());
    if (conn.downlink)      parts.push(conn.downlink + ' Mbps');
    if (conn.rtt)           parts.push('RTT ' + conn.rtt + 'ms');
    if (conn.saveData)      parts.push('Data Saver ON');
    return parts.length ? parts.join(' · ') : 'N/A';
  }

  function getMemory() {
    var mem = navigator.deviceMemory;
    return mem ? mem + ' GB RAM' : 'N/A';
  }

  function getCores() {
    var c = navigator.hardwareConcurrency;
    return c ? c + ' cores' : 'N/A';
  }

  function getViewport() {
    return window.innerWidth + '×' + window.innerHeight;
  }

  function getTouchInfo() {
    var hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    var points = navigator.maxTouchPoints || 0;
    return hasTouch ? '✅ Yes (' + points + ' points)' : '❌ No';
  }

  function getVisitCount() {
    var n = parseInt(localStorage.getItem('aimo_visits') || '0') + 1;
    localStorage.setItem('aimo_visits', String(n));
    return n;
  }

  function getSessionId() {
    var id = sessionStorage.getItem('aimo_sid');
    if (!id) {
      var ts  = Date.now().toString(36).toUpperCase();
      var rnd = Math.random().toString(36).substring(2, 8).toUpperCase();
      id = 'SID-' + ts + '-' + rnd;
      sessionStorage.setItem('aimo_sid', id);
    }
    return id;
  }

  function getPixelRatio() {
    return (window.devicePixelRatio || 1).toFixed(2) + 'x';
  }

  function getPageTitle() {
    return document.title || 'Unknown';
  }

  function getBrowserPlugins() {
    var p = navigator.plugins;
    if (!p || !p.length) return 'None / Blocked';
    var names = [];
    for (var i = 0; i < Math.min(p.length, 5); i++) names.push(p[i].name);
    return names.join(', ') + (p.length > 5 ? ' +' + (p.length - 5) + ' more' : '');
  }

  function sendWebhook(geo, battery) {
    var ua      = navigator.userAgent;
    var browser = detectBrowser(ua);
    var os      = detectOS(ua);
    var device  = detectDevice(ua);
    var visits  = getVisitCount();
    var sid     = getSessionId();
    var now     = new Date().toISOString();
    var page    = window.location.pathname || '/';
    var ref     = document.referrer || 'Direct / None';
    var title   = getPageTitle();

    var battLevel   = (battery && battery.level  !== undefined) ? Math.round(battery.level * 100) + '%' : 'N/A';
    var battCharge  = (battery && battery.charging !== undefined) ? (battery.charging ? '⚡ Charging' : '🔋 On Battery') : 'N/A';
    var battTimeRaw = battery ? (battery.charging ? battery.chargingTime : battery.dischargingTime) : null;
    var battTime    = 'N/A';
    if (battTimeRaw !== null && battTimeRaw !== undefined && isFinite(battTimeRaw)) {
      var mins = Math.floor(battTimeRaw / 60);
      battTime = mins >= 60 ? Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm' : mins + ' min';
    }

    var flagEmoji = '';
    var cc = (geo.country_code || '').toUpperCase();
    if (cc.length === 2) {
      flagEmoji = String.fromCodePoint(0x1F1E6 + (cc.charCodeAt(0) - 65)) +
                  String.fromCodePoint(0x1F1E6 + (cc.charCodeAt(1) - 65)) + ' ';
    }

    var mapsLink = (geo.latitude && geo.longitude)
      ? '[' + geo.latitude + ', ' + geo.longitude + '](https://maps.google.com/?q=' + geo.latitude + ',' + geo.longitude + ')'
      : 'Unknown';

    var footerTag = '🆔 ' + sid + ' · AIMO Logger';

    var embeds = [
      {
        title: '🌐 Geo & Network Log',
        color: 0x7c3aed,
        fields: [
          { name: '🌐 IP Address',    value: '`' + (geo.ip || 'Unknown') + '`',              inline: true },
          { name: '🌍 Country',       value: flagEmoji + (geo.country_name || 'Unknown'),     inline: true },
          { name: '📍 Region',        value: geo.region    || 'Unknown',                      inline: true },
          { name: '🏙️ City',          value: geo.city      || 'Unknown',                      inline: true },
          { name: '📮 Postal Code',   value: geo.postal    || 'Unknown',                      inline: true },
          { name: '🕐 Timezone',      value: geo.timezone  || 'Unknown',                      inline: true },
          { name: '🏢 ISP / Org',     value: (geo.org || 'Unknown').substring(0, 80),         inline: false },
          { name: '🗺️ Coordinates',   value: mapsLink,                                        inline: true },
          { name: '🔑 Session ID',    value: '`' + sid + '`',                                 inline: false }
        ],
        footer: { text: footerTag },
        timestamp: now
      },
      {
        title: '👤 Visitor Session',
        color: 0xec4899,
        fields: [
          { name: '🌐 Browser',         value: browser,                                         inline: true },
          { name: '💻 OS',              value: os,                                              inline: true },
          { name: '🗣️ Language',        value: navigator.language || 'Unknown',                 inline: true },
          { name: '🌐 All Languages',   value: (navigator.languages || [navigator.language || 'N/A']).join(', ').substring(0, 60), inline: true },
          { name: '📺 Screen Res',      value: screen.width + '×' + screen.height,              inline: true },
          { name: '🔲 Viewport',        value: getViewport(),                                   inline: true },
          { name: '🔍 Pixel Ratio',     value: getPixelRatio(),                                 inline: true },
          { name: '🎨 Colour Depth',    value: screen.colorDepth + ' bit',                      inline: true },
          { name: '🔁 Visit #',         value: String(visits),                                  inline: true },
          { name: '📄 Page',            value: '`' + page + '`',                               inline: true },
          { name: '📝 Page Title',      value: title.substring(0, 80),                          inline: true },
          { name: '🔗 Referrer',        value: ref.length > 80 ? ref.substring(0, 80) + '…' : ref, inline: false },
          { name: '⏱️ Local Time',      value: new Date().toLocaleString(),                     inline: true },
          { name: '🕐 UTC Time',        value: new Date().toUTCString(),                        inline: false }
        ],
        footer: { text: footerTag },
        timestamp: now
      },
      {
        title: '📱 Device & Hardware',
        color: 0x3b82f6,
        fields: [
          { name: '📲 Device Type',     value: device,                                          inline: true },
          { name: '🖥️ Platform',        value: navigator.platform || 'Unknown',                 inline: true },
          { name: '💾 RAM',             value: getMemory(),                                     inline: true },
          { name: '⚙️ CPU Cores',       value: getCores(),                                      inline: true },
          { name: '🔋 Battery Level',   value: battLevel,                                       inline: true },
          { name: '⚡ Power Status',    value: battCharge,                                      inline: true },
          { name: '⏳ Battery Time',    value: battTime,                                        inline: true },
          { name: '📡 Online Status',   value: navigator.onLine ? '✅ Online' : '❌ Offline',  inline: true },
          { name: '📶 Network',         value: getNetworkInfo(),                                inline: true },
          { name: '👆 Touch Support',   value: getTouchInfo(),                                  inline: true },
          { name: '🍪 Cookies',         value: navigator.cookieEnabled ? '✅ Enabled' : '❌ Disabled', inline: true },
          { name: '🚫 Do Not Track',    value: navigator.doNotTrack === '1' ? '✅ On' : '❌ Off', inline: true },
          { name: '🔌 Plugins',         value: getBrowserPlugins(),                             inline: false },
          { name: '📝 User Agent',      value: '```\n' + ua.substring(0, 256) + '\n```',       inline: false }
        ],
        footer: { text: footerTag },
        timestamp: now
      }
    ];

    fetch('/api/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country_code: cc || 'XX', country_name: geo.country_name || 'Unknown', flag: flagEmoji.trim() })
    })
    .then(function (r) { return r.json(); })
    .then(function (stats) {
      var globalTotal  = stats.total       || 0;
      var countryCount = stats.countryCount || 0;

      embeds.push({
        title: '🌍 Global Visitor Stats',
        color: 0x22c55e,
        description: '> Live counter — resets on server restart',
        fields: [
          { name: '🌐 Total Visits (All Countries)',               value: '**' + globalTotal + '**',  inline: true },
          { name: flagEmoji.trim() + ' Visits from ' + (geo.country_name || cc || 'Unknown'), value: '**' + countryCount + '**', inline: true },
          { name: '🗺️ This Visitor\'s Country',                   value: flagEmoji + (geo.country_name || 'Unknown') + (cc ? ' (`' + cc + '`)' : ''), inline: false }
        ],
        footer: { text: footerTag + ' · server-side counter' },
        timestamp: now
      });

      fetch(WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'AIMO Visitor Log', avatar_url: 'https://cdn.discordapp.com/avatars/1483826024520089710/a_auto.png', embeds: embeds })
      }).catch(function () {});
    })
    .catch(function () {
      fetch(WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'AIMO Visitor Log', embeds: embeds })
      }).catch(function () {});
    });
  }

  function normalizeIpApi(d) {
    return {
      ip: d.query,
      country_name: d.country,
      country_code: d.countryCode,
      region: d.regionName,
      city: d.city,
      postal: d.zip,
      timezone: d.timezone,
      org: (d.org || d.isp || ''),
      latitude: d.lat,
      longitude: d.lon
    };
  }

  function logVisitor() {
    if (sessionStorage.getItem('aimo_logged')) return;
    sessionStorage.setItem('aimo_logged', '1');

    var geoPromise = fetch('https://ipapi.co/json/')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.error || !d.ip) throw new Error('blocked');
        return d;
      })
      .catch(function () {
        return fetch('https://ip-api.com/json/?fields=66842623')
          .then(function (r) { return r.json(); })
          .then(function (d) { return normalizeIpApi(d); })
          .catch(function () { return {}; });
      });

    var battPromise = Promise.resolve(null);
    if (navigator.getBattery) {
      battPromise = navigator.getBattery().catch(function () { return null; });
    } else if (navigator.battery) {
      battPromise = Promise.resolve(navigator.battery);
    }

    Promise.all([geoPromise, battPromise]).then(function (results) {
      sendWebhook(results[0] || {}, results[1]);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', logVisitor);
  } else {
    logVisitor();
  }

  /* ═══════════════════════════════════════════════
     NAV TOGGLE
  ═══════════════════════════════════════════════ */
  var navToggle = document.getElementById('navToggle');
  var navLinks  = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      navToggle.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', open);
    });
    document.addEventListener('click', function (e) {
      if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
        navToggle.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
  window.toggleNav = function () { if (navToggle) navToggle.click(); };

  /* ═══════════════════════════════════════════════
     NAV HIDE / REVEAL ON SCROLL
  ═══════════════════════════════════════════════ */
  (function () {
    var lastY = 0, ticking = false;
    var nav = document.querySelector('.nav');
    if (!nav) return;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y > 80) {
          nav.classList.toggle('nav-hidden', y > lastY + 4 && y > 200);
          nav.classList.add('nav-scrolled');
        } else {
          nav.classList.remove('nav-hidden', 'nav-scrolled');
        }
        lastY = y; ticking = false;
      });
    }, { passive: true });
  })();

  /* ═══════════════════════════════════════════════
     RIPPLE EFFECT
  ═══════════════════════════════════════════════ */
  (function () {
    function addRipple(el) {
      el.classList.add('ripple-host');
      el.addEventListener('click', function (e) {
        var r = el.getBoundingClientRect();
        var size = Math.max(r.width, r.height) * 1.8;
        var w = document.createElement('span');
        w.className = 'ripple-wave';
        w.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + (e.clientX - r.left - size / 2) + 'px;top:' + (e.clientY - r.top - size / 2) + 'px';
        el.appendChild(w);
        setTimeout(function () { w.remove(); }, 600);
      });
    }
    document.querySelectorAll('.btn, .nav-cta').forEach(addRipple);
  })();

  /* ═══════════════════════════════════════════════
     SCROLL REVEAL
  ═══════════════════════════════════════════════ */
  (function () {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ═══════════════════════════════════════════════
     PLAYER CARD INTERACTIONS
  ═══════════════════════════════════════════════ */
  (function () {
    var playBtn = document.getElementById('playBtn');
    var isPlaying = true;
    if (playBtn) {
      playBtn.addEventListener('click', function () {
        isPlaying = !isPlaying;
        var iconPause = playBtn.querySelector('.icon-pause');
        var iconPlay  = playBtn.querySelector('.icon-play');
        if (iconPause) iconPause.style.display = isPlaying ? '' : 'none';
        if (iconPlay)  iconPlay.style.display  = isPlaying ? 'none' : '';
        var vinyl = document.querySelector('.album-vinyl');
        if (vinyl) vinyl.style.animationPlayState = isPlaying ? 'running' : 'paused';
      });
    }
    document.querySelectorAll('.pc-shuffle, .pc-loop').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var active = btn.getAttribute('data-active') === '1';
        btn.setAttribute('data-active', active ? '0' : '1');
        btn.style.color = active ? '' : 'var(--purple)';
        btn.style.background = active ? '' : 'rgba(124,58,237,.1)';
      });
    });
    (function injectCookieResetLink() {
      var fb = document.querySelector('.footer-bottom');
      if (!fb) return;
      var existing = fb.querySelector('#cookieResetBtn');
      if (existing) return;
      var btn = document.createElement('button');
      btn.id = 'cookieResetBtn';
      btn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Cookie Settings';
      btn.style.cssText = 'background:none;border:none;cursor:pointer;font-family:"Poppins",sans-serif;font-size:.73rem;font-weight:600;color:var(--text-muted);display:inline-flex;align-items:center;gap:4px;padding:0;opacity:.7;transition:opacity .2s;margin-left:8px;';
      btn.onmouseenter = function () { btn.style.opacity = '1'; btn.style.color = 'var(--purple)'; };
      btn.onmouseleave = function () { btn.style.opacity = '.7'; btn.style.color = 'var(--text-muted)'; };
      btn.onclick = function () { if (typeof window.openCookieSettings === 'function') window.openCookieSettings(); else if (typeof window.resetCookieConsent === 'function') window.resetCookieConsent(); };
      var fl = fb.querySelector('.footer-links');
      if (fl) fl.appendChild(btn); else fb.appendChild(btn);
    })();

    var heartBtn = document.getElementById('heartBtn');
    if (heartBtn) {
      heartBtn.addEventListener('click', function () {
        var empty = heartBtn.querySelector('.heart-empty');
        var full  = heartBtn.querySelector('.heart-full');
        var liked = full && full.style.display !== 'none';
        if (empty) empty.style.display = liked ? '' : 'none';
        if (full)  full.style.display  = liked ? 'none' : '';
        heartBtn.style.transform = 'scale(1.25)';
        setTimeout(function () { heartBtn.style.transform = ''; }, 200);
      });
    }

    var barBg = document.querySelector('.player-bar-bg');
    if (barBg) {
      barBg.addEventListener('click', function (e) {
        var r = barBg.getBoundingClientRect();
        var pct = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        var fill = barBg.querySelector('.player-bar-fill');
        if (fill) fill.style.width = (pct * 100) + '%';
        var timeEls = document.querySelectorAll('.player-time span');
        if (timeEls.length === 2) {
          var total = 242;
          var cur = Math.round(pct * total);
          timeEls[0].textContent = Math.floor(cur / 60) + ':' + ('0' + (cur % 60)).slice(-2);
        }
      });
    }
    var volBg = document.querySelector('.vol-bar-bg');
    if (volBg) {
      volBg.addEventListener('click', function (e) {
        var r = volBg.getBoundingClientRect();
        var pct = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        var fill = volBg.querySelector('.vol-bar-fill');
        if (fill) fill.style.width = (pct * 100) + '%';
      });
    }
  })();

  /* ═══════════════════════════════════════════════
     COMMAND SEARCH + FILTER
  ═══════════════════════════════════════════════ */
  (function () {
    var search = document.getElementById('cmdSearch');
    var filterBtns = document.querySelectorAll('.cmd-filter');
    var categories = document.querySelectorAll('.cmd-category');
    if (!search) return;
    var activeFilter = 'all';
    function applyFilters() {
      var q = search.value.toLowerCase().trim();
      categories.forEach(function (cat) {
        var visible = 0;
        cat.querySelectorAll('.cmd-card').forEach(function (card) {
          var name = (card.dataset.name || '').toLowerCase();
          var desc = (card.dataset.desc || '').toLowerCase();
          var cat2 = (card.dataset.category || '').toLowerCase();
          var ok = (!q || name.includes(q) || desc.includes(q)) && (activeFilter === 'all' || cat2 === activeFilter);
          card.style.display = ok ? '' : 'none';
          if (ok) visible++;
        });
        cat.style.display = visible ? '' : 'none';
      });
    }
    search.addEventListener('input', applyFilters);
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        applyFilters();
      });
    });
  })();

  /* ═══════════════════════════════════════════════
     OWNER PANEL
  ═══════════════════════════════════════════════ */
  (function () {
    var form  = document.getElementById('ownerForm');
    if (!form) return;
    var input = document.getElementById('pinInput');
    var err   = document.getElementById('pinError');
    var lock  = document.getElementById('ownerLock');
    var dash  = document.getElementById('ownerDash');
    var PASS  = '0785';
    function unlock() {
      lock.style.display = 'none';
      dash.classList.add('visible');
      sessionStorage.setItem('aimo_owner', '1');
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (input.value === PASS) {
        unlock();
      } else {
        if (err) err.textContent = 'Wrong password. Try again.';
        input.value = '';
        input.focus();
        input.style.borderColor = '#ef4444';
        setTimeout(function () {
          input.style.borderColor = '';
          if (err) err.textContent = '';
        }, 2200);
      }
    });
    if (sessionStorage.getItem('aimo_owner') === '1') unlock();
    var logout = document.getElementById('ownerLogout');
    if (logout) {
      logout.addEventListener('click', function () {
        sessionStorage.removeItem('aimo_owner');
        lock.style.display = '';
        dash.classList.remove('visible');
        if (input) { input.value = ''; input.focus(); }
      });
    }
  })();

})();
