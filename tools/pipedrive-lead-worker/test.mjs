// Local unit tests for worker.js with a mocked Pipedrive (no network). Run: node test.mjs
import assert from 'node:assert/strict';
import { handleRequest, validate } from './worker.js';

const ENV = { PIPEDRIVE_API_TOKEN: 'test-token-not-real', PIPEDRIVE_DOMAIN: 'annasis', JOB_TITLE_FIELD: 'TITLE', SEGMENT_FIELD: 'SEG', LABEL_WEBSITE_CHAT: 'chat-label', LABEL_FIT_QUIZ: 'quiz-label' };
const ORIGIN = 'https://aaronsiebert-ux.github.io';

function mockPipedrive({ existingOrg = null, existingPerson = null, domainOrg = null, failOn = null } = {}) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    const u = new URL(url);
    const method = init.method || 'GET';
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ method, path: u.pathname, query: Object.fromEntries(u.searchParams), body, host: u.host, token: (init.headers || {})['x-api-token'] });
    const ok = (data) => new Response(JSON.stringify({ success: true, data }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    if (failOn && u.pathname.endsWith(failOn)) return new Response(JSON.stringify({ success: false, error: 'boom' }), { status: 500 });
    if (u.pathname.endsWith('/organizations/search')) {
      if (u.searchParams.get('exact_match')) return ok({ items: existingOrg ? [{ item: existingOrg }] : [] });
      return ok({ items: domainOrg ? [{ item: { id: domainOrg.id } }] : [] });
    }
    if (/\/organizations\/\d+$/.test(u.pathname)) return ok(domainOrg);
    if (u.pathname.endsWith('/persons/search')) return ok({ items: existingPerson ? [{ item: existingPerson }] : [] });
    if (u.pathname.endsWith('/organizations')) return ok({ id: 101 });
    if (u.pathname.endsWith('/persons')) return ok({ id: 202 });
    if (/\/persons\/\d+$/.test(u.pathname)) return ok({ id: +u.pathname.split('/').pop() });
    if (u.pathname.endsWith('/leads')) return ok({ id: 'lead-uuid-1' });
    if (u.pathname.endsWith('/notes')) return ok({ id: 303 });
    if (u.pathname.endsWith('/activities')) return ok({ id: 404 });
    return new Response('{}', { status: 404 });
  };
  return { calls, fetchImpl };
}

const sales = {
  type: 'sales', source: 'chat', intent: 'pricing', name: 'Pat Tester', firstName: 'Pat', lastName: 'Tester',
  email: 'Pat@Example.org', phone: '555-0100', role: 'Business office / finance', organization: 'Example Academy',
  orgType: 'Private school', size: '150–400 Students', currentTools: ['FACTS / RenWeb', 'QuickBooks'], pains: [],
  plan: '', timeline: '', recommendation: '', modules: [], topics: ['Pricing'], supportCategory: '', message: '',
  leadTitle: 'Website pricing (Anna) – Example Academy', noteText: 'Sales lead from the ANNASIS website\nName: Pat Tester',
  pageUrl: 'https://aaronsiebert-ux.github.io/annasis-website/events.html', landingPage: '', referrer: '',
  utm_source: '', utm_medium: '', utm_campaign: '', utm_term: '', utm_content: '', gclid: '', submittedAt: new Date().toISOString(), website: ''
};
const support = Object.assign({}, sales, {
  type: 'support', intent: 'support', supportCategory: 'Login / account access', message: 'Password reset email never arrives.',
  leadTitle: '[Support] Login / account access – Example Academy', noteText: '[Support] Support request from the ANNASIS website\nName: Pat Tester'
});

const req = (body, { origin = ORIGIN, method = 'POST', ct = 'text/plain;charset=UTF-8' } = {}) =>
  new Request('https://annasis-lead.example.workers.dev/', { method, headers: { Origin: origin, 'Content-Type': ct }, body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined });

let n = 0;
async function t(name, fn) { await fn(); n++; console.log('ok -', name); }

await t('sales: new person + new org (name AND domain searched first), lead, note', async () => {
  const m = mockPipedrive();
  const res = await handleRequest(req(sales), ENV, m.fetchImpl);
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.deepEqual(data, { ok: true, type: 'sales', orgId: 101, personId: 202, leadId: 'lead-uuid-1', noteId: 303, orgCreated: true, orgMatchedBy: null, personCreated: true });
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  const paths = m.calls.map((c) => c.method + ' ' + c.path.replace('/api/v1', ''));
  assert.deepEqual(paths, ['GET /persons/search', 'GET /organizations/search', 'GET /organizations/search', 'GET /organizations/search', 'POST /organizations', 'POST /persons', 'POST /leads', 'POST /notes']);
  assert.equal(m.calls[0].host, 'annasis.pipedrive.com');
  assert.equal(m.calls[0].token, 'test-token-not-real'); assert.equal(m.calls[0].query.api_token, undefined);
  assert.equal(m.calls[0].query.term, 'pat@example.org');
  assert.equal(m.calls[1].query.term, 'Example Academy');
  assert.equal(m.calls[2].query.term, 'example.org');
  assert.deepEqual(m.calls[4].body, { name: 'Example Academy', website: 'https://example.org', SEG: 'Private school' });
  assert.equal(m.calls[5].body.org_id, 101);
  assert.equal(m.calls[5].body.TITLE, 'Business office / finance');
  assert.deepEqual(m.calls[6].body, { title: 'Website pricing (Anna) – Example Academy', person_id: 202, organization_id: 101, label_ids: ['chat-label'] });
  assert.equal(m.calls[7].body.lead_id, 'lead-uuid-1');
  assert.match(m.calls[7].body.content, /^Source: Website chat<br>Sales lead/);
});

await t('sales: existing person by email → reuse person AND their org (no org search)', async () => {
  const m = mockPipedrive({ existingPerson: { id: 8, organization: { id: 7 }, phones: [] } });
  const data = await (await handleRequest(req(sales, { ct: 'application/json' }), { PIPEDRIVE_API_TOKEN: 'x' }, m.fetchImpl)).json();
  assert.equal(data.orgId, 7); assert.equal(data.personId, 8); assert.equal(data.orgMatchedBy, 'person');
  const paths = m.calls.map((c) => c.method + ' ' + c.path.replace('/v1', ''));
  assert.deepEqual(paths, ['GET /persons/search', 'PUT /persons/8', 'POST /leads', 'POST /notes']);
  assert.equal(m.calls[0].host, 'api.pipedrive.com');
});

await t('sales: org matched by exact name', async () => {
  const m = mockPipedrive({ existingOrg: { id: 7, name: 'Example Academy' } });
  const data = await (await handleRequest(req(sales), ENV, m.fetchImpl)).json();
  assert.equal(data.orgId, 7); assert.equal(data.orgMatchedBy, 'name');
  assert.ok(!m.calls.some((c) => c.method === 'POST' && c.path.endsWith('/organizations')));
});

await t('sales: org matched by website domain when name differs; fit quiz label', async () => {
  const m = mockPipedrive({ domainOrg: { id: 9, website: 'http://www.example.org/' } });
  const data = await (await handleRequest(req(Object.assign({}, sales, { source: 'fit-quiz', organization: 'Example Acad.' })), ENV, m.fetchImpl)).json();
  assert.equal(data.orgId, 9); assert.equal(data.orgMatchedBy, 'website');
  assert.deepEqual(m.calls.find((c) => c.path.endsWith('/leads')).body.label_ids, ['quiz-label']);
});

await t('gmail address → no domain search, no website set', async () => {
  const m = mockPipedrive();
  await handleRequest(req(Object.assign({}, sales, { email: 'pat@gmail.com' })), ENV, m.fetchImpl);
  assert.equal(m.calls.filter((c) => c.path.endsWith('/organizations/search')).length, 1);
  assert.equal(m.calls.find((c) => c.method === 'POST' && c.path.endsWith('/organizations')).body.website, undefined);
});

await t('spam: link-stuffed message silently dropped', async () => {
  const m = mockPipedrive();
  const res = await handleRequest(req(Object.assign({}, sales, { message: 'http://a http://b http://c' })), ENV, m.fetchImpl);
  assert.equal(res.status, 200); assert.equal(m.calls.length, 0);
});

await t('support: no lead; [Support] note on person/org + task activity', async () => {
  const m = mockPipedrive();
  const res = await handleRequest(req(support), ENV, m.fetchImpl);
  const data = await res.json();
  assert.deepEqual(data, { ok: true, type: 'support', orgId: 101, personId: 202, noteId: 303, activityId: 404, orgCreated: true, orgMatchedBy: null, personCreated: true });
  const paths = m.calls.map((c) => c.method + ' ' + c.path.replace('/api/v1', ''));
  assert.ok(!paths.includes('POST /leads'));
  const note = m.calls.find((c) => c.path.endsWith('/notes')).body;
  assert.match(note.content, /^\[Support\]/); assert.equal(note.person_id, 202); assert.equal(note.org_id, 101); assert.equal(note.lead_id, undefined);
  const act = m.calls.find((c) => c.path.endsWith('/activities')).body;
  assert.equal(act.type, 'task'); assert.equal(act.subject, '[Support] Login / account access – Example Academy');
  assert.equal(act.person_id, 202); assert.equal(act.org_id, 101); assert.match(act.due_date, /^\d{4}-\d{2}-\d{2}$/);
});

await t('support note gets [Support] prefix even if noteText lacks it', async () => {
  const m = mockPipedrive();
  await handleRequest(req(Object.assign({}, support, { noteText: 'plain note' })), ENV, m.fetchImpl);
  assert.equal(m.calls.find((c) => c.path.endsWith('/notes')).body.content, '[Support] plain note');
});

await t('honeypot → 200 ok, nothing sent to Pipedrive', async () => {
  const m = mockPipedrive();
  const res = await handleRequest(req(Object.assign({}, sales, { website: 'http://spam' })), ENV, m.fetchImpl);
  assert.equal(res.status, 200); assert.equal(m.calls.length, 0);
});

await t('origin allowlist + CORS preflight', async () => {
  const m = mockPipedrive();
  let res = await handleRequest(req(sales, { origin: 'https://evil.example' }), ENV, m.fetchImpl);
  assert.equal(res.status, 403); assert.equal(res.headers.get('Access-Control-Allow-Origin'), null);
  res = await handleRequest(req(sales, { origin: '' }), ENV, m.fetchImpl);
  assert.equal(res.status, 403);
  for (const o of ['https://annasis.com', 'https://www.annasis.com', 'https://aaronsiebert-ux.github.io']) {
    res = await handleRequest(req(null, { origin: o, method: 'OPTIONS' }), ENV, m.fetchImpl);
    assert.equal(res.status, 204); assert.equal(res.headers.get('Access-Control-Allow-Origin'), o);
    assert.match(res.headers.get('Access-Control-Allow-Methods'), /POST/);
  }
  res = await handleRequest(req(null, { method: 'GET' }), ENV, m.fetchImpl);
  assert.equal(res.status, 405);
  assert.equal(m.calls.length, 0);
});

await t('required fields, bad JSON, missing token, too large', async () => {
  const m = mockPipedrive();
  let res = await handleRequest(req(Object.assign({}, sales, { email: 'nope' })), ENV, m.fetchImpl);
  assert.equal(res.status, 400); assert.match((await res.json()).error, /email/);
  res = await handleRequest(req(Object.assign({}, support, { message: '' })), ENV, m.fetchImpl);
  assert.equal(res.status, 400); assert.match((await res.json()).error, /message/);
  res = await handleRequest(req(Object.assign({}, sales, { name: '', organization: '' })), ENV, m.fetchImpl);
  assert.match((await res.json()).error, /name, .*organization/);
  res = await handleRequest(req('{not json'), ENV, m.fetchImpl);
  assert.equal(res.status, 400);
  res = await handleRequest(req(sales), {}, m.fetchImpl);
  assert.equal(res.status, 500);
  res = await handleRequest(req(JSON.stringify(Object.assign({}, sales, { message: 'x'.repeat(30000) }))), ENV, m.fetchImpl);
  assert.equal(res.status, 413);
  assert.equal(m.calls.length, 0);
});

await t('Pipedrive failure → 502 (website falls back to contact page)', async () => {
  const m = mockPipedrive({ failOn: '/leads' });
  const res = await handleRequest(req(sales), ENV, m.fetchImpl);
  assert.equal(res.status, 502); assert.equal((await res.json()).ok, false);
});

await t('validate() fills leadTitle/noteText defaults and lowercases email', async () => {
  const v = validate({ type: 'support', name: 'A B', email: 'A@B.CO', organization: 'Org', message: 'help', supportCategory: 'Store / order' });
  assert.ok(v.ok); assert.equal(v.payload.email, 'a@b.co');
  assert.equal(v.payload.leadTitle, '[Support] Store / order – Org'); assert.match(v.payload.noteText, /Message: help/);
});

await t('token never appears in responses', async () => {
  const m = mockPipedrive({ failOn: '/organizations/search' });
  const res = await handleRequest(req(sales), ENV, m.fetchImpl);
  assert.ok(!(await res.text()).includes('test-token-not-real'));
});

// ---- Skip log ----
function mockKV() {
  const m = new Map();
  return { m, async put(k, v, o) { m.set(k, { v, o }); }, async get(k) { return m.has(k) ? m.get(k).v : null; },
    async list({ prefix }) { return { keys: [...m.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }; } };
}
const W = 'https://annasis-lead.annasis.workers.dev';
const skipReq = (body, { origin = ORIGIN, ip = '1.2.3.4' } = {}) => new Request(W + '/skip', { method: 'POST', headers: { Origin: origin, 'CF-Connecting-IP': ip, 'Content-Type': 'text/plain' }, body: typeof body === 'string' ? body : JSON.stringify(body) });

await t('POST /skip stores org/reason/page, no IP, never calls Pipedrive', async () => {
  const kv = mockKV(); let called = 0;
  const res = await handleRequest(skipReq({ org: 'Amazon AWS', reason: 'infrastructure', why: 'infrastructure: Amazon', page: '/fit.html?x=1', ts: 1, email: 'x@y.z' }, { ip: '9.9.9.1' }), { ...ENV, SKIP_LOG: kv }, async () => { called++; return new Response('{}'); });
  assert.equal(res.status, 200); assert.equal(called, 0); assert.equal(kv.m.size, 1);
  const [[k, { v, o }]] = [...kv.m];
  assert.match(k, /^skip:\d{4}-\d{2}-\d{2}:/); assert.equal(o.expirationTtl, 90 * 86400);
  const e = JSON.parse(v); assert.equal(e.page, '/fit.html'); assert.equal(e.reason, 'infrastructure');
  assert.ok(!v.includes('9.9.9.1') && !v.includes('x@y.z'));
});
await t('POST /skip rejects bad origin, big body, missing org; unknown reason -> other', async () => {
  const kv = mockKV(); const env = { ...ENV, SKIP_LOG: kv };
  assert.equal((await handleRequest(skipReq({ org: 'A' }, { origin: 'https://evil.example', ip: '9.9.9.2' }), env)).status, 403);
  assert.equal((await handleRequest(skipReq('x'.repeat(2000), { ip: '9.9.9.2' }), env)).status, 413);
  assert.equal((await handleRequest(skipReq({ reason: 'infrastructure' }, { ip: '9.9.9.2' }), env)).status, 400);
  assert.equal((await handleRequest(skipReq({ org: 'B', reason: 'zzz' }, { ip: '9.9.9.2' }), env)).status, 200);
  assert.equal(JSON.parse([...kv.m.values()][0].v).reason, 'other');
});
await t('POST /skip rate limits per IP', async () => {
  const env = { ...ENV, SKIP_LOG: mockKV() }; let last;
  for (let i = 0; i < 21; i++) last = await handleRequest(skipReq({ org: 'C' }, { ip: '9.9.9.3' }), env);
  assert.equal(last.status, 429);
});
await t('GET /skip-log html/csv/json, newest first, noindex, no key needed', async () => {
  const kv = mockKV(); const env = { ...ENV, SKIP_LOG: kv };
  await handleRequest(skipReq({ org: 'Old <b>Org</b>', reason: 'public district' }, { ip: '9.9.9.4' }), env);
  await new Promise((r) => setTimeout(r, 5));
  await handleRequest(skipReq({ org: '=New, "Org"', reason: 'non-ICP business', page: '/a' }, { ip: '9.9.9.4' }), env);
  const h = await handleRequest(new Request(W + '/skip-log'), env);
  assert.equal(h.status, 200); assert.match(h.headers.get('X-Robots-Tag'), /noindex/);
  const html = await h.text(); assert.ok(html.indexOf('New') < html.indexOf('Old')); assert.ok(html.includes('&lt;b&gt;'));
  const c = await (await handleRequest(new Request(W + '/skip-log?days=2&format=csv'), env)).text();
  assert.match(c, /^date,time,org,reason,why,page\n/); assert.ok(c.includes(`"'=New, ""Org"""`));
  const j = await (await handleRequest(new Request(W + '/skip-log?format=json'), env)).json();
  assert.equal(j.count, 2); assert.equal(j.rows[0].reason, 'non-ICP business');
  assert.equal((await handleRequest(new Request(W + '/skip-log', { method: 'POST', headers: { Origin: ORIGIN } }), env)).status, 405);
});

console.log(`\n${n} tests passed`);
