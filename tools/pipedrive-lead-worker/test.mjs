// Local unit tests for worker.js with a mocked Pipedrive (no network). Run: node test.mjs
import assert from 'node:assert/strict';
import { handleRequest, validate } from './worker.js';

const ENV = { PIPEDRIVE_API_TOKEN: 'test-token-not-real', PIPEDRIVE_DOMAIN: 'annasis' };
const ORIGIN = 'https://aaronsiebert-ux.github.io';

function mockPipedrive({ existingOrg = null, existingPerson = null, failOn = null } = {}) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    const u = new URL(url);
    const method = init.method || 'GET';
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ method, path: u.pathname, query: Object.fromEntries(u.searchParams), body, host: u.host });
    const ok = (data) => new Response(JSON.stringify({ success: true, data }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    if (failOn && u.pathname.endsWith(failOn)) return new Response(JSON.stringify({ success: false, error: 'boom' }), { status: 500 });
    if (u.pathname.endsWith('/organizations/search')) return ok({ items: existingOrg ? [{ item: existingOrg }] : [] });
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

await t('sales: creates org, person, lead, note (text/plain body)', async () => {
  const m = mockPipedrive();
  const res = await handleRequest(req(sales), ENV, m.fetchImpl);
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.deepEqual(data, { ok: true, type: 'sales', orgId: 101, personId: 202, leadId: 'lead-uuid-1', noteId: 303 });
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  const paths = m.calls.map((c) => c.method + ' ' + c.path.replace('/api/v1', ''));
  assert.deepEqual(paths, ['GET /organizations/search', 'POST /organizations', 'GET /persons/search', 'POST /persons', 'POST /leads', 'POST /notes']);
  assert.equal(m.calls[0].host, 'annasis.pipedrive.com');
  assert.equal(m.calls[0].query.api_token, 'test-token-not-real');
  assert.equal(m.calls[0].query.term, 'Example Academy');
  assert.equal(m.calls[2].query.term, 'pat@example.org');
  assert.equal(m.calls[3].body.org_id, 101);
  assert.equal(m.calls[3].body.job_title, 'Business office / finance');
  assert.equal(m.calls[3].body.phone[0].value, '555-0100');
  assert.deepEqual(m.calls[4].body, { title: 'Website pricing (Anna) – Example Academy', person_id: 202, organization_id: 101 });
  assert.equal(m.calls[5].body.lead_id, 'lead-uuid-1');
  assert.match(m.calls[5].body.content, /Sales lead from the ANNASIS website<br>Name: Pat Tester/);
});

await t('sales: reuses existing org + person (JSON content type, default api host)', async () => {
  const m = mockPipedrive({ existingOrg: { id: 7, name: 'Example Academy' }, existingPerson: { id: 8, organization: null, phones: [] } });
  const res = await handleRequest(req(sales, { ct: 'application/json' }), { PIPEDRIVE_API_TOKEN: 'x' }, m.fetchImpl);
  const data = await res.json();
  assert.equal(data.orgId, 7); assert.equal(data.personId, 8);
  const paths = m.calls.map((c) => c.method + ' ' + c.path.replace('/v1', ''));
  assert.deepEqual(paths, ['GET /organizations/search', 'GET /persons/search', 'PUT /persons/8', 'POST /leads', 'POST /notes']);
  assert.equal(m.calls[0].host, 'api.pipedrive.com');
  assert.deepEqual(m.calls[2].body, { org_id: 7, phone: [{ value: '555-0100', primary: true, label: 'work' }] });
});

await t('support: no lead; [Support] note on person/org + task activity', async () => {
  const m = mockPipedrive();
  const res = await handleRequest(req(support), ENV, m.fetchImpl);
  const data = await res.json();
  assert.deepEqual(data, { ok: true, type: 'support', orgId: 101, personId: 202, noteId: 303, activityId: 404 });
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

console.log(`\n${n} tests passed`);
