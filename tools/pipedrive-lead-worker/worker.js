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
 *       JOB_TITLE_FIELD     (optional; Person field key for job title, default "job_title")
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
    url.searchParams.set('api_token', token);
    const res = await fetchImpl(url.toString(), {
      method,
      headers: body ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
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

async function findOrCreateOrg(pd, name) {
  const found = await pd.call('GET', '/organizations/search', null, { term: name, fields: 'name', exact_match: 'true', limit: '1' });
  const item = found && found.items && found.items[0] && found.items[0].item;
  if (item && item.id) return { id: item.id, created: false };
  const org = await pd.call('POST', '/organizations', { name });
  return { id: org.id, created: true };
}

async function findOrCreatePerson(pd, p, orgId, env) {
  const found = await pd.call('GET', '/persons/search', null, { term: p.email, fields: 'email', exact_match: 'true', limit: '1' });
  const item = found && found.items && found.items[0] && found.items[0].item;
  const jobKey = (env && env.JOB_TITLE_FIELD) || 'job_title';
  if (item && item.id) {
    // Fill gaps only — never overwrite what the team already entered.
    const patch = {};
    if (!item.organization && orgId) patch.org_id = orgId;
    if (p.phone && !(item.phones && item.phones.length)) patch.phone = [{ value: p.phone, primary: true, label: 'work' }];
    if (Object.keys(patch).length) await pd.call('PUT', `/persons/${item.id}`, patch);
    return { id: item.id, created: false };
  }
  const body = {
    name: p.name,
    email: [{ value: p.email, primary: true, label: 'work' }],
    org_id: orgId || undefined
  };
  if (p.phone) body.phone = [{ value: p.phone, primary: true, label: 'work' }];
  if (p.role) body[jobKey] = p.role;
  const person = await pd.call('POST', '/persons', body);
  return { id: person.id, created: true };
}

async function handleLead(p, env, fetchImpl) {
  const pd = pipedrive(env, fetchImpl);
  const org = await findOrCreateOrg(pd, p.organization);
  const person = await findOrCreatePerson(pd, p, org.id, env);
  if (p.type === 'support') {
    const content = /^\[Support\]/.test(p.noteText) ? p.noteText : '[Support] ' + p.noteText;
    const note = await pd.call('POST', '/notes', { content: content.replace(/\n/g, '<br>'), person_id: person.id, org_id: org.id });
    const activity = await pd.call('POST', '/activities', {
      subject: `[Support] ${p.supportCategory || 'Website request'} – ${p.organization}`.slice(0, 250),
      type: 'task',
      person_id: person.id,
      org_id: org.id,
      note: (p.message || '').replace(/\n/g, '<br>'),
      due_date: new Date().toISOString().slice(0, 10)
    });
    return { type: 'support', orgId: org.id, personId: person.id, noteId: note.id, activityId: activity.id };
  }
  const lead = await pd.call('POST', '/leads', { title: p.leadTitle, person_id: person.id, organization_id: org.id });
  const note = await pd.call('POST', '/notes', { content: p.noteText.replace(/\n/g, '<br>'), lead_id: lead.id });
  return { type: 'sales', orgId: org.id, personId: person.id, leadId: lead.id, noteId: note.id };
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
export { handleRequest, validate, handleLead, corsHeaders };
