const { test } = require('node:test');
const assert = require('node:assert/strict');
const core = require('../state.js');

test('a blank or whitespace contact message cannot create a request', () => {
  for (const message of ['', ' \n\t ']) {
    const state = core.createState();
    assert.equal(core.submitContact(state, 'ana', message).ok, false);
    assert.deepEqual(state.contacts, {});
  }
});
test('a valid contact request is pending acceptance and cannot be sent twice', () => {
  const state = core.createState();
  assert.equal(core.submitContact(state, 'ana', '  Quiero colaborar en tu proyecto.  ').ok, true);
  assert.deepEqual(state.contacts.ana, { message: 'Quiero colaborar en tu proyecto.', status: 'pending' });
  assert.equal(core.submitContact(state, 'ana', 'Segundo mensaje').reason, 'duplicate');
  assert.equal(state.contacts.ana.message, 'Quiero colaborar en tu proyecto.');
});
test('mentor requests need both a concrete goal and a supported modality', () => {
  for (const [goal, modality] of [['', 'online'], ['   ', 'presential'], ['Un plan de carrera', ''], ['Un plan de carrera', 'phone']]) {
    const state = core.createState();
    assert.equal(core.submitMentor(state, 'luis', goal, modality).ok, false);
    assert.deepEqual(state.mentorRequests, {});
  }
});
test('mentor requests are pending and duplicate attempts keep the first goal', () => {
  const state = core.createState();
  assert.equal(core.submitMentor(state, 'luis', '  Preparar mi primera entrevista  ', 'online').ok, true);
  assert.deepEqual(state.mentorRequests.luis, { goal: 'Preparar mi primera entrevista', modality: 'online', status: 'pending' });
  assert.equal(core.submitMentor(state, 'luis', 'Otra meta', 'presential').reason, 'duplicate');
  assert.equal(state.mentorRequests.luis.modality, 'online');
});
test('saving twice returns an item to its original unsaved state', () => {
  const state = core.createState();
  assert.equal(core.toggleSaved(state, 'event-1'), true);
  assert.deepEqual(state.saved, ['event-1']);
  assert.equal(core.toggleSaved(state, 'event-1'), false);
  assert.deepEqual(state.saved, []);
});
test('people search is case and accent insensitive and combines with skill filtering', () => {
  const people = [
    { id: 'a', name: 'Lucía Torres', career: 'Diseño', bio: 'Interfaces accesibles', skills: ['UX/UI', 'Investigación'] },
    { id: 'b', name: 'Luis Peña', career: 'Ingeniería', bio: 'Datos para proyectos', skills: ['Python'] }
  ];
  assert.deepEqual(core.filterPeople(people, { search: 'LUCIA', skill: 'UX/UI' }).map(p => p.id), ['a']);
  assert.deepEqual(core.filterPeople(people, { search: 'accesibles', skill: 'all' }).map(p => p.id), ['a']);
  assert.deepEqual(core.filterPeople(people, { search: 'Lucia', skill: 'Python' }), []);
});
test('category and topic filters preserve the source order and support all', () => {
  const pulse = [{ id: 'a', category: 'events' }, { id: 'b', category: 'news' }, { id: 'c', category: 'events' }];
  const mentors = [{ id: 'a', topics: ['Emprendimiento', 'Ventas'] }, { id: 'b', topics: ['Diseño'] }];
  assert.deepEqual(core.filterPulse(pulse, 'events').map(i => i.id), ['a', 'c']);
  assert.equal(core.filterPulse(pulse, 'all').length, 3);
  assert.deepEqual(core.filterMentors(mentors, 'Ventas').map(i => i.id), ['a']);
  assert.equal(core.filterMentors(mentors, 'all').length, 2);
});
test('reset clears all activity, drafts, filters and browsing positions', () => {
  const state = core.createState();
  state.saved.push('one'); state.contacts.ana = { status: 'pending' };
  state.mentorRequests.luis = { status: 'pending' }; state.drafts.contacts.ana = 'texto';
  state.filters.talent.search = 'Lucía'; state.filters.pulse = 'events'; state.positions.talent = { windowY: 220, listY: 80 };
  core.resetState(state);
  assert.deepEqual(state, core.createState());
});
test('only known routes and existing entities can open detail or form views', () => {
  const data = { pulse: [{ id: 'event-1' }], people: [{ id: 'ana' }], mentors: [{ id: 'luis' }] };
  assert.deepEqual(core.resolveRoute('#/talent/ana/contact', data), { section: 'talent', view: 'contact', id: 'ana', valid: true });
  assert.deepEqual(core.resolveRoute('#/mentor/luis/request', data), { section: 'mentor', view: 'request', id: 'luis', valid: true });
  for (const hash of ['#/unknown', '#/talent/missing', '#/pulse/event-1/contact', '#/mentor/luis/extra', '#/pulse/event-1/more/parts']) {
    assert.equal(core.resolveRoute(hash, data).valid, false);
  }
});
test('user text is escaped before entering HTML', () => {
  assert.equal(core.escapeHTML('<img src=x onerror="alert(1)"> & \'hola\''), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &#39;hola&#39;');
});
