/**
 * ANNASIS Apollo website visitor tracker.
 * Loads immediately on every site visit.
 * Also reinitializes after Blazor enhanced navigation.
 */

(function () {
    const APOLLO_APP_ID = '6a74e7186eb280001427515e';

    function runApolloTracking() {
        if (window.trackingFunctions && window.trackingFunctions.onLoad) {
            window.trackingFunctions.onLoad({
                appId: APOLLO_APP_ID
            });
        }
    }

    function loadApollo() {
        if (window.__annasisApolloLoaded) {
            runApolloTracking();
            return;
        }

        window.__annasisApolloLoaded = true;

        const nocache = Math.random().toString(36).substring(7);
        const script = document.createElement('script');

        script.src =
            'https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache=' +
            nocache;

        script.async = true;
        script.defer = true;

        script.onload = function () {
            runApolloTracking();
        };

        document.head.appendChild(script);
    }

    // Initial page load
    loadApollo();

    // Blazor enhanced navigation
    document.addEventListener('enhancedload', function () {
        runApolloTracking();
    });
})();