const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../state.js');
const D = require('../data.js');

const event = D.pulse.find(item => item.id === 'laboratorio-ideas');
const workshop = D.pulse.find(item => item.id === 'prototipo');
const article = D.pulse.find(item => item.kind === 'article');
const localJob = D.pulse.find(item => item.id === 'practica-finanzas');
const externalJob = D.pulse.find(item => item.id === 'practica-marketing');

test('only practica-finanzas uses the local application flow and every internship keeps its source CTA', () => {
  assert.equal(localJob.applyMode, 'local');
  assert.ok(D.pulse.filter(item => item.kind === 'internship' && item.applyMode === 'local').length === 1);
  for (const job of D.pulse.filter(item => item.kind === 'internship')) {
    assert.equal(job.ctaLabel, 'Saber más');
    assert.ok(job.ctaUrl.startsWith('demo-source.html?type=job&id='));
  }
});

test('registerForEvent stores a simulated registration for events and workshops only', () => {
  const state = C.createState();
  assert.deepEqual(C.registerForEvent(state, D.pulse, event.id), { ok: true });
  assert.equal(state.registrations[event.id].status, 'registered');
  assert.equal(state.registrations[event.id].simulatedAt, C.DEMO_DATE);
  assert.deepEqual(C.registerForEvent(state, D.pulse, workshop.id), { ok: true });
  assert.deepEqual(Object.keys(state.registrations).sort(), [event.id, workshop.id].sort());
  for (const id of [article.id, localJob.id, 'missing']) {
    const result = C.registerForEvent(state, D.pulse, id);
    assert.equal(result.ok, false);
    assert.equal(state.registrations[id], undefined);
  }
  assert.equal(C.registerForEvent(state, D.pulse, article.id).reason, 'invalid-kind');
  assert.equal(C.registerForEvent(state, D.pulse, 'missing').reason, 'not-found');
});

test('repeating a registration keeps the existing record and reports a duplicate', () => {
  const state = C.createState();
  C.registerForEvent(state, D.pulse, event.id);
  const first = C.clone(state.registrations[event.id]);
  assert.deepEqual(C.registerForEvent(state, D.pulse, event.id), { ok: false, reason: 'duplicate' });
  assert.deepEqual(state.registrations[event.id], first);
});

test('registration is independent of saving, applications and calendar export', () => {
  const state = C.createState();
  C.registerForEvent(state, D.pulse, event.id);
  assert.deepEqual(state.saved, []);
  assert.deepEqual(state.applications, {});
  C.toggleSaved(state, event.id);
  assert.equal(state.registrations[event.id].status, 'registered');
  C.toggleSaved(state, event.id);
  assert.equal(state.registrations[event.id].status, 'registered');
});

test('applyToInternship validates the interest text and stores a trimmed simulated submission', () => {
  const state = C.createState();
  state.drafts.applications[localJob.id] = '  Quiero aprender análisis de escenarios.  ';
  for (const blank of ['', '   ', null, undefined]) {
    const result = C.applyToInternship(state, D.pulse, localJob.id, blank);
    assert.equal(result.ok, false); assert.equal(result.reason, 'invalid');
    assert.ok(result.errors.interest);
    assert.equal(state.applications[localJob.id], undefined);
  }
  assert.equal(state.drafts.applications[localJob.id].trim().length > 0, true, 'a failed submission keeps the draft');
  assert.deepEqual(C.applyToInternship(state, D.pulse, localJob.id, '  Quiero aprender análisis de escenarios.  '), { ok: true });
  assert.deepEqual(state.applications[localJob.id], { status: 'submitted', interest: 'Quiero aprender análisis de escenarios.', simulatedAt: C.DEMO_DATE });
  assert.equal(state.drafts.applications[localJob.id], undefined, 'a successful submission clears the draft');
});

test('applyToInternship rejects an interest longer than the 1200 character limit', () => {
  const state = C.createState();
  const result = C.applyToInternship(state, D.pulse, localJob.id, 'x'.repeat(C.INTEREST_MAX_LENGTH + 1));
  assert.equal(result.ok, false); assert.equal(result.reason, 'invalid'); assert.ok(result.errors.interest);
  assert.equal(state.applications[localJob.id], undefined);
  assert.deepEqual(C.applyToInternship(state, D.pulse, localJob.id, 'x'.repeat(C.INTEREST_MAX_LENGTH)), { ok: true });
});

test('applyToInternship is once per vacancy and only for local internships', () => {
  const state = C.createState();
  C.applyToInternship(state, D.pulse, localJob.id, 'Primera versión');
  assert.deepEqual(C.applyToInternship(state, D.pulse, localJob.id, 'Segunda versión'), { ok: false, reason: 'duplicate' });
  assert.equal(state.applications[localJob.id].interest, 'Primera versión');
  assert.equal(C.applyToInternship(state, D.pulse, externalJob.id, 'Hola').reason, 'external');
  assert.equal(C.applyToInternship(state, D.pulse, event.id, 'Hola').reason, 'invalid-kind');
  assert.equal(C.applyToInternship(state, D.pulse, 'missing', 'Hola').reason, 'not-found');
  assert.deepEqual(Object.keys(state.applications), [localJob.id]);
});

test('opening the external source never records an application', () => {
  const state = C.createState();
  assert.deepEqual(state.applications, {});
  assert.ok(externalJob.ctaUrl);
  assert.deepEqual(state.applications, {});
});

test('the action profile summary reads the confirmed profile, not the draft', () => {
  const state = C.createState();
  C.beginProfileDraft(state).displayName = 'Borrador sin guardar';
  const summary = C.actionProfileSummary(state);
  assert.equal(summary.displayName, 'Valeria Álvarez');
  assert.equal(summary.career, 'Finanzas'); assert.equal(summary.semester, 1);
  assert.equal(summary.email, 'valeria.alvarez@example.com');
});

test('reset restores registrations, applications and application drafts', () => {
  const state = C.createState();
  C.registerForEvent(state, D.pulse, event.id);
  C.applyToInternship(state, D.pulse, localJob.id, 'Interés');
  state.drafts.applications['otra'] = 'borrador';
  C.resetState(state);
  assert.deepEqual(state, C.createState());
  assert.deepEqual(state.drafts.applications, {});
});

test('routes: register is for events/workshops, apply for local internships, both validated by kind', () => {
  const state = C.createState();
  const route = hash => C.resolveRoute(hash, D, state);
  assert.deepEqual(route('#/pulse/' + event.id + '/register'), { section: 'pulse', view: 'register', id: event.id, valid: true });
  assert.deepEqual(route('#/pulse/' + workshop.id + '/register'), { section: 'pulse', view: 'register', id: workshop.id, valid: true });
  assert.deepEqual(route('#/pulse/' + localJob.id + '/apply'), { section: 'pulse', view: 'apply', id: localJob.id, valid: true });
  for (const hash of [
    '#/pulse/' + article.id + '/register', '#/pulse/' + localJob.id + '/register', '#/pulse/' + event.id + '/apply',
    '#/pulse/' + externalJob.id + '/apply', '#/pulse/' + article.id + '/apply', '#/pulse/missing/register', '#/pulse/' + event.id + '/other',
    '#/pulse/' + event.id + '/register/extra'
  ]) assert.equal(route(hash).valid, false, hash);
  assert.equal(route('#/pulse/' + event.id).view, 'detail');
  assert.equal(route('#/talent/' + D.people[0].id + '/contact').view, 'contact');
});

test('action capabilities are derived from the publication kind', () => {
  assert.deepEqual(C.pulseActions(event), { register: true, calendar: true, apply: false });
  assert.deepEqual(C.pulseActions(workshop), { register: true, calendar: true, apply: false });
  assert.deepEqual(C.pulseActions(article), { register: false, calendar: false, apply: false });
  assert.deepEqual(C.pulseActions(localJob), { register: false, calendar: false, apply: true });
  assert.deepEqual(C.pulseActions(externalJob), { register: false, calendar: false, apply: false });
});
