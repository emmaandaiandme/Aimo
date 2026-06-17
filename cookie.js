(function () {
  var COOKIE_KEY  = 'aimo_cookie_consent';
  var PREF_KEY    = 'aimo_cookie_prefs';

  function getCookie(name) {
    var m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return m ? m.pop() : null;
  }

  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = name + '=' + value + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
  }

  function getPrefs() {
    try {
      return JSON.parse(localStorage.getItem(PREF_KEY) || '{"analytics":true,"functional":true}');
    } catch (e) { return { analytics: true, functional: true }; }
  }

  function savePrefs(prefs) {
    try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) {}
  }

  function removeBanner() {
    var b = document.getElementById('aimoCookieBanner');
    if (b) {
      b.style.transform = 'translateX(-50%) translateY(calc(100% + 40px))';
      b.style.opacity = '0';
      setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 450);
    }
  }

  function removeModal() {
    var m = document.getElementById('aimoCookieModal');
    if (m) { m.style.opacity = '0'; setTimeout(function () { if (m.parentNode) m.parentNode.removeChild(m); }, 300); }
    var o = document.getElementById('aimoCookieOverlay');
    if (o) { o.style.opacity = '0'; setTimeout(function () { if (o.parentNode) o.parentNode.removeChild(o); }, 300); }
  }

  function openCustomize() {
    if (document.getElementById('aimoCookieModal')) return;
    var prefs = getPrefs();

    var overlayEl = document.createElement('div');
    overlayEl.id = 'aimoCookieOverlay';
    overlayEl.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100000;transition:opacity .3s;backdrop-filter:blur(3px);';
    overlayEl.onclick = removeModal;
    document.body.appendChild(overlayEl);
    requestAnimationFrame(function () { overlayEl.style.opacity = '1'; });

    var modal = document.createElement('div');
    modal.id = 'aimoCookieModal';
    modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(.96);z-index:100001;width:calc(100% - 32px);max-width:500px;background:#fff;border-radius:24px;box-shadow:0 24px 80px rgba(124,58,237,.22),0 4px 20px rgba(0,0,0,.12);font-family:"Inter","Poppins",sans-serif;opacity:0;transition:opacity .3s,transform .3s;overflow:hidden;';

    modal.innerHTML = [
      '<div style="background:linear-gradient(135deg,#7c3aed,#ec4899);padding:20px 24px;color:white;display:flex;align-items:center;gap:12px;">',
      '  <div style="width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">',
      '    <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M21.598 11.064A1 1 0 0020.6 10c-.925 0-1.833-.5-2.348-1.3a1 1 0 00-1.414-.3 3.011 3.011 0 01-3.762-.424 1 1 0 00-1.414 0A3.011 3.011 0 018.9 8.4a1 1 0 00-1.414.3C6.971 9.5 6.063 10 5.138 10a1 1 0 00-.998 1.064 10 10 0 1017.458 0zM12 20a8 8 0 110-16 7.98 7.98 0 01-.056 16zm-1-5a1 1 0 112 0 1 1 0 01-2 0zm-2-5a1 1 0 112 0 1 1 0 01-2 0zm6 0a1 1 0 112 0 1 1 0 01-2 0z"/></svg>',
      '  </div>',
      '  <div style="flex:1">',
      '    <div style="font-family:\'Poppins\',sans-serif;font-size:1rem;font-weight:800;margin-bottom:2px;">Cookie Preferences</div>',
      '    <div style="font-size:.76rem;opacity:.85;">Choose what cookies AIMO may use</div>',
      '  </div>',
      '  <button id="ckModalClose" style="background:rgba(255,255,255,.2);border:none;border-radius:8px;width:30px;height:30px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:white;flex-shrink:0;">',
      '    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      '  </button>',
      '</div>',
      '<div style="padding:20px 24px;display:flex;flex-direction:column;gap:14px;">',
      /* Essential - always on */
      '  <div style="display:flex;align-items:flex-start;gap:14px;padding:16px;background:#f8f4ff;border-radius:14px;border:1.5px solid rgba(124,58,237,.12);">',
      '    <div style="width:42px;height:24px;flex-shrink:0;background:linear-gradient(135deg,#7c3aed,#ec4899);border-radius:100px;display:flex;align-items:center;padding:3px;margin-top:2px;">',
      '      <div style="width:18px;height:18px;border-radius:50%;background:#fff;margin-left:auto;"></div>',
      '    </div>',
      '    <div>',
      '      <div style="font-family:\'Poppins\',sans-serif;font-size:.88rem;font-weight:700;color:#1a1a2e;margin-bottom:3px;display:flex;align-items:center;gap:6px;">Essential <span style="font-size:.68rem;font-weight:700;padding:2px 8px;border-radius:100px;background:rgba(124,58,237,.1);color:#7c3aed;">Always ON</span></div>',
      '      <div style="font-size:.78rem;color:#64748b;line-height:1.5;">Required for the site to function — session storage, security tokens. Cannot be disabled.</div>',
      '    </div>',
      '  </div>',
      /* Analytics */
      '  <div style="display:flex;align-items:flex-start;gap:14px;padding:16px;background:#f9fafb;border-radius:14px;border:1.5px solid #e2e8f0;" id="ckRowAnalytics">',
      '    <div id="ckToggleAnalytics" data-on="' + (prefs.analytics ? '1' : '0') + '" style="width:42px;height:24px;flex-shrink:0;border-radius:100px;display:flex;align-items:center;padding:3px;margin-top:2px;cursor:pointer;transition:background .25s;background:' + (prefs.analytics ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : '#cbd5e1') + ';">',
      '      <div style="width:18px;height:18px;border-radius:50%;background:#fff;transition:margin .25s;margin-left:' + (prefs.analytics ? 'auto' : '0') + ';"></div>',
      '    </div>',
      '    <div>',
      '      <div style="font-family:\'Poppins\',sans-serif;font-size:.88rem;font-weight:700;color:#1a1a2e;margin-bottom:3px;">Analytics</div>',
      '      <div style="font-size:.78rem;color:#64748b;line-height:1.5;">Anonymous visit data (country, browser, device) used to improve the site experience. No personal data stored.</div>',
      '    </div>',
      '  </div>',
      /* Functional */
      '  <div style="display:flex;align-items:flex-start;gap:14px;padding:16px;background:#f9fafb;border-radius:14px;border:1.5px solid #e2e8f0;" id="ckRowFunctional">',
      '    <div id="ckToggleFunctional" data-on="' + (prefs.functional ? '1' : '0') + '" style="width:42px;height:24px;flex-shrink:0;border-radius:100px;display:flex;align-items:center;padding:3px;margin-top:2px;cursor:pointer;transition:background .25s;background:' + (prefs.functional ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : '#cbd5e1') + ';">',
      '      <div style="width:18px;height:18px;border-radius:50%;background:#fff;transition:margin .25s;margin-left:' + (prefs.functional ? 'auto' : '0') + ';"></div>',
      '    </div>',
      '    <div>',
      '      <div style="font-family:\'Poppins\',sans-serif;font-size:.88rem;font-weight:700;color:#1a1a2e;margin-bottom:3px;">Functional</div>',
      '      <div style="font-size:.78rem;color:#64748b;line-height:1.5;">Remembers your preferences (visit count, player state). Stored locally on your device only.</div>',
      '    </div>',
      '  </div>',
      '</div>',
      '<div style="padding:16px 24px 20px;display:flex;gap:10px;border-top:1px solid #f1f5f9;">',
      '  <button id="ckSavePrefs" style="flex:1;padding:11px;border:none;border-radius:100px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;font-family:\'Poppins\',sans-serif;font-size:.84rem;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(124,58,237,.3);">Save Preferences</button>',
      '  <button id="ckAcceptAllModal" style="flex:1;padding:11px;border:none;border-radius:100px;background:#f1f5f9;color:#475569;font-family:\'Poppins\',sans-serif;font-size:.84rem;font-weight:700;cursor:pointer;">Accept All</button>',
      '</div>'
    ].join('');

    document.body.appendChild(modal);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        modal.style.opacity = '1';
        modal.style.transform = 'translate(-50%,-50%) scale(1)';
      });
    });

    document.getElementById('ckModalClose').onclick = removeModal;

    function makeToggle(id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', function () {
        var on = el.getAttribute('data-on') === '1';
        var newOn = !on;
        el.setAttribute('data-on', newOn ? '1' : '0');
        el.style.background = newOn ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : '#cbd5e1';
        el.querySelector('div').style.marginLeft = newOn ? 'auto' : '0';
      });
    }
    makeToggle('ckToggleAnalytics');
    makeToggle('ckToggleFunctional');

    document.getElementById('ckSavePrefs').onclick = function () {
      var prefs2 = {
        analytics:  document.getElementById('ckToggleAnalytics').getAttribute('data-on') === '1',
        functional: document.getElementById('ckToggleFunctional').getAttribute('data-on') === '1'
      };
      savePrefs(prefs2);
      setCookie(COOKIE_KEY, 'customized', 365);
      removeModal();
      removeBanner();
    };

    document.getElementById('ckAcceptAllModal').onclick = function () {
      savePrefs({ analytics: true, functional: true });
      setCookie(COOKIE_KEY, 'accepted', 365);
      removeModal();
      removeBanner();
    };
  }

  function createBanner() {
    if (document.getElementById('aimoCookieBanner')) return;

    var style = document.createElement('style');
    style.textContent = [
      '#aimoCookieBanner{position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(calc(100% + 40px));z-index:99999;width:calc(100% - 32px);max-width:920px;transition:transform .55s cubic-bezier(.34,1.4,.64,1),opacity .4s ease;opacity:0;font-family:"Inter","Poppins",sans-serif;}',
      '.ck-wrap{background:#fff;border:1.5px solid rgba(124,58,237,.16);border-radius:24px;box-shadow:0 20px 60px rgba(124,58,237,.15),0 4px 20px rgba(0,0,0,.08);overflow:hidden;}',
      '.ck-top{display:flex;align-items:center;gap:14px;padding:18px 22px 14px;border-bottom:1px solid rgba(124,58,237,.08);}',
      '.ck-icon-box{width:44px;height:44px;min-width:44px;border-radius:12px;background:linear-gradient(135deg,#7c3aed,#ec4899);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(124,58,237,.28);}',
      '.ck-title{font-family:"Poppins",sans-serif;font-size:.92rem;font-weight:800;color:#1a1a2e;margin-bottom:1px;}',
      '.ck-title .ck-grad{background:linear-gradient(135deg,#7c3aed,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}',
      '.ck-subtitle{font-size:.74rem;color:#94a3b8;font-weight:500;}',
      '.ck-close{background:none;border:none;cursor:pointer;padding:5px;border-radius:8px;color:#94a3b8;display:flex;transition:background .2s,color .2s;flex-shrink:0;margin-left:auto;}',
      '.ck-close:hover{background:rgba(239,68,68,.08);color:#ef4444;}',
      '.ck-bottom{display:flex;align-items:center;gap:10px;padding:12px 22px 16px;flex-wrap:wrap;}',
      '.ck-desc{flex:1;min-width:180px;font-size:.78rem;color:#64748b;line-height:1.6;}',
      '.ck-desc a{color:#7c3aed;font-weight:600;text-decoration:none;}',
      '.ck-actions{display:flex;align-items:center;gap:8px;flex-shrink:0;}',
      '.ck-btn{padding:9px 20px;border-radius:100px;font-family:"Poppins",sans-serif;font-size:.8rem;font-weight:700;cursor:pointer;white-space:nowrap;line-height:1;border:none;transition:all .2s;}',
      '.ck-decline{background:#f1f5f9;color:#64748b;}',
      '.ck-decline:hover{background:#e2e8f0;color:#475569;}',
      '.ck-customize{background:rgba(124,58,237,.09);color:#7c3aed;border:1.5px solid rgba(124,58,237,.2) !important;}',
      '.ck-customize:hover{background:rgba(124,58,237,.16);}',
      '.ck-accept{background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;box-shadow:0 4px 14px rgba(124,58,237,.3);}',
      '.ck-accept:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(124,58,237,.44);}',
      '@media(max-width:600px){.ck-bottom{flex-direction:column;align-items:stretch;}.ck-actions{flex-direction:column;}.ck-btn{text-align:center;}}'
    ].join('');
    document.head.appendChild(style);

    var banner = document.createElement('div');
    banner.id = 'aimoCookieBanner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML = [
      '<div class="ck-wrap">',
      '  <div class="ck-top">',
      '    <div class="ck-icon-box">',
      '      <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M21.598 11.064A1 1 0 0020.6 10c-.925 0-1.833-.5-2.348-1.3a1 1 0 00-1.414-.3 3.011 3.011 0 01-3.762-.424 1 1 0 00-1.414 0A3.011 3.011 0 018.9 8.4a1 1 0 00-1.414.3C6.971 9.5 6.063 10 5.138 10a1 1 0 00-.998 1.064 10 10 0 1017.458 0zM12 20a8 8 0 110-16 7.98 7.98 0 01-.056 16zm-1-5a1 1 0 112 0 1 1 0 01-2 0zm-2-5a1 1 0 112 0 1 1 0 01-2 0zm6 0a1 1 0 112 0 1 1 0 01-2 0z"/></svg>',
      '    </div>',
      '    <div style="flex:1;min-width:0;">',
      '      <div class="ck-title">We use <span class="ck-grad">cookies</span> 🍪</div>',
      '      <div class="ck-subtitle">AIMO uses cookies to improve your experience</div>',
      '    </div>',
      '    <button class="ck-close" id="ckClose" aria-label="Dismiss">',
      '      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      '    </button>',
      '  </div>',
      '  <div class="ck-bottom">',
      '    <p class="ck-desc">We collect anonymous data to improve your experience. Your data is never sold. <a href="/privacy">Privacy Policy</a></p>',
      '    <div class="ck-actions">',
      '      <button id="ckDecline" class="ck-btn ck-decline">Decline</button>',
      '      <button id="ckCustomize" class="ck-btn ck-customize">',
      '        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:4px"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>',
      '        Customize',
      '      </button>',
      '      <button id="ckAccept" class="ck-btn ck-accept">Accept All</button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');

    document.body.appendChild(banner);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        banner.style.transform = 'translateX(-50%) translateY(0)';
        banner.style.opacity = '1';
      });
    });

    document.getElementById('ckAccept').onclick = function () {
      savePrefs({ analytics: true, functional: true });
      setCookie(COOKIE_KEY, 'accepted', 365);
      removeBanner();
    };
    document.getElementById('ckDecline').onclick = function () {
      savePrefs({ analytics: false, functional: false });
      setCookie(COOKIE_KEY, 'declined', 30);
      removeBanner();
    };
    document.getElementById('ckClose').onclick = function () {
      setCookie(COOKIE_KEY, 'dismissed', 7);
      removeBanner();
    };
    document.getElementById('ckCustomize').onclick = function () {
      openCustomize();
    };
  }

  window.resetCookieConsent = function () {
    document.cookie = COOKIE_KEY + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
    var existing = document.getElementById('aimoCookieBanner');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    setTimeout(createBanner, 300);
  };

  window.openCookieSettings = openCustomize;

  function init() {
    if (!getCookie(COOKIE_KEY)) {
      setTimeout(createBanner, 1200);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
