/**
 * AIMO Cookie Banner — Multi-language + detailed webhook logging
 */
(function () {
  if (document.cookie.indexOf('aimo_cookie_consent=') !== -1) return;

  var cfg       = (typeof window !== 'undefined' && window.AIMO_CONFIG) || {};
  var WEBHOOK   = cfg.webhook || '/api/log';
  var BOT_AVATAR = cfg.botAvatarUrl || '';

  var TRANSLATIONS = {
    en: { title: '🍪 Cookie Notice', msg: 'AIMO uses cookies to improve your experience and to understand how you use our website. You can accept or decline non-essential cookies.',      accept: 'Accept All', decline: 'Decline', more: 'Learn more' },
    es: { title: '🍪 Aviso de cookies', msg: 'AIMO usa cookies para mejorar tu experiencia y entender cómo usas nuestro sitio web. Puedes aceptar o rechazar las cookies no esenciales.',   accept: 'Aceptar todo', decline: 'Rechazar', more: 'Más info' },
    fr: { title: '🍪 Avis sur les cookies', msg: 'AIMO utilise des cookies pour améliorer votre expérience. Vous pouvez accepter ou refuser les cookies non essentiels.',              accept: 'Tout accepter', decline: 'Refuser', more: 'En savoir plus' },
    de: { title: '🍪 Cookie-Hinweis', msg: 'AIMO verwendet Cookies, um Ihre Erfahrung zu verbessern und zu verstehen, wie Sie unsere Website nutzen.',                               accept: 'Alle akzeptieren', decline: 'Ablehnen', more: 'Mehr erfahren' },
    pt: { title: '🍪 Aviso de cookies', msg: 'O AIMO usa cookies para melhorar sua experiência e entender como você usa nosso site.',                                                accept: 'Aceitar tudo', decline: 'Recusar', more: 'Saiba mais' },
    it: { title: '🍪 Avviso sui cookie', msg: 'AIMO utilizza i cookie per migliorare la tua esperienza e capire come usi il nostro sito.',                                           accept: 'Accetta tutto', decline: 'Rifiuta', more: 'Ulteriori info' },
    nl: { title: '🍪 Cookiemelding', msg: 'AIMO gebruikt cookies om uw ervaring te verbeteren en te begrijpen hoe u onze website gebruikt.',                                         accept: 'Alles accepteren', decline: 'Weigeren', more: 'Meer info' },
    ru: { title: '🍪 Cookie-уведомление', msg: 'AIMO использует файлы cookie для улучшения вашего опыта и понимания того, как вы используете наш сайт.',                           accept: 'Принять все', decline: 'Отклонить', more: 'Подробнее' },
    ja: { title: '🍪 Cookieの通知', msg: 'AIMOは、お客様の体験を向上させ、ウェブサイトの使用状況を理解するためにCookieを使用します。',                                             accept: 'すべて許可', decline: '拒否する', more: '詳細を見る' },
    ko: { title: '🍪 쿠키 알림', msg: 'AIMO는 서비스 개선과 사용 현황 파악을 위해 쿠키를 사용합니다. 비필수 쿠키를 수락하거나 거부할 수 있습니다.',                               accept: '모두 수락', decline: '거부', more: '자세히 보기' },
    zh: { title: '🍪 Cookie 通知', msg: 'AIMO 使用 Cookie 来改善您的体验并了解您如何使用我们的网站。您可以接受或拒绝非必要的 Cookie。',                                            accept: '全部接受', decline: '拒绝', more: '了解更多' },
    ar: { title: '🍪 إشعار ملفات تعريف الارتباط', msg: 'يستخدم AIMO ملفات تعريف الارتباط لتحسين تجربتك وفهم كيفية استخدامك لموقعنا.',                                             accept: 'قبول الكل', decline: 'رفض', more: 'معرفة المزيد' },
    tr: { title: '🍪 Çerez Bildirimi', msg: 'AIMO, deneyiminizi iyileştirmek ve web sitemizi nasıl kullandığınızı anlamak için çerezler kullanır.',                                 accept: 'Tümünü Kabul Et', decline: 'Reddet', more: 'Daha fazla' },
    pl: { title: '🍪 Powiadomienie o plikach cookie', msg: 'AIMO używa plików cookie, aby poprawić Twoje doświadczenia i zrozumieć, jak korzystasz z naszej witryny.',             accept: 'Zaakceptuj wszystkie', decline: 'Odrzuć', more: 'Dowiedz się więcej' },
    sv: { title: '🍪 Cookie-meddelande', msg: 'AIMO använder cookies för att förbättra din upplevelse och förstå hur du använder vår webbplats.',                                   accept: 'Acceptera alla', decline: 'Avvisa', more: 'Läs mer' },
  };

  function detectLang() {
    var raw = navigator.language || navigator.languages && navigator.languages[0] || 'en';
    var code = raw.toLowerCase().split('-')[0];
    return TRANSLATIONS[code] ? code : 'en';
  }

  function getSid() { return sessionStorage.getItem('aimo_sid') || 'N/A'; }

  function sendCookieLog(decision, lang, geo) {
    var ua      = navigator.userAgent;
    var page    = window.location.pathname;
    var sid     = getSid();
    var now     = new Date().toISOString();
    var lang2   = navigator.language || 'N/A';
    var isAccepted = decision === 'accepted';
    var timeOnSite = sessionStorage.getItem('aimo_page_start')
      ? Math.round((Date.now() - parseInt(sessionStorage.getItem('aimo_page_start'))) / 1000) + 's'
      : 'N/A';

    var flagEmoji = '';
    var cc = (geo && geo.country_code || '').toUpperCase();
    if (cc.length === 2) {
      try {
        flagEmoji = String.fromCodePoint(0x1F1E6 + (cc.charCodeAt(0) - 65)) +
                    String.fromCodePoint(0x1F1E6 + (cc.charCodeAt(1) - 65)) + ' ';
      } catch(e) {}
    }

    var payload = {
      username: isAccepted ? '✅ AIMO Cookie Accepted' : '❌ AIMO Cookie Declined',
      avatar_url: BOT_AVATAR,
      embeds: [{
        title: isAccepted ? '✅ Cookie Consent — **ACCEPTED**' : '❌ Cookie Consent — **DECLINED**',
        color: isAccepted ? 0x22c55e : 0xef4444,
        description: isAccepted
          ? 'User **accepted** non-essential cookies — full analytics tracking is now active.'
          : 'User **declined** non-essential cookies — only essential cookies will be used.',
        fields: [
          { name: '🍪 Decision',     value: isAccepted ? '✅ **ACCEPTED**' : '❌ **DECLINED**',            inline: true },
          { name: '🌐 IP',           value: '`' + (geo && geo.ip || 'Unknown') + '`',                     inline: true },
          { name: '🌍 Country',      value: flagEmoji + (geo && geo.country_name || 'Unknown'),            inline: true },
          { name: '🏙️ City',         value: (geo && geo.city || '—') + ', ' + (geo && geo.region || '—'), inline: true },
          { name: '🌐 Banner Lang',  value: '`' + lang.toUpperCase() + '` — ' + (TRANSLATIONS[lang] && TRANSLATIONS[lang].title.replace('🍪 ', '') || lang), inline: true },
          { name: '🗣️ Browser Lang', value: lang2,                                                         inline: true },
          { name: '📄 Page',         value: '`' + page + '`',                                             inline: true },
          { name: '⏱️ Time on Page', value: timeOnSite,                                                    inline: true },
          { name: '🆔 Session',      value: '`' + sid + '`',                                              inline: true },
          { name: '🖥️ User Agent',   value: '```\n' + ua.substring(0, 200) + '\n```',                    inline: false }
        ],
        footer: { text: 'AIMO Cookie Logger v3 · ' + (isAccepted ? 'Analytics ENABLED' : 'Analytics DISABLED') },
        timestamp: now
      }]
    };

    fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(function () {});
  }

  function fetchGeoQuick() {
    return fetch('https://ipwho.is/', { signal: AbortSignal.timeout(5000) })
      .then(function(r) { return r.json(); })
      .then(function(d) { return d.success ? d : {}; })
      .catch(function() { return {}; });
  }

  function buildBanner(lang) {
    var t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    var banner = document.createElement('div');
    banner.id = 'aimoCookieBanner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.style.cssText = [
      'position:fixed', 'bottom:24px', 'left:50%', 'transform:translateX(-50%) translateY(80px)', 'opacity:0',
      'z-index:99999', 'max-width:560px', 'width:calc(100% - 40px)',
      'background:#1a1033', 'border:1.5px solid rgba(124,58,237,.3)',
      'border-radius:20px', 'padding:22px 24px',
      'box-shadow:0 24px 64px rgba(0,0,0,.55),0 0 0 1px rgba(124,58,237,.08)',
      'font-family:Inter,system-ui,sans-serif',
      'transition:transform .45s cubic-bezier(.34,1.56,.64,1),opacity .4s ease',
      'display:flex','align-items:flex-start','gap:16px',
    ].join(';');

    var icon = document.createElement('div');
    icon.style.cssText = 'font-size:1.7rem;flex-shrink:0;margin-top:2px';
    icon.textContent = '🍪';

    var body = document.createElement('div');
    body.style.flex = '1';

    var title = document.createElement('div');
    title.style.cssText = 'font-weight:800;font-size:.92rem;color:#fff;margin-bottom:7px;font-family:Poppins,Inter,sans-serif';
    title.textContent = t.title.replace('🍪 ', '');

    var msg = document.createElement('p');
    msg.style.cssText = 'font-size:.79rem;color:rgba(255,255,255,.55);line-height:1.6;margin:0 0 16px';
    msg.textContent = t.msg;

    var btns = document.createElement('div');
    btns.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;align-items:center';

    var acceptBtn = document.createElement('button');
    acceptBtn.textContent = t.accept;
    acceptBtn.style.cssText = [
      'background:linear-gradient(135deg,#7c3aed,#ec4899)', 'color:#fff', 'border:none', 'cursor:pointer',
      'border-radius:100px', 'padding:9px 22px', 'font-family:Poppins,Inter,sans-serif',
      'font-size:.78rem', 'font-weight:700', 'letter-spacing:.04em',
      'box-shadow:0 4px 16px rgba(124,58,237,.4)',
      'transition:transform .15s,box-shadow .15s',
    ].join(';');
    acceptBtn.onmouseenter = function () { this.style.transform = 'translateY(-2px)'; this.style.boxShadow = '0 8px 24px rgba(124,58,237,.5)'; };
    acceptBtn.onmouseleave = function () { this.style.transform = ''; this.style.boxShadow = '0 4px 16px rgba(124,58,237,.4)'; };

    var declineBtn = document.createElement('button');
    declineBtn.textContent = t.decline;
    declineBtn.style.cssText = [
      'background:transparent', 'color:rgba(255,255,255,.45)', 'border:1.5px solid rgba(255,255,255,.12)',
      'cursor:pointer', 'border-radius:100px', 'padding:8px 18px',
      'font-family:Poppins,Inter,sans-serif', 'font-size:.78rem', 'font-weight:600', 'letter-spacing:.04em',
      'transition:color .2s,border-color .2s',
    ].join(';');
    declineBtn.onmouseenter = function () { this.style.color = '#fff'; this.style.borderColor = 'rgba(255,255,255,.3)'; };
    declineBtn.onmouseleave = function () { this.style.color = 'rgba(255,255,255,.45)'; this.style.borderColor = 'rgba(255,255,255,.12)'; };

    var moreLink = document.createElement('a');
    moreLink.textContent = t.more;
    moreLink.href = '/privacy';
    moreLink.style.cssText = 'font-size:.75rem;color:rgba(124,58,237,.75);text-decoration:none;transition:color .2s';
    moreLink.onmouseenter = function () { this.style.color = '#a78bfa'; };
    moreLink.onmouseleave = function () { this.style.color = 'rgba(124,58,237,.75)'; };

    btns.appendChild(acceptBtn);
    btns.appendChild(declineBtn);
    btns.appendChild(moreLink);
    body.appendChild(title);
    body.appendChild(msg);
    body.appendChild(btns);
    banner.appendChild(icon);
    banner.appendChild(body);
    document.body.appendChild(banner);

    sessionStorage.setItem('aimo_page_start', Date.now().toString());

    // Slide in
    requestAnimationFrame(function () {
      setTimeout(function () {
        banner.style.transform = 'translateX(-50%) translateY(0)';
        banner.style.opacity = '1';
      }, 400);
    });

    function dismiss(decision) {
      banner.style.transform = 'translateX(-50%) translateY(80px)';
      banner.style.opacity = '0';
      setTimeout(function () { if (banner.parentNode) banner.parentNode.removeChild(banner); }, 500);
      // Set cookie for 365 days
      var exp = new Date(); exp.setFullYear(exp.getFullYear() + 1);
      document.cookie = 'aimo_cookie_consent=' + decision + ';expires=' + exp.toUTCString() + ';path=/;SameSite=Lax';
      // Geo then log
      fetchGeoQuick().then(function(geo) { sendCookieLog(decision, lang, geo); });
    }

    acceptBtn.addEventListener('click', function () { dismiss('accepted'); });
    declineBtn.addEventListener('click', function () { dismiss('declined'); });

    // Keyboard accessibility
    banner.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { dismiss('declined'); }
    });
  }

  // Boot: detect language, show banner after short delay
  var lang = detectLang();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(function () { buildBanner(lang); }, 1200); });
  } else {
    setTimeout(function () { buildBanner(lang); }, 1200);
  }
})();
