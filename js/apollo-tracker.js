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

    // Explicit ICP exceptions: always win over the business deny groups below.
    const ICP_EXCEPTIONS = [
        /montessori/i, /charter/i, /\bpcs\b/i, /\besd\b/i, /\besa\b/i, /\bboces\b/i,
        /intermediate unit/i, /education service/i, /association/i, /church/i, /\bcamps?\b/i,
        /christian/i, /academy/i, /catholic/i, /ministr/i, /diocese/i, /parish/i
    ];

    // Public school districts (Apollo rule): skipped unless a district exception matches.
    // Plain "school" never overrides this.
    const DISTRICT_PATTERNS = [
        /district/i, /unified/i, /\bisd\b/i, /public schools/i, /public school system/i,
        /county office of education/i, /board of education/i, /department of education/i
    ];
    const DISTRICT_EXCEPTIONS = [
        /montessori/i, /charter/i, /\besd\b/i, /\besa\b/i, /\bboces\b/i, /christian/i, /academy/i
    ];

    // Business deny groups (Aaron, 10/23). Checked after ICP_EXCEPTIONS but before the
    // generic ICP words, so "school district" is skipped even though "school" is an ICP word.
    const DENY_BUSINESS = [
        // Competitor / event-software vendors
        /planning center/i, /pushpay/i, /tithe\.?ly/i, /subsplash/i, /acs technologies/i,
        /campminder/i, /ultracamp/i, /campbrain/i, /campdoc/i, /active network/i, /eventbrite/i,
        /\bcvent\b/i, /regfox/i, /webconnex/i, /ticket tailor/i, /swapcard/i, /eventeny/i,
        /shopify/i, /square,? inc/i, /\bblock,? inc/i, /kev group/i, /heartland payment/i,
        /heartland school/i, /leagueapps/i, /teamsnap/i, /sportsengine/i, /blackbaud/i,
        /facts management/i, /powerschool/i,
        // Banks and insurers
        /\bbank\b/i, /bancorp/i, /jpmorgan/i, /wells fargo/i, /citigroup/i, /goldman/i,
        /credit union/i, /insurance/i, /state farm/i, /allstate/i, /geico/i, /progressive corp/i,
        /\bmetlife\b/i, /prudential/i, /nationwide mutual/i, /liberty mutual/i,
        // Healthcare
        /hospital/i, /health ?system/i, /\bclinic\b/i, /medical cent(er|re)/i, /kaiser/i,
        /healthcare/i, /health care/i
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
        function any(list, t) { return list.some(function (p) { return p.test(t); }); }
        if (any(NON_ICP_PATTERNS, text)) return { load: false, why: 'infrastructure: ' + text };
        if (any(DISTRICT_PATTERNS, text) && !any(DISTRICT_EXCEPTIONS, icpText)) return { load: false, why: 'public district: ' + text };
        if (any(ICP_EXCEPTIONS, icpText)) return { load: true, why: 'ICP exception: ' + text };
        if (any(DENY_BUSINESS, text)) return { load: false, why: 'non-ICP business: ' + text };
        if (any(ICP_PATTERNS, icpText)) return { load: true, why: 'ICP match: ' + text };
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
