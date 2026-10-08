const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../state.js');
const D = require('../data.js');
const AI = require('../demo-ai.js');

const gels = AI.talentScenarios[0].prompt;
const submit = (state, query) => C.submitTalentAssistant(state, C.getPeople(state, D.people), AI.matchTeam, query);

test('submitting a valid query stores the trimmed query and the structured result', () => {
  const state = C.createState();
  assert.deepEqual(submit(state, '  ' + gels + '  '), { ok: true });
  assert.equal(state.talentAssistant.query, gels);
  assert.equal(state.talentAssistant.result.status, 'matched');
  assert.equal(state.talentAssistant.result.scenarioId, 'running-gels');
});

test('an unrecognized query is stored as an unrecognized result without recommendations', () => {
  const state = C.createState();
  assert.deepEqual(submit(state, 'quiero cocinar'), { ok: true });
  assert.equal(state.talentAssistant.result.status, 'unrecognized');
  assert.equal(state.talentAssistant.result.roles, undefined);
});

test('empty and overlong queries are rejected and keep the previous result', () => {
  const state = C.createState();
  submit(state, gels);
  const before = C.clone(state.talentAssistant);
  for (const query of ['', '   ', null]) {
    const result = submit(state, query);
    assert.equal(result.ok, false); assert.equal(result.reason, 'invalid'); assert.ok(result.errors.query);
    assert.deepEqual(state.talentAssistant, before);
  }
  const long = submit(state, 'x'.repeat(C.TALENT_QUERY_MAX_LENGTH + 1));
  assert.equal(long.ok, false); assert.ok(long.errors.query);
  assert.deepEqual(state.talentAssistant, before);
});

test('the typed query is kept as a draft without producing or clearing a result', () => {
  const state = C.createState();
  C.setTalentAssistantQuery(state, 'Escribiendo…');
  assert.equal(state.talentAssistant.query, 'Escribiendo…');
  assert.equal(state.talentAssistant.result, null);
  submit(state, gels);
  const result = C.clone(state.talentAssistant.result);
  C.setTalentAssistantQuery(state, 'otra cosa');
  assert.deepEqual(state.talentAssistant.result, result);
});

test('exploring a skill clears a leftover directory search so the directory is not empty', () => {
  const state = C.createState();
  state.filters.talent.search = 'xyz';
  assert.equal(C.exploreTalentSkill(state, C.getPeople(state, D.people), 'Marketing'), true);
  assert.deepEqual(state.filters.talent, { search: '', skill: 'Marketing' });
  assert.equal(C.filterPeople(C.getPeople(state, D.people), state.filters.talent).length, 1);
});

test('exploring a skill sets the Talent skill filter without touching other areas or the assistant', () => {
  const state = C.createState();
  state.filters.talent.search = 'ana'; state.filters.pulse = 'events'; state.filters.mentor = 'x';
  submit(state, gels);
  const assistant = C.clone(state.talentAssistant);
  assert.equal(C.exploreTalentSkill(state, C.getPeople(state, D.people), 'Marketing'), true);
  assert.deepEqual(state.filters.talent, { search: '', skill: 'Marketing' });
  assert.equal(state.filters.pulse, 'events'); assert.equal(state.filters.mentor, 'x');
  assert.deepEqual(state.talentAssistant, assistant);
  assert.equal(C.exploreTalentSkill(state, C.getPeople(state, D.people), 'Cocina'), false);
  assert.equal(state.filters.talent.skill, 'Marketing');
});

test('contact requests are untouched by the assistant', () => {
  const state = C.createState();
  C.submitContact(state, 'sofia-mendoza', 'Hola');
  const contacts = C.clone(state.contacts);
  submit(state, gels);
  C.exploreTalentSkill(state, C.getPeople(state, D.people), 'Marketing');
  assert.deepEqual(state.contacts, contacts);
});

test('reset restores the assistant and the skill filter', () => {
  const state = C.createState();
  submit(state, gels); C.exploreTalentSkill(state, D.people, 'Marketing');
  C.resetState(state);
  assert.deepEqual(state, C.createState());
  assert.deepEqual(state.talentAssistant, { query: '', result: null });
});
