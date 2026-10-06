/* =========================================================
   ANNASIS Engage — "Are we a fit?" quiz, Anna chat assistant,
   and lead capture. Self-contained: this file + css/annasis-engage.css.
   No backend required. No API tokens belong in this file.

   Include on every page (after js/annasis.js):
     <link rel="stylesheet" href="css/annasis-engage.css" />
     <script src="js/annasis-engage.js" defer></script>
   Quiz renders into any element with [data-annasis-quiz] (fit.html).
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

        // Lead submission — see ANNASIS_LEAD below.
        lead: {
            // endpoint: '' (default) -> no network call; people go to contact.html,
            //   which embeds the Pipedrive web form, with the answers in the URL and
            //   a copy-ready summary above the form. (Pipedrive Web Forms cannot be
            //   prefilled or posted to from another page, so this is the safe default.)
            // endpoint: 'https://hooks.zapier.com/...' or a Make / own-server URL ->
            //   POST JSON payload; that webhook creates Person + Organization + Lead
            //   (+ Note) in Pipedrive using a token kept server-side.
            endpoint: '',
            // Sent as text/plain so the browser makes a "simple" request (no CORS
            // preflight). Zapier/Make parse the JSON body. Use 'application/json'
            // if your own server handles preflight.
            contentType: 'text/plain;charset=UTF-8',
            timeoutMs: 10000,
            fallbackUrl: 'contact.html'
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

       Payload → Pipedrive mapping (done by the webhook/server, never in
       the browser; keep the Pipedrive API token server-side):
         Person        name  = payload.person.name
                       email = payload.person.email
                       phone = payload.person.phone (optional)
                       (job title / custom field = payload.person.role)
         Organization  name  = payload.organization.name   (school / org)
         Lead          title = payload.lead.title
                       e.g. "Website fit quiz – <org>" or "Website chat (Anna) – <org>"
                       linked to the Person + Organization above
         Note          content = payload.note  (attach to the Lead) — plain text with
                       quiz answers + recommendation (or chat topics/questions),
                       page URL, landing page, referrer, and UTM params.
         Raw fields    payload.quiz / payload.chat / payload.context for custom
                       fields or labels if wanted (source = payload.source).
       Zapier example: Catch Hook → Pipedrive "Create Person" → "Create
       Organization" → "Create Lead" → "Create Note" (lead id from previous step).
       ========================================================= */
    var LEAD_STORAGE_KEY = 'annasis_lead_summary';

    function buildNote(payload) {
        var lines = [];
        lines.push('Source: ' + (payload.source === 'chat' ? 'ANNASIS website chat (Anna)' : 'ANNASIS website fit quiz'));
        if (payload.person && payload.person.name) {
            lines.push('Name: ' + payload.person.name);
            lines.push('Email: ' + payload.person.email);
            if (payload.person.phone) { lines.push('Phone: ' + payload.person.phone); }
            if (payload.person.role) { lines.push('Role: ' + payload.person.role); }
        }
        if (payload.organization && payload.organization.name) { lines.push('School / organization: ' + payload.organization.name); }
        if (payload.quiz) {
            if (payload.quiz.recommendation) {
                lines.push('');
                lines.push('Recommendation: ' + payload.quiz.recommendation.title);
                if (payload.quiz.recommendation.modules && payload.quiz.recommendation.modules.length) {
                    lines.push('Suggested modules: ' + payload.quiz.recommendation.modules.join(', '));
                }
            }
            lines.push('');
            lines.push('Quiz answers:');
            (payload.quiz.answerList || []).forEach(function (a) {
                lines.push('- ' + a.question + ' ' + a.answer);
            });
        }
        if (payload.chat) {
            lines.push('');
            if (payload.chat.topics && payload.chat.topics.length) { lines.push('Chat topics: ' + payload.chat.topics.join(', ')); }
            if (payload.chat.questions && payload.chat.questions.length) {
                lines.push('Questions typed:');
                payload.chat.questions.forEach(function (q) { lines.push('- ' + q); });
            }
        }
        var c = payload.context || {};
        lines.push('');
        if (c.pageUrl) { lines.push('Page: ' + c.pageUrl); }
        if (c.landingPage && c.landingPage !== c.pageUrl) { lines.push('Landing page: ' + c.landingPage); }
        if (c.referrer) { lines.push('Referrer: ' + c.referrer); }
        var utmKeys = Object.keys(c.utm || {});
        if (utmKeys.length) { lines.push('UTM: ' + utmKeys.map(function (k) { return k + '=' + c.utm[k]; }).join(', ')); }
        return lines.join('\n');
    }

    function buildContext() {
        var l = readJSON('annasis_landing', {});
        return {
            pageUrl: window.location.href.split('#')[0],
            pageTitle: document.title,
            landingPage: l.landingPage || '',
            referrer: l.referrer || document.referrer || '',
            utm: l.utm || {},
            submittedAt: new Date().toISOString()
        };
    }

    // Completes a payload: context, lead title, note.
    function finalizePayload(payload) {
        payload.context = payload.context || buildContext();
        var org = (payload.organization && payload.organization.name) || (payload.person && payload.person.name) || 'Website visitor';
        payload.lead = payload.lead || {};
        if (!payload.lead.title) {
            payload.lead.title = (payload.source === 'chat' ? 'Website chat (Anna) – ' : 'Website fit quiz – ') + org;
        }
        payload.note = buildNote(payload);
        return payload;
    }

    function fallbackToContact(payload, params) {
        // Contact details stay in sessionStorage (same site, this tab only) — not in the URL,
        // so names and emails never land in analytics or referrer logs.
        store.set(LEAD_STORAGE_KEY, JSON.stringify({ source: payload.source, note: payload.note, at: Date.now() }));
        var url = CONFIG.lead.fallbackUrl || CONFIG.urls.contact;
        var query = qs(params || {});
        window.location.href = url + (query ? (url.indexOf('?') < 0 ? '?' : '&') + query : '');
    }

    var ANNASIS_LEAD = {
        buildNote: buildNote,
        /**
         * submit(payload, options)
         *   payload: { source: 'fit-quiz'|'chat', person:{name,email,phone,role},
         *              organization:{name}, quiz?:{...}, chat?:{...} }
         *   options.params: non-personal query params for the contact.html fallback
         * Resolves { ok, mode: 'endpoint' } after a successful POST; otherwise
         * (no endpoint, or the POST fails) it sends the visitor to contact.html.
         */
        submit: function (payload, options) {
            options = options || {};
            finalizePayload(payload);
            var endpoint = CONFIG.lead.endpoint;
            if (!endpoint || !window.fetch) {
                fallbackToContact(payload, options.params);
                return Promise.resolve({ ok: true, mode: 'fallback' });
            }
            var controller = window.AbortController ? new window.AbortController() : null;
            var timer = controller ? setTimeout(function () { controller.abort(); }, CONFIG.lead.timeoutMs) : null;
            return window.fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': CONFIG.lead.contentType },
                body: JSON.stringify(payload),
                signal: controller ? controller.signal : undefined
            }).then(function (res) {
                if (timer) { clearTimeout(timer); }
                if (!res.ok) { throw new Error('HTTP ' + res.status); }
                store.set(LEAD_STORAGE_KEY, JSON.stringify({ source: payload.source, note: payload.note, at: Date.now(), sent: true }));
                return { ok: true, mode: 'endpoint' };
            }).catch(function () {
                if (timer) { clearTimeout(timer); }
                fallbackToContact(payload, options.params);
                return { ok: true, mode: 'fallback' };
            });
        }
    };
    window.ANNASIS_LEAD = ANNASIS_LEAD;

    /* ---------------------------------------------------------
       Shared lead-capture form (quiz result + chat)
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
        // opts: { source, intro, compact, getExtra(): {quiz|chat}, getParams(): {} }
        var fid = nextId('ae-lead');
        var status = el('p', { className: 'ae-lead-status', role: 'status', 'aria-live': 'polite' });

        function field(name, label, type, required, autocomplete) {
            var id = fid + '-' + name;
            return el('div', { className: 'ae-field' }, [
                el('label', { 'for': id }, [label, required ? null : el('span', { className: 'ae-optional', text: ' (optional)' })]),
                el('input', { id: id, name: name, type: type, required: required, 'aria-required': required ? 'true' : null, autocomplete: autocomplete })
            ]);
        }

        var roleId = fid + '-role';
        var roleSelect = el('select', { id: roleId, name: 'role' }, [el('option', { value: '', text: 'Choose one' })].concat(ROLES.map(function (r) {
            return el('option', { value: r, text: r });
        })));

        var submitBtn = el('button', { type: 'submit', className: 'btn ae-lead-submit', text: 'Send to ANNASIS sales' });

        var form = el('form', { className: 'ae-lead-form' + (opts.compact ? ' ae-lead-form--compact' : ''), novalidate: true, 'aria-describedby': fid + '-intro' }, [
            el('p', { id: fid + '-intro', className: 'ae-lead-intro', text: opts.intro }),
            el('div', { className: 'ae-lead-grid' }, [
                field('name', 'Your name', 'text', true, 'name'),
                field('email', 'Work email', 'email', true, 'email'),
                field('org', 'School or organization', 'text', true, 'organization'),
                el('div', { className: 'ae-field' }, [el('label', { 'for': roleId, text: 'Your role' }), roleSelect]),
                field('phone', 'Phone', 'tel', false, 'tel')
            ]),
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
                role: form.elements.role.value,
                phone: form.elements.phone.value.trim()
            };
            var problems = [];
            [['name', 'your name'], ['email', 'a valid work email'], ['org', 'your school or organization']].forEach(function (f) {
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
            status.textContent = CONFIG.lead.endpoint ? 'Sending…' : 'Taking you to the contact page…';
            var payload = {
                source: opts.source,
                person: { name: data.name, email: data.email, phone: data.phone, role: data.role },
                organization: { name: data.org }
            };
            var extra = opts.getExtra ? opts.getExtra() : {};
            Object.keys(extra).forEach(function (k) { payload[k] = extra[k]; });
            ANNASIS_LEAD.submit(payload, { params: opts.getParams ? opts.getParams() : {} }).then(function (r) {
                if (r.mode !== 'endpoint') { return; }
                var first = data.name.split(' ')[0];
                var done = el('div', { className: 'ae-lead-done', tabindex: '-1' }, [
                    el('p', { className: 'ae-lead-done-title', text: 'Thanks, ' + first + '.' }),
                    el('p', { text: 'ANNASIS sales will follow up from sales@annasis.com.' })
                ]);
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

    function answerList(answers) {
        return QUIZ.filter(function (s) {
            var v = answers[s.id];
            return v && (!Array.isArray(v) || v.length);
        }).map(function (s) {
            return { id: s.id, question: s.q(answers), answer: labelFor(s.id, answers[s.id], answers) };
        });
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
            portal: M('Family portal & communication', 'One family portal for Parents plus email and SMS — on the school’s own site, no required app.', u.different, 'See The Difference'),
            reporting: M('Analytics & dashboards', 'A clear view for the office without exporting to five spreadsheets.', u.education, 'Explore Schools'),
            admissions: M('Admissions', 'Inquiry, online application, enrollment, and re-enrollment — with waivers and consents on the school site.', u.education, 'Explore Schools'),
            sis: M('Student information system', 'One student and family record — demographics, Attendance, Scheduler, Behavior / Discipline, and reporting.', u.education, 'Explore Schools'),
            gradebook: M('Learning Management & Gradebook', 'Gradebook, progress reports, report cards, and transcripts on the same student and family system.', u.education, 'Explore Schools')
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
     *   FinalForms or "outside" → Athletics; "logins" → Family portal & communication;
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
                body: 'Run the school on one platform: twelve foundation modules on one student and family record — from Admissions and Gradebook to tuition & billing, events, the school store, and athletics. Parents, Students, and Faculty get one campus experience; the office keeps QuickBooks as books of record.',
                modules: [C.admissions, C.sis, C.gradebook, C.tuition, C.events, C.store, C.athletics, C.quickbooks]
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

    function recSummary(rec) {
        return { id: rec.id, title: rec.title, modules: rec.modules.map(function (m) { return m.name; }) };
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

        function showResult() {
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
                source: 'fit-quiz',
                intro: 'Send your answers and this recommendation to ANNASIS sales. We will follow up from sales@annasis.com.',
                getExtra: function () {
                    return { quiz: { answers: answers, answerList: answerList(answers), recommendation: recSummary(rec) } };
                },
                getParams: function () { return params; }
            }));

            var retake = el('button', { type: 'button', className: 'ae-linklike', text: 'Retake the quiz', onclick: function () {
                answers = {}; index = 0; render(true);
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
            if (root.getBoundingClientRect().top < 0) { root.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        }

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
        var note = '';
        if (stored && stored.note && (!p.src || p.src === stored.source)) {
            note = stored.note;
            source = stored.source;
        } else if (p.src === 'fit-quiz' && p.fit) {
            var a = {
                type: p.fit, size: p.size, plan: p.plan, when: p.when,
                tools: p.tools ? p.tools.split(',') : [], pain: p.pain ? p.pain.split(',') : []
            };
            note = finalizePayload({ source: 'fit-quiz', quiz: { answers: a, answerList: answerList(a), recommendation: recSummary(recommend(a)) } }).note;
            source = 'fit-quiz';
        } else if (p.src === 'chat') {
            note = finalizePayload({ source: 'chat', chat: { topics: p.topics ? p.topics.split(',') : [] } }).note;
            source = 'chat';
        }
        if (!note) { return; }

        var anchor = document.querySelector('.form-embed');
        if (!anchor) { return; }
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
            el('div', { className: 'kicker', text: source === 'chat' ? 'From your chat with Anna' : 'From your fit quiz' }),
            el('h2', { id: taId + '-h', className: 'ae-contact-title', text: 'Your answers, ready to send' }),
            el('p', { text: 'Copy this summary and paste it into the message box in the form below so ANNASIS sales sees your answers.' }),
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
       action: 'lead' shows the lead-capture form; 'quiz' jumps to the quiz.
       ========================================================= */
    var U = CONFIG.urls;
    var ANNASIS_CHAT_KB = {
        chips: [
            { label: 'What is ANNASIS?', intent: 'what' },
            { label: 'Does it work with my current SIS?', intent: 'sis' },
            { label: 'Events & camps', intent: 'events' },
            { label: 'School store', intent: 'store' },
            { label: 'Pricing', intent: 'pricing' },
            { label: 'Take the fit quiz', intent: 'quiz' },
            { label: 'Book a demo', intent: 'demo' }
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
                links: [{ label: 'Take the fit quiz', href: U.quiz }],
                action: 'quiz'
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
                text: 'Many SIS packages can share rosters in a standard called OneRoster — directly, or through Clever or ClassLink. Standards-based roster sharing is on the ANNASIS roadmap. Today, we map each school’s handoff during onboarding and confirm the path with your vendors before we commit to a date.',
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
                topic: 'Events & camps',
                keywords: ['event', 'registration', 'register', 'ticket', 'ticketing', 'eventbrite', 'conference', 'convention', 'check-in', 'checkin', 'exhibitor', 'fundraiser', 'plays', 'enrichment'],
                text: 'ANNASIS event registration covers sports, plays, camps, enrichment, games, fundraisers, church programs, conferences, and conventions — registration and ticketing for paid and free events, check-in and scheduling, exhibitor and add-on paths where your event needs them, and fundraising with sponsor invites and round-up beside payments. For schools it stays on the same student and family record as tuition & billing — no Eventbrite leakage. Camps get a one-stop path too: registration, camp store, attendance & check-in, and fundraising.',
                links: [{ label: 'See Events', href: U.events }, { label: 'See Camps', href: U.camps }]
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
                action: 'lead'
            },
            admissions: {
                topic: 'Admissions',
                keywords: ['admission', 'admissions', 'enroll', 'enrollment', 'application', 'apply', 'inquiry', 're-enrollment', 'reenrollment'],
                text: 'Admissions covers inquiry, online application, enrollment, and re-enrollment — one pipeline with configurable application forms. Embed Apply on the website you already have, and collect waivers and consents in enrollment packets on the same student and family system.',
                links: [{ label: 'Explore Schools', href: U.education }]
            },
            gradebook: {
                topic: 'Gradebook',
                keywords: ['grade', 'gradebook', 'report card', 'transcript', 'gpa', 'progress report', 'rubric', 'assignment'],
                text: 'Learning Management & Gradebook includes assignments, rubrics, report cards, progress reports, transcripts, and GPA. Faculty live here; Parents and Students see the same academic record in the family portal — no separate parent grade portal.',
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
                text: 'Health & medical records keep immunizations, allergies, medications, and emergency-card details on the student system. Athletics physicals that expire use the same workflows as eligibility and clearance — nurse, coach, and office look at one Student.',
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
                keywords: ['email', 'sms', 'text message', 'texting', 'notification', 'notice', 'app', 'mobile', 'portal', 'parent portal', 'family portal', 'login', 'logins'],
                text: 'Email and SMS messaging go to groups, teams, and lists, and Parents get one family portal — apply, register, pay, and stay informed on the school’s own site. Phone-friendly portal and SMS — no required app.',
                links: [{ label: 'The Difference', href: U.different }]
            },
            fundraising: {
                topic: 'Fundraising',
                keywords: ['donation', 'donate', 'fundraising', 'fundraise', 'giving', 'give', 'sponsor', 'campaign', 'round-up', 'round up', 'goal', 'annual fund'],
                text: 'Donations & fundraising cover one-time and recurring giving on the same family wallet. Sponsor invites let families, staff, and others invite sponsors for students, events, and similar participants, and optional round-up on store purchases drives additional giving. A class, team, or campaign can see progress — dollars raised against a goal, rankings, and percent to goal.',
                links: [{ label: 'Explore Schools', href: U.education }]
            },
            partnership: {
                topic: 'Partnership & support',
                keywords: ['support', 'implementation', 'onboarding', 'training', 'partner', 'partnership', 'roadmap', 'go-live', 'go live'],
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
                text: 'ANNASIS is a school operating system for private education — not just a student information system. Twelve foundation modules share one student and family record: Admissions, SIS, Learning Management & Gradebook, tuition & billing, health & medical records, the school store, communication, event registration, donations & fundraising, QuickBooks accounting, uniform exchange, and athletics eligibility & workflows. Private schools have customers — Parents, Students, and Faculty — and the same platform also powers Events, Store, Camps, and Churches.',
                links: [{ label: 'Explore Schools', href: U.education }, { label: 'The Difference', href: U.different }]
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
            text: 'I don’t have a scripted answer for that yet. The two-minute fit quiz can point you to the right modules, or Talk with Sales and a person will answer.',
            links: [{ label: 'Take the fit quiz', href: U.quiz }, { label: 'Talk with Sales', href: U.contact }],
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
       Anna chat widget UI
       --------------------------------------------------------- */
    var CHAT_OPEN_KEY = 'annasis_chat_open';
    var CHAT_LOG_KEY = 'annasis_chat_log';
    var CHAT_TOPICS_KEY = 'annasis_chat_topics';
    var CHAT_QUESTIONS_KEY = 'annasis_chat_questions';
    var CHAT_NUDGE_KEY = 'annasis_chat_nudged';

    function initChat() {
        if (document.getElementById('ae-chat')) { return; }
        var anna = CONFIG.anna;
        var root = el('div', { id: 'ae-chat', className: 'ae-chat' });
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

        function renderMessage(m) {
            var row = el('div', { className: 'ae-msg ae-msg--' + (m.from === 'anna' ? 'anna' : 'user') });
            if (m.from === 'anna') { row.appendChild(avatar('ae-msg-avatar')); }
            var bubble = el('div', { className: 'ae-msg-bubble' }, [
                el('span', { className: 'ae-sr', text: m.from === 'anna' ? anna.name + ' said: ' : 'You said: ' }),
                el('span', { text: m.text })
            ]);
            if (m.links && m.links.length) {
                var links = el('span', { className: 'ae-msg-links' });
                m.links.forEach(function (l) { links.appendChild(el('a', { href: l.href, text: l.label + ' →' })); });
                bubble.appendChild(links);
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

        function addTopic(topic, question) {
            var topics = readJSON(CHAT_TOPICS_KEY, []);
            if (topic && topics.indexOf(topic) < 0) { topics.push(topic); store.set(CHAT_TOPICS_KEY, JSON.stringify(topics)); }
            if (question) {
                var list = readJSON(CHAT_QUESTIONS_KEY, []);
                list.push(question.slice(0, 200));
                store.set(CHAT_QUESTIONS_KEY, JSON.stringify(list.slice(-5)));
            }
        }

        function showLeadForm() {
            var existing = log.querySelector('.ae-lead-form');
            if (existing) { existing.querySelector('input').focus(); return; }
            var wrap = el('div', { className: 'ae-msg ae-msg--form' });
            wrap.appendChild(buildLeadForm({
                source: 'chat',
                compact: true,
                intro: 'Share a few details and ANNASIS sales will follow up from sales@annasis.com. Your chat topics come along so you don’t have to repeat yourself.',
                getExtra: function () {
                    return { chat: { topics: readJSON(CHAT_TOPICS_KEY, []), questions: readJSON(CHAT_QUESTIONS_KEY, []) } };
                },
                getParams: function () { return { src: 'chat', topics: readJSON(CHAT_TOPICS_KEY, []).join(',') }; }
            }));
            log.appendChild(wrap);
            scrollLog();
            var first = wrap.querySelector('input');
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

            var quizHere = document.getElementById('fit-quiz');
            if (res.action === 'quiz' && quizHere) {
                pushMessage({ from: 'anna', text: 'The quiz is right on this page — taking you there.', links: [] });
                closeChat(false);
                quizHere.scrollIntoView({ behavior: 'smooth', block: 'start' });
                var target = quizHere.querySelector('.ae-quiz-q, .ae-quiz-result-title');
                if (target) { setTimeout(function () { target.focus({ preventScroll: true }); }, 450); }
                return;
            }
            pushMessage({ from: 'anna', text: res.text, links: res.links });
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

        if (store.get(CHAT_OPEN_KEY) === '1') {
            openChat(false); // remember state across pages, but never steal focus on load
        } else if (CONFIG.nudgeDelayMs > 0 && !store.get(CHAT_NUDGE_KEY) && !isPage('contact')) {
            setTimeout(function () {
                if (!panel.hidden || store.get(CHAT_NUDGE_KEY)) { return; }
                nudge.hidden = false;
                store.set(CHAT_NUDGE_KEY, '1'); // once per session
                setTimeout(hideNudge, 12000);
            }, CONFIG.nudgeDelayMs);
        }
    }

    /* ---------------------------------------------------------
       Boot (and re-boot after Blazor enhanced navigation)
       --------------------------------------------------------- */
    function boot() {
        if (applyChatMode()) { initChat(); }
        Array.prototype.forEach.call(document.querySelectorAll('[data-annasis-quiz]'), initQuiz);
        initContactSummary();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
    document.addEventListener('enhancedload', boot);
})();
