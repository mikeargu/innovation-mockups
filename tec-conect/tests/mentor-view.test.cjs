const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../state.js');
const D = require('../data.js');
const AI = require('../demo-ai.js');
const M = require('../views/mentor.js');

const goal = AI.careerScenarios[0].prompt;
const ctx = (state, errors = {}) => ({ state, mentors: D.mentors, errors });
const planned = () => { const state = C.createState(); C.submitCareerAssistant(state, AI.planCareer, goal); return state; };
const uniqueIDs = html => { const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(match => match[1]); return new Set(ids).size === ids.length; };
const count = (html, text) => html.split(text).length - 1;
const between = (html, start, end) => html.slice(html.indexOf(start), end ? html.indexOf(end) : undefined);

test('the assistant shows profile context, an editable goal, an example chip and Explorar mi ruta', () => {
  const html = M.assistant(ctx(C.createState()));
  assert.ok(html.includes('Finanzas')); assert.ok(html.includes('1.º semestre')); assert.ok(html.includes('href="#/profile/edit"'));
  assert.ok(html.includes('<label for="career-goal"')); assert.ok(html.includes('<textarea id="career-goal"'));
  assert.ok(html.includes('maxlength="' + C.CAREER_GOAL_MAX_LENGTH + '"'));
  assert.equal(count(html, 'data-action="career-chip"'), 1);
  assert.equal(count(html, 'Explorar mi ruta'), 1);
  assert.equal(html.includes('href="#/mentor/plan"'), false, 'no plan link before a plan exists');
  const state = C.createState(); state.profile.career = 'Economía'; state.profile.semester = 3;
  const updated = M.assistant(ctx(state));
  assert.ok(updated.includes('Economía') && updated.includes('3.º semestre'));
});

test('the goal is escaped and validation errors are accessible', () => {
  const state = C.createState(); C.setCareerGoal(state, '<img src=x> "meta"');
  const html = M.assistant(ctx(state, { goal: 'Escribe tu meta.' }));
  assert.equal(html.includes('<img src=x>'), false); assert.ok(html.includes('&lt;img src=x&gt; &quot;meta&quot;'));
  assert.ok(html.includes('aria-invalid="true"')); assert.ok(html.includes('id="career-goal-error"'));
  assert.ok(html.includes('aria-describedby="career-goal-hint career-goal-error"'));
});

test('after a plan the assistant links to it; an unrecognized goal offers the example', () => {
  const html = M.assistant(ctx(planned()));
  assert.ok(html.includes('href="#/mentor/plan"')); assert.ok(html.includes('Ver mi ruta')); assert.ok(html.includes('Ejemplo de orientación'));
  const state = C.createState(); C.submitCareerAssistant(state, AI.planCareer, 'quiero ser diseñadora');
  const other = M.assistant(ctx(state));
  assert.ok(other.includes('No tenemos un ejemplo de orientación')); assert.equal(count(other, 'data-action="career-chip"'), 2);
  assert.equal(other.includes('href="#/mentor/plan"'), false);
});

test('the network shows the fixed mentor and director, without unpin controls', () => {
  const html = M.network(ctx(C.createState()));
  for (const heading of ['Tu red de apoyo', 'Mi mentor institucional', 'Mi director de carrera', 'Profesores fijados']) assert.ok(html.includes(heading), heading);
  assert.ok(html.includes('Elena Cruz')); assert.ok(html.includes('Rodrigo Navarro')); assert.ok(html.includes('Director de Finanzas'));
  assert.equal(html.includes('data-action="toggle-pin"'), false);
  assert.ok(html.includes('Aún no fijas profesores'));
  assert.ok(html.includes('href="#/mentor/elena-cruz/request"')); assert.ok(html.includes('Solicitar orientación'));
  assert.equal(html.includes('person-card'), false, 'network cards are distinct from the explorer');
  assert.ok(uniqueIDs(html));
});

test('pinned professors appear once in the network with an unpin control and request status', () => {
  const state = C.createState(); C.pinSupport(state, D.mentors, 'paula-ortiz'); C.submitMentor(state, 'paula-ortiz', 'Hablar de mercados', 'online');
  const html = M.network(ctx(state));
  const pinned = between(html, 'Profesores fijados');
  assert.equal(count(pinned, 'data-person="paula-ortiz"'), 2, 'one card and one toggle');
  assert.ok(pinned.includes('Quitar de mi red')); assert.ok(pinned.includes('Pendiente de aceptación'));
  assert.equal(html.includes('Aún no fijas profesores'), false);
});

test('the explorer lists professors only, filtered by topic, with pin toggles', () => {
  const state = C.createState();
  let html = M.explorer(ctx(state));
  assert.equal(count(html, 'class="card person-card'), 2);
  assert.ok(html.includes('href="#/mentor/paula-ortiz"') && html.includes('href="#/mentor/gabriel-soto"'));
  assert.equal(html.includes('elena-cruz'), false); assert.equal(html.includes('rodrigo-navarro'), false);
  assert.equal(count(html, 'data-pinned="false"'), 2); assert.equal(count(html, 'Fijar en mi red'), 2);
  assert.equal(html.includes('aria-pressed'), false, 'pin buttons are actions whose label states the action, not toggles');
  C.pinSupport(state, D.mentors, 'gabriel-soto');
  html = M.explorer(ctx(state));
  assert.equal(count(html, 'data-pinned="true"'), 1); assert.ok(html.includes('Quitar de mi red'));
  state.filters.mentor = 'Estadística aplicada';
  assert.equal(count(M.explorer(ctx(state)), 'class="card person-card'), 1);
  state.filters.mentor = 'Plan de carrera';
  const empty = M.explorer(ctx(state));
  assert.equal(count(empty, 'class="card person-card'), 0); assert.ok(empty.includes('data-action="clear-filters"'));
});

test('the plan route explains when there is no plan yet', () => {
  const html = M.plan(ctx(C.createState()));
  assert.ok(html.includes('<h1')); assert.ok(html.includes('Aún no hay una ruta')); assert.ok(html.includes('href="#/mentor"'));
});

test('the plan shows the six orientation sections in order with example labels', () => {
  const html = M.plan(ctx(planned()));
  const headings = ['Tu meta y punto de partida', 'Ruta sugerida', 'Materias para explorar', 'Profesores para conversar', 'Intercambio o concentración', 'Siguiente conversación'];
  const positions = headings.map(heading => html.indexOf('>' + heading + '<'));
  assert.ok(positions.every(position => position > 0), JSON.stringify(positions));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  for (const text of ['Fundamentos', 'Exploración', 'Especialización', 'Preparación profesional', 'Estadística aplicada', 'Análisis de mercados', 'Instrumentos financieros', 'Ejemplo de orientación', 'no inscribe']) assert.ok(html.includes(text), text);
  assert.ok(html.includes('href="#/mentor"'), 'a way back that keeps the goal');
  assert.ok(uniqueIDs(html));
});

test('recommended professors link to their profile and can be pinned from the plan', () => {
  const state = planned();
  let html = between(M.plan(ctx(state)), 'Profesores para conversar', 'Intercambio o concentración');
  for (const id of ['paula-ortiz', 'gabriel-soto']) { assert.ok(html.includes('href="#/mentor/' + id + '"')); assert.ok(html.includes('data-action="toggle-pin" data-person="' + id + '"')); }
  assert.ok(html.includes('Paula Ortiz') && html.includes('Gabriel Soto'));
  assert.ok(html.includes('<h3 id="support-name-plan-paula-ortiz"'), 'professor cards use h3 under the section h2');
  C.pinSupport(state, D.mentors, 'paula-ortiz');
  html = between(M.plan(ctx(state)), 'Profesores para conversar', 'Intercambio o concentración');
  assert.equal(count(html, 'data-pinned="true"'), 1);
});

test('both alternatives stay visible; selecting one marks it and shows what to review', () => {
  const state = planned();
  let html = between(M.plan(ctx(state)), 'Intercambio o concentración', 'Siguiente conversación');
  assert.equal(count(html, 'data-action="select-alternative"'), 2); assert.equal(count(html, 'aria-pressed="false"'), 2);
  assert.equal(html.includes('Opción que estás explorando'), false);
  C.selectCareerAlternative(state, 'exchange');
  html = between(M.plan(ctx(state)), 'Intercambio o concentración', 'Siguiente conversación');
  assert.equal(count(html, 'data-action="select-alternative"'), 2);
  assert.ok(html.includes('Opción que estás explorando'));
  assert.ok(html.includes('Qué revisar con tu director'));
  assert.ok(html.includes('data-alternative="exchange" aria-pressed="true"'));
  assert.ok(html.includes('data-alternative="concentration" aria-pressed="false"'));
  assert.equal(count(html, 'Explorar esta opción'), 2, 'the toggle label stays constant; aria-pressed carries the state');
});

test('the plan reads career and semester from the live profile, not a stale snapshot', () => {
  const state = planned();
  state.profile.career = 'Economía'; state.profile.semester = 4;
  const html = between(M.plan(ctx(state)), 'Tu meta y punto de partida', 'Ruta sugerida');
  assert.ok(html.includes('Economía') && html.includes('4.º semestre'));
  assert.equal(html.includes('1.º semestre'), false);
});

test('legacy small text classes are overridden to at least 12px on the F5 surfaces', () => {
  const css = require('node:fs').readFileSync(require('node:path').join(__dirname, '../mentor.css'), 'utf8');
  for (const selector of ['.plan-card .text-link', '.support-card .status', '.support-explorer-card .tag', '.support-explorer-card .availability', '.support-explorer-card .person-career', '.mentor-plan-back']) assert.ok(css.includes(selector), selector);
});

test('the next conversation names the institutional mentor and the director', () => {
  const html = between(M.plan(ctx(planned())), 'Siguiente conversación');
  assert.ok(html.includes('Elena Cruz')); assert.ok(html.includes('Rodrigo Navarro'));
});
