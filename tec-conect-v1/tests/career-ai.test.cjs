const { test } = require('node:test');
const assert = require('node:assert/strict');
const D = require('../data.js');
const AI = require('../demo-ai.js');

const goal = 'Estoy en primer semestre de Finanzas y al terminar mi carrera quiero trabajar en el mercado bursátil mexicano. ¿Qué profesores y materias me ayudarían? ¿Me conviene un intercambio o una concentración?';
const profile = { career: 'Finanzas', semester: 1 };
const ids = list => list.map(item => item.id);

test('the main orientation scenario is exposed with its exact prompt', () => {
  assert.deepEqual(ids(AI.careerScenarios), ['stock-market']);
  assert.equal(AI.careerScenarios[0].prompt, goal);
  assert.ok(AI.careerScenarios[0].label);
});

test('the stock-market goal returns the six orientation sections', () => {
  const plan = AI.planCareer(goal, profile);
  assert.equal(plan.status, 'matched'); assert.equal(plan.scenarioId, 'stock-market');
  assert.deepEqual(plan.startingPoint, { career: 'Finanzas', semester: 1, summary: plan.startingPoint.summary });
  assert.ok(plan.startingPoint.summary.includes('mercado bursátil'));
  assert.deepEqual(ids(plan.stages), ['foundations', 'exploration', 'specialization', 'professional']);
  assert.deepEqual(plan.stages.map(stage => stage.label), ['Fundamentos', 'Exploración', 'Especialización', 'Preparación profesional']);
  for (const stage of plan.stages) { assert.ok(stage.period); assert.ok(stage.actions.length >= 2); }
  assert.deepEqual(plan.courses.map(course => course.name), ['Estadística aplicada', 'Análisis de mercados', 'Instrumentos financieros']);
  for (const course of plan.courses) assert.ok(course.why.length > 20, course.id);
  assert.deepEqual(ids(plan.alternatives), ['exchange', 'concentration']);
  for (const option of plan.alternatives) { assert.ok(option.goal && option.experience); assert.ok(option.review.length >= 2); }
  assert.ok(plan.nextConversation.mentor.length >= 2); assert.ok(plan.nextConversation.director.length >= 2);
});

test('recommended professors exist in the data, are professors, and each has a reason', () => {
  const plan = AI.planCareer(goal, profile);
  assert.deepEqual(ids(plan.professors), ['paula-ortiz', 'gabriel-soto']);
  for (const professor of plan.professors) {
    const contact = D.mentors.find(item => item.id === professor.id);
    assert.equal(contact.supportRole, 'professor');
    assert.ok(professor.why.length > 20);
  }
});

test('the plan is labelled as orientation and never claims enrollment, equivalence or acceptance', () => {
  const plan = AI.planCareer(goal, profile);
  assert.ok(plan.note.includes('Ejemplo de orientación'));
  assert.ok(/no inscribe/i.test(plan.note) && /equivalencias/i.test(plan.note));
  const json = JSON.stringify(plan);
  assert.equal(/inscrit[oa]|aprobad[oa]|aceptad[oa]|confirmad[oa]/i.test(json.replace(plan.note, '')), false);
});

test('the starting point follows the profile context', () => {
  const plan = AI.planCareer('Quiero trabajar en la bolsa de valores', { career: 'Economía', semester: 3 });
  assert.equal(plan.status, 'matched');
  assert.equal(plan.startingPoint.career, 'Economía'); assert.equal(plan.startingPoint.semester, 3);
});

test('recognition ignores case and accents, avoids ordinary words and is deterministic', () => {
  assert.equal(AI.planCareer('MERCADO BURSATIL', profile).status, 'matched');
  assert.equal(AI.planCareer('quiero entender la BMV', profile).status, 'matched');
  assert.deepEqual(AI.planCareer(goal, profile), AI.planCareer(goal, profile));
  for (const text of ['quiero ser diseñadora', 'acciones concretas para mi semestre', 'mercado de trabajo en marketing']) {
    const plan = AI.planCareer(text, profile);
    assert.equal(plan.status, 'unrecognized', text);
    assert.deepEqual(ids(plan.suggestions), ['stock-market']);
    assert.equal(plan.stages, undefined);
  }
});

test('empty goals are reported as empty', () => {
  for (const text of ['', '  ', null, undefined]) assert.equal(AI.planCareer(text, profile).status, 'empty');
});

test('the talent scenarios are unchanged by the orientation scenarios', () => {
  assert.deepEqual(ids(AI.talentScenarios), ['running-gels', 'hackathon', 'campus-app']);
});
