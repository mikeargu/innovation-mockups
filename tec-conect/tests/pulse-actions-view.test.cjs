const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../state.js');
const D = require('../data.js');
const A = require('../views/pulse-actions.js');
const P = require('../views/pulse.js');

const find = id => D.pulse.find(item => item.id === id);
const event = find('laboratorio-ideas');
const workshop = find('prototipo');
const article = find('huerto');
const localJob = find('practica-finanzas');
const externalJob = find('practica-marketing');
const context = (state, id, view) => ({ state, items: D.pulse, route: { section: 'pulse', view, id } });
const uniqueIDs = html => { const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(match => match[1]); return new Set(ids).size === ids.length; };
const count = (html, text) => html.split(text).length - 1;

test('event and workshop details expose Registrarme and the independent calendar action', () => {
  for (const item of [event, workshop]) {
    const html = P.detail(item, context(C.createState(), item.id, 'detail'));
    assert.ok(html.includes('href="#/pulse/' + item.id + '/register"'), item.id);
    assert.equal(count(html, 'Registrarme'), 1);
    assert.ok(html.includes('data-action="add-calendar"')); assert.ok(html.includes('Agregar a mi calendario'));
    assert.ok(html.includes('no te registra') || html.includes('No te registra'), 'states that the calendar does not register');
    assert.equal(html.includes('Postúlate'), false);
    assert.ok(uniqueIDs(html));
  }
});

test('a registered event shows the status instead of Registrarme and keeps the calendar action', () => {
  const state = C.createState(); C.registerForEvent(state, D.pulse, event.id);
  const html = P.detail(event, context(state, event.id, 'detail'));
  assert.ok(html.includes('Registro simulado'));
  assert.equal(html.includes('>Registrarme<'), false);
  assert.ok(html.includes('Ver mi registro'));
  assert.ok(html.includes('data-action="add-calendar"'));
});

test('articles and external internships expose neither registration, calendar nor application actions', () => {
  for (const item of [article, externalJob]) {
    const html = P.detail(item, context(C.createState(), item.id, 'detail'));
    for (const text of ['Registrarme', 'Agregar a mi calendario', 'add-calendar', 'Postúlate', '/register', '/apply']) assert.equal(html.includes(text), false, item.id + ' ' + text);
  }
  assert.ok(P.detail(externalJob, context(C.createState(), externalJob.id, 'detail')).includes('Saber más'));
});

test('the local internship offers Postúlate and keeps Saber más; applying swaps in the submitted status', () => {
  const state = C.createState();
  let html = P.detail(localJob, context(state, localJob.id, 'detail'));
  assert.ok(html.includes('href="#/pulse/' + localJob.id + '/apply"')); assert.ok(html.includes('Postúlate'));
  assert.ok(html.includes('Saber más'));
  assert.equal(html.includes('Registrarme'), false); assert.equal(html.includes('add-calendar'), false);
  C.applyToInternship(state, D.pulse, localJob.id, 'Interés');
  html = P.detail(localJob, context(state, localJob.id, 'detail'));
  assert.ok(html.includes('Postulación simulada enviada')); assert.equal(html.includes('>Postúlate<'), false);
  assert.ok(html.includes('Saber más'));
});

test('cards show a visible status label for registrations and applications only', () => {
  const state = C.createState(); C.registerForEvent(state, D.pulse, event.id); C.applyToInternship(state, D.pulse, localJob.id, 'Interés');
  const ctx = context(state, '', 'browse');
  assert.ok(P.card(event, ctx).includes('Registro simulado'));
  assert.ok(P.card(localJob, ctx).includes('Postulación simulada enviada'));
  assert.equal(P.card(workshop, ctx).includes('Registro simulado'), false);
  assert.equal(P.card(article, ctx).includes('simulad'), false);
});

test('the registration review shows event facts, confirmed profile data and a single confirm control', () => {
  const state = C.createState();
  C.beginProfileDraft(state).displayName = 'Borrador sin guardar';
  const html = A.register(context(state, event.id, 'register'));
  assert.ok(html.includes('<h1'));
  for (const text of [event.title, event.when, event.location, 'Valeria Álvarez', 'Finanzas', 'valeria.alvarez@example.com']) assert.ok(html.includes(text), text);
  assert.equal(html.includes('Borrador sin guardar'), false);
  assert.ok(html.includes('id="register-form"')); assert.equal(count(html, 'Confirmar registro'), 1);
  assert.ok(html.includes('href="#/profile/edit"'));
  assert.ok(html.includes('simulaci'), 'explains that the action is simulated');
  assert.equal(html.includes('Registro simulado'), false, 'not confirmed yet');
  assert.ok(uniqueIDs(html));
});

test('status badges are not live regions because the controller announces confirmations', () => {
  const state = C.createState(); C.registerForEvent(state, D.pulse, event.id); C.applyToInternship(state, D.pulse, localJob.id, 'Interés');
  for (const html of [A.register(context(state, event.id, 'register')), A.apply(context(state, localJob.id, 'apply')), P.detail(event, context(state, event.id, 'detail')), P.detail(localJob, context(state, localJob.id, 'detail'))]) {
    assert.equal(html.includes('role="status"'), false);
    assert.ok(html.includes('pulse-status'), 'the visible status text and icon remain');
  }
});

test('the registration screen shows the existing registration when repeated', () => {
  const state = C.createState(); C.registerForEvent(state, D.pulse, event.id);
  const html = A.register(context(state, event.id, 'register'));
  assert.ok(html.includes('Registro simulado')); assert.equal(html.includes('id="register-form"'), false);
  assert.ok(html.includes('data-action="add-calendar"')); assert.ok(html.includes('href="#/pulse/' + event.id + '"'));
});

test('the application review shows the vacancy, profile data, the draft and escapes user text', () => {
  const state = C.createState();
  state.drafts.applications[localJob.id] = '<img src=x onerror=alert(1)> "quoted"';
  const html = A.apply(context(state, localJob.id, 'apply'));
  for (const text of [localJob.role, localJob.company, localJob.modality, localJob.deadline, 'Valeria Álvarez', 'valeria.alvarez@example.com']) assert.ok(html.includes(text), text);
  assert.ok(html.includes('id="apply-form"')); assert.ok(html.includes('<textarea id="interest"')); assert.equal(count(html, 'Confirmar postulación'), 1);
  assert.equal(html.includes('<img src=x'), false); assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt; &quot;quoted&quot;'));
  assert.equal(html.includes('Postulación simulada enviada'), false);
  assert.ok(uniqueIDs(html));
});

test('the application form exposes the validation error accessibly', () => {
  const html = A.apply({ ...context(C.createState(), localJob.id, 'apply'), errors: { interest: 'Cuéntanos qué te interesa de esta práctica.' } });
  assert.ok(html.includes('aria-invalid="true"')); assert.ok(html.includes('id="interest-error"'));
  assert.ok(html.includes('aria-describedby="interest-hint interest-error"'));
  assert.ok(html.includes('Cuéntanos qué te interesa'));
});

test('a submitted application shows the stored interest and cannot be edited again', () => {
  const state = C.createState(); C.applyToInternship(state, D.pulse, localJob.id, 'Me interesa <b>comunicar</b> datos.');
  const html = A.apply(context(state, localJob.id, 'apply'));
  assert.ok(html.includes('Postulación simulada enviada')); assert.equal(html.includes('id="apply-form"'), false);
  assert.ok(html.includes('Me interesa &lt;b&gt;comunicar&lt;/b&gt; datos.'));
  assert.ok(html.includes('2026'), 'shows the simulated date');
  assert.ok(html.includes('Es una simulación') && html.includes('No se envió nada a una empresa real'), 'states that nothing was really sent');
  assert.ok(html.includes('6 de octubre de 2026'), 'shows the simulated date in readable form');
});
