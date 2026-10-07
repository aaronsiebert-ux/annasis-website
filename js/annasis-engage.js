/* =========================================================
   ANNASIS Engage — "Are we a fit?" quiz, Anna chat assistant,
   and lead capture. Self-contained: this file + css/annasis-engage.css.
   No backend required. No API tokens belong in this file.

   Include on every page (after js/annasis.js):
     <link rel="stylesheet" href="css/annasis-engage.css" />
     <script src="js/annasis-engage.js" defer></script>
   Quiz renders into any element with [data-annasis-quiz] (fit.html).
   Support form renders into [data-annasis-support-form] (support.html).
   Contact summary renders on contact.html above the Pipedrive form.

   To change settings without editing this file, define
   window.ANNASIS_ENGAGE_CONFIG = { ... } before this script loads;
   values are merged over the defaults below.
   ========================================================= */

(function () {
    'use strict';

    if (window.__annasisEngageLoaded) { return; }
    window.__annasisEngageLoaded = true;

    /* ---------------------------------------------------------
       CONFIG
       --------------------------------------------------------- */
    var DEFAULTS = {
        // Our scripted Anna chat widget (bottom-right). Default ON for the preview.
        chatEnabled: true,

        // leadboosterMode: true  -> do NOT mount our chat; show the Pipedrive
        //                           LeadBooster chatbot (Anna) instead.
        //                  false -> mount our chat and hide the LeadBooster
        //                           bubble so the two never show at once.
        // The quiz works the same either way.
        leadboosterMode: false,

        // LeadBooster chatbot install values (read from the live site's
        // js/annasis.js, which already loads LeadBooster on every page).
        // If a page does not already load LeadBooster and leadboosterMode is on,
        // this file loads it with these values. To replace, paste the values from
        // Pipedrive > LeadBooster > Chatbot > (playbook) > Install code:
        //   window.pipedriveLeadboosterConfig = {
        //       base: 'leadbooster-chat.pipedrive.com',
        //       companyId: 13851722,
        //       playbookUuid: 'fe7940be-2952-44fb-aa6c-ea33b7fa01df',
        //       version: 2
        //   };
        //   <script src="https://leadbooster-chat.pipedrive.com/assets/loader.js" async></script>
        leadbooster: {
            base: 'leadbooster-chat.pipedrive.com',
            companyId: 13851722,
            playbookUuid: 'fe7940be-2952-44fb-aa6c-ea33b7fa01df',
            version: 2,
            loaderSrc: 'https://leadbooster-chat.pipedrive.com/assets/loader.js',
            loadIfMissing: true
        },

        // Anna — name, picture, greeting, and color match the existing
        // LeadBooster playbook settings (botName "Anna", mainColor #1855AA).
        anna: {
            name: 'Anna',
            title: 'Anna · ANNASIS assistant',
            subtitle: 'Answers from the ANNASIS site',
            annaAvatar: 'Images/anna-bot-avatar.png',
            color: '#1855AA',
            greeting: 'Welcome to our website!',
            prompt: 'What brought you to our website today? Pick a topic below or type a question.',
            launcherLead: 'Questions?',
            launcherLabel: 'Chat with Anna',
            nudge: 'Questions? I can help.'
        },

        // Subtle nudge once per session (ms after load). 0 disables.
        nudgeDelayMs: 20000,

        // Page links (relative for the static preview; the Blazor site may use /fit, /contact, ...).
        urls: {
            quiz: 'fit.html#fit-quiz',
            contact: 'contact.html',
            support: 'support.html',
            education: 'education.html',
            events: 'events.html',
            ecommerce: 'ecommerce.html',
            integrations: 'integrations.html',
            different: 'different.html',
            camps: 'camps.html',
            churches: 'churches.html',
            partner: 'partner.html',
            about: 'about.html',
            stories: 'stories.html'
        },

        // Support contact shown by Anna's "Get support" path.
        // Support page: urls.support (support.html). No dedicated support inbox yet
        // (only sales@annasis.com is public). TODO: set support.email to support@annasis.com
        // when Aaron confirms that inbox; leave url empty (the Support page is urls.support).
        // While email is empty, Anna says the ANNASIS team will follow up by email.
        support: {
            email: '',
            url: ''
        },

        // Lead submission — see ANNASIS_LEAD below and NEXT_VERSION_NOTES.md (payload schema).
        lead: {
            // endpoint: '' (default) -> no network call; people go to contact.html,
            //   which embeds the Pipedrive web form, with a copy-ready summary above the form.
            //   (Pipedrive Web Forms cannot be prefilled or posted to from another page.)
            // endpoint: 'https://annasis-lead.<you>.workers.dev' (tools/pipedrive-lead-worker)
            //   or a Zapier / Make URL -> POST the flat JSON payload; the server creates
            //   Person + Organization + Lead + Note in Pipedrive with a token kept server-side.
            endpoint: '',
            // Sent as text/plain so the browser makes a "simple" request (no CORS preflight).
            // The body is still JSON; the Worker / Zapier / Make parse it.
            contentType: 'text/plain;charset=UTF-8',
            // 'cors' (default): the response status is readable. The ANNASIS lead Worker sends
            //   CORS headers, so if Pipedrive rejects a lead the visitor is sent to the contact
            //   page instead of the lead being lost.
            // 'no-cors': for a webhook that sends no CORS headers. The response is opaque and
            //   counted as success; only a network failure falls back to the contact page.
            fetchMode: 'cors',
            timeoutMs: 10000,
            fallbackUrl: 'contact.html',
            // Testing only: ?ae_endpoint=<url> overrides `endpoint` for this browser tab
            // (sessionStorage) — honored ONLY on these hosts, never on www.annasis.com.
            // ?ae_endpoint=off clears the override.
            endpointOverrideHosts: ['aaronsiebert-ux.github.io']
        }
    };

    function merge(base, over) {
        var out = {};
        var k;
        for (k in base) { if (Object.prototype.hasOwnProperty.call(base, k)) { out[k] = base[k]; } }
        if (!over) { return out; }
        for (k in over) {
            if (!Object.prototype.hasOwnProperty.call(over, k)) { continue; }
            if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) && over[k] && typeof over[k] === 'object') {
                out[k] = merge(base[k], over[k]);
            } else {
                out[k] = over[k];
            }
        }
        return out;
    }

    var CONFIG = merge(DEFAULTS, window.ANNASIS_ENGAGE_CONFIG || {});
    window.ANNASIS_ENGAGE = { config: CONFIG };

    /* ---------------------------------------------------------
       Small helpers
       --------------------------------------------------------- */
    var store = {
        get: function (k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } },
        set: function (k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) { /* private mode */ } },
        del: function (k) { try { window.sessionStorage.removeItem(k); } catch (e) { /* ignore */ } }
    };

    function el(tag, attrs, children) {
        var node = document.createElement(tag);
        if (attrs) {
            Object.keys(attrs).forEach(function (key) {
                var val = attrs[key];
                if (val === null || val === undefined || val === false) { return; }
                if (key === 'text') { node.textContent = val; }
                else if (key === 'className') { node.className = val; }
                else if (key.indexOf('on') === 0 && typeof val === 'function') { node.addEventListener(key.slice(2), val); }
                else { node.setAttribute(key, val === true ? '' : val); }
            });
        }
        (children || []).forEach(function (c) {
            if (c === null || c === undefined) { return; }
            node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
        });
        return node;
    }

    var uid = 0;
    function nextId(prefix) { uid += 1; return prefix + '-' + uid; }

    function qs(params) {
        return Object.keys(params).filter(function (k) {
            return params[k] !== undefined && params[k] !== null && params[k] !== '';
        }).map(function (k) {
            return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
        }).join('&');
    }

    function readParams() {
        var out = {};
        var search = window.location.search.replace(/^\?/, '');
        if (!search) { return out; }
        search.split('&').forEach(function (pair) {
            var i = pair.indexOf('=');
            var k = decodeURIComponent((i < 0 ? pair : pair.slice(0, i)).replace(/\+/g, ' '));
            var v = i < 0 ? '' : decodeURIComponent(pair.slice(i + 1).replace(/\+/g, ' '));
            if (k) { out[k] = v; }
        });
        return out;
    }

    function isPage(name) {
        var path = window.location.pathname.toLowerCase();
        return new RegExp('/' + name + '(\\.html)?/?$').test(path);
    }

    function has(list, v) { return (list || []).indexOf(v) >= 0; }

    function readJSON(k, d) { try { return JSON.parse(store.get(k)) || d; } catch (e) { return d; } }

    /* ---------------------------------------------------------
       Test-only endpoint override: ?ae_endpoint=<url>
       Honored only on CONFIG.lead.endpointOverrideHosts (the GitHub Pages
       preview). Stored in sessionStorage for this tab, then removed from the
       address bar so it never lands in pageUrl / landingPage.
       --------------------------------------------------------- */
    var ENDPOINT_OVERRIDE_KEY = 'annasis_ae_endpoint';
    function overrideAllowed() {
        return (CONFIG.lead.endpointOverrideHosts || []).indexOf(window.location.hostname) >= 0;
    }
    (function captureEndpointOverride() {
        var p = readParams();
        if (!Object.prototype.hasOwnProperty.call(p, 'ae_endpoint')) { return; }
        if (overrideAllowed()) {
            var v = String(p.ae_endpoint || '').trim();
            if (!v || v === 'off' || v === 'clear') {
                store.del(ENDPOINT_OVERRIDE_KEY);
            } else if (/^https:\/\/[^\s"'<>]+$/i.test(v) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/[^\s"'<>]*)?$/i.test(v)) {
                store.set(ENDPOINT_OVERRIDE_KEY, v);
            }
        }
        if (window.history && window.history.replaceState) {
            var rest = window.location.search.replace(/^\?/, '').split('&').filter(function (pair) {
                return pair && pair.split('=')[0] !== 'ae_endpoint';
            }).join('&');
            window.history.replaceState(window.history.state, '', window.location.pathname + (rest ? '?' + rest : '') + window.location.hash);
        }
    })();
    function leadEndpoint() {
        if (overrideAllowed()) {
            var o = store.get(ENDPOINT_OVERRIDE_KEY);
            if (o) { return o; }
        }
        return CONFIG.lead.endpoint || '';
    }

    /* ---------------------------------------------------------
       UTM / landing capture (first page of the session)
       --------------------------------------------------------- */
    (function captureLanding() {
        if (store.get('annasis_landing')) { return; }
        var p = readParams();
        var utm = {};
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'msclkid'].forEach(function (k) {
            if (p[k]) { utm[k] = p[k]; }
        });
        store.set('annasis_landing', JSON.stringify({
            landingPage: window.location.href.split('#')[0],
            referrer: document.referrer || '',
            utm: utm
        }));
    })();

    /* =========================================================
       ANNASIS_LEAD — one place every quiz and chat lead goes.

       The browser builds ONE flat JSON payload (schema in NEXT_VERSION_NOTES.md):
         type ('sales' | 'support'), source, name, firstName, lastName, email, phone,
         role, organization, orgType, size, currentTools[], pains[], plan, timeline,
         recommendation, modules[], topics[], supportCategory, message, leadTitle,
         noteText, pageUrl, landingPage, referrer, utm_source, utm_medium,
         utm_campaign, utm_term, utm_content, gclid, submittedAt
         (+ intent, questions[], customerStatus, website = honeypot, always '').
       It is POSTed as text/plain (no CORS preflight) to CONFIG.lead.endpoint —
       e.g. tools/pipedrive-lead-worker (Cloudflare Worker), which creates the
       Pipedrive Organization + Person + Lead + Note (sales) or Note + Activity
       (support) with a token kept server-side. Never put a Pipedrive token here.
       No endpoint (or the POST fails) → contact.html with a copy-ready summary.
       ========================================================= */
    var LEAD_STORAGE_KEY = 'annasis_lead_summary';

    var PAYLOAD_STRINGS = ['type', 'source', 'intent', 'name', 'firstName', 'lastName', 'email', 'phone', 'role',
        'organization', 'orgType', 'size', 'plan', 'timeline', 'recommendation', 'customerStatus', 'supportCategory',
        'message', 'leadTitle', 'noteText', 'pageUrl', 'landingPage', 'referrer', 'utm_source', 'utm_medium',
        'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'submittedAt', 'website'];
    var PAYLOAD_LISTS = ['currentTools', 'pains', 'modules', 'topics', 'questions'];
    var PAYLOAD_ORDER = ['type', 'source', 'name', 'firstName', 'lastName', 'email', 'phone', 'role', 'organization',
        'orgType', 'size', 'currentTools', 'pains', 'plan', 'timeline', 'recommendation', 'modules', 'topics',
        'supportCategory', 'message', 'leadTitle', 'noteText', 'pageUrl', 'landingPage', 'referrer', 'utm_source',
        'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'submittedAt',
        // extras
        'intent', 'customerStatus', 'questions', 'website'];

    function sourceLabel(p) {
        if (p.source === 'fit-quiz') { return 'ANNASIS website fit quiz'; }
        return 'ANNASIS website chat (Anna)' + (p.intent === 'pricing' ? ' — pricing request' : '');
    }

    function buildNote(p) {
        var lines = [];
        function line(label, v) {
            if (Array.isArray(v)) { v = v.join(', '); }
            if (v) { lines.push(label + ': ' + v); }
        }
        lines.push(p.type === 'support' ? '[Support] Support request from the ANNASIS website' : 'Sales lead from the ANNASIS website');
        line('Source', sourceLabel(p));
        if (p.type === 'support') {
            line('Category', p.supportCategory);
            line('Customer', p.customerStatus);
        }
        lines.push('');
        line('Name', p.name);
        line('Email', p.email);
        line('Phone', p.phone);
        line('Role', p.role);
        line('School / organization', p.organization);
        line('Organization type', p.orgType);
        line('Size', p.size);
        line('Uses today', p.currentTools);
        line('What hurts most', p.pains);
        line('How they want to start', p.plan);
        line('Timeline', p.timeline);
        if (p.recommendation) {
            lines.push('');
            line('Recommendation', p.recommendation);
            line('Suggested modules', p.modules);
        }
        if ((p.topics && p.topics.length) || (p.questions && p.questions.length)) {
            lines.push('');
            line('Chat topics', p.topics);
            if (p.questions && p.questions.length) {
                lines.push('Questions typed:');
                p.questions.forEach(function (q) { lines.push('- ' + q); });
            }
        }
        if (p.message) {
            lines.push('');
            lines.push(p.type === 'support' ? 'What’s going on:' : 'Message:');
            lines.push(p.message);
        }
        lines.push('');
        line('Page', p.pageUrl);
        if (p.landingPage && p.landingPage !== p.pageUrl) { line('Landing page', p.landingPage); }
        line('Referrer', p.referrer);
        var utm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid'].filter(function (k) { return p[k]; });
        if (utm.length) { lines.push('UTM: ' + utm.map(function (k) { return k + '=' + p[k]; }).join(', ')); }
        line('Submitted', p.submittedAt);
        return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    }

    function defaultLeadTitle(p) {
        var org = p.organization || p.name || 'Website visitor';
        if (p.type === 'support') { return '[Support] ' + (p.supportCategory || 'Website request') + ' – ' + org; }
        if (p.source === 'fit-quiz') { return 'Website fit quiz – ' + org; }
        if (p.intent === 'pricing') { return 'Website pricing (Anna) – ' + org; }
        return 'Website chat (Anna) – ' + org;
    }

    // Builds the flat payload from partial input: fills defaults, name parts,
    // page context, UTM, leadTitle, and noteText.
    function finalizePayload(input) {
        input = input || {};
        var l = readJSON('annasis_landing', {});
        var utm = l.utm || {};
        var p = {};
        PAYLOAD_STRINGS.forEach(function (k) {
            var v = input[k];
            p[k] = (v === undefined || v === null) ? '' : String(v).trim();
        });
        PAYLOAD_LISTS.forEach(function (k) {
            var v = input[k];
            p[k] = Array.isArray(v) ? v.filter(Boolean).map(String) : (v ? [String(v)] : []);
        });
        p.type = p.type === 'support' ? 'support' : 'sales';
        p.source = p.source || 'chat';
        if (p.name && !p.firstName && !p.lastName) {
            var parts = p.name.split(/\s+/);
            p.firstName = parts[0];
            p.lastName = parts.slice(1).join(' ');
        }
        p.pageUrl = p.pageUrl || window.location.href.split('#')[0];
        p.landingPage = p.landingPage || l.landingPage || '';
        p.referrer = p.referrer || l.referrer || document.referrer || '';
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid'].forEach(function (k) {
            p[k] = p[k] || utm[k] || '';
        });
        p.submittedAt = p.submittedAt || new Date().toISOString();
        p.leadTitle = p.leadTitle || defaultLeadTitle(p);
        p.noteText = buildNote(p);
        // Same key order as the schema in NEXT_VERSION_NOTES.md.
        var ordered = {};
        PAYLOAD_ORDER.forEach(function (k) { ordered[k] = p[k]; });
        return ordered;
    }

    function fallbackToContact(p, params) {
        // Contact details stay in sessionStorage (same site, this tab only) — not in the URL,
        // so names and emails never land in analytics or referrer logs.
        store.set(LEAD_STORAGE_KEY, JSON.stringify({ type: p.type, source: p.source, note: p.noteText, at: Date.now() }));
        var url = CONFIG.lead.fallbackUrl || CONFIG.urls.contact;
        var query = qs(params || {});
        window.location.href = url + (query ? (url.indexOf('?') < 0 ? '?' : '&') + query : '');
    }

    var ANNASIS_LEAD = {
        buildNote: buildNote,
        buildPayload: finalizePayload,
        endpoint: leadEndpoint,
        fields: PAYLOAD_ORDER.slice(),
        /**
         * submit(input, options)
         *   input: partial flat payload, e.g. { type:'sales'|'support', source:'fit-quiz'|'chat',
         *          name, email, organization, ... } — see the schema above.
         *   options.params: non-personal query params for the contact.html fallback
         *   options.navigate: false → never leave the page (used by tests)
         * Resolves { ok, mode: 'endpoint' | 'fallback', payload }.
         */
        submit: function (input, options) {
            options = options || {};
            var p = finalizePayload(input);
            var endpoint = leadEndpoint();
            function fallback() {
                if (options.navigate !== false) { fallbackToContact(p, options.params); }
                return { ok: true, mode: 'fallback', payload: p };
            }
            if (!endpoint || !window.fetch) { return Promise.resolve(fallback()); }
            var controller = window.AbortController ? new window.AbortController() : null;
            var timer = controller ? setTimeout(function () { controller.abort(); }, CONFIG.lead.timeoutMs) : null;
            return window.fetch(endpoint, {
                method: 'POST',
                mode: CONFIG.lead.fetchMode === 'no-cors' ? 'no-cors' : 'cors',
                credentials: 'omit',
                headers: { 'Content-Type': CONFIG.lead.contentType || 'text/plain;charset=UTF-8' },
                body: JSON.stringify(p),
                signal: controller ? controller.signal : undefined
            }).then(function (res) {
                if (timer) { clearTimeout(timer); }
                // Opaque (no-cors) responses cannot be read: the request reached the server, count it.
                if (res.type !== 'opaque' && !res.ok) { throw new Error('HTTP ' + res.status); }
                store.set(LEAD_STORAGE_KEY, JSON.stringify({ type: p.type, source: p.source, note: p.noteText, at: Date.now(), sent: true }));
                return { ok: true, mode: 'endpoint', payload: p };
            }).catch(function () {
                if (timer) { clearTimeout(timer); }
                return fallback();
            });
        }
    };
    window.ANNASIS_LEAD = ANNASIS_LEAD;

    /* ---------------------------------------------------------
       Shared lead-capture form (quiz result + chat sales + chat support)
       --------------------------------------------------------- */
    var ROLES = [
        'Head of school / leadership',
        'Business office / finance',
        'Admissions / enrollment',
        'Registrar / front office',
        'Technology',
        'Athletics / activities',
        'Faculty',
        'Parent',
        'Event, camp, or church office',
        'Other'
    ];

    function buildLeadForm(opts) {
        // opts: { kind: 'sales'|'support', source, intro, compact, orgLabel,
        //         getExtra(): partial flat payload, getParams(): {} }
        var support = opts.kind === 'support';
        var fid = nextId('ae-lead');
        var status = el('p', { className: 'ae-lead-status', role: 'status', 'aria-live': 'polite' });

        function field(name, label, type, required, autocomplete) {
            var id = fid + '-' + name;
            return el('div', { className: 'ae-field' }, [
                el('label', { 'for': id }, [label, required ? null : el('span', { className: 'ae-optional', text: ' (optional)' })]),
                el('input', { id: id, name: name, type: type, required: required, 'aria-required': required ? 'true' : null, autocomplete: autocomplete })
            ]);
        }

        function categoryField() {
            var catId = fid + '-category';
            var cats = (typeof SUPPORT_CATEGORIES !== 'undefined' && SUPPORT_CATEGORIES) ? SUPPORT_CATEGORIES : [
                { v: 'login', l: 'Login / account access' },
                { v: 'billing', l: 'Billing or payment' },
                { v: 'registration', l: 'Registration or event' },
                { v: 'store', l: 'Store / order' },
                { v: 'gradebook', l: 'Gradebook / SIS' },
                { v: 'other', l: 'Something else' }
            ];
            var sel = el('select', { id: catId, name: 'category', required: true, 'aria-required': 'true' }, [el('option', { value: '', text: 'Choose one' })].concat(cats.map(function (c) {
                return el('option', { value: c.l, text: c.l });
            })));
            return el('div', { className: 'ae-field' }, [el('label', { 'for': catId, text: 'Category' }), sel]);
        }
        function messageField() {
            var msgId = fid + '-message';
            return el('div', { className: 'ae-field ae-field--wide' }, [
                el('label', { 'for': msgId, text: 'What’s going on?' }),
                el('textarea', { id: msgId, name: 'message', rows: '3', maxlength: '1500', required: true, 'aria-required': 'true', 'aria-describedby': msgId + '-hint' }),
                el('span', { id: msgId + '-hint', className: 'ae-field-hint', text: 'A sentence or two is plenty. Please don’t include passwords or card numbers.' })
            ]);
        }
        var grid = [];
        if (support && opts.includeCategory) {
            // Page form order: name, email, school/org, category, message, phone
            grid.push(field('name', 'Your name', 'text', true, 'name'));
            grid.push(field('email', 'Email', 'email', true, 'email'));
            grid.push(field('org', opts.orgLabel || 'School or organization', 'text', true, 'organization'));
            grid.push(categoryField());
            grid.push(messageField());
            grid.push(field('phone', 'Phone', 'tel', false, 'tel'));
        } else {
            if (support) { grid.push(messageField()); }
            grid.push(field('name', 'Your name', 'text', true, 'name'));
            grid.push(field('email', support ? 'Email' : 'Work email', 'email', true, 'email'));
            grid.push(field('org', opts.orgLabel || 'School or organization', 'text', true, 'organization'));
            if (!support) {
                var roleId = fid + '-role';
                var roleSelect = el('select', { id: roleId, name: 'role' }, [el('option', { value: '', text: 'Choose one' })].concat(ROLES.map(function (r) {
                    return el('option', { value: r, text: r });
                })));
                grid.push(el('div', { className: 'ae-field' }, [el('label', { 'for': roleId, text: 'Your role' }), roleSelect]));
            }
            grid.push(field('phone', 'Phone', 'tel', false, 'tel'));
        }

        var submitBtn = el('button', { type: 'submit', className: 'btn ae-lead-submit', text: support ? 'Send to ANNASIS support' : 'Send to ANNASIS sales' });

        var form = el('form', { className: 'ae-lead-form' + (opts.compact ? ' ae-lead-form--compact' : '') + (support ? ' ae-lead-form--support' : ''), novalidate: true, 'aria-describedby': fid + '-intro' }, [
            el('p', { id: fid + '-intro', className: 'ae-lead-intro', text: opts.intro }),
            el('div', { className: 'ae-lead-grid' }, grid),
            // Honeypot — hidden from people; bots tend to fill it.
            el('div', { className: 'ae-hp', 'aria-hidden': 'true' }, [
                el('label', { 'for': fid + '-website', text: 'Website' }),
                el('input', { id: fid + '-website', name: 'website', type: 'text', tabindex: '-1', autocomplete: 'off' })
            ]),
            el('div', { className: 'ae-lead-actions' }, [submitBtn]),
            status
        ]);

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (form.elements.website.value) { return; }
            var data = {
                name: form.elements.name.value.trim(),
                email: form.elements.email.value.trim(),
                org: form.elements.org.value.trim(),
                role: form.elements.role ? form.elements.role.value : '',
                phone: form.elements.phone.value.trim(),
                message: form.elements.message ? form.elements.message.value.trim() : '',
                category: form.elements.category ? form.elements.category.value.trim() : ''
            };
            var checks = [['name', 'your name'], ['email', support ? 'a valid email' : 'a valid work email'], ['org', 'your school or organization']];
            if (support) { checks.unshift(['message', 'a short description']); }
            if (support && opts.includeCategory) { checks.push(['category', 'a category']); }
            var problems = [];
            checks.forEach(function (f) {
                var input = form.elements[f[0]];
                var bad = !data[f[0]] || (f[0] === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email));
                input.setAttribute('aria-invalid', bad ? 'true' : 'false');
                if (bad) { problems.push(f[1]); }
            });
            if (problems.length) {
                status.textContent = 'Please add ' + problems.join(', ') + '.';
                status.className = 'ae-lead-status is-error';
                var firstBad = form.querySelector('[aria-invalid="true"]');
                if (firstBad) { firstBad.focus(); }
                return;
            }
            submitBtn.disabled = true;
            status.className = 'ae-lead-status';
            status.textContent = leadEndpoint() ? 'Sending…' : 'Taking you to the contact page…';
            var payload = {
                type: support ? 'support' : 'sales',
                source: opts.source,
                name: data.name,
                email: data.email,
                phone: data.phone,
                role: data.role,
                organization: data.org,
                message: data.message,
                website: form.elements.website.value
            };
            if (support && data.category) { payload.supportCategory = data.category; }
            var extra = opts.getExtra ? opts.getExtra() : {};
            Object.keys(extra).forEach(function (k) {
                if (extra[k] !== undefined && extra[k] !== null && extra[k] !== '') { payload[k] = extra[k]; }
            });
            ANNASIS_LEAD.submit(payload, { params: opts.getParams ? opts.getParams() : {} }).then(function (r) {
                if (r.mode !== 'endpoint') { return; }
                var first = data.name.split(' ')[0];
                var lines = support
                    ? ['Your request is with the ANNASIS team — we’ll follow up by email.']
                    : ['ANNASIS sales will follow up from sales@annasis.com.'];
                if (support && CONFIG.support.email) { lines.push('You can also reach us at ' + CONFIG.support.email + '.'); }
                var done = el('div', { className: 'ae-lead-done', tabindex: '-1' }, [el('p', { className: 'ae-lead-done-title', text: 'Thanks, ' + first + '.' })].concat(lines.map(function (t) {
                    return el('p', { text: t });
                })));
                form.parentNode.replaceChild(done, form);
                done.focus();
            });
        });

        return form;
    }

    /* =========================================================
       FIT QUIZ
       ========================================================= */
    var SIS_TOOLS = ['facts', 'classreach', 'sycamore', 'gradelink', 'alma', 'veracross'];

    var QUIZ = [
        {
            id: 'type', kind: 'single',
            q: function () { return 'What best describes you?'; },
            options: [
                { v: 'school', l: 'Private school' },
                { v: 'events', l: 'Event or conference organizer' },
                { v: 'camp', l: 'Camp' },
                { v: 'church', l: 'Church' },
                { v: 'store', l: 'Store or program shop' }
            ]
        },
        {
            id: 'size', kind: 'single',
            q: function (a) { return a.type === 'school' ? 'How many Students are enrolled?' : 'How many families or participants do you serve in a year?'; },
            options: function (a) {
                return a.type === 'school'
                    ? [{ v: 's1', l: 'Under 150' }, { v: 's2', l: '150–400' }, { v: 's3', l: '400–800' }, { v: 's4', l: 'More than 800' }]
                    : [{ v: 'p1', l: 'Under 250' }, { v: 'p2', l: '250–1,000' }, { v: 'p3', l: '1,000–5,000' }, { v: 'p4', l: 'More than 5,000' }];
            }
        },
        {
            id: 'tools', kind: 'multi',
            q: function () { return 'Which tools do you run today?'; },
            hint: 'Pick all that apply.',
            options: function (a) {
                var all = [
                    { v: 'facts', l: 'FACTS / RenWeb', school: true },
                    { v: 'classreach', l: 'ClassReach', school: true },
                    { v: 'sycamore', l: 'Sycamore', school: true },
                    { v: 'gradelink', l: 'Gradelink', school: true },
                    { v: 'alma', l: 'Alma', school: true },
                    { v: 'veracross', l: 'Veracross', school: true },
                    { v: 'eventbrite', l: 'Eventbrite' },
                    { v: 'shopify', l: 'Separate store / Shopify' },
                    { v: 'finalforms', l: 'FinalForms' },
                    { v: 'paper', l: 'Spreadsheets / paper' },
                    { v: 'quickbooks', l: 'QuickBooks' },
                    { v: 'other', l: 'Something else / not sure' }
                ];
                return a.type === 'school' ? all : all.filter(function (o) { return !o.school; });
            }
        },
        {
            id: 'pain', kind: 'multi',
            q: function () { return 'What hurts most today?'; },
            hint: 'Pick all that apply.',
            options: function (a) {
                var school = a.type === 'school';
                return [
                    { v: 'logins', l: school ? 'Separate logins for Parents' : 'Separate logins for families' },
                    { v: 'double', l: 'Office double entry' },
                    { v: 'addons', l: 'Hidden add-on costs' },
                    { v: 'outside', l: school ? 'Events, store, or athletics outside the SIS' : 'Registration, store, or giving in separate tools' },
                    { v: 'reporting', l: 'Reporting' }
                ];
            }
        },
        {
            id: 'plan', kind: 'single',
            q: function () { return 'How would you like to start?'; },
            options: function (a) {
                var cur = a.type === 'school' ? 'our current SIS' : 'what we run today';
                return [
                    { v: 'beside', l: 'Add modules beside ' + cur + ' now' },
                    { v: 'later', l: 'Start beside ' + cur + ', full switch later' },
                    { v: 'full', l: 'Full switch to one system' },
                    { v: 'explore', l: 'Just exploring' }
                ];
            }
        },
        {
            id: 'when', kind: 'single',
            q: function () { return 'When would you like something running?'; },
            options: function (a) {
                return a.type === 'school'
                    ? [{ v: 'term', l: 'This term' }, { v: 'next', l: 'Next school year' }, { v: 'open', l: 'No date yet' }]
                    : [{ v: 'term', l: 'This season' }, { v: 'next', l: 'Next season' }, { v: 'open', l: 'No date yet' }];
            }
        }
    ];

    function optionsFor(step, answers) {
        return typeof step.options === 'function' ? step.options(answers) : step.options;
    }

    function labelFor(stepId, value, answers) {
        var step = QUIZ.filter(function (s) { return s.id === stepId; })[0];
        if (!step) { return value; }
        var opts = optionsFor(step, answers);
        var vals = Array.isArray(value) ? value : [value];
        return vals.map(function (v) {
            var o = opts.filter(function (x) { return x.v === v; })[0];
            return o ? o.l : v;
        }).join(', ');
    }

    function labelsFor(stepId, values, answers) {
        var step = QUIZ.filter(function (s) { return s.id === stepId; })[0];
        var opts = step ? optionsFor(step, answers) : [];
        return (values || []).map(function (v) {
            var o = opts.filter(function (x) { return x.v === v; })[0];
            return o ? o.l : v;
        });
    }

    // "150–400 Students" / "Under 250 families or participants"
    function sizeText(a) {
        if (!a.size) { return ''; }
        return labelFor('size', a.size, a) + (a.type === 'school' ? ' Students' : ' families or participants');
    }

    // Quiz answers as flat, human-readable payload fields.
    function quizFlat(a, rec) {
        return {
            orgType: a.type ? labelFor('type', a.type, a) : '',
            size: sizeText(a),
            currentTools: labelsFor('tools', a.tools, a),
            pains: labelsFor('pain', a.pain, a),
            plan: a.plan ? labelFor('plan', a.plan, a) : '',
            timeline: a.when ? labelFor('when', a.when, a) : '',
            recommendation: rec ? rec.title : '',
            modules: rec ? rec.modules.map(function (m) { return m.name; }) : []
        };
    }

    // Module cards used by results (names and copy from the site).
    function M(name, why, href, linkText) { return { name: name, why: why, href: href, linkText: linkText }; }
    function modulesCatalog() {
        var u = CONFIG.urls;
        return {
            events: M('Event registration', 'Sports, plays, camps, enrichment, games, and fundraisers — register and pay on the school system without add-ons and high fees.', u.events, 'See Events'),
            store: M('School store', 'Uniforms, books, trips, and fees on the family system beside tuition & billing — no second shop login to reconcile.', u.ecommerce, 'See Store'),
            athletics: M('Athletics eligibility & workflows', 'Clearance, waivers, and consents with serial or parallel approvals — without a bolt-on forms product like FinalForms.', u.education, 'Explore Schools'),
            quickbooks: M('QuickBooks accounting', 'Keep QuickBooks as books of record; ANNASIS posts operations so the office stops triple-entry.', u.integrations, 'See Integrations'),
            tuition: M('Tuition & billing', 'Payment plans, invoices, incidental billing, and online payments — part of the operating system, not a hidden or add-on cost later.', u.education, 'Explore Schools'),
            portal: M('Parent portal & group communication', 'One Parent portal with email and text announcements in Base SIS, plus email and SMS to groups, teams, and lists — on the school’s own site, no required app.', u.different, 'See The Difference'),
            reporting: M('Analytics & dashboards', 'A clear view for the office without exporting to five spreadsheets.', u.education, 'Explore Schools'),
            basesis: M('Base SIS', 'One student and family record — family record (including multi-campus), Admissions and re-enrollment, Attendance, class and bell schedules, Gradebook, report cards, transcripts, Parent portal, email and text announcements, medical notes, and discipline log.', u.education, 'Explore Schools')
        };
    }

    /**
     * Branching / result logic:
     *  - Not a school → segment result (events, camp, church, store).
     *  - School + plan "full"                          → full-os
     *  - School + no SIS picked + plan "later"         → full-os
     *  - School + an SIS picked (beside/later/explore) → beside-sis
     *  - School + no SIS picked (beside/explore)       → start-modules
     * Modules for beside-sis / start-modules come from tools + pains, in this order:
     *   Eventbrite or "outside" → Event registration; Shopify or "outside" → School store;
     *   FinalForms or "outside" → Athletics; "logins" → Parent portal & group communication;
     *   "addons" → Tuition & billing; QuickBooks or "double" → QuickBooks accounting;
     *   "reporting" → Analytics & dashboards. Nothing picked → Event registration + School store.
     *   Title uses the first two; up to four are listed.
     */
    function recommend(a) {
        var C = modulesCatalog();
        var u = CONFIG.urls;
        var tools = a.tools || [];
        var pain = a.pain || [];
        var res;

        if (a.type && a.type !== 'school') {
            var segments = {
                events: {
                    id: 'events',
                    title: 'Event registration + fundraising beside what you run',
                    body: 'Run the calendar in one place: registration and ticketing for paid and free events, check-in and scheduling, exhibitor and add-on paths where your event needs them, and fundraising with sponsor invites and round-up beside payments — not in a separate stack.',
                    modules: [
                        M('Registration & ticketing', 'Paid and free events, capacity, payments, and the details your office collects.', u.events, 'See Events'),
                        M('Check-in & scheduling', 'Door lists, sessions, and room-level detail on the same records as registration.', u.events, 'See Events'),
                        M('Fundraising beside registration', 'Sponsor invites for attendees and round-up when store or checkout paths run.', u.events, 'See Events'),
                        M('Event & program add-ons', 'Conference merch, resource tables, and ticketed-event extras beside registration.', u.ecommerce, 'See Store')
                    ]
                },
                camp: {
                    id: 'camp',
                    title: 'One-stop camp management',
                    body: 'Run the season in one place: online registration for day, overnight, and multi-session programs; a real camp store; attendance and check-in paths; and fundraising that sits beside your programs.',
                    modules: [
                        M('Registration & program signups', 'Day camps, overnight sessions, and multi-week summers — paid and free paths, capacity, and waivers where you need them.', u.camps, 'See Camps'),
                        M('Camp store & e-commerce', 'Merch, apparel, gear lists, and program materials — with optional round-up at checkout.', u.ecommerce, 'See Store'),
                        M('Attendance & check-in', 'Tied to the same people and program records you use for registration.', u.camps, 'See Camps'),
                        M('Fundraising & campaign gifts', 'Scholarships, season campaigns, and sponsor invites for campers.', u.camps, 'See Camps')
                    ]
                },
                church: {
                    id: 'church',
                    title: 'One-stop for churches — event management, giving, check-in, and store',
                    body: 'Run the ministry year in one place: event management for conferences, large events, and multi-session programs; online giving and fundraising; check-in for kids and volunteers; and a real store for merch and resources.',
                    modules: [
                        M('Event management', 'Conferences, life groups, camps, VBS, classes, sports, and midweek — paid and free signups.', u.events, 'See Events'),
                        M('Online giving & fundraising', 'Donations, campaign gifts, sponsor invites, and round-up on store purchases.', u.churches, 'See Churches'),
                        M('Check-in', 'Kids, families, and volunteers — tied to the same people and program records.', u.churches, 'See Churches'),
                        M('Store & e-commerce', 'Merch, resource tables, books, and program materials.', u.ecommerce, 'See Store')
                    ]
                },
                store: {
                    id: 'store',
                    title: 'An institutional store beside registration and giving',
                    body: 'Sell uniforms, merch, materials, and add-ons on one institutional store — with round-up and sponsorship giving beside everyday checkout, not a separate Shopify for every table.',
                    modules: [
                        M('Institutional store', 'School stores and uniform shops, camp merch, church bookstores, and event add-ons.', u.ecommerce, 'See Store'),
                        M('Round-up & sponsor giving', 'Optional round-up at checkout plus sponsor invites beside donations.', u.ecommerce, 'See Store'),
                        M('Event & program add-ons', 'Resource tables, conference merch, and camp session add-ons beside registration.', u.events, 'See Events')
                    ]
                }
            };
            res = segments[a.type] || segments.events;
            if (a.plan === 'beside' || a.plan === 'later') {
                res.body += ' If you already run other software, ANNASIS can cover these paths alongside it — jog before you run.';
            }
            res.links = [
                { label: 'Events', href: u.events }, { label: 'Store', href: u.ecommerce },
                { label: 'Camps', href: u.camps }, { label: 'Churches', href: u.churches }, { label: 'Partnership', href: u.partner }
            ];
            return res;
        }

        var sisPicked = tools.filter(function (t) { return has(SIS_TOOLS, t); });
        var sisName = sisPicked.length === 1 ? labelFor('tools', sisPicked[0], a) : 'your current SIS';

        var picks = [];
        function add(key) { if (picks.indexOf(key) < 0) { picks.push(key); } }
        if (has(tools, 'eventbrite') || has(pain, 'outside')) { add('events'); }
        if (has(tools, 'shopify') || has(pain, 'outside')) { add('store'); }
        if (has(tools, 'finalforms') || has(pain, 'outside')) { add('athletics'); }
        if (has(pain, 'logins')) { add('portal'); }
        if (has(pain, 'addons')) { add('tuition'); }
        if (has(tools, 'quickbooks') || has(pain, 'double')) { add('quickbooks'); }
        if (has(pain, 'reporting')) { add('reporting'); }
        if (!picks.length) { add('events'); add('store'); }
        var top = picks.slice(0, 2).map(function (k) { return C[k].name; }).join(' + ');

        if (a.plan === 'full' || (!sisPicked.length && a.plan === 'later')) {
            res = {
                id: 'full-os',
                title: 'Full school operating system',
                body: 'Run the school on one platform: Base SIS plus nine foundation modules on one student and family record — from Admissions, Attendance, and Gradebook in Base SIS to tuition & billing, events, the school store, and athletics. Parents, Students, and Faculty get one campus experience; the office keeps QuickBooks as books of record.',
                modules: [C.basesis, C.tuition, C.events, C.store, C.athletics, C.quickbooks]
            };
        } else if (sisPicked.length) {
            res = {
                id: 'beside-sis',
                title: 'Start beside ' + sisName + ' with ' + top,
                body: 'Keep ' + sisName + ' and let ANNASIS sit beside it, turning on the modules that fill today’s gaps. Jog before you run' +
                    (a.plan === 'later' ? ' — then grow into the full school operating system when the office is ready.' : '; expand or replace when the office is ready.'),
                modules: picks.slice(0, 4).map(function (k) { return C[k]; })
            };
        } else {
            res = {
                id: 'start-modules',
                title: 'Start with ' + top + ' on the school operating system',
                body: 'Begin with the modules that hurt most today — on one student and family record — and add the rest of the foundation when the office is ready. Jog before you run.',
                modules: picks.slice(0, 4).map(function (k) { return C[k]; })
            };
        }
        if (a.when === 'term') { res.body += ' Scope a first site to the modules the office will run this term.'; }
        res.links = [
            { label: 'Explore Schools', href: u.education }, { label: 'Events', href: u.events },
            { label: 'Store', href: u.ecommerce }, { label: 'Integrations', href: u.integrations }, { label: 'The Difference', href: u.different }
        ];
        return res;
    }

    function quizParams(a, rec) {
        return {
            src: 'fit-quiz',
            fit: a.type,
            size: a.size,
            tools: (a.tools || []).join(','),
            pain: (a.pain || []).join(','),
            plan: a.plan,
            when: a.when,
            rec: rec ? rec.id : ''
        };
    }

    function initQuiz(root) {
        if (!root || root.getAttribute('data-ae-ready')) { return; }
        root.setAttribute('data-ae-ready', '1');
        root.innerHTML = '';

        var answers = {};
        var index = 0;
        var live = el('p', { className: 'ae-sr', role: 'status', 'aria-live': 'polite' });
        var progressFill = el('span', { className: 'ae-quiz-progress-fill' });
        var progress = el('div', { className: 'ae-quiz-progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(QUIZ.length), 'aria-valuenow': '0', 'aria-label': 'Quiz progress' }, [progressFill]);
        var stepLabel = el('p', { className: 'ae-quiz-step', 'aria-hidden': 'true' });
        var body = el('div', { className: 'ae-quiz-body' });
        root.appendChild(el('div', { className: 'ae-quiz-head' }, [stepLabel, progress]));
        root.appendChild(body);
        root.appendChild(live);

        function setProgress(n, label) {
            progress.setAttribute('aria-valuenow', String(n));
            progress.setAttribute('aria-valuetext', label);
            progressFill.style.width = Math.round((n / QUIZ.length) * 100) + '%';
            stepLabel.textContent = label;
        }

        function go(delta) {
            index += delta;
            if (index < 0) { index = 0; }
            if (index >= QUIZ.length) { showResult(); return; }
            render(true);
        }

        function render(focus) {
            var step = QUIZ[index];
            var opts = optionsFor(step, answers);
            var label = 'Question ' + (index + 1) + ' of ' + QUIZ.length;
            setProgress(index, label);
            var qId = nextId('ae-q');
            var current = answers[step.id];
            if (step.kind === 'multi') {
                var valid = opts.map(function (o) { return o.v; });
                current = (current || []).filter(function (v) { return valid.indexOf(v) >= 0; });
                answers[step.id] = current;
            } else if (current && !opts.some(function (o) { return o.v === current; })) {
                current = undefined;
                delete answers[step.id];
            }

            var heading = el('h3', { id: qId, className: 'ae-quiz-q', tabindex: '-1', text: step.q(answers) });
            var group = el('div', { className: 'ae-quiz-options' + (step.kind === 'multi' ? ' ae-quiz-options--multi' : ''), role: 'group', 'aria-labelledby': qId });
            var nextBtn = null;

            opts.forEach(function (o) {
                var selected = step.kind === 'multi' ? has(current, o.v) : current === o.v;
                var btn = el('button', { type: 'button', className: 'ae-quiz-option', 'aria-pressed': selected ? 'true' : 'false' }, [
                    el('span', { className: 'ae-quiz-check', 'aria-hidden': 'true' }),
                    el('span', { className: 'ae-quiz-option-label', text: o.l })
                ]);
                btn.addEventListener('click', function () {
                    if (step.kind === 'multi') {
                        var list = answers[step.id] || [];
                        var i = list.indexOf(o.v);
                        if (i >= 0) { list.splice(i, 1); } else { list.push(o.v); }
                        answers[step.id] = list;
                        btn.setAttribute('aria-pressed', i >= 0 ? 'false' : 'true');
                        nextBtn.textContent = list.length ? 'Next' : 'Skip';
                    } else {
                        answers[step.id] = o.v;
                        Array.prototype.forEach.call(group.querySelectorAll('.ae-quiz-option'), function (b) { b.setAttribute('aria-pressed', 'false'); });
                        btn.setAttribute('aria-pressed', 'true');
                        setTimeout(function () { go(1); }, 180);
                    }
                });
                group.appendChild(btn);
            });

            var nav = el('div', { className: 'ae-quiz-nav' });
            if (index > 0) {
                nav.appendChild(el('button', { type: 'button', className: 'btn ghost ae-quiz-back', text: '← Back', onclick: function () { go(-1); } }));
            }
            if (step.kind === 'multi') {
                nextBtn = el('button', { type: 'button', className: 'btn ae-quiz-next', text: current.length ? 'Next' : 'Skip', onclick: function () { go(1); } });
                nav.appendChild(nextBtn);
            } else if (current) {
                nav.appendChild(el('button', { type: 'button', className: 'btn ae-quiz-next', text: 'Next', onclick: function () { go(1); } }));
            }

            body.innerHTML = '';
            body.appendChild(heading);
            if (step.hint) { body.appendChild(el('p', { className: 'ae-quiz-hint', text: step.hint })); }
            body.appendChild(group);
            body.appendChild(nav);
            live.textContent = label + ': ' + step.q(answers);
            if (focus) { heading.focus({ preventScroll: true }); }
        }

        function showResult(quiet) {
            var rec = recommend(answers);
            var params = quizParams(answers, rec);
            var contactHref = CONFIG.urls.contact + '?' + qs(params);
            setProgress(QUIZ.length, 'Your result');
            store.set('annasis_quiz_result', JSON.stringify({ answers: answers, rec: rec.id }));

            var title = el('h3', { className: 'ae-quiz-result-title', tabindex: '-1', text: rec.title });
            var list = el('ul', { className: 'ae-quiz-modules' }, rec.modules.map(function (m) {
                return el('li', null, [
                    el('strong', { text: m.name }),
                    el('span', { text: ' — ' + m.why + ' ' }),
                    el('a', { href: m.href, text: m.linkText + ' →' })
                ]);
            }));
            var links = el('p', { className: 'ae-quiz-links' }, [el('span', { text: 'Learn more: ' })]);
            rec.links.forEach(function (l, i) {
                if (i) { links.appendChild(document.createTextNode(' · ')); }
                links.appendChild(el('a', { href: l.href, text: l.label }));
            });

            var leadWrap = el('div', { className: 'ae-quiz-lead', id: nextId('ae-quiz-lead'), hidden: true });
            var talkBtn = el('button', { type: 'button', className: 'btn ae-quiz-talk', 'aria-expanded': 'false', 'aria-controls': leadWrap.id, text: 'Talk with Sales' });
            talkBtn.addEventListener('click', function () {
                var open = leadWrap.hidden;
                leadWrap.hidden = !open;
                talkBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
                if (open) {
                    var first = leadWrap.querySelector('input');
                    if (first) { first.focus(); }
                }
            });
            leadWrap.appendChild(buildLeadForm({
                kind: 'sales',
                source: 'fit-quiz',
                intro: 'Send your answers and this recommendation to ANNASIS sales. We will follow up from sales@annasis.com.',
                getExtra: function () { return quizFlat(answers, rec); },
                getParams: function () { return params; }
            }));

            var retake = el('button', { type: 'button', className: 'ae-linklike', text: 'Retake the quiz', onclick: function () {
                answers = {}; index = 0; store.del('annasis_quiz_result'); render(true);
            } });

            body.innerHTML = '';
            body.appendChild(el('div', { className: 'ae-quiz-result' }, [
                el('p', { className: 'kicker', text: 'Your recommendation' }),
                title,
                el('p', { className: 'ae-quiz-result-body', text: rec.body }),
                list,
                links,
                el('div', { className: 'ae-quiz-cta' }, [
                    talkBtn,
                    el('a', { className: 'btn ghost', href: contactHref, text: 'Go to the contact page' }),
                    retake
                ]),
                leadWrap
            ]));
            live.textContent = 'Your result: ' + rec.title;
            title.focus({ preventScroll: true });
            if (!quiet && root.getBoundingClientRect().top < 0) { root.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        }

        // Used by the chat and by arrivals at fit.html#fit-quiz.
        root.__aeQuiz = {
            focus: function (opts) {
                opts = opts || {};
                var resultTitle = body.querySelector('.ae-quiz-result-title');
                if (resultTitle) { resultTitle.focus({ preventScroll: true }); return; }
                var saved = readJSON('annasis_quiz_result', null);
                if (opts.restore && index === 0 && !Object.keys(answers).length && saved && saved.answers && saved.answers.type) {
                    answers = saved.answers;
                    index = QUIZ.length;
                    showResult(true);
                    return;
                }
                if (opts.fromChat || opts.restore) { index = 0; render(true); return; }
                var q = body.querySelector('.ae-quiz-q');
                if (q) { q.focus({ preventScroll: true }); }
            }
        };

        render(false);
    }

    /* =========================================================
       CONTACT PAGE — summary above the Pipedrive web form.
       The form is a cross-origin iframe (webforms.pipedrive.com), so it
       cannot be prefilled from this page; a copy-ready summary sits above it.
       ========================================================= */
    function initContactSummary() {
        if (!isPage('contact') || document.querySelector('.ae-contact-summary')) { return; }
        var p = readParams();
        var stored = readJSON(LEAD_STORAGE_KEY, null);
        var source = '';
        var type = 'sales';
        var note = '';
        if (stored && stored.note && (!p.src || p.src === stored.source || (p.src === 'support' && stored.type === 'support'))) {
            note = stored.note;
            source = stored.source;
            type = stored.type || 'sales';
        } else if (p.src === 'fit-quiz' && p.fit) {
            var a = {
                type: p.fit, size: p.size, plan: p.plan, when: p.when,
                tools: p.tools ? p.tools.split(',') : [], pain: p.pain ? p.pain.split(',') : []
            };
            var flat = quizFlat(a, recommend(a));
            flat.source = 'fit-quiz';
            note = finalizePayload(flat).noteText;
            source = 'fit-quiz';
        } else if (p.src === 'chat') {
            note = finalizePayload({ source: 'chat', intent: p.intent, topics: p.topics ? p.topics.split(',') : [] }).noteText;
            source = 'chat';
        }
        if (!note) { return; }

        var anchor = document.querySelector('.form-embed');
        if (!anchor) { return; }
        var isSupport = type === 'support';
        var taId = nextId('ae-summary');
        var ta = el('textarea', { id: taId, className: 'ae-contact-text', readonly: true, rows: '9' });
        ta.value = note;
        var status = el('span', { className: 'ae-copy-status', role: 'status', 'aria-live': 'polite' });
        var copyBtn = el('button', { type: 'button', className: 'btn', text: 'Copy summary' });
        copyBtn.addEventListener('click', function () {
            function done() { status.textContent = 'Copied. Paste it into the message box below.'; }
            function legacy() { ta.focus(); ta.select(); try { document.execCommand('copy'); } catch (e) { /* ignore */ } done(); }
            if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(note).then(done, legacy); } else { legacy(); }
        });
        var card = el('section', { className: 'card ae-contact-summary', 'aria-labelledby': taId + '-h' }, [
            el('div', { className: 'kicker', text: isSupport ? 'Your support request' : (source === 'chat' ? 'From your chat with Anna' : 'From your fit quiz') }),
            el('h2', { id: taId + '-h', className: 'ae-contact-title', text: isSupport ? 'Your request, ready to send' : 'Your answers, ready to send' }),
            el('p', { text: isSupport
                ? 'Copy this summary and paste it into the message box in the form below so the ANNASIS team sees your request and can follow up.'
                : 'Copy this summary and paste it into the message box in the form below so ANNASIS sales sees your answers.' }),
            el('label', { className: 'ae-sr', 'for': taId, text: 'Summary' }),
            ta,
            el('p', { className: 'ae-contact-actions' }, [copyBtn, status])
        ]);
        anchor.parentNode.insertBefore(card, anchor);
    }

    /* =========================================================
       ANNA CHAT — scripted knowledge base
       ---------------------------------------------------------
       Written only from ANNASIS site copy (no prices, customer names,
       stats, or features that are not on the site).
       It is a plain object so it can later be swapped for a real AI
       backend: replace ANNASIS_CHAT.answer(text) with a call to your
       service and keep the same { intent, topic, text, links, action } shape.
       action: 'lead' shows the lead-capture form; 'quiz' jumps to the quiz;
       'pricing' / 'support' start the short guided flows in initChat().
       ========================================================= */
    var U = CONFIG.urls;
    var ANNASIS_CHAT_KB = {
        chips: [
            { label: 'What is ANNASIS?', intent: 'what' },
            { label: 'Does it work with my current SIS?', intent: 'sis' },
            { label: 'Events', intent: 'events' },
            { label: 'Camps', intent: 'camps' },
            { label: 'School store', intent: 'store' },
            { label: 'Pricing', intent: 'pricing' },
            { label: 'Take the fit quiz', intent: 'quiz' },
            { label: 'Book a demo', intent: 'demo' },
            { label: 'Get support', intent: 'support' }
        ],
        // Keyword order inside an intent does not matter; intent order breaks ties (earlier wins).
        intents: {
            demo: {
                topic: 'Book a demo',
                keywords: ['demo', 'demonstration', 'book a', 'schedule a', 'meeting', 'call me', 'talk to', 'talk with', 'sales', 'salesperson', 'contact', 'conversation', 'human', 'someone', 'representative', 'quote'],
                text: 'Happy to connect you with ANNASIS sales. Share a few details below and we will follow up from sales@annasis.com — or use the Request a conversation page.',
                links: [{ label: 'Request a conversation', href: U.contact }],
                action: 'lead'
            },
            quiz: {
                topic: 'Fit quiz',
                keywords: ['quiz', 'are we a fit', 'good fit', 'right for us', 'fit for', 'assessment', 'fit'],
                text: 'The “Are we a fit?” quiz is six quick questions — what you run today, what hurts, and how you would like to start. You get a tailored recommendation of ANNASIS modules at the end.',
                links: [],
                action: 'quiz' // off fit.html: "Start the quiz" button; on fit.html: closes chat and jumps to the quiz
            },
            sis: {
                topic: 'Current SIS',
                keywords: ['current sis', 'my sis', 'our sis', 'existing', 'sis', 'student information system', 'facts', 'renweb', 'classreach', 'sycamore', 'gradelink', 'alma', 'veracross', 'blackbaud', 'rediker', 'jupiter', 'replace', 'switch', 'sit beside', 'alongside', 'work with', 'keep our', 'rip out'],
                text: 'Yes — ANNASIS can sit beside the student information system you run today and turn on the modules your current system leaves to spreadsheets and side tools: event registration, the school store, athletics eligibility, forms and approvals, uniform exchange, and Parent communication. No forced switch, no big-bang cutover. When the office is ready for a fuller move, we plan the handoff together — on your timeline. Jog before you run.',
                links: [{ label: 'Integrations', href: U.integrations }, { label: 'Take the fit quiz', href: U.quiz }]
            },
            data: {
                topic: 'Roster data',
                keywords: ['oneroster', 'roster', 'rostering', 'import', 'sync', 'migrate', 'migration', 'data transfer', 'api'],
                text: 'OneRoster is the common standard many SIS packages use to share rosters. ANNASIS supports OneRoster today — standards-based roster sharing so classes and enrollments flow cleanly to your LMS and sign-on tools, directly from the SIS or through Clever or ClassLink. We confirm the path with each school’s vendors during onboarding.',
                links: [{ label: 'Integrations', href: U.integrations }]
            },
            lms: {
                topic: 'LMS',
                keywords: ['lms', 'learning management', 'google classroom', 'canvas', 'schoology', 'microsoft teams', 'teams', 'coursework'],
                text: 'Faculty keep teaching where they already teach. The LMS keeps coursework and assignments — Google Classroom, Canvas, Schoology, or Microsoft Teams — and ANNASIS runs the office side of the school: enrollment, billing, events, the store, forms, and Parent communication.',
                links: [{ label: 'Integrations', href: U.integrations }]
            },
            clever: {
                topic: 'Clever / ClassLink',
                keywords: ['clever', 'classlink', 'single sign', 'sso', 'sign-on', 'sign on', 'planbook', 'seesaw', 'nearpod', 'edpuzzle', 'kahoot'],
                text: 'Where Clever or ClassLink is already in place, it keeps working beside ANNASIS. These hubs are optional — plenty of private schools run without them, and we never assume you have one.',
                links: [{ label: 'Integrations', href: U.integrations }]
            },
            quickbooks: {
                topic: 'QuickBooks',
                keywords: ['quickbooks', 'accounting', 'ledger', 'accountant', 'bookkeeping', 'books of record', 'qbo'],
                text: 'Keep QuickBooks as your books of record. ANNASIS posts school operations to QuickBooks Online automatically, with a file export for offices on QuickBooks Desktop. We do not replace the accountant’s general ledger — we stop the office from typing the same family three times.',
                links: [{ label: 'Integrations', href: U.integrations }]
            },
            workspace: {
                topic: 'Google / Microsoft 365',
                keywords: ['google workspace', 'google', 'gmail', 'microsoft 365', 'microsoft', 'office 365', 'outlook', 'email domain'],
                text: 'ANNASIS connects to your school’s Google Workspace or Microsoft 365 — your tenant, your domain, your accounts — so school email and communication stay where you already manage them.',
                links: [{ label: 'Integrations', href: U.integrations }]
            },
            events: {
                topic: 'Events',
                keywords: ['event', 'registration', 'register', 'ticket', 'ticketing', 'eventbrite', 'conference', 'convention', 'check-in', 'checkin', 'exhibitor', 'fundraiser', 'plays', 'enrichment'],
                text: 'ANNASIS event registration covers sports, plays, camps, enrichment, games, fundraisers, church programs, conferences, and conventions — registration and ticketing for paid and free events, check-in and scheduling, exhibitor and add-on paths where your event needs them, and fundraising with sponsor invites and round-up beside payments. For schools it stays on the same student and family record as tuition & billing — no Eventbrite leakage.',
                links: [{ label: 'See Events', href: U.events }]
            },
            camps: {
                topic: 'Camps',
                keywords: ['camp', 'summer', 'overnight', 'day camp', 'camper', 'session'],
                text: 'ANNASIS is one-stop for camps: online registration for day, overnight, and multi-session programs; a real camp store for merch and materials; attendance and check-in paths; and fundraising — including sponsor invites for campers and round-up on camp store purchases. Forms and health information parents provide before camp ride the same registration path.',
                links: [{ label: 'See Camps', href: U.camps }]
            },
            churches: {
                topic: 'Churches',
                keywords: ['church', 'ministry', 'ministries', 'congregation', 'vbs', 'life group', 'tithe', 'tithing', 'volunteer'],
                text: 'ANNASIS is one-stop for churches: event management for conferences, large events, and multi-session programs; online giving and fundraising; check-in for kids, families, and volunteers; and a real store for merch and resources.',
                links: [{ label: 'See Churches', href: U.churches }]
            },
            store: {
                topic: 'School store',
                keywords: ['store', 'shop', 'ecommerce', 'e-commerce', 'shopify', 'merch', 'merchandise', 'spirit wear', 'checkout', 'buy', 'purchase', 'books'],
                text: 'The ANNASIS school store sells uniforms, books, trips, and fees on the family system — not a volunteer Shopify the office reconciles at night. Store purchases land on the family beside tuition & billing, and optional round-up at checkout turns everyday purchases into extra giving. Camps, churches, and event programs use the same institutional store for merch, resource tables, and add-ons.',
                links: [{ label: 'See Store', href: U.ecommerce }]
            },
            uniforms: {
                topic: 'Uniform exchange',
                keywords: ['uniform', 'uniform exchange', 'used uniform', 'swap', 'exchange', 'facebook'],
                text: 'Uniform exchange lives in the family portal: Parents publish uniforms for other Parents or Students to exchange or purchase. No middleman required — and used uniforms stay in the community instead of a Facebook thread the office cannot see.',
                links: [{ label: 'Explore Schools', href: U.education }]
            },
            pricing: {
                topic: 'Pricing',
                keywords: ['price', 'pricing', 'cost', 'how much', 'expensive', 'cheap', 'budget', 'add-on', 'addon', 'per student'],
                text: 'Pricing is discussed in conversation, so it fits the modules your office will actually run. One thing the site is clear on: tuition & billing is part of the operating system — in the annual student price, not a hidden or add-on cost later. Talk with Sales for specifics.',
                links: [{ label: 'Talk with Sales', href: U.contact }, { label: 'Take the fit quiz', href: U.quiz }],
                action: 'pricing' // asks tools → org type → size first, then this text + lead form
            },
            basesis: {
                topic: 'Base SIS',
                keywords: ['base sis', 'base', 'attendance', 'bell schedule', 'class schedule', 'scheduler', 'discipline', 'behavior', 'family record', 'household', 'multi-campus', 'multi campus', 'second campus', 'campus'],
                text: 'Base SIS is one student and family system: the family record (including a second campus with multi-campus support), Admissions and re-enrollment, Attendance, class and bell schedules, Gradebook, report cards, transcripts, the Parent portal, email and text announcements, medical notes, and the discipline log. Scheduler and Student locator keep the office current on where Students are during the day.',
                links: [{ label: 'Explore Schools', href: U.education }]
            },
            admissions: {
                topic: 'Admissions',
                keywords: ['admission', 'admissions', 'enroll', 'enrollment', 'application', 'apply', 'inquiry', 're-enrollment', 'reenrollment'],
                text: 'Admissions is part of Base SIS — inquiry, online application, enrollment, and re-enrollment — one pipeline with configurable application forms. Embed Apply on the website you already have, and collect waivers and consents in enrollment packets on the same student and family system.',
                links: [{ label: 'Explore Schools', href: U.education }]
            },
            gradebook: {
                topic: 'Gradebook',
                keywords: ['grade', 'gradebook', 'report card', 'transcript', 'gpa', 'progress report', 'rubric', 'assignment'],
                text: 'Gradebook, report cards, and transcripts are part of Base SIS — assignments, rubrics, progress reports, and GPA too. Faculty live here; Parents and Students see the same academic record in the family portal — no separate parent grade portal.',
                links: [{ label: 'Explore Schools', href: U.education }]
            },
            tuition: {
                topic: 'Tuition & billing',
                keywords: ['tuition', 'billing', 'invoice', 'payment plan', 'payment', 'pay', 'ach', 'stripe', 'finance', 'fees'],
                text: 'Tuition management covers payment plans, invoices, incidental billing, online payments, and family-portal pay. Finance is part of the operating system — not a hidden or add-on cost later.',
                links: [{ label: 'Explore Schools', href: U.education }]
            },
            health: {
                topic: 'Health records',
                keywords: ['health', 'medical', 'nurse', 'immunization', 'allergy', 'allergies', 'medication', 'physical'],
                text: 'Medical notes sit on the student record in Base SIS, and the Health records module keeps immunizations, allergies, medications, and emergency-card details on the student system. Athletics physicals that expire use the same workflows as eligibility and clearance — nurse, coach, and office look at one Student.',
                links: [{ label: 'Explore Schools', href: U.education }]
            },
            athletics: {
                topic: 'Athletics & forms',
                keywords: ['athletic', 'athletics', 'sport', 'eligibility', 'clearance', 'finalforms', 'waiver', 'consent', 'approval', 'workflow', 'forms', 'coach'],
                text: 'Athletics eligibility & workflows handle clearance with waivers, consents, and serial or parallel approvals — reusable for enrollment packets and purchase approval, without a bolt-on forms product like FinalForms. Clearance sits on the same student and family system as fees and roster.',
                links: [{ label: 'Explore Schools', href: U.education }]
            },
            communication: {
                topic: 'Communication & portal',
                keywords: ['email', 'sms', 'text message', 'texting', 'notification', 'notice', 'app', 'mobile', 'portal', 'parent portal', 'family portal', 'logins', 'separate logins'],
                text: 'Base SIS gives Parents one family portal — apply, register, pay, and stay informed on the school’s own site — plus school-wide email and text announcements. The Group communication module adds email and SMS messaging to groups, teams, and lists. Phone-friendly portal and SMS — no required app.',
                links: [{ label: 'The Difference', href: U.different }]
            },
            fundraising: {
                topic: 'Fundraising',
                keywords: ['donation', 'donate', 'fundraising', 'fundraise', 'giving', 'give', 'sponsor', 'campaign', 'round-up', 'round up', 'goal', 'annual fund'],
                text: 'Donations & fundraising cover one-time and recurring giving on the same family wallet. Sponsor invites let families, staff, and others invite sponsors for students, events, and similar participants, and optional round-up on store purchases drives additional giving. A class, team, or campaign can see progress — dollars raised against a goal, rankings, and percent to goal.',
                links: [{ label: 'Explore Schools', href: U.education }]
            },
            partnership: {
                topic: 'Partnership & onboarding',
                keywords: ['implementation support', 'implementation', 'onboarding', 'training', 'partner', 'partnership', 'roadmap', 'go-live', 'go live'],
                text: 'Implementation and support are part of how ANNASIS works — mapping your real programs, registration flows, and store needs, then staying available as seasons change. We share where the product is going, listen to what offices need next, and ship in the open. Jog before you run — modules when you are ready.',
                links: [{ label: 'Partnership', href: U.partner }]
            },
            about: {
                topic: 'About ANNASIS',
                keywords: ['who are you', 'about annasis', 'about you', 'founder', 'history', 'origin', 'company', 'story', 'stories', 'customer', 'reference'],
                text: 'ANNASIS started with private schools, where Parents, Students, and Faculty are customers — designed with a private school where the founder’s children attended. We partner the same way with event and conference offices, institutional stores, camps, and churches: listen first, adapt the platform to each organization’s vision, and ship what the office needs.',
                links: [{ label: 'About', href: U.about }, { label: 'Stories', href: U.stories }]
            },
            what: {
                topic: 'What is ANNASIS?',
                keywords: ['what is annasis', 'what is it', 'what do you do', 'what does annasis', 'overview', 'school operating system', 'operating system', 'explain', 'annasis'],
                text: 'ANNASIS is a school operating system for private education — not just a student information system. Base SIS plus nine foundation modules share one student and family record: Base SIS (family record, Admissions, Attendance, schedules, Gradebook, report cards, transcripts, Parent portal, announcements, medical notes, and discipline log), tuition & billing, health records, the school store, group communication, event registration, donations & fundraising, QuickBooks accounting, uniform exchange, and athletics eligibility & workflows. Private schools have customers — Parents, Students, and Faculty — and the same platform also powers Events, Store, Camps, and Churches.',
                links: [{ label: 'Explore Schools', href: U.education }, { label: 'The Difference', href: U.different }]
            },
            // Support path: customer? → category → description + contact (type: 'support').
            // Listed late so ties go to product topics ("ticket" alone → Events ticketing;
            // "logins" → family portal); phrases like "can't log in" score higher.
            support: {
                topic: 'Support',
                keywords: ['support', 'get support', 'help', 'need help', 'login', 'log in', 'password', 'cant log in', 'cannot log in', 'cant login', 'cant sign in', 'broken', 'error', 'bug', 'refund', 'charge', 'charged', 'billing issue', 'billing problem', 'account', 'my account', 'ticket', 'support ticket', 'open a ticket', 'submit a ticket', 'file a ticket', 'not working', 'doesnt work', 'locked out', 'reset'],
                text: '',
                links: [{ label: 'Support', href: U.support }],
                action: 'support'
            },
            hello: {
                topic: 'Hello',
                keywords: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'],
                text: 'Hi! I’m Anna. Ask me about ANNASIS, or pick a topic below.',
                links: []
            },
            thanks: {
                topic: 'Thanks',
                keywords: ['thanks', 'thank you', 'thx', 'appreciate', 'great', 'awesome', 'perfect'],
                text: 'You’re welcome! Anything else? You can also take the fit quiz or Talk with Sales.',
                links: [{ label: 'Take the fit quiz', href: U.quiz }, { label: 'Talk with Sales', href: U.contact }]
            }
        },
        fallback: {
            topic: 'Other question',
            text: 'I don’t have a scripted answer for that yet. The two-minute fit quiz can point you to the right modules, Talk with Sales, or visit the Support page.',
            links: [{ label: 'Take the fit quiz', href: U.quiz }, { label: 'Talk with Sales', href: U.contact }, { label: 'Support', href: U.support }],
            action: 'lead'
        }
    };
    window.ANNASIS_CHAT_KB = ANNASIS_CHAT_KB;

    function normalize(text) {
        return ' ' + String(text || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9@\-\s]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
    }

    function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    // Simple keyword scoring: phrases (contain a space) score 3, single words score 1
    // (whole-word match; plural "s"/"es" allowed). Highest score wins; none → fallback.
    function matchIntent(text) {
        var t = normalize(text);
        var best = null;
        var bestScore = 0;
        Object.keys(ANNASIS_CHAT_KB.intents).forEach(function (id) {
            var score = 0;
            ANNASIS_CHAT_KB.intents[id].keywords.forEach(function (kw) {
                var k = kw.toLowerCase().replace(/[’']/g, '');
                if (k.indexOf(' ') >= 0) {
                    if (t.indexOf(' ' + k) >= 0) { score += 3; }
                } else if (new RegExp('\\s' + escapeRe(k) + '(s|es)?\\s').test(t)) {
                    score += 1;
                }
            });
            if (score > bestScore) { bestScore = score; best = id; }
        });
        return best;
    }

    var ANNASIS_CHAT = {
        kb: ANNASIS_CHAT_KB,
        match: matchIntent,
        // Swap point for a real AI backend. Returns { intent, topic, text, links, action }.
        answer: function (text) {
            var id = matchIntent(text);
            var hit = id ? ANNASIS_CHAT_KB.intents[id] : ANNASIS_CHAT_KB.fallback;
            return { intent: id || 'fallback', topic: hit.topic, text: hit.text, links: hit.links || [], action: hit.action };
        },
        open: function () { }, // replaced once the widget mounts
        close: function () { }
    };
    window.ANNASIS_CHAT = ANNASIS_CHAT;

    /* ---------------------------------------------------------
       LeadBooster coexistence
       --------------------------------------------------------- */
    function ensureLeadBooster() {
        // js/annasis.js already loads LeadBooster on the ANNASIS site; only load here if missing.
        if (window.LeadBooster || document.getElementById('annasis-pipedrive-leadbooster') || document.getElementById('ae-leadbooster-loader')) { return; }
        if (!CONFIG.leadbooster.loadIfMissing) { return; }
        // === LeadBooster chatbot embed (Pipedrive > LeadBooster > Chatbot > Install code) ===
        window.pipedriveLeadboosterConfig = {
            base: CONFIG.leadbooster.base,
            companyId: CONFIG.leadbooster.companyId,
            playbookUuid: CONFIG.leadbooster.playbookUuid,
            version: CONFIG.leadbooster.version
        };
        window.LeadBooster = {
            q: [],
            on: function (n, h) { this.q.push({ t: 'o', n: n, h: h }); },
            trigger: function (n) { this.q.push({ t: 't', n: n }); }
        };
        var s = document.createElement('script');
        s.id = 'ae-leadbooster-loader';
        s.src = CONFIG.leadbooster.loaderSrc;
        s.async = true;
        document.body.appendChild(s);
        // === end LeadBooster embed ===
    }

    function applyChatMode() {
        var html = document.documentElement;
        if (CONFIG.leadboosterMode) {
            html.classList.remove('ae-hide-leadbooster');
            ensureLeadBooster();
            return false; // LeadBooster's Anna is the chat; ours stays unmounted
        }
        // Our chat (or no chat at all): keep the LeadBooster bubble hidden so two chats never show.
        html.classList.add('ae-hide-leadbooster');
        return !!CONFIG.chatEnabled;
    }

    /* ---------------------------------------------------------
       Quiz navigation shared by the chat and the page
       ---------------------------------------------------------
       Root cause of "Take the fit quiz doesn't work" (2026-10-06):
       the chat is appended to <body>, outside the site's
       <div class="site-shell" data-enhance-nav="false">, so Blazor's
       enhanced navigation (blazor.web.js) intercepted the chat's
       "fit.html#fit-quiz" link. On the static preview the fetched page has
       no `blazor-enhanced-nav: allow` header, so Blazor "falls back" with
       history.replaceState(url + "?") + location.replace(url); with a #hash
       that is only a same-document fragment change, which re-triggers
       enhanced nav — an endless loop: the URL flips to fit.html#fit-quiz but
       the page never loads and the chat stays open. (On IIS/Blazor the
       enhanced nav succeeds but replaces <body>, so the chat re-opened from
       sessionStorage on top of the quiz.)
       Fix: #ae-chat opts out of enhanced nav like the site shell does, every
       quiz link/button in the chat is handled here (close + persist closed,
       then scroll on fit.html or full navigation elsewhere), and arriving at
       fit.html#fit-quiz keeps the chat closed and focuses the quiz.
       --------------------------------------------------------- */
    var QUIZ_GO_KEY = 'annasis_quiz_go';

    function quizRoot() { return document.querySelector('#fit-quiz [data-annasis-quiz]'); }

    function isQuizHref(href) {
        if (!href) { return false; }
        if (href === CONFIG.urls.quiz) { return true; }
        return /(^|\/)fit(\.html)?\/?#fit-quiz$/i.test(href.split('?')[0]) || /(^|\/)fit(\.html)?\?[^#]*#fit-quiz$/i.test(href);
    }

    function reducedMotion() {
        return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    // opts: { fromChat: start at question 1 (or keep a showing result),
    //         restore: show this session's saved result (arrival from another page),
    //         smooth: smooth scroll }
    function focusQuiz(opts) {
        opts = opts || {};
        var root = quizRoot();
        if (!root) { return false; }
        if (!root.__aeQuiz) { initQuiz(root); }
        if (root.__aeQuiz) { root.__aeQuiz.focus(opts); }
        var section = document.getElementById('fit-quiz');
        section.scrollIntoView({ behavior: opts.smooth && !reducedMotion() ? 'smooth' : 'auto', block: 'start' });
        return true;
    }

    /* ---------------------------------------------------------
       Anna chat widget UI
       --------------------------------------------------------- */
    var CHAT_OPEN_KEY = 'annasis_chat_open';
    var CHAT_LOG_KEY = 'annasis_chat_log';
    var CHAT_TOPICS_KEY = 'annasis_chat_topics';
    var CHAT_QUESTIONS_KEY = 'annasis_chat_questions';
    var CHAT_NUDGE_KEY = 'annasis_chat_nudged';
    var CHAT_QUAL_KEY = 'annasis_chat_qual';

    var SUPPORT_CUSTOMER = [
        { v: 'customer', l: 'Yes — we use ANNASIS software' },
        { v: 'parent', l: 'I’m a Parent or family member' },
        { v: 'prospect', l: 'Not yet / not sure' }
    ];
    var SUPPORT_CUSTOMER_STATUS = { customer: 'ANNASIS customer (staff)', parent: 'Parent / family member', prospect: 'Not a customer yet / not sure' };
    var SUPPORT_CATEGORIES = [
        { v: 'login', l: 'Login / account access' },
        { v: 'billing', l: 'Billing or payment' },
        { v: 'registration', l: 'Registration or event' },
        { v: 'store', l: 'Store / order' },
        { v: 'gradebook', l: 'Gradebook / SIS' },
        { v: 'other', l: 'Something else' }
    ];

    function initChat() {
        if (document.getElementById('ae-chat')) { return; }
        var anna = CONFIG.anna;
        // data-enhance-nav="false": same opt-out the site shell uses, so Blazor never
        // intercepts links inside the chat (see root cause above).
        var root = el('div', { id: 'ae-chat', className: 'ae-chat', 'data-enhance-nav': 'false' });
        root.style.setProperty('--ae-anna', anna.color);

        function avatar(cls, alt) {
            var img = el('img', { src: anna.annaAvatar, alt: alt || '', className: cls, width: '40', height: '40' });
            img.addEventListener('error', function () { img.style.visibility = 'hidden'; });
            return img;
        }

        var launcher = el('button', { type: 'button', className: 'ae-chat-launcher', 'aria-expanded': 'false', 'aria-controls': 'ae-chat-panel' }, [
            avatar('ae-chat-launcher-img'),
            el('span', { className: 'ae-chat-launcher-text' }, [
                el('span', { className: 'ae-chat-launcher-lead', text: anna.launcherLead + ' ' }),
                el('strong', { text: anna.launcherLabel })
            ])
        ]);

        var nudgeClose = el('button', { type: 'button', className: 'ae-chat-nudge-close', 'aria-label': 'Dismiss', text: '×' });
        var nudgeMsg = el('button', { type: 'button', className: 'ae-chat-nudge-msg', text: anna.nudge });
        var nudge = el('div', { className: 'ae-chat-nudge', hidden: true }, [nudgeMsg, nudgeClose]);

        var log = el('div', { className: 'ae-chat-log', role: 'log', 'aria-live': 'polite', 'aria-relevant': 'additions', tabindex: '0', 'aria-label': 'Conversation with ' + anna.name });
        var chips = el('div', { className: 'ae-chat-chips', role: 'group', 'aria-label': 'Suggested questions' });
        var inputId = 'ae-chat-input';
        var input = el('input', { id: inputId, type: 'text', className: 'ae-chat-input', autocomplete: 'off', maxlength: '300', placeholder: 'Type a question…' });
        var form = el('form', { className: 'ae-chat-form' }, [
            el('label', { 'for': inputId, className: 'ae-sr', text: 'Ask ' + anna.name + ' a question' }),
            input,
            el('button', { type: 'submit', className: 'ae-chat-send' }, [el('span', { text: 'Send' })])
        ]);
        var closeBtn = el('button', { type: 'button', className: 'ae-chat-close', 'aria-label': 'Close chat', text: '×' });
        var panel = el('section', { id: 'ae-chat-panel', className: 'ae-chat-panel', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'ae-chat-title', hidden: true }, [
            el('div', { className: 'ae-chat-header' }, [
                avatar('ae-chat-header-img', anna.name),
                el('div', { className: 'ae-chat-header-copy' }, [
                    el('p', { id: 'ae-chat-title', className: 'ae-chat-title', text: anna.title }),
                    el('p', { className: 'ae-chat-subtitle', text: anna.subtitle })
                ]),
                closeBtn
            ]),
            log,
            chips,
            form
        ]);

        root.appendChild(nudge);
        root.appendChild(panel);
        root.appendChild(launcher);
        document.body.appendChild(root);

        ANNASIS_CHAT_KB.chips.forEach(function (c) {
            chips.appendChild(el('button', { type: 'button', className: 'ae-chat-chip', text: c.label, onclick: function () { ask(c.label, c.intent); } }));
        });

        function scrollLog() { log.scrollTop = log.scrollHeight; }

        function quizButton() {
            return el('button', { type: 'button', className: 'ae-chat-chip ae-chat-chip--primary ae-msg-cta', 'data-ae-action': 'quiz', text: 'Start the quiz →' });
        }

        function renderMessage(m) {
            var row = el('div', { className: 'ae-msg ae-msg--' + (m.from === 'anna' ? 'anna' : 'user') });
            if (m.from === 'anna') { row.appendChild(avatar('ae-msg-avatar')); }
            var bubble = el('div', { className: 'ae-msg-bubble' }, [
                el('span', { className: 'ae-sr', text: m.from === 'anna' ? anna.name + ' said: ' : 'You said: ' }),
                el('span', { text: m.text })
            ]);
            if (m.links && m.links.length) {
                var links = el('span', { className: 'ae-msg-links' });
                m.links.forEach(function (l) {
                    links.appendChild(el('a', { href: l.href, text: l.label + ' →', 'data-ae-action': isQuizHref(l.href) ? 'quiz' : null }));
                });
                bubble.appendChild(links);
            }
            if (m.cta === 'quiz') {
                bubble.appendChild(el('span', { className: 'ae-msg-cta-row' }, [quizButton()]));
            }
            row.appendChild(bubble);
            log.appendChild(row);
        }

        function pushMessage(m) {
            var history = readJSON(CHAT_LOG_KEY, []);
            history.push(m);
            store.set(CHAT_LOG_KEY, JSON.stringify(history.slice(-40)));
            renderMessage(m);
            scrollLog();
        }

        function say(text, links, extra) {
            var m = { from: 'anna', text: text, links: links || [] };
            if (extra) { Object.keys(extra).forEach(function (k) { m[k] = extra[k]; }); }
            pushMessage(m);
        }

        function addTopic(topic, question) {
            var topics = readJSON(CHAT_TOPICS_KEY, []);
            if (topic && topics.indexOf(topic) < 0) { topics.push(topic); store.set(CHAT_TOPICS_KEY, JSON.stringify(topics)); }
            if (question) {
                var list = readJSON(CHAT_QUESTIONS_KEY, []);
                list.push(question.slice(0, 200));
                store.set(CHAT_QUESTIONS_KEY, JSON.stringify(list.slice(-5)));
            }
        }

        // Any quiz link or button inside the chat (new replies, restored history,
        // "Start the quiz") closes the chat first, then goes to the quiz.
        function goToQuiz() {
            closeChat(false);
            if (focusQuiz({ fromChat: true, smooth: true })) { return; }
            store.set(QUIZ_GO_KEY, '1');
            window.location.assign(CONFIG.urls.quiz);
        }
        log.addEventListener('click', function (e) {
            if (e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) { return; }
            var t = e.target.closest ? e.target.closest('[data-ae-action="quiz"], a[href]') : null;
            if (!t || !log.contains(t)) { return; }
            if (t.getAttribute('data-ae-action') === 'quiz' || isQuizHref(t.getAttribute('href'))) {
                e.preventDefault();
                goToQuiz();
            }
        });

        /* ---- Choice chips inside the conversation (pricing + support steps) ---- */
        function askChoice(opts) {
            // opts: { options:[{v,l}], multi, label, onDone(values, labels) }
            var row = el('div', { className: 'ae-msg ae-msg--action ae-choice' });
            var group = el('div', { className: 'ae-choice-options', role: 'group', 'aria-label': opts.label || 'Choose an answer' });
            var picked = [];
            var nextBtn = null;
            function finish(values) {
                var labels = values.map(function (v) {
                    var o = opts.options.filter(function (x) { return x.v === v; })[0];
                    return o ? o.l : v;
                });
                row.parentNode.removeChild(row);
                pushMessage({ from: 'user', text: labels.length ? labels.join(', ') : 'Skip' });
                opts.onDone(values, labels);
            }
            opts.options.forEach(function (o) {
                var b = el('button', { type: 'button', className: 'ae-chat-chip ae-choice-chip', 'aria-pressed': opts.multi ? 'false' : null, text: o.l });
                b.addEventListener('click', function () {
                    if (!opts.multi) { finish([o.v]); return; }
                    var i = picked.indexOf(o.v);
                    if (i >= 0) { picked.splice(i, 1); } else { picked.push(o.v); }
                    b.setAttribute('aria-pressed', i >= 0 ? 'false' : 'true');
                    nextBtn.textContent = picked.length ? 'Next' : 'Skip';
                });
                group.appendChild(b);
            });
            row.appendChild(group);
            if (opts.multi) {
                nextBtn = el('button', { type: 'button', className: 'ae-chat-chip ae-chat-chip--primary ae-choice-next', text: 'Skip', onclick: function () { finish(picked.slice()); } });
                row.appendChild(el('div', { className: 'ae-choice-actions' }, [nextBtn]));
            }
            log.appendChild(row);
            scrollLog();
            var first = group.querySelector('button');
            if (first && !panel.hidden) { first.focus({ preventScroll: true }); }
        }

        /* ---- Sales lead form in the chat ---- */
        function showLeadForm() {
            var existing = log.querySelector('.ae-lead-form:not(.ae-lead-form--support)');
            if (existing) { log.appendChild(existing.parentNode); scrollLog(); existing.querySelector('input').focus(); return; }
            var wrap = el('div', { className: 'ae-msg ae-msg--form' });
            wrap.appendChild(buildLeadForm({
                kind: 'sales',
                source: 'chat',
                compact: true,
                intro: 'Share a few details and ANNASIS sales will follow up from sales@annasis.com. Your chat answers come along so you don’t have to repeat yourself.',
                getExtra: function () {
                    var q = readJSON(CHAT_QUAL_KEY, {});
                    return {
                        intent: q.intent || '',
                        currentTools: q.currentTools || [],
                        orgType: q.orgType || '',
                        size: q.size || '',
                        topics: readJSON(CHAT_TOPICS_KEY, []),
                        questions: readJSON(CHAT_QUESTIONS_KEY, [])
                    };
                },
                getParams: function () {
                    var q = readJSON(CHAT_QUAL_KEY, {});
                    return { src: 'chat', intent: q.intent || '', topics: readJSON(CHAT_TOPICS_KEY, []).join(',') };
                }
            }));
            log.appendChild(wrap);
            scrollLog();
            var first = wrap.querySelector('input');
            if (first) { first.focus(); }
        }

        /* ---- Pricing: qualify first (tools → type → size), then answer + lead form ---- */
        function startPricingFlow() {
            var toolStep = QUIZ.filter(function (s) { return s.id === 'tools'; })[0];
            var typeStep = QUIZ.filter(function (s) { return s.id === 'type'; })[0];
            var sizeStep = QUIZ.filter(function (s) { return s.id === 'size'; })[0];
            say('Happy to help with pricing. It’s tailored to the modules you’ll actually run, so three quick questions first. What do you use today? Pick all that apply.');
            askChoice({
                multi: true,
                label: 'What do you use today?',
                options: optionsFor(toolStep, { type: 'school' }),
                onDone: function (toolVals, toolLabels) {
                    say('What best describes you?');
                    askChoice({
                        label: 'What best describes you?',
                        options: optionsFor(typeStep, {}),
                        onDone: function (typeVals, typeLabels) {
                            var a = { type: typeVals[0] };
                            say(sizeStep.q(a) + ' A rough number is fine.');
                            askChoice({
                                label: sizeStep.q(a),
                                options: optionsFor(sizeStep, a),
                                onDone: function (sizeVals) {
                                    a.size = sizeVals[0];
                                    store.set(CHAT_QUAL_KEY, JSON.stringify({
                                        intent: 'pricing',
                                        currentTools: toolLabels,
                                        orgType: typeLabels[0],
                                        size: sizeText(a)
                                    }));
                                    var hit = ANNASIS_CHAT_KB.intents.pricing;
                                    say('Thanks! ' + hit.text, hit.links);
                                    showLeadForm();
                                }
                            });
                        }
                    });
                }
            });
        }

        /* ---- Support: customer? → category → description + contact ---- */
        function startSupportFlow() {
            say('Sorry you’re running into trouble — let’s get this to the right people. Are you an ANNASIS customer?');
            askChoice({
                label: 'Are you an ANNASIS customer?',
                options: SUPPORT_CUSTOMER,
                onDone: function (custVals) {
                    var cust = custVals[0];
                    if (cust === 'parent') {
                        say('Thanks! For questions about your Student or family account — like grades, balances, or schedules — your school office is usually the fastest help, since they manage those records. If something in ANNASIS itself isn’t working, like signing in, I can pass it to our team.',
                            [{ label: 'Support', href: CONFIG.urls.support }]);
                    }
                    say('What is it about?');
                    askChoice({
                        label: 'What is it about?',
                        options: SUPPORT_CATEGORIES,
                        onDone: function (catVals, catLabels) {
                            var cat = catVals[0];
                            var followUp = 'The ANNASIS team will follow up by email.';
                            if (CONFIG.support.email) { followUp += ' You can also write to ' + CONFIG.support.email + '.'; }
                            var supportLinks = [{ label: 'Support', href: CONFIG.urls.support }].concat(
                                CONFIG.support.url ? [{ label: 'Help center', href: CONFIG.support.url }] : []
                            );
                            if (cust === 'parent' && (cat === 'billing' || cat === 'gradebook')) {
                                say('Quick reminder: your school office can see your family’s balance and grades and can usually sort this out fastest. If you’d still like our team to take a look, add the details below. ' + followUp,
                                    supportLinks);
                            } else {
                                say('Got it. Tell me briefly what’s happening and how to reach you. ' + followUp,
                                    supportLinks);
                            }
                            showSupportForm(cust, catLabels[0]);
                        }
                    });
                }
            });
        }

        function showSupportForm(cust, category) {
            var wrap = el('div', { className: 'ae-msg ae-msg--form' });
            wrap.appendChild(buildLeadForm({
                kind: 'support',
                source: 'chat',
                compact: true,
                orgLabel: cust === 'parent' ? 'Your Student’s school or organization' : 'School or organization',
                intro: 'Support request: ' + category + '.',
                getExtra: function () {
                    return {
                        intent: 'support',
                        supportCategory: category,
                        customerStatus: SUPPORT_CUSTOMER_STATUS[cust] || '',
                        role: cust === 'parent' ? 'Parent' : '',
                        topics: readJSON(CHAT_TOPICS_KEY, []),
                        questions: readJSON(CHAT_QUESTIONS_KEY, [])
                    };
                },
                getParams: function () { return { src: 'support' }; }
            }));
            log.appendChild(wrap);
            scrollLog();
            var first = wrap.querySelector('textarea, input');
            if (first) { first.focus(); }
        }

        function ask(text, intentId) {
            var res;
            if (intentId) {
                var hit = ANNASIS_CHAT_KB.intents[intentId];
                res = { intent: intentId, topic: hit.topic, text: hit.text, links: hit.links || [], action: hit.action };
            } else {
                res = ANNASIS_CHAT.answer(text);
            }
            pushMessage({ from: 'user', text: text });
            addTopic(res.topic, intentId ? null : text);

            if (res.action === 'quiz') {
                if (quizRoot()) {
                    say('The quiz is right on this page — taking you there.');
                    goToQuiz();
                } else {
                    say(res.text, res.links, { cta: 'quiz' });
                    var cta = log.querySelector('.ae-msg:last-child .ae-msg-cta');
                    if (cta) { cta.focus({ preventScroll: true }); }
                }
                return;
            }
            if (res.action === 'pricing') { startPricingFlow(); return; }
            if (res.action === 'support') { startSupportFlow(); return; }
            say(res.text, res.links);
            if (res.action === 'lead') {
                if (res.intent === 'demo') { showLeadForm(); return; }
                var row = el('div', { className: 'ae-msg ae-msg--action' });
                var leadBtn = el('button', { type: 'button', className: 'ae-chat-chip ae-chat-chip--primary', text: 'Leave my details for sales', onclick: function () { row.parentNode.removeChild(row); showLeadForm(); } });
                row.appendChild(leadBtn);
                log.appendChild(row);
                scrollLog();
            }
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var text = input.value.trim();
            if (!text) { return; }
            input.value = '';
            ask(text, null);
        });

        var restored = false;
        function restoreOrGreet() {
            restored = true;
            log.innerHTML = '';
            var history = readJSON(CHAT_LOG_KEY, []);
            if (!history.length) {
                pushMessage({ from: 'anna', text: anna.greeting, links: [] });
                pushMessage({ from: 'anna', text: anna.prompt, links: [] });
            } else {
                history.forEach(renderMessage);
            }
        }

        function hideNudge() { nudge.hidden = true; }
        function openChat(focus) {
            if (!restored) { restoreOrGreet(); }
            panel.hidden = false;
            root.classList.add('is-open');
            launcher.setAttribute('aria-expanded', 'true');
            store.set(CHAT_OPEN_KEY, '1');
            store.set(CHAT_NUDGE_KEY, '1');
            hideNudge();
            scrollLog();
            if (focus) { input.focus(); }
        }
        function closeChat(focusLauncher) {
            panel.hidden = true;
            root.classList.remove('is-open');
            launcher.setAttribute('aria-expanded', 'false');
            store.set(CHAT_OPEN_KEY, '0');
            hideNudge();
            if (focusLauncher) { launcher.focus(); }
        }

        launcher.addEventListener('click', function () { if (panel.hidden) { openChat(true); } else { closeChat(true); } });
        closeBtn.addEventListener('click', function () { closeChat(true); });
        nudgeMsg.addEventListener('click', function () { openChat(true); });
        nudgeClose.addEventListener('click', function () { hideNudge(); launcher.focus(); });
        root.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape' && e.key !== 'Esc') { return; }
            if (!panel.hidden) { e.stopPropagation(); closeChat(true); }
            else if (!nudge.hidden) { hideNudge(); }
        });

        ANNASIS_CHAT.open = function () { openChat(true); };
        ANNASIS_CHAT.close = function () { closeChat(false); };
        ANNASIS_CHAT.ask = function (text, intentId) { if (panel.hidden) { openChat(false); } ask(text, intentId || null); };
        ANNASIS_CHAT.goToQuiz = goToQuiz;

        if (store.get(CHAT_OPEN_KEY) === '1') {
            openChat(false); // remember state across pages, but never steal focus on load
        } else if (CONFIG.nudgeDelayMs > 0 && !store.get(CHAT_NUDGE_KEY) && !isPage('contact')) {
            setTimeout(function () {
                if (!panel.hidden || store.get(CHAT_NUDGE_KEY) || store.get(CHAT_OPEN_KEY) === '0') { return; }
                nudge.hidden = false;
                store.set(CHAT_NUDGE_KEY, '1'); // once per session
                setTimeout(hideNudge, 12000);
            }, CONFIG.nudgeDelayMs);
        }
    }


    /* ---------------------------------------------------------
       Support page form ([data-annasis-support-form])
       --------------------------------------------------------- */
    function initSupportForm(root) {
        if (!root || root.getAttribute('data-ae-ready') === '1') { return; }
        root.setAttribute('data-ae-ready', '1');
        // Keep noscript for non-JS; clear for the live mount
        Array.prototype.forEach.call(root.querySelectorAll('noscript'), function (n) { n.parentNode.removeChild(n); });
        root.appendChild(buildLeadForm({
            kind: 'support',
            source: 'support-page',
            includeCategory: true,
            orgLabel: 'School or organization',
            intro: 'The ANNASIS team will follow up by email.',
            getExtra: function () {
                return { intent: 'support', customerStatus: 'ANNASIS customer (staff)' };
            },
            getParams: function () { return { src: 'support' }; }
        }));
    }

    /* ---------------------------------------------------------
       Boot (and re-boot after Blazor enhanced navigation)
       --------------------------------------------------------- */
    function boot() {
        // Arriving at the quiz (fit.html#fit-quiz, or sent here by Anna): keep the chat
        // closed so it never covers the quiz, then focus the quiz.
        var arriving = !!quizRoot() && (window.location.hash.toLowerCase() === '#fit-quiz' || store.get(QUIZ_GO_KEY) === '1');
        if (!quizRoot() || arriving) { store.del(QUIZ_GO_KEY); }
        if (arriving) {
            store.set(CHAT_OPEN_KEY, '0');
            if (ANNASIS_CHAT.close) { ANNASIS_CHAT.close(); }
        }
        if (applyChatMode()) { initChat(); }
        Array.prototype.forEach.call(document.querySelectorAll('[data-annasis-quiz]'), initQuiz);
        Array.prototype.forEach.call(document.querySelectorAll('[data-annasis-support-form]'), initSupportForm);
        initContactSummary();
        if (arriving) {
            focusQuiz({ restore: true });
            // The browser's own scroll-to-#fit-quiz runs after this and moves focus to the
            // page (the section itself is not focusable), and late images can shift the
            // layout — so re-apply focus/alignment shortly after and on load, unless the
            // visitor has already scrolled, clicked, or typed.
            var userMoved = false;
            var moved = function () { userMoved = true; };
            ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (t) { window.addEventListener(t, moved, { once: true, passive: true }); });
            var refocus = function () {
                // Until the visitor interacts, any other focus change was programmatic
                // (anchor scroll, Blazor's focus-on-navigate h1), so put focus back.
                if (userMoved || !quizRoot()) { return; }
                focusQuiz({});
            };
            setTimeout(refocus, 60);
            setTimeout(refocus, 600);
            window.addEventListener('load', refocus, { once: true });
        }
    }

    // Same-page "#fit-quiz" links (e.g. the fit.html hero button) close the chat too.
    window.addEventListener('hashchange', function () {
        if (window.location.hash.toLowerCase() !== '#fit-quiz' || !quizRoot()) { return; }
        if (ANNASIS_CHAT.close) { ANNASIS_CHAT.close(); }
        focusQuiz({ smooth: true });
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
    document.addEventListener('enhancedload', boot);
})();
