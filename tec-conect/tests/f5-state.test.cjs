const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../state.js');
const D = require('../data.js');
const AI = require('../demo-ai.js');

const goal = AI.careerScenarios[0].prompt;
const submit = (state, text) => C.submitCareerAssistant(state, AI.planCareer, text);
const ids = list => list.map(item => item.id);

test('support contacts carry explicit roles with exactly one institutional mentor', () => {
  assert.deepEqual(D.mentors.map(item => [item.id, item.supportRole]), [
    ['elena-cruz', 'institutionalMentor'], ['rodrigo-navarro', 'degreeDirector'], ['paula-ortiz', 'professor'], ['gabriel-soto', 'professor']
  ]);
  assert.equal(D.mentors.find(item => item.id === 'rodrigo-navarro').role, 'Director de Finanzas');
});

test('the initial network shows the assigned mentor, the director and no pinned professors', () => {
  const state = C.createState();
  assert.deepEqual(state.careerAssistant, { goal: '', result: null, selectedAlternative: null });
  const network = C.supportNetwork(state, D.mentors);
  assert.equal(network.mentor.id, 'elena-cruz');
  assert.equal(network.director.id, 'rodrigo-navarro');
  assert.deepEqual(network.professors, []);
});

test('submitting a goal stores the trimmed goal and a plan based on the profile', () => {
  const state = C.createState();
  assert.deepEqual(submit(state, '  ' + goal + '  '), { ok: true });
  assert.equal(state.careerAssistant.goal, goal);
  assert.equal(state.careerAssistant.result.status, 'matched');
  assert.equal(state.careerAssistant.result.startingPoint.career, 'Finanzas');
  assert.equal(state.careerAssistant.result.startingPoint.semester, 1);
  assert.equal(state.careerAssistant.selectedAlternative, null);
});

test('empty and overlong goals are rejected and keep the previous plan', () => {
  const state = C.createState(); submit(state, goal); C.selectCareerAlternative(state, 'exchange');
  const before = C.clone(state.careerAssistant);
  for (const text of ['', '   ', null, 'x'.repeat(C.CAREER_GOAL_MAX_LENGTH + 1)]) {
    const result = submit(state, text);
    assert.equal(result.ok, false); assert.equal(result.reason, 'invalid'); assert.ok(result.errors.goal);
    assert.deepEqual(state.careerAssistant, before);
  }
});

test('an unrecognized goal is stored without a plan', () => {
  const state = C.createState();
  assert.deepEqual(submit(state, 'quiero ser diseñadora'), { ok: true });
  assert.equal(state.careerAssistant.result.status, 'unrecognized');
});

test('the goal draft is kept without changing the plan', () => {
  const state = C.createState(); submit(state, goal);
  const plan = C.clone(state.careerAssistant.result);
  C.setCareerGoal(state, 'Editando mi meta…');
  assert.equal(state.careerAssistant.goal, 'Editando mi meta…');
  assert.deepEqual(state.careerAssistant.result, plan);
});

test('an alternative can be selected only from the current plan, and a new plan clears it', () => {
  const state = C.createState();
  assert.equal(C.selectCareerAlternative(state, 'exchange'), false);
  submit(state, goal);
  assert.equal(C.selectCareerAlternative(state, 'exchange'), true);
  assert.equal(state.careerAssistant.selectedAlternative, 'exchange');
  assert.equal(C.selectCareerAlternative(state, 'other'), false);
  assert.equal(state.careerAssistant.selectedAlternative, 'exchange');
  assert.equal(C.selectCareerAlternative(state, 'concentration'), true);
  submit(state, goal);
  assert.equal(state.careerAssistant.selectedAlternative, null);
});

test('only professors can be pinned, never twice', () => {
  const state = C.createState();
  assert.deepEqual(C.pinSupport(state, D.mentors, 'paula-ortiz'), { ok: true });
  assert.deepEqual(C.pinSupport(state, D.mentors, 'paula-ortiz'), { ok: false, reason: 'duplicate' });
  assert.deepEqual(C.pinSupport(state, D.mentors, 'gabriel-soto'), { ok: true });
  assert.equal(C.pinSupport(state, D.mentors, 'elena-cruz').reason, 'not-professor');
  assert.equal(C.pinSupport(state, D.mentors, 'rodrigo-navarro').reason, 'not-professor');
  assert.equal(C.pinSupport(state, D.mentors, 'nadie').reason, 'not-found');
  assert.deepEqual(state.pinnedSupportIds, ['rodrigo-navarro', 'paula-ortiz', 'gabriel-soto']);
  assert.deepEqual(ids(C.supportNetwork(state, D.mentors).professors), ['paula-ortiz', 'gabriel-soto']);
});

test('the network never duplicates cards even with repeated ids in state', () => {
  const state = C.createState();
  state.pinnedSupportIds = ['rodrigo-navarro', 'paula-ortiz', 'paula-ortiz', 'elena-cruz', 'missing'];
  const network = C.supportNetwork(state, D.mentors);
  assert.deepEqual(ids(network.professors), ['paula-ortiz']);
  assert.equal(network.mentor.id, 'elena-cruz'); assert.equal(network.director.id, 'rodrigo-navarro');
});

test('professors can be unpinned; the assigned mentor and the director stay fixed', () => {
  const state = C.createState(); C.pinSupport(state, D.mentors, 'paula-ortiz');
  assert.deepEqual(C.unpinSupport(state, D.mentors, 'paula-ortiz'), { ok: true });
  assert.deepEqual(C.supportNetwork(state, D.mentors).professors, []);
  assert.equal(C.unpinSupport(state, D.mentors, 'paula-ortiz').reason, 'not-pinned');
  assert.equal(C.unpinSupport(state, D.mentors, 'rodrigo-navarro').reason, 'fixed');
  assert.equal(C.unpinSupport(state, D.mentors, 'elena-cruz').reason, 'fixed');
  const network = C.supportNetwork(state, D.mentors);
  assert.equal(network.mentor.id, 'elena-cruz'); assert.equal(network.director.id, 'rodrigo-navarro');
});

test('orientation never changes requests, registrations or the profile', () => {
  const state = C.createState();
  const before = C.clone({ mentorRequests: state.mentorRequests, contacts: state.contacts, registrations: state.registrations, applications: state.applications, profile: state.profile });
  submit(state, goal); C.selectCareerAlternative(state, 'exchange'); C.pinSupport(state, D.mentors, 'gabriel-soto');
  assert.deepEqual({ mentorRequests: state.mentorRequests, contacts: state.contacts, registrations: state.registrations, applications: state.applications, profile: state.profile }, before);
});

test('reset restores the assistant, the assigned mentor and the pinned director', () => {
  const state = C.createState(); submit(state, goal); C.selectCareerAlternative(state, 'exchange'); C.pinSupport(state, D.mentors, 'paula-ortiz');
  C.resetState(state);
  assert.deepEqual(state, C.createState());
  assert.equal(state.assignedMentorId, 'elena-cruz'); assert.deepEqual(state.pinnedSupportIds, ['rodrigo-navarro']);
});

test('the reserved plan route resolves before contact ids', () => {
  const state = C.createState();
  assert.deepEqual(C.resolveRoute('#/mentor/plan', D, state), { section: 'mentor', view: 'plan', valid: true });
  assert.equal(C.resolveRoute('#/mentor/plan/extra', D, state).valid, false);
  assert.equal(C.resolveRoute('#/mentor/paula-ortiz', D, state).view, 'detail');
  assert.equal(C.resolveRoute('#/mentor/paula-ortiz/request', D, state).view, 'request');
});
