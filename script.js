(function () {

  /* ═══════════════════════════════════════════════
     CONFIG
  ═══════════════════════════════════════════════ */
  var cfg       = (typeof window !== 'undefined' && window.AIMO_CONFIG) || {};
  var WEBHOOK   = cfg.webhook || '/api/log';
  var BOT_AVATAR = cfg.botAvatarUrl || '';

  /* ═══════════════════════════════════════════════
     DEVICE / BROWSER DETECTION
  ═══════════════════════════════════════════════ */
  function detectBrowser(ua) {
    if (/Edg\//i.test(ua))             return '🔷 Microsoft Edge';
    if (/OPR\/|Opera/i.test(ua))       return '🔴 Opera';
    if (/SamsungBrowser/i.test(ua))    return '🔵 Samsung Browser';
    if (/YaBrowser/i.test(ua))         return '🟡 Yandex Browser';
    if (/UCBrowser/i.test(ua))         return '🟠 UC Browser';
    if (/CriOS/i.test(ua))             return '🔵 Chrome (iOS)';
    if (/FxiOS/i.test(ua))             return '🟠 Firefox (iOS)';
    if (/Firefox/i.test(ua))           return '🟠 Firefox';
    if (/Brave/i.test(ua))             return '🦁 Brave';
    if (/DuckDuckGo/i.test(ua))        return '🦆 DuckDuckGo';
    if (/Vivaldi/i.test(ua))           return '🔴 Vivaldi';
    if (/Chrome/i.test(ua))            return '🔵 Chrome';
    if (/Safari/i.test(ua))            return '⬜ Safari';
    if (/MSIE|Trident/i.test(ua))      return '🔷 Internet Explorer';
    if (/HeadlessChrome/i.test(ua))    return '🤖 Headless Chrome';
    return '❓ Unknown';
  }

  function detectOS(ua) {
    if (/Windows NT 10\.0/i.test(ua))  return '🪟 Windows 10 / 11';
    if (/Windows NT 6\.3/i.test(ua))   return '🪟 Windows 8.1';
    if (/Windows NT 6\.2/i.test(ua))   return '🪟 Windows 8';
    if (/Windows NT 6\.1/i.test(ua))   return '🪟 Windows 7';
    if (/Windows NT 6\.0/i.test(ua))   return '🪟 Windows Vista';
    if (/Windows NT 5/i.test(ua))      return '🪟 Windows XP';
    if (/Windows/i.test(ua))           return '🪟 Windows';
    var macVer = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/i);
    if (macVer)                         return '🍎 macOS ' + macVer[1].replace(/_/g, '.');
    var iosVer = ua.match(/OS (\d+[._]\d+[._]?\d*) like Mac/i);
    if (iosVer)                         return '📱 iOS ' + iosVer[1].replace(/_/g, '.');
    if (/iPhone|iPad|iPod/i.test(ua))  return '📱 iOS';
    var andVer = ua.match(/Android (\d+\.?\d*)/i);
    if (andVer)                         return '🤖 Android ' + andVer[1];
    if (/Android/i.test(ua))           return '🤖 Android';
    if (/CrOS/i.test(ua))              return '💻 Chrome OS';
    if (/Ubuntu/i.test(ua))            return '🐧 Ubuntu Linux';
    if (/Fedora/i.test(ua))            return '🐧 Fedora Linux';
    if (/Debian/i.test(ua))            return '🐧 Debian Linux';
    if (/Linux/i.test(ua))             return '🐧 Linux';
    if (/Tizen/i.test(ua))             return '📺 Tizen (Samsung TV)';
    if (/webOS/i.test(ua))             return '📺 webOS (LG TV)';
    if (/FreeBSD/i.test(ua))           return '💻 FreeBSD';
    return '❓ Unknown';
  }

  function detectDevice(ua) {
    var w = screen.width, h = screen.height;
    var maxDim = Math.max(w, h), minDim = Math.min(w, h);
    var hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    var isBot = /HeadlessChrome/i.test(ua) || navigator.webdriver ||
      /bot|crawl|spider|scraper|curl|wget|python-requests|java\/|go-http|libwww|axios|node-fetch|facebookexternalhit|Twitterbot|Googlebot|bingbot/i.test(ua);

    if (isBot)                         return '🤖 Bot / Crawler';
    if (/PlayStation 5/i.test(ua))     return '🎮 PlayStation 5';
    if (/PlayStation/i.test(ua))       return '🎮 PlayStation 4';
    if (/Xbox Series/i.test(ua))       return '🎮 Xbox Series X/S';
    if (/Xbox/i.test(ua))              return '🎮 Xbox';
    if (/Nintendo Switch/i.test(ua))   return '🎮 Nintendo Switch';
    if (/Nintendo/i.test(ua))          return '🎮 Nintendo';
    if (/SmartTV|SMART-TV|Tizen|HbbTV|BRAVIA/i.test(ua)) return '📺 Smart TV';
    if (/webOS/i.test(ua))             return '📺 LG Smart TV';
    if (/Roku/i.test(ua))              return '📺 Roku';
    if (/Oculus|Quest/i.test(ua))      return '🥽 VR Headset';
    if (/CrOS/i.test(ua))              return '💻 Chromebook';
    var isIPad = /iPad/i.test(ua) || (/Macintosh/i.test(ua) && hasTouch && maxDim <= 1366);
    if (isIPad)                         return '📟 iPad';
    if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return '📟 Android Tablet';
    if (/Tablet/i.test(ua))            return '📟 Tablet';
    if (hasTouch && minDim >= 600 && maxDim <= 1400 && !/iPhone|iPod|Android.*Mobile/i.test(ua)) return '📟 Tablet';
    if (/iPhone/i.test(ua))            return '📱 iPhone';
    if (/iPod/i.test(ua))              return '📱 iPod Touch';
    if (/Android.*Mobile/i.test(ua))   return '📱 Android Phone';
    if (/Mobi/i.test(ua) || (hasTouch && maxDim < 768)) return '📱 Mobile Phone';
    if (/Macintosh|Mac OS X/i.test(ua)) return '🍎 Mac';
    if (/Windows NT/i.test(ua))        return '🖥️ Windows PC';
    if (/Ubuntu|Fedora|Debian|Linux/i.test(ua)) return '🐧 Linux PC';
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

  function getMemory()    { var m = navigator.deviceMemory; return m ? m + ' GB RAM' : 'N/A'; }
  function getCores()     { var c = navigator.hardwareConcurrency; return c ? c + ' cores' : 'N/A'; }
  function getViewport()  { return window.innerWidth + '×' + window.innerHeight; }
  function getPixelRatio(){ return (window.devicePixelRatio || 1).toFixed(2) + 'x'; }
  function getPageTitle() { return document.title || 'Unknown'; }

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

  function getBrowserPlugins() {
    var p = navigator.plugins;
    if (!p || !p.length) return 'None / Blocked';
    var names = [];
    for (var i = 0; i < Math.min(p.length, 5); i++) names.push(p[i].name);
    return names.join(', ') + (p.length > 5 ? ' +' + (p.length - 5) + ' more' : '');
  }

  /* ═══════════════════════════════════════════════
     VISITOR LOGGER (geo + battery)
  ═══════════════════════════════════════════════ */
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
    var isBot   = device.includes('🤖');

    var battLevel  = (battery && battery.level  !== undefined) ? Math.round(battery.level * 100) + '%' : 'N/A';
    var battCharge = (battery && battery.charging !== undefined) ? (battery.charging ? '⚡ Charging' : '🔋 On Battery') : 'N/A';
    var battTimeRaw = battery ? (battery.charging ? battery.chargingTime : battery.dischargingTime) : null;
    var battTime   = 'N/A';
    if (battTimeRaw !== null && battTimeRaw !== undefined && isFinite(battTimeRaw)) {
      var mins = Math.floor(battTimeRaw / 60);
      battTime = mins >= 60 ? Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm' : mins + ' min';
    }

    var flagEmoji = '';
    var cc = (geo.country_code || '').toUpperCase();
    if (cc.length === 2) {
      try {
        flagEmoji = String.fromCodePoint(0x1F1E6 + (cc.charCodeAt(0) - 65)) +
                    String.fromCodePoint(0x1F1E6 + (cc.charCodeAt(1) - 65)) + ' ';
      } catch(e) {}
    }

    var mapsLink = (geo.latitude && geo.longitude)
      ? '[' + geo.latitude + ', ' + geo.longitude + '](https://maps.google.com/?q=' + geo.latitude + ',' + geo.longitude + ')'
      : 'Unknown';

    var footerTag = '🆔 ' + sid + ' · AIMO Client Logger v3';

    var embeds = [
      {
        title: isBot ? '🤖 Bot Visit — ' + page : '🌐 New Visitor — ' + page,
        color: isBot ? 0xf59e0b : 0x7c3aed,
        fields: [
          { name: '🌐 IP Address',    value: '`' + (geo.ip || 'Unknown') + '`',             inline: true },
          { name: '🌍 Country',       value: flagEmoji + (geo.country_name || 'Unknown'),    inline: true },
          { name: '📍 Region',        value: geo.region    || 'Unknown',                     inline: true },
          { name: '🏙️ City',          value: geo.city      || 'Unknown',                     inline: true },
          { name: '📮 Postal Code',   value: geo.postal    || 'Unknown',                     inline: true },
          { name: '🕐 Timezone',      value: geo.timezone  || 'Unknown',                     inline: true },
          { name: '🏢 ISP / Org',     value: (geo.org || 'Unknown').substring(0, 80),        inline: false },
          { name: '🗺️ Coordinates',   value: mapsLink,                                       inline: true },
          { name: '🔑 Session ID',    value: '`' + sid + '`',                                inline: false }
        ],
        footer: { text: footerTag },
        timestamp: now
      },
      {
        title: '👤 Visitor Session Info',
        color: 0xec4899,
        fields: [
          { name: '🌐 Browser',         value: browser,                                                  inline: true },
          { name: '💻 OS',              value: os,                                                       inline: true },
          { name: '📲 Device',          value: device,                                                   inline: true },
          { name: '🗣️ Language',        value: navigator.language || 'Unknown',                          inline: true },
          { name: '🌐 All Languages',   value: (navigator.languages || [navigator.language || 'N/A']).join(', ').substring(0, 60), inline: true },
          { name: '📺 Screen',          value: screen.width + '×' + screen.height,                      inline: true },
          { name: '🔲 Viewport',        value: getViewport(),                                            inline: true },
          { name: '🔍 Pixel Ratio',     value: getPixelRatio(),                                         inline: true },
          { name: '🎨 Colour Depth',    value: screen.colorDepth + ' bit',                              inline: true },
          { name: '🔁 Visit #',         value: String(visits),                                           inline: true },
          { name: '📄 Page',            value: '`' + page + '`',                                        inline: true },
          { name: '📝 Page Title',      value: title.substring(0, 80),                                  inline: true },
          { name: '🔗 Referrer',        value: ref.length > 80 ? ref.substring(0, 80) + '…' : ref,     inline: false },
          { name: '⏱️ Local Time',      value: new Date().toLocaleString(),                              inline: true },
          { name: '🕐 UTC Time',        value: new Date().toUTCString(),                                 inline: false }
        ],
        footer: { text: footerTag },
        timestamp: now
      },
      {
        title: '📱 Device & Hardware Info',
        color: 0x3b82f6,
        fields: [
          { name: '🖥️ Platform',        value: navigator.platform || 'Unknown',                         inline: true },
          { name: '💾 RAM',             value: getMemory(),                                             inline: true },
          { name: '⚙️ CPU Cores',       value: getCores(),                                              inline: true },
          { name: '🔋 Battery Level',   value: battLevel,                                               inline: true },
          { name: '⚡ Power Status',    value: battCharge,                                              inline: true },
          { name: '⏳ Battery Time',    value: battTime,                                                inline: true },
          { name: '📡 Online Status',   value: navigator.onLine ? '✅ Online' : '❌ Offline',          inline: true },
          { name: '📶 Network',         value: getNetworkInfo(),                                        inline: true },
          { name: '👆 Touch Support',   value: getTouchInfo(),                                          inline: true },
          { name: '🍪 Cookies',         value: navigator.cookieEnabled ? '✅ Enabled' : '❌ Disabled', inline: true },
          { name: '🚫 Do Not Track',    value: navigator.doNotTrack === '1' ? '✅ On' : '❌ Off',      inline: true },
          { name: '🕵️ Webdriver',       value: navigator.webdriver ? '⚠️ YES (bot detected)' : '✅ No',inline: true },
          { name: '🔌 Plugins',         value: getBrowserPlugins(),                                     inline: false },
          { name: '📝 User Agent',      value: '```\n' + ua.substring(0, 256) + '\n```',               inline: false }
        ],
        footer: { text: footerTag },
        timestamp: now
      }
    ];

    if (!WEBHOOK) return;
    sendWebhookWithRetry({ username: isBot ? '🤖 AIMO Bot Detector' : '👁️ AIMO Visitor Log', avatar_url: BOT_AVATAR, embeds: embeds });
  }

  function normalizeIpwho(d) {
    return { ip: d.ip, country_name: d.country, country_code: d.country_code, region: d.region, city: d.city, postal: d.postal, timezone: (d.timezone && (d.timezone.id || d.timezone)) || '', org: (d.connection && (d.connection.org || d.connection.isp)) || '', latitude: d.latitude, longitude: d.longitude };
  }
  function normalizeIpapi(d) {
    return { ip: d.query, country_name: d.country, country_code: d.countryCode, region: d.regionName, city: d.city, postal: d.zip, timezone: d.timezone, org: (d.org || d.isp || ''), latitude: d.lat, longitude: d.lon };
  }
  function normalizeFreeipapi(d) {
    return { ip: d.ipAddress, country_name: d.countryName, country_code: d.countryCode, region: d.regionName, city: d.cityName, postal: d.zipCode, timezone: d.timeZone || '', org: '', latitude: d.latitude, longitude: d.longitude };
  }

  function fetchGeo() {
    return fetch('https://ipwho.is/').then(function (r) { return r.json(); }).then(function (d) { if (!d.success || !d.ip) throw new Error('fail'); return normalizeIpwho(d); })
      .catch(function () { return fetch('https://ipapi.co/json/').then(function (r) { return r.json(); }).then(function (d) { if (d.error || !d.ip) throw new Error('fail'); return normalizeIpapi(d); }); })
      .catch(function () { return fetch('https://freeipapi.com/api/json').then(function (r) { return r.json(); }).then(function (d) { return normalizeFreeipapi(d); }).catch(function () { return {}; }); });
  }

  function sendWebhookWithRetry(payload, attempt) {
    attempt = attempt || 0;
    if (!WEBHOOK) return;
    fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function(r) {
      if (r.status === 429 && attempt < 4) {
        r.json().then(function(d) {
          var wait = ((d && d.retry_after) || Math.pow(2, attempt + 1)) * 1000;
          setTimeout(function() { sendWebhookWithRetry(payload, attempt + 1); }, wait);
        }).catch(function() {
          setTimeout(function() { sendWebhookWithRetry(payload, attempt + 1); }, 4000);
        });
      }
    }).catch(function () {});
  }

  function logVisitor() {
    if (sessionStorage.getItem('aimo_logged')) return;
    sessionStorage.setItem('aimo_logged', '1');
    var geoPromise  = fetchGeo();
    var battPromise = Promise.resolve(null);
    if (navigator.getBattery) { battPromise = navigator.getBattery().catch(function () { return null; }); }
    else if (navigator.battery) { battPromise = Promise.resolve(navigator.battery); }
    Promise.all([geoPromise, battPromise]).then(function (r) { sendWebhook(r[0] || {}, r[1]); });
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', logVisitor); }
  else { logVisitor(); }

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
        navLinks.classList.remove('open'); navToggle.classList.remove('is-open'); navToggle.setAttribute('aria-expanded', 'false');
      }
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('open'); navToggle.classList.remove('is-open'); navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ═══════════════════════════════════════════════
     NAV HIDE / REVEAL ON SCROLL
  ═══════════════════════════════════════════════ */
  (function () {
    var lastY = 0, ticking = false;
    var nav = document.querySelector('.nav');
    if (!nav) return;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y > 80) {
          nav.classList.toggle('nav-hidden', y > lastY + 4 && y > 200);
          nav.classList.add('nav-scrolled');
        } else { nav.classList.remove('nav-hidden', 'nav-scrolled'); }
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
        el.appendChild(w); setTimeout(function () { w.remove(); }, 600);
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
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ═══════════════════════════════════════════════
     STARBOY AUDIO PLAYER
  ═══════════════════════════════════════════════ */
  (function () {
    var audio      = document.getElementById('starboy-audio');
    var playBtn    = document.getElementById('playBtn');
    var progressFill = document.getElementById('progressFill');
    var progressBg   = document.getElementById('progressBg');
    var timeCur    = document.getElementById('timeCur');
    var timeTot    = document.getElementById('timeTot');
    var volBg      = document.getElementById('volBg');
    var volFill    = document.getElementById('volFill');
    var eqBars     = document.getElementById('eqBars');
    var shuffleBtn = document.getElementById('shuffleBtn');
    var loopBtn    = document.getElementById('loopBtn');
    var heartBtn   = document.getElementById('heartBtn');

    if (!audio) return;

    function fmt(s) { s = Math.floor(s || 0); return Math.floor(s/60) + ':' + ('0' + (s%60)).slice(-2); }
    function setPlaying(playing) {
      var iconPlay  = playBtn ? playBtn.querySelector('.icon-play')  : null;
      var iconPause = playBtn ? playBtn.querySelector('.icon-pause') : null;
      if (iconPlay)  iconPlay.style.display  = playing ? 'none' : '';
      if (iconPause) iconPause.style.display = playing ? '' : 'none';
      if (eqBars)    eqBars.classList.toggle('paused', !playing);
    }

    if (playBtn) {
      playBtn.addEventListener('click', function () {
        if (!audio.src) return;
        if (audio.paused) { audio.play().catch(function(){}); } else { audio.pause(); }
      });
    }

    audio.addEventListener('play',  function () { setPlaying(true); });
    audio.addEventListener('pause', function () { setPlaying(false); });
    audio.addEventListener('ended', function () {
      setPlaying(false);
      if (audio.loop) { audio.currentTime = 0; audio.play().catch(function(){}); }
    });
    audio.addEventListener('loadedmetadata', function () {
      if (timeTot) timeTot.textContent = fmt(audio.duration);
    });
    audio.addEventListener('timeupdate', function () {
      if (!audio.duration) return;
      var pct = (audio.currentTime / audio.duration) * 100;
      if (progressFill) progressFill.style.width = pct + '%';
      if (timeCur) timeCur.textContent = fmt(audio.currentTime);
    });
    if (progressBg) {
      progressBg.addEventListener('click', function (e) {
        if (!audio.duration) return;
        var r = progressBg.getBoundingClientRect();
        var pct = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        audio.currentTime = pct * audio.duration;
      });
    }
    if (volBg) {
      volBg.addEventListener('click', function (e) {
        var r = volBg.getBoundingClientRect();
        var pct = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
        audio.volume = pct;
        if (volFill) volFill.style.width = (pct * 100) + '%';
      });
    }
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', function () {
        var active = shuffleBtn.getAttribute('data-active') === '1';
        shuffleBtn.setAttribute('data-active', active ? '0' : '1');
        shuffleBtn.style.color = active ? '' : 'var(--purple)';
        shuffleBtn.style.background = active ? '' : 'rgba(124,58,237,.1)';
      });
    }
    if (loopBtn) {
      loopBtn.addEventListener('click', function () {
        var active = loopBtn.getAttribute('data-active') === '1';
        loopBtn.setAttribute('data-active', active ? '0' : '1');
        loopBtn.style.color = active ? '' : 'var(--purple)';
        loopBtn.style.background = active ? '' : 'rgba(124,58,237,.1)';
        audio.loop = !active;
      });
    }
    if (heartBtn) {
      heartBtn.addEventListener('click', function () {
        var empty = heartBtn.querySelector('.heart-empty');
        var full  = heartBtn.querySelector('.heart-full');
        var liked = full && full.style.display !== 'none';
        if (empty) empty.style.display = liked ? '' : 'none';
        if (full)  full.style.display  = liked ? 'none' : '';
        heartBtn.style.transform = 'scale(1.3)';
        setTimeout(function () { heartBtn.style.transform = ''; }, 220);
      });
    }
  })();

  /* ═══════════════════════════════════════════════
     ACTIVITY TRACKER — clicks, scroll, time, audio
  ═══════════════════════════════════════════════ */
  (function () {
    if (!WEBHOOK) return;
    var lastSent = 0;
    function sid() { return sessionStorage.getItem('aimo_sid') || 'N/A'; }

    function sendEvent(title, color, fields, urgent) {
      var now = Date.now();
      if (!urgent && now - lastSent < 1800) return;
      lastSent = now;
      var base = [
        { name: '📄 Page',    value: '`' + window.location.pathname + '`', inline: true },
        { name: '🆔 Session', value: '`' + sid() + '`',                    inline: true },
        { name: '⏱️ Time',    value: new Date().toLocaleTimeString(),       inline: true }
      ];
      sendWebhookWithRetry({
        username: 'AIMO Activity', avatar_url: BOT_AVATAR,
        embeds: [{ title: title, color: color, fields: fields.concat(base), footer: { text: 'AIMO · Activity Tracker v3' }, timestamp: new Date().toISOString() }]
      });
    }

    /* CTA / link click tracking */
    var CLICK_RULES = [
      { sel: 'a[href*="oauth2/authorize"]',               label: '➕ Add to Discord (Bot Invite)' },
      { sel: '.nav-cta',                                  label: '➕ Invite AIMO (Nav Button)' },
      { sel: 'a[href*="discord.gg"]',                     label: '💬 Join Support Server' },
      { sel: 'a[href*="top.gg"]',                         label: '⭐ Vote on Top.gg' },
      { sel: 'a[href="/commands"], a[href*="/commands"]',  label: '📋 View Commands Page' },
      { sel: 'a[href="/premium"],  a[href*="/premium"]',   label: '⭐ View Premium Page' },
      { sel: 'a[href="/features"], a[href*="/features"]',  label: '✨ View Features Page' },
      { sel: 'a[href="/status"],   a[href*="/status"]',    label: '📡 View Status Page' },
      { sel: 'a[href="/docs"],     a[href*="/docs"]',      label: '📖 View Docs Page' },
      { sel: 'a[href="/updates"],  a[href*="/updates"]',   label: '📢 View Updates Page' },
      { sel: 'a[href="/support"],  a[href*="/support"]',   label: '💬 Support Page Click' },
      { sel: 'a[href="/privacy"],  a[href*="/privacy"]',   label: '🔒 Privacy Page Click' },
      { sel: 'a[href="/terms"],    a[href*="/terms"]',     label: '📜 Terms Page Click' },
      { sel: 'a[href*="mailto:"]',                        label: '✉️ Email Click' },
    ];

    CLICK_RULES.forEach(function (rule) {
      document.querySelectorAll(rule.sel).forEach(function (el) {
        el.addEventListener('click', function () {
          sendEvent('🖱️ Button / Link Clicked', 0x22c55e, [{ name: '🔘 Action', value: rule.label, inline: false }]);
        });
      });
    });

    /* Audio player interactions */
    var audio = document.getElementById('starboy-audio');
    if (audio) {
      audio.addEventListener('play', function () {
        sendEvent('🎵 Music Player — Play', 0x1ed760, [{ name: '🎵 Track', value: 'Starboy (feat. Daft Punk) — The Weeknd', inline: false }]);
      });
      audio.addEventListener('pause', function () {
        sendEvent('⏸️ Music Player — Pause', 0xfbbf24, [
          { name: '🎵 Track', value: 'Starboy (feat. Daft Punk) — The Weeknd', inline: false },
          { name: '⏱️ Position', value: Math.floor(audio.currentTime) + 's listened', inline: true }
        ]);
      });
      audio.addEventListener('ended', function() {
        sendEvent('✅ Music Player — Track Finished', 0x22c55e, [
          { name: '🎵 Track', value: 'Starboy (feat. Daft Punk) — The Weeknd', inline: false },
          { name: '🎉 Status', value: 'Full track listened!', inline: true }
        ], true);
      });
    }

    /* Heart / like tracking */
    var heartBtn = document.getElementById('heartBtn');
    if (heartBtn) {
      heartBtn.addEventListener('click', function () {
        var full = heartBtn.querySelector('.heart-full');
        var liked = full && full.style.display !== 'none';
        sendEvent(liked ? '💜 Song Liked!' : '💔 Song Unliked', liked ? 0xf43f5e : 0x94a3b8,
          [{ name: '🎵 Track', value: 'Starboy (feat. Daft Punk) — The Weeknd', inline: false }]);
      });
    }

    /* Scroll depth milestones */
    var MILESTONES = [25, 50, 75, 100];
    var reached = {};
    window.addEventListener('scroll', function () {
      var scrolled = window.scrollY + window.innerHeight;
      var total    = document.documentElement.scrollHeight || 1;
      var pct      = Math.floor((scrolled / total) * 100);
      MILESTONES.forEach(function (m) {
        if (pct >= m && !reached[m]) {
          reached[m] = true;
          sendEvent('📜 Scroll Depth — ' + m + '%', 0x3b82f6,
            [{ name: '📊 Milestone', value: m + '% of the page scrolled', inline: true }]);
        }
      });
    }, { passive: true });

    /* Helpful / Not Helpful buttons — docs page */
    document.querySelectorAll('[data-helpful]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.dataset.voted === '1') return; // prevent double-submit
        btn.dataset.voted = '1';
        var isHelpful = btn.dataset.helpful === 'true';
        var section = btn.closest('[data-section]');
        var sectionName = section ? (section.dataset.section || 'Unknown Section') : (document.title || 'Unknown');

        sendEvent(
          isHelpful ? '👍 Docs Feedback — Helpful' : '👎 Docs Feedback — Not Helpful',
          isHelpful ? 0x22c55e : 0xef4444,
          [
            { name: '📄 Section',  value: '**' + sectionName + '**', inline: false },
            { name: '📊 Rating',   value: isHelpful ? '✅ **HELPFUL** — User found this page useful' : '❌ **NOT HELPFUL** — User did not find this page useful', inline: false },
            { name: '🌐 Page URL', value: '`' + window.location.pathname + '`', inline: true }
          ],
          true
        );

        /* Visual feedback */
        var parent = btn.parentElement;
        if (parent) {
          parent.innerHTML = '<span style="font-size:.82rem;color:' + (isHelpful ? '#16a34a' : '#dc2626') + ';font-weight:600">' +
            (isHelpful ? '✅ Thanks for your feedback!' : '❌ Sorry to hear that — we\'ll improve it!') + '</span>';
        }
      });
    });

    /* Feature card hover depth (first hover on each card) */
    var hovered = {};
    document.querySelectorAll('.feature-card, .stat-card, .perk-card, .feat-demo-card').forEach(function (card, i) {
      card.addEventListener('mouseenter', function () {
        if (hovered[i]) return; hovered[i] = true;
        var h4 = card.querySelector('h4');
        sendEvent('🖱️ Feature Card Explored', 0xa855f7,
          [{ name: '🃏 Card', value: h4 ? '**' + h4.textContent.trim() + '**' : 'Card #' + (i+1), inline: false }]);
      });
    });

    /* Time on page (fires on exit) */
    var pageStart = Date.now();
    function sendExit() {
      var secs = Math.round((Date.now() - pageStart) / 1000);
      var timeStr = secs >= 60 ? Math.floor(secs / 60) + 'm ' + (secs % 60) + 's' : secs + 's';
      var topReached = Object.keys(reached).sort(function (a, b) { return b - a; }).shift();
      var payload = JSON.stringify({
        username: 'AIMO Activity', avatar_url: BOT_AVATAR,
        embeds: [{
          title: '🚪 Visitor Left Page', color: 0xf59e0b,
          fields: [
            { name: '⏱️ Time Spent',  value: '**' + timeStr + '**',                            inline: true },
            { name: '📄 Page',         value: '`' + window.location.pathname + '`',             inline: true },
            { name: '🆔 Session',      value: '`' + sid() + '`',                               inline: true },
            { name: '📊 Max Scroll',   value: (topReached ? topReached + '%' : '<25%') + ' reached', inline: true },
            { name: '🕐 Exit Time',    value: new Date().toLocaleTimeString(),                  inline: true }
          ],
          footer: { text: 'AIMO · Activity Tracker v3' },
          timestamp: new Date().toISOString()
        }]
      });
      try {
        navigator.sendBeacon
          ? navigator.sendBeacon(WEBHOOK, new Blob([payload], { type: 'application/json' }))
          : fetch(WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true });
      } catch (e) {}
    }
    window.addEventListener('pagehide', sendExit);
    window.addEventListener('beforeunload', sendExit);
  })();

  /* ═══════════════════════════════════════════════
     COMMAND SEARCH + FILTER
  ═══════════════════════════════════════════════ */
  (function () {
    var search     = document.getElementById('cmdSearch');
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
          card.style.display = ok ? '' : 'none'; if (ok) visible++;
        });
        cat.style.display = visible ? '' : 'none';
      });
    }
    search.addEventListener('input', applyFilters);
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active'); activeFilter = btn.dataset.filter; applyFilters();
      });
    });
  })();

  /* ═══════════════════════════════════════════════
     FEATURES PAGE — ANIMATED DEMOS
     (cycling songs, filters, AI chat, playlists, games)
  ═══════════════════════════════════════════════ */
  (function () {
    // ── Song picker cycling ──
    var songItems = document.querySelectorAll('#songPicker .fsd-item');
    if (songItems.length) {
      var si = 0;
      setInterval(function () {
        songItems.forEach(function (el) { el.classList.remove('fsd-active'); });
        si = (si + 1) % songItems.length;
        songItems[si].classList.add('fsd-active');
      }, 1800);
    }

    // ── Queue cycling ──
    var queueItems = document.querySelectorAll('.fqd-item');
    if (queueItems.length) {
      var qi = 0;
      setInterval(function () {
        queueItems.forEach(function(el) { el.classList.remove('fqd-active'); });
        qi = (qi + 1) % queueItems.length;
        queueItems[qi].classList.add('fqd-active');
      }, 2200);
    }

    // ── Playlist cycling ──
    var plItems = document.querySelectorAll('.fpd-item');
    if (plItems.length) {
      var pli = 0;
      setInterval(function () {
        plItems.forEach(function(el) { el.classList.remove('fpd-active'); });
        pli = (pli + 1) % plItems.length;
        plItems[pli].classList.add('fpd-active');
      }, 2000);
    }

    // ── Filter chip cycling ──
    var filterChips = document.querySelectorAll('.ffd-chip');
    if (filterChips.length) {
      var fci = 0;
      setInterval(function () {
        filterChips.forEach(function(c) { if (!c.classList.contains('ffd-chip-premium')) c.classList.remove('ffd-chip-on'); });
        for (var i = 0; i < 2; i++) {
          fci = (fci + 1) % filterChips.length;
          filterChips[fci].classList.add('ffd-chip-on');
        }
      }, 1500);
    }

    // ── EQ bars animation on filter demo ──
    var eqBarGroups = document.querySelectorAll('#eqBars .ffd-bar-group');
    if (eqBarGroups.length) {
      setInterval(function () {
        eqBarGroups.forEach(function(g) {
          var bar = g.querySelector('.ffd-bar');
          if (bar) {
            var h = Math.floor(25 + Math.random() * 70);
            bar.style.height = h + '%';
            bar.classList.toggle('ffd-bar-active', h > 55);
          }
        });
      }, 800);
    }

    // ── AI chat cycling responses ──
    var aiResponses = [
      { q: '/ask Best song to hype up a Discord server?', a: '<strong>Starboy by The Weeknd</strong> — high energy, instantly recognisable. Try <code>/play Starboy</code>!' },
      { q: '/ask What\'s the weather like today?', a: 'I can\'t check live weather, but try <code>/weather [city]</code> for real-time data!' },
      { q: '/ask Give me a fun fact', a: 'The shortest war in history lasted only <strong>38–45 minutes</strong> — the Anglo-Zanzibar War of 1896! 🎖️' },
      { q: '/ask Recommend a chill playlist', a: 'Try <strong>lo-fi hip hop</strong> — type <code>/play lofi hip hop playlist</code> to get started! 🎵' }
    ];
    var aiUserEl = document.querySelector('.fad-msg.fad-user');
    var aiBotEl  = document.querySelector('.fad-bot-text');
    if (aiUserEl && aiBotEl) {
      var aii = 0;
      setInterval(function () {
        aii = (aii + 1) % aiResponses.length;
        aiUserEl.textContent = aiResponses[aii].q;
        aiBotEl.innerHTML = aiResponses[aii].a;
      }, 3000);
    }

    // ── Discord language selector animation ──
    var langOptions = document.querySelectorAll('#discordOptionsList .fdd-option-row');
    var selFlag     = document.getElementById('discordSelFlag');
    var selName     = document.getElementById('discordSelName');
    var confirmMsg  = document.getElementById('discordConfirmMsg');
    var confirmLang = document.getElementById('discordConfirmLang');
    var optsList    = document.getElementById('discordOptionsList');
    var arrowEl     = document.getElementById('discordArrow');
    var boxEl       = document.getElementById('discordSelectBox');

    if (langOptions.length && selFlag && selName) {
      var langIndex = 0;
      var isAnimating = false;
      function cycleLang() {
        if (isAnimating) return;
        isAnimating = true;
        // Open dropdown
        if (optsList) optsList.classList.add('fdd-options-open');
        if (arrowEl)  arrowEl.style.transform = 'rotate(180deg)';
        if (boxEl)    boxEl.closest('.fdd-select-box') && boxEl.classList.add('fdd-select-open');
        setTimeout(function () {
          // Highlight next option
          langOptions.forEach(function(o) { o.classList.remove('fdd-option-active'); });
          langIndex = (langIndex + 1) % langOptions.length;
          langOptions[langIndex].classList.add('fdd-option-active');
          setTimeout(function () {
            var flag = langOptions[langIndex].dataset.flag || '';
            var name = langOptions[langIndex].dataset.name || '';
            if (selFlag) selFlag.textContent = flag;
            if (selName) selName.textContent = name;
            if (optsList) optsList.classList.remove('fdd-options-open');
            if (arrowEl)  arrowEl.style.transform = '';
            if (confirmLang) confirmLang.textContent = name;
            if (confirmMsg) { confirmMsg.classList.add('visible'); }
            setTimeout(function () {
              if (confirmMsg) confirmMsg.classList.remove('visible');
              isAnimating = false;
            }, 1600);
          }, 800);
        }, 600);
      }
      setInterval(cycleLang, 4000);
      setTimeout(cycleLang, 1500);
    }

    // ── Games grid — rotating highlight ──
    var gameCards = document.querySelectorAll('.fgd-game');
    if (gameCards.length) {
      var gi = 0;
      setInterval(function () {
        gameCards.forEach(function(c) { c.style.background = ''; c.style.borderColor = ''; c.style.transform = ''; });
        gameCards[gi].style.background = 'rgba(124,58,237,.1)';
        gameCards[gi].style.borderColor = 'rgba(124,58,237,.25)';
        gameCards[gi].style.transform = 'translateY(-4px)';
        gi = (gi + 1) % gameCards.length;
      }, 1200);
    }

    // ── Customize selector animation ──
    var custOptions = document.querySelectorAll('#custOptionsList .fdd-option-row');
    var custIcon    = document.getElementById('custSelIcon');
    var custName    = document.getElementById('custSelName');
    var custConfirm = document.getElementById('custConfirmMsg');
    var custField   = document.getElementById('custConfirmField');
    var custList    = document.getElementById('custOptionsList');
    var custArrow   = document.getElementById('custArrow');

    if (custOptions.length && custIcon && custName) {
      var custIdx = 0;
      var custBusy = false;
      function cycleCust() {
        if (custBusy) return; custBusy = true;
        if (custList)  custList.classList.add('fdd-options-open');
        if (custArrow) custArrow.style.transform = 'rotate(180deg)';
        setTimeout(function () {
          custOptions.forEach(function(o) { o.classList.remove('fdd-option-active'); });
          custIdx = (custIdx + 1) % custOptions.length;
          custOptions[custIdx].classList.add('fdd-option-active');
          setTimeout(function () {
            var icon = custOptions[custIdx].dataset.icon || '';
            var name = custOptions[custIdx].dataset.name || '';
            if (custIcon)  custIcon.textContent = icon;
            if (custName)  custName.textContent = name;
            if (custList)  custList.classList.remove('fdd-options-open');
            if (custArrow) custArrow.style.transform = '';
            if (custField)   custField.textContent = name;
            if (custConfirm) { custConfirm.classList.add('visible'); }
            setTimeout(function () {
              if (custConfirm) custConfirm.classList.remove('visible');
              custBusy = false;
            }, 1800);
          }, 800);
        }, 600);
      }
      setInterval(cycleCust, 4500);
      setTimeout(cycleCust, 2500);
    }
  })();

})();
