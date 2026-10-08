const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../state.js');
const D = require('../data.js');
const AI = require('../demo-ai.js');
const T = require('../views/talent.js');

const gels = AI.talentScenarios[0].prompt;
const render = (state, errors = {}) => T.assistant({ state, people: C.getPeople(state, D.people), errors });
const asked = query => { const state = C.createState(); C.submitTalentAssistant(state, D.people, AI.matchTeam, query); return state; };
const uniqueIDs = html => { const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(match => match[1]); return new Set(ids).size === ids.length; };
const count = (html, text) => html.split(text).length - 1;

test('the assistant block has a labelled textarea, the submit button and one chip per scenario', () => {
  const html = render(C.createState());
  assert.ok(html.includes('<label for="assistant-query"'));
  assert.ok(html.includes('<textarea id="assistant-query"')); assert.ok(html.includes('maxlength="' + C.TALENT_QUERY_MAX_LENGTH + '"'));
  assert.equal(count(html, 'Encontrar mi equipo'), 1);
  assert.equal(count(html, 'data-action="assistant-chip"'), 3);
  for (const scenario of AI.talentScenarios) assert.ok(html.includes('data-scenario="' + scenario.id + '"') && html.includes(scenario.label));
  assert.equal(html.includes('assistant-result'), false, 'no result before the first query');
  assert.ok(uniqueIDs(html));
});

test('the draft query is escaped inside the textarea', () => {
  const state = C.createState();
  C.setTalentAssistantQuery(state, '<script>alert(1)</script> "x"');
  const html = render(state);
  assert.equal(html.includes('<script>'), false);
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt; &quot;x&quot;'));
});

test('a validation error is exposed with aria-invalid and aria-describedby', () => {
  const html = render(C.createState(), { query: 'Escribe qué equipo necesitas.' });
  assert.ok(html.includes('aria-invalid="true"')); assert.ok(html.includes('id="assistant-query-error"'));
  assert.ok(html.includes('aria-describedby="assistant-query-hint assistant-query-error"'));
  assert.ok(html.includes('Escribe qué equipo necesitas.'));
});

test('a matched result is labelled as an example and organized by role with profile links and skill exploration', () => {
  const html = render(asked(gels));
  assert.ok(html.includes('Respuesta de ejemplo'));
  for (const label of ['Marketing', 'Finanzas', 'Diseño / desarrollo web']) assert.ok(html.includes('>' + label + '<'), label);
  for (const id of ['sofia-mendoza', 'camila-leon', 'lucia-torres']) assert.ok(html.includes('href="#/talent/' + id + '"'), id);
  assert.ok(html.includes('Ver perfil'));
  assert.ok(html.includes('data-action="explore-skill"') && html.includes('data-skill="Marketing"'));
  assert.ok(html.includes('Explorar personas con Marketing'));
  assert.ok(uniqueIDs(html));
});

test('reason, evidence and declared availability are rendered as separate labelled items without scores', () => {
  const html = render(asked(gels));
  for (const label of ['Por qué coincide', 'Evidencia del perfil', 'Disponibilidad declarada']) assert.ok(html.includes(label), label);
  assert.ok(html.includes('4 h por semana'));
  assert.equal(/%|compatib|ranking|puntaje/i.test(html), false);
  assert.ok(html.includes('declaradas'), 'states that skills are self-declared');
});

test('the result states which query it answered, escaped', () => {
  const html = render(asked(gels));
  assert.ok(html.includes('Consulta respondida'));
  assert.ok(html.includes(gels.slice(0, 40)));
  const state = asked(gels); state.talentAssistant.result.query = '<b>x</b>';
  assert.equal(render(state).includes('<b>x</b>'), false);
});

test('skill exploration never offers a skill that only the signed-in student has', () => {
  const state = C.createState();
  state.profile.discoverable = true; state.profile.openToCollaborate = true;
  state.profile.skills = [{ id: 's', name: 'Marketing', level: 'Inicial' }, { id: 'u', name: 'Habilidad única', level: 'Inicial' }];
  C.submitTalentAssistant(state, C.getPeople(state, D.people), AI.matchTeam, gels);
  state.talentAssistant.result.roles[0].skills = ['Marketing', 'Habilidad única'];
  const html = render(state);
  assert.ok(html.includes('data-skill="Marketing"'));
  assert.equal(html.includes('Habilidad única'), false);
});

test('a person with a pending contact request shows it without altering the request', () => {
  const state = asked(gels); C.submitContact(state, 'sofia-mendoza', 'Hola');
  const html = render(state);
  assert.ok(html.includes('Pendiente de aceptación'));
  assert.deepEqual(state.contacts['sofia-mendoza'], { message: 'Hola', status: 'pending' });
});

test('an unrecognized query lists the available scenarios and no people', () => {
  const html = render(asked('quiero cocinar'));
  assert.ok(html.includes('Respuesta de ejemplo'));
  assert.ok(html.includes('No tenemos una respuesta de ejemplo'));
  assert.equal(count(html, 'data-action="assistant-chip"'), 6, 'three input chips plus three suggestions');
  assert.equal(html.includes('Ver perfil'), false);
});

test('a role with no available people explains it and still offers the skill exploration', () => {
  const state = asked(gels);
  state.talentAssistant.result.roles[1].people = [];
  const html = render(state);
  assert.ok(html.includes('Aún no hay perfiles de ejemplo'));
});

test('user text and result text are escaped', () => {
  const state = asked(gels);
  state.talentAssistant.result.roles[0].people[0].reason = '<img src=x onerror=alert(1)>';
  const html = render(state);
  assert.equal(html.includes('<img src=x'), false); assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
});
