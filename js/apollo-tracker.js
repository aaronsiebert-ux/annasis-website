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
 *      data vendor, proxy/VPN)               -> skip Apollo
 *   4. Anything else (Comcast, Charter, T-Mobile,
 *      home ISPs, carriers, unknown,
 *      lookup failed)                              -> load Apollo
 * Rule of thumb from Aaron: if it isn't obviously out of scope, include it.
 * The decision is cached for the browser session.
 * Debug: add ?apollodebug=1 to any URL to see the decision in the console.
 */

(function () {
    const APOLLO_APP_ID = '6a74e7186eb280001427515e';
    const LOOKUP_URL = 'https://ipwho.is/';
    const LOOKUP_TIMEOUT_MS = 2500;
    const CACHE_KEY = 'annasisApolloDecision';

    // ICP allow-words (brief Part A). Any match loads Apollo and beats every deny list.
    const ICP_PATTERNS = [
        // School
        /school/i, /academy/i, /christian/i, /catholic/i, /parish/i, /diocese/i, /lutheran/i,
        /adventist/i, /baptist/i, /montessori/i, /classical/i, /\bprep(aratory)?\b/i,
        /charter/i, /\bpcs\b/i, /\bk-?12\b/i, /\.edu\b/i, /heritage/i, /covenant/i,
        /\bsaint\b/i, /\bst\.\s/i, /elementary/i,
        // ASSC: associations, accreditation, ESD/ESA/BOCES
        /association/i, /\bacsi\b/i, /accreditation/i, /conference of/i, /office of (education|schools)/i,
        /\besd\b/i, /\besa\b/i, /\bboces\b/i, /intermediate unit/i, /education service/i,
        // Church
        /church/i, /chapel/i, /ministr/i, /fellowship/i, /cathedral/i, /tabernacle/i, /assembly/i,
        /\bbible\b/i, /gospel/i, /worship/i, /congregation/i, /synagogue/i, /\btemple\b/i,
        // Camp
        /\bcamps?\b/i, /retreat/i, /conference cent(er|re)/i, /\bymca\b/i, /\bywca\b/i, /scouts?\b/i,
        // Events / conventions
        /\bcon\b/i, /comic/i, /\bexpo\b/i, /convention/i, /festival/i, /\bfest\b/i, /\bfair\b/i,
        /conference/i, /summit/i, /\bgala\b/i, /\bevents?\b/i, /productions/i, /\bvenue\b/i,
        /dance (studio|academy)/i, /ballet/i,
        // Sports leagues / associations
        /league/i, /soccer/i, /softball/i, /baseball/i, /basketball/i, /lacrosse/i, /hockey/i,
        /swim club/i, /golf association/i, /\bewga\b/i, /pickleball/i, /running club/i,
        /cycling club/i, /athletic association/i, /booster/i,
        // Store
        /spirit ?wear/i, /\bpto\b/i, /\bpta\b/i
    ];

    // Skip only clear infrastructure: cloud/hosting/CDN, scanners, data vendors,
    // proxy/VPN networks and crawler operators. ISPs, mobile carriers and unknown owners pass.
    const NON_ICP_PATTERNS = [
        // Cloud / hosting / CDN
        /amazon/i, /\baws\b/i, /google(?! fiber)/i, /microsoft/i, /azure/i, /oracle/i,
        /digitalocean/i, /linode/i, /akamai/i, /\bovh/i, /hetzner/i, /vultr/i, /cloudflare/i,
        /fastly/i, /alibaba/i, /tencent/i, /leaseweb/i, /contabo/i, /choopa/i, /m247/i,
        /datacamp/i, /scaleway/i, /rackspace/i, /hostinger/i, /\bhosting\b/i,
        /data ?cent(er|re)/i, /\bcolo(cation)?\b/i, /\bservers?\b/i, /\bvps\b/i, /\bcdn\b/i,
        // Scanners / security egress
        /censys/i, /shodan/i, /palo alto/i, /expanse/i, /rapid7/i, /qualys/i, /tenable/i,
        /recorded future/i, /binaryedge/i, /shadowserver/i, /internet ?measurement/i,
        /zscaler/i, /netskope/i,
        // Data vendors / crawlers / SEO / proxy networks / VPN
        /zoominfo/i, /\bapollo\b/i, /clearbit/i, /lusha/i, /semrush/i, /ahrefs/i, /\bmoz\b/i,
        /builtwith/i, /similarweb/i, /common ?crawl/i, /dataforseo/i, /bright ?data/i, /luminati/i,
        /oxylabs/i, /\bproxy\b/i, /\bvpn\b/i, /nordvpn/i, /expressvpn/i, /surfshark/i,
        /private internet access/i, /mullvad/i, /\btor\b/i,
        // Bot / AI crawler operators and uptime monitors
        /openai/i, /anthropic/i, /perplexity/i, /bytedance/i, /bytespider/i, /facebook/i,
        /meta platforms/i, /pingdom/i, /uptimerobot/i, /statuscake/i, /\bcrawl/i
    ];

    // ISP names that would otherwise trip an allow-word (e.g. "charter"). Removed before
    // ICP matching so they fall through to the default allow, untagged.
    const ISP_NEUTRAL = [/charter communications/ig, /spectrum/ig];

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
        let icpText = text;
        ISP_NEUTRAL.forEach(function (p) { icpText = icpText.replace(p, ' '); });
        if (ICP_PATTERNS.some(function (p) { return p.test(icpText); })) return { load: true, why: 'ICP match: ' + text };
        if (NON_ICP_PATTERNS.some(function (p) { return p.test(text); })) return { load: false, why: 'non-ICP: ' + text };
        return { load: true, why: 'default allow (ISP/carrier/other): ' + text };
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
