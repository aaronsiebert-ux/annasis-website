(function () {
  var STORAGE_KEY = 'annasis_cookie_consent';
  var APOLLO_APP_ID = '6a74e7186eb280001427515e';

  function isHomePage() {
    var path = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
    return (
      path === '/annasis-website' ||
      path === '/annasis-website/index.html' ||
      path === '/' ||
      path === '/index.html'
    );
  }

  function loadApollo() {
    if (window.__annasisApolloLoaded) return;
    window.__annasisApolloLoaded = true;
    var n = Math.random().toString(36).substring(7);
    var o = document.createElement('script');
    o.src = 'https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache=' + n;
    o.async = true;
    o.defer = true;
    o.onload = function () {
      if (window.trackingFunctions && window.trackingFunctions.onLoad) {
        window.trackingFunctions.onLoad({ appId: APOLLO_APP_ID });
      }
    };
    document.head.appendChild(o);
  }

  function setConsent(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) {}
  }

  function getConsent() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function injectStyles() {
    if (document.getElementById('annasis-cookie-consent-style')) return;
    var s = document.createElement('style');
    s.id = 'annasis-cookie-consent-style';
    s.textContent =
      'html.cookie-consent-open,body.cookie-consent-open{overflow:hidden!important;}' +
      '.cookie-modal{position:fixed!important;top:0!important;right:0!important;bottom:0!important;left:0!important;z-index:2147483646!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important;box-sizing:border-box!important;}' +
      '.cookie-modal-backdrop{position:absolute!important;top:0!important;right:0!important;bottom:0!important;left:0!important;background:rgba(12,53,88,.65)!important;}' +
      '.cookie-modal-panel{position:relative!important;z-index:1!important;width:100%!important;max-width:440px!important;margin:0 auto!important;background:#fff!important;color:#1a1a1a!important;border:1px solid #d7dee7!important;border-radius:14px!important;box-shadow:0 18px 50px rgba(12,53,88,.35)!important;padding:28px 26px 24px!important;box-sizing:border-box!important;text-align:center!important;}' +
      '.cookie-modal-panel h2{margin:0 0 10px!important;font-size:24px!important;color:#0c3558!important;font-family:Fraunces,Georgia,serif!important;}' +
      '.cookie-modal-panel p{margin:0 0 22px!important;font-size:15px!important;line-height:1.5!important;color:#5b6b7c!important;}' +
      '.cookie-modal-actions{display:flex!important;gap:10px!important;justify-content:center!important;flex-wrap:wrap!important;}' +
      '.cookie-modal-actions .btn{padding:11px 18px!important;font-size:14px!important;min-width:120px!important;cursor:pointer!important;}' +
      '.cookie-modal-actions .btn.ghost{background:transparent!important;color:#0c3558!important;border:1px solid #d7dee7!important;}';
    document.head.appendChild(s);
  }

  function unlockPage() {
    document.documentElement.classList.remove('cookie-consent-open');
    document.body.classList.remove('cookie-consent-open');
  }

  function showModal() {
    injectStyles();
    document.documentElement.classList.add('cookie-consent-open');
    document.body.classList.add('cookie-consent-open');

    var root = document.createElement('div');
    root.className = 'cookie-modal';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'cookie-modal-title');
    root.innerHTML =
      '<div class="cookie-modal-backdrop" aria-hidden="true"></div>' +
      '<div class="cookie-modal-panel">' +
      '<h2 id="cookie-modal-title">Cookie preferences</h2>' +
      '<p>We use cookies for analytics to understand site visits and improve ANNASIS. Please accept or decline non-essential cookies to continue.</p>' +
      '<div class="cookie-modal-actions">' +
      '<button type="button" class="btn ghost cookie-decline">Decline</button>' +
      '<button type="button" class="btn cookie-accept">Accept</button>' +
      '</div></div>';
    document.body.appendChild(root);

    function close(choice) {
      setConsent(choice);
      if (root.parentNode) root.parentNode.removeChild(root);
      unlockPage();
      if (choice === 'accepted') loadApollo();
    }

    root.querySelector('.cookie-accept').addEventListener('click', function () { close('accepted'); });
    root.querySelector('.cookie-decline').addEventListener('click', function () { close('declined'); });

    // Block Esc / outside click — must answer
    root.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') e.preventDefault();
    });
    root.querySelector('.cookie-modal-backdrop').addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
    });

    var accept = root.querySelector('.cookie-accept');
    if (accept) accept.focus();
  }

  function init() {
    injectStyles();
    var consent = getConsent();
    if (consent === 'accepted') {
      loadApollo();
      return;
    }
    if (consent === 'declined') return;
    if (isHomePage()) {
      // Let visitors land first, then require a choice
      setTimeout(showModal, 5000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
