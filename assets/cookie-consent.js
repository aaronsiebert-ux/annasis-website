(function () {
  var STORAGE_KEY = 'annasis_cookie_consent';
  var APOLLO_APP_ID = '6a74e7186eb280001427515e';

  function isHomePage() {
    var path = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
    return path === '/annasis-website' || path === '/annasis-website/index.html' || path === '/' || path === '/index.html';
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

  function unlockPage() {
    document.documentElement.classList.remove('cookie-consent-open');
    document.body.classList.remove('cookie-consent-open');
  }

  function showModal() {
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

    var accept = root.querySelector('.cookie-accept');
    if (accept) accept.focus();

    root.querySelector('.cookie-accept').addEventListener('click', function () {
      setConsent('accepted');
      root.parentNode.removeChild(root);
      unlockPage();
      loadApollo();
    });
    root.querySelector('.cookie-decline').addEventListener('click', function () {
      setConsent('declined');
      root.parentNode.removeChild(root);
      unlockPage();
    });
  }

  function init() {
    var consent = getConsent();
    if (consent === 'accepted') {
      loadApollo();
      return;
    }
    if (consent === 'declined') return;
    // Ask only once, on the home page
    if (isHomePage()) showModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
