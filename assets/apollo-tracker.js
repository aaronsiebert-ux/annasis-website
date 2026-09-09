/**
 * ANNASIS Apollo website visit tracker
 * Loaded only after cookie consent is accepted.
 * Apollo's tracker library itself is fetched from Apollo's CDN.
 */
(function () {
  var APOLLO_APP_ID = '6a74e7186eb280001427515e';

  function initApollo() {
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

  // Expose for cookie-consent.js
  window.annasisLoadApollo = initApollo;

  // If this file is included alone after consent was already granted, start tracking
  try {
    if (localStorage.getItem('annasis_cookie_consent') === 'accepted') {
      initApollo();
    }
  } catch (e) {}
})();
