/**
 * ANNASIS Apollo website visitor tracker, with an ICP pre-filter.
 *
 * Goal: don't spend Apollo visitor credits on obvious non-ICP traffic.
 * Before Apollo's script loads, we look up the visitor's network owner
 * (free, keyless lookup) and decide:
 *   1. Bots / headless browsers            -> skip Apollo
 *   2. Owner looks like our market (school,
 *      church, camp, events, .edu, k12...)  -> load Apollo
 *   3. Owner is obviously out of scope
 *      (cloud host, data center, scanner,
 *      security/data firm, big corporate)   -> skip Apollo
 *   4. Anything else (Comcast, AT&T, home
 *      or business ISPs, unknown, lookup
 *      failed)                              -> load Apollo
 * Rule of thumb from Aaron: if it isn't obviously out of scope, include it.
 * The decision is cached for the browser session.
 * Debug: add ?apollodebug=1 to any URL to see the decision in the console.
 */

(function () {
    const APOLLO_APP_ID = '6a74e7186eb280001427515e';
    const LOOKUP_URL = 'https://ipwho.is/';
    const LOOKUP_TIMEOUT_MS = 2500;
    const CACHE_KEY = 'annasisApolloDecision';
    // Set to false to also skip home/business ISP traffic (saves more credits).
    const ALLOW_ISP_TRAFFIC = true;

    // Always load when the owner looks like our market. Wins over everything.
    const ICP_PATTERNS = [
        // Schools: private, Christian, Montessori, k12, .edu
        /school/i, /academy/i, /christian/i, /montessori/i, /\bk-?12\b/i, /\.edu\b/i,
        // Camps
        /\bcamps?\b/i,
        // Churches and ministries
        /church/i, /ministr/i,
        // Events, conventions, expos, leagues
        /\bevents?\b/i, /convention/i, /\bexpo\b/i, /\bleague\b/i
    ];

    // Obviously out of scope: cloud, hosting, data centers, scanners, data/security firms,
    // and very large corporate networks.
    const NON_ICP_PATTERNS = [
        /amazon/i, /\baws\b/i, /google/i, /microsoft/i, /azure/i, /oracle/i, /\bibm\b/i,
        /digitalocean/i, /linode/i, /akamai/i, /cloudflare/i, /fastly/i, /hetzner/i,
        /\bovh/i, /vultr/i, /leaseweb/i, /contabo/i, /choopa/i, /m247/i, /datacamp/i,
        /alibaba/i, /tencent/i, /huawei cloud/i, /scaleway/i, /rackspace/i, /hostinger/i,
        /godaddy/i, /\bhosting\b/i, /\bhost\b/i, /data ?cent(er|re)/i, /\bserver/i,
        /\bcloud\b/i, /\bvps\b/i, /colocation/i, /\bcdn\b/i,
        /censys/i, /shodan/i, /palo alto/i, /zscaler/i, /crowdstrike/i, /qualys/i,
        /rapid7/i, /tenable/i, /recorded future/i, /binaryedge/i, /internet ?measurement/i,
        /\bscan/i, /crawl/i, /\bbot\b/i, /security/i, /cyber/i, /threat/i, /\bvpn\b/i,
        /\bproxy\b/i, /\btor\b/i, /facebook/i, /\bmeta platforms/i, /apple inc/i,
        /\bbank\b/i, /jpmorgan/i, /wells fargo/i, /citigroup/i, /goldman/i, /walmart/i,
        /salesforce/i, /zoominfo/i, /\bapollo\b/i, /clearbit/i, /6sense/i, /demandbase/i
    ];

    const BOT_UA = /bot|crawl|spider|slurp|headless|phantom|puppeteer|playwright|selenium|lighthouse|pingdom|uptime|monitor|scan|curl|wget|python|httpclient|java\//i;

    const debug = /[?&]apollodebug=1/.test(location.search);
    function log(msg, extra) { if (debug) console.log('[ANNASIS Apollo filter] ' + msg, extra || ''); }

    function isBot() {
        return navigator.webdriver === true || BOT_UA.test(navigator.userAgent || '');
    }

    function classify(info) {
        if (!info || info.success === false) return { load: true, why: 'lookup failed, allow' };
        const c = info.connection || {};
        const text = [c.org, c.isp, c.domain].filter(Boolean).join(' | ');
        if (!text) return { load: true, why: 'no owner info, allow' };
        if (ICP_PATTERNS.some(function (p) { return p.test(text); })) return { load: true, why: 'ICP match: ' + text };
        if (NON_ICP_PATTERNS.some(function (p) { return p.test(text); })) return { load: false, why: 'non-ICP: ' + text };
        if (!ALLOW_ISP_TRAFFIC) return { load: false, why: 'ISP/other skipped by setting: ' + text };
        return { load: true, why: 'not obviously out of scope: ' + text };
    }

    function runApolloTracking() {
        if (window.trackingFunctions && window.trackingFunctions.onLoad) {
            window.trackingFunctions.onLoad({ appId: APOLLO_APP_ID });
        }
    }

    function loadApollo() {
        if (window.__annasisApolloLoaded) { runApolloTracking(); return; }
        window.__annasisApolloLoaded = true;
        const nocache = Math.random().toString(36).substring(7);
        const script = document.createElement('script');
        script.src = 'https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache=' + nocache;
        script.async = true;
        script.defer = true;
        script.onload = runApolloTracking;
        document.head.appendChild(script);
    }

    function apply(decision) {
        window.__annasisApolloDecision = decision;
        log(decision.load ? 'LOAD Apollo' : 'SKIP Apollo', decision.why);
        if (decision.load) loadApollo();
    }

    function decide() {
        if (isBot()) { apply({ load: false, why: 'bot/headless browser' }); return; }
        try {
            const cached = sessionStorage.getItem(CACHE_KEY);
            if (cached && !debug) { apply(JSON.parse(cached)); return; }
        } catch (e) { /* storage blocked, continue */ }

        let done = false;
        function finish(decision) {
            if (done) return;
            done = true;
            try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(decision)); } catch (e) { }
            apply(decision);
        }
        const timer = setTimeout(function () { finish({ load: true, why: 'lookup timeout, allow' }); }, LOOKUP_TIMEOUT_MS);
        fetch(LOOKUP_URL, { cache: 'no-store' })
            .then(function (r) { return r.json(); })
            .then(function (info) { clearTimeout(timer); finish(classify(info)); })
            .catch(function () { clearTimeout(timer); finish({ load: true, why: 'lookup error, allow' }); });
    }

    // Exposed for testing only.
    window.__annasisApolloClassify = classify;

    decide();

    // Blazor enhanced navigation: only re-run if Apollo was allowed.
    document.addEventListener('enhancedload', function () {
        if (window.__annasisApolloLoaded) runApolloTracking();
    });
})();
