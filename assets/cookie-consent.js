(function () {
  var STORAGE_KEY = 'annasis_cookie_consent';
  var APOLLO_APP_ID = '6a74e7186eb280001427515e';

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

  function hideBanner(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function setConsent(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {}
  }

  function getConsent() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function showBanner() {
    var bar = document.createElement('div');
    bar.className = 'cookie-banner';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-live', 'polite');
    bar.setAttribute('aria-label', 'Cookie consent');
    bar.innerHTML =
      '<div class="cookie-banner-inner">' +
      '<p>We use cookies for analytics to understand site visits and improve ANNASIS. You can accept or decline non-essential cookies.</p>' +
      '<div class="cookie-banner-actions">' +
      '<button type="button" class="btn ghost cookie-decline">Decline</button>' +
      '<button type="button" class="btn cookie-accept">Accept</button>' +
      '</div></div>';
    document.body.appendChild(bar);

    bar.querySelector('.cookie-accept').addEventListener('click', function () {
      setConsent('accepted');
      hideBanner(bar);
      loadApollo();
    });
    bar.querySelector('.cookie-decline').addEventListener('click', function () {
      setConsent('declined');
      hideBanner(bar);
    });
  }

  function init() {
    var consent = getConsent();
    if (consent === 'accepted') {
      loadApollo();
      return;
    }
    if (consent === 'declined') return;
    showBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
