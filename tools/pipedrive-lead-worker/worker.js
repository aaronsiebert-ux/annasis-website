/**
 * ANNASIS lead Worker (Cloudflare Workers) — website payload → Pipedrive.
 *
 * Pipedrive's own webhooks are outbound-only, so the website POSTs here and this
 * Worker calls the Pipedrive API v1 with a token stored as a Worker secret
 * (PIPEDRIVE_API_TOKEN — never in the website or in this repo).
 *
 * Accepts: POST, body = the flat JSON payload from js/annasis-engage.js
 *          (Content-Type text/plain or application/json). OPTIONS for CORS preflight.
 * Sales   (type 'sales'):   find-or-create Organization (by name) → find-or-create
 *                           Person (by email; org, phone, job title) → Lead
 *                           (title = leadTitle) → Note on the Lead (noteText).
 * Support (type 'support'): no sales Lead. Org + Person as above → Note on the
 *                           Person/Org ("[Support] …") → Activity (task)
 *                           "[Support] <category> – <org>".
 * Env:  PIPEDRIVE_API_TOKEN (secret, required)
 *       PIPEDRIVE_DOMAIN    (optional, e.g. "annasis" → https://annasis.pipedrive.com)
 *       ALLOWED_ORIGINS     (optional, comma-separated; defaults below)
 *       JOB_TITLE_FIELD     (optional; Person field key for the visitor's role, default "job_title")
 *       SEGMENT_FIELD       (optional; Organization field key that receives orgType on NEW orgs)
 *       LABEL_WEBSITE_CHAT / LABEL_FIT_QUIZ (optional; Pipedrive lead-label UUIDs)
 */

const DEFAULT_ORIGINS = [
  'https://annasis.com',
  'https://www.annasis.com',
  'https://aaronsiebert-ux.github.io'
];
const MAX_BODY = 20000;
const STR_LIMIT = 5000;

function allowedOrigins(env) {
  return env && env.ALLOWED_ORIGINS
    ? env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
    : DEFAULT_ORIGINS;
}

function corsHeaders(origin, env) {
  const h = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
  if (origin && allowedOrigins(env).includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}

function json(status, data, origin, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json' }, corsHeaders(origin, env))
  });
}

const s = (v, max = 300) => (v === undefined || v === null ? '' : String(v).trim().slice(0, max));
const list = (v) => (Array.isArray(v) ? v.map((x) => s(x, 200)).filter(Boolean).slice(0, 30) : []);

/** Normalize + validate the website payload. Returns { ok, payload } or { ok:false, error, silent }. */
function validate(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, error: 'Body must be a JSON object' };
  // Honeypot: real visitors never fill "website". Pretend success so bots learn nothing.
  if (s(raw.website)) return { ok: false, silent: true, error: 'honeypot' };
  const p = {
    type: raw.type === 'support' ? 'support' : 'sales',
    source: s(raw.source, 40) || 'website',
    name: s(raw.name, 200),
    firstName: s(raw.firstName, 100),
    lastName: s(raw.lastName, 100),
    email: s(raw.email, 200).toLowerCase(),
    phone: s(raw.phone, 50),
    role: s(raw.role, 150),
    organization: s(raw.organization, 200),
    orgType: s(raw.orgType, 100),
    size: s(raw.size, 100),
    currentTools: list(raw.currentTools),
    pains: list(raw.pains),
    plan: s(raw.plan, 200),
    timeline: s(raw.timeline, 100),
    recommendation: s(raw.recommendation, 300),
    modules: list(raw.modules),
    topics: list(raw.topics),
    supportCategory: s(raw.supportCategory, 100),
    message: s(raw.message, STR_LIMIT),
    leadTitle: s(raw.leadTitle, 250),
    noteText: s(raw.noteText, STR_LIMIT * 2),
    pageUrl: s(raw.pageUrl, 1000),
    submittedAt: s(raw.submittedAt, 40)
  };
  const missing = [];
  if (!p.name) missing.push('name');
  if (!p.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) missing.push('email');
  if (!p.organization) missing.push('organization');
  if (p.type === 'support' && !p.message) missing.push('message');
  // Spam heuristics: link-stuffed messages or a name/org that is a URL.
  const urls = (p.message.match(/https?:\/\/|www\./gi) || []).length;
  if (urls > 2 || /https?:\/\//i.test(p.name + p.organization)) return { ok: false, silent: true, error: 'spam' };
  if (missing.length) return { ok: false, error: 'Missing or invalid: ' + missing.join(', ') };
  if (!p.leadTitle) {
    p.leadTitle = p.type === 'support'
      ? `[Support] ${p.supportCategory || 'Website request'} – ${p.organization}`
      : `Website lead – ${p.organization}`;
  }
  if (!p.noteText) p.noteText = fallbackNote(p);
  return { ok: true, payload: p };
}

function fallbackNote(p) {
  const rows = [
    ['Source', p.source], ['Name', p.name], ['Email', p.email], ['Phone', p.phone], ['Role', p.role],
    ['School / organization', p.organization], ['Organization type', p.orgType], ['Size', p.size],
    ['Uses today', p.currentTools.join(', ')], ['What hurts most', p.pains.join(', ')], ['Plan', p.plan],
    ['Timeline', p.timeline], ['Recommendation', p.recommendation], ['Modules', p.modules.join(', ')],
    ['Topics', p.topics.join(', ')], ['Support category', p.supportCategory], ['Message', p.message],
    ['Page', p.pageUrl], ['Submitted', p.submittedAt]
  ];
  return rows.filter((r) => r[1]).map((r) => r[0] + ': ' + r[1]).join('\n');
}

/* ---------------- Pipedrive API v1 ---------------- */
function pipedrive(env, fetchImpl) {
  const token = env.PIPEDRIVE_API_TOKEN;
  const base = env.PIPEDRIVE_DOMAIN
    ? `https://${String(env.PIPEDRIVE_DOMAIN).replace(/^https?:\/\//, '').replace(/\.pipedrive\.com.*$/, '')}.pipedrive.com/api/v1`
    : 'https://api.pipedrive.com/v1';
  async function call(method, path, body, query) {
    const url = new URL(base + path);
    Object.entries(query || {}).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetchImpl(url.toString(), {
      method,
      headers: Object.assign({ Accept: 'application/json', 'x-api-token': token }, body ? { 'Content-Type': 'application/json' } : {}),
      body: body ? JSON.stringify(body) : undefined
    });
    let data = null;
    try { data = await res.json(); } catch (e) { /* non-JSON */ }
    if (!res.ok || !data || data.success === false) {
      const err = new Error(`Pipedrive ${method} ${path} failed (${res.status}): ${(data && (data.error || data.message)) || 'no body'}`);
      err.status = res.status;
      throw err;
    }
    return data.data;
  }
  return { call };
}

const FREEMAIL = new Set(['gmail.com', 'googlemail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
  'msn.com', 'aol.com', 'icloud.com', 'me.com', 'mac.com', 'protonmail.com', 'proton.me', 'comcast.net',
  'att.net', 'sbcglobal.net', 'verizon.net', 'ymail.com', 'gmx.com', 'mail.com']);

/** Organization domain from the visitor's email (null for free-mail addresses). */
function emailDomain(email) {
  const d = (String(email).split('@')[1] || '').toLowerCase().replace(/^www\./, '');
  return d && !FREEMAIL.has(d) ? d : null;
}
function hostOf(url) {
  if (!url) return '';
  try { return new URL(/^https?:\/\//i.test(url) ? url : 'https://' + url).hostname.toLowerCase().replace(/^www\./, ''); }
  catch (e) { return ''; }
}
const normName = (n) => String(n || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const first = (found) => (found && found.items && found.items[0] && found.items[0].item) || null;

/**
 * CRM rule: search by NAME and by DOMAIN/website before creating an org.
 * 1) org already linked to the existing Person (by email) wins;
 * 2) exact name match; 3) an org whose website matches the email domain;
 * 4) otherwise create (with website + segment filled).
 */
async function findOrCreateOrg(pd, p, env, personOrgId) {
  if (personOrgId) return { id: personOrgId, created: false, matchedBy: 'person' };
  const byName = first(await pd.call('GET', '/organizations/search', null, { term: p.organization, fields: 'name', exact_match: 'true', limit: '1' }));
  if (byName && byName.id) return { id: byName.id, created: false, matchedBy: 'name' };
  const domain = emailDomain(p.email);
  if (domain) {
    const label = domain.split('.')[0];
    const hits = await pd.call('GET', '/organizations/search', null, { term: domain, limit: '10' });
    const nameHits = label.length >= 3 ? await pd.call('GET', '/organizations/search', null, { term: label, fields: 'name', limit: '10' }) : null;
    const ids = [...new Set([...(hits && hits.items) || [], ...(nameHits && nameHits.items) || []].map((x) => x.item && x.item.id).filter(Boolean))].slice(0, 10);
    for (const id of ids) {
      const org = await pd.call('GET', `/organizations/${id}`);
      if (org && hostOf(org.website) === domain) return { id, created: false, matchedBy: 'website' };
    }
  }
  const body = { name: p.organization };
  if (domain) body.website = 'https://' + domain;
  if (p.orgType && env.SEGMENT_FIELD) body[env.SEGMENT_FIELD] = p.orgType;
  const org = await pd.call('POST', '/organizations', body);
  return { id: org.id, created: true, matchedBy: null };
}

async function findPerson(pd, p) {
  return first(await pd.call('GET', '/persons/search', null, { term: p.email, fields: 'email', exact_match: 'true', limit: '1' }));
}

async function upsertPerson(pd, p, existing, orgId, env) {
  const jobKey = env.JOB_TITLE_FIELD || 'job_title';
  if (existing && existing.id) {
    // Fill gaps only — never overwrite what the team already entered.
    const patch = {};
    if (!existing.organization && orgId) patch.org_id = orgId;
    if (p.phone && !(existing.phones && existing.phones.length)) patch.phone = [{ value: p.phone, primary: true, label: 'work' }];
    if (Object.keys(patch).length) await pd.call('PUT', `/persons/${existing.id}`, patch);
    return { id: existing.id, created: false };
  }
  const body = { name: p.name, email: [{ value: p.email, primary: true, label: 'work' }], org_id: orgId || undefined };
  if (p.phone) body.phone = [{ value: p.phone, primary: true, label: 'work' }];
  if (p.role) body[jobKey] = p.role;
  const person = await pd.call('POST', '/persons', body);
  return { id: person.id, created: true };
}

function sourceName(p) { return p.source === 'fit-quiz' ? 'Fit quiz' : 'Website chat'; }

async function handleLead(p, env, fetchImpl) {
  env = env || {};
  const pd = pipedrive(env, fetchImpl);
  const existing = await findPerson(pd, p);
  const personOrgId = existing && existing.organization && (existing.organization.id || existing.organization);
  const org = await findOrCreateOrg(pd, p, env, personOrgId || null);
  const person = await upsertPerson(pd, p, existing, org.id, env);
  const dedupe = { orgCreated: org.created, orgMatchedBy: org.matchedBy, personCreated: person.created };
  if (p.type === 'support') {
    const content = /^\[Support\]/.test(p.noteText) ? p.noteText : '[Support] ' + p.noteText;
    const note = await pd.call('POST', '/notes', { content: esc(content), person_id: person.id, org_id: org.id });
    const activity = await pd.call('POST', '/activities', {
      subject: `[Support] ${p.supportCategory || 'Website request'} – ${p.organization}`.slice(0, 250),
      type: 'task', person_id: person.id, org_id: org.id,
      note: esc(p.message || ''), due_date: new Date().toISOString().slice(0, 10)
    });
    return Object.assign({ type: 'support', orgId: org.id, personId: person.id, noteId: note.id, activityId: activity.id }, dedupe);
  }
  const src = sourceName(p);
  const title = /^(Website chat|Fit quiz)\b/i.test(p.leadTitle) || /^Website /i.test(p.leadTitle) ? p.leadTitle : `${src} – ${p.leadTitle}`;
  const leadBody = { title: title.slice(0, 250), person_id: person.id, organization_id: org.id };
  const labelId = p.source === 'fit-quiz' ? env.LABEL_FIT_QUIZ : env.LABEL_WEBSITE_CHAT;
  if (labelId) leadBody.label_ids = [labelId];
  const lead = await pd.call('POST', '/leads', leadBody);
  const note = await pd.call('POST', '/notes', { content: esc(`Source: ${src}\n` + p.noteText), lead_id: lead.id });
  return Object.assign({ type: 'sales', orgId: org.id, personId: person.id, leadId: lead.id, noteId: note.id }, dedupe);
}

/** Notes are HTML in Pipedrive: escape visitor text, keep line breaks. */
function esc(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
}

/* Best-effort per-isolate rate limit (no extra Cloudflare products needed). */
const hits = new Map();
const RATE_MAX = 5, RATE_WINDOW_MS = 10 * 60 * 1000;
function rateLimited(ip, now = Date.now()) {
  if (!ip) return false;
  const arr = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > RATE_MAX;
}

async function handleRequest(request, env, fetchImpl) {
  fetchImpl = fetchImpl || fetch;
  const origin = request.headers.get('Origin') || '';
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: allowedOrigins(env).includes(origin) ? 204 : 403, headers: corsHeaders(origin, env) });
  }
  if (request.method !== 'POST') return json(405, { ok: false, error: 'POST only' }, origin, env);
  // Browsers always send Origin on cross-site POSTs; scripts (test-lead-webhook.sh) set it explicitly.
  if (!allowedOrigins(env).includes(origin)) return json(403, { ok: false, error: 'Origin not allowed' }, origin, env);
  if (!env || !env.PIPEDRIVE_API_TOKEN) return json(500, { ok: false, error: 'Server not configured (PIPEDRIVE_API_TOKEN missing)' }, origin, env);
  if (rateLimited(request.headers.get('CF-Connecting-IP'))) return json(429, { ok: false, error: 'Too many requests' }, origin, env);
  const text = await request.text();
  if (text.length > MAX_BODY) return json(413, { ok: false, error: 'Payload too large' }, origin, env);
  let raw;
  try { raw = JSON.parse(text); } catch (e) { return json(400, { ok: false, error: 'Body must be JSON' }, origin, env); }
  const v = validate(raw);
  if (!v.ok) return v.silent ? json(200, { ok: true }, origin, env) : json(400, { ok: false, error: v.error }, origin, env);
  try {
    const result = await handleLead(v.payload, env, fetchImpl);
    return json(200, Object.assign({ ok: true }, result), origin, env);
  } catch (e) {
    // 502 → the website falls back to the contact page, so the lead is not lost.
    console.error(e && e.message);
    return json(502, { ok: false, error: 'Could not save to Pipedrive' }, origin, env);
  }
}

export default {
  fetch(request, env) { return handleRequest(request, env); }
};
export { handleRequest, validate, handleLead, corsHeaders, emailDomain, hostOf };
