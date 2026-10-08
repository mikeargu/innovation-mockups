const { test } = require('node:test');
const assert = require('node:assert/strict');
const D = require('../data.js');
const AI = require('../demo-ai.js');

const gels = 'Estoy empezando una startup de geles para correr. Necesito alguien de marketing, alguien de finanzas y alguien que diseñe la página web.';
const ids = list => list.map(item => item.id);
const role = (result, id) => result.roles.find(item => item.id === id);

test('three demo scenarios exist and each prompt resolves to its own scenario', () => {
  assert.deepEqual(ids(AI.talentScenarios), ['running-gels', 'hackathon', 'campus-app']);
  assert.equal(AI.talentScenarios[0].prompt, gels);
  for (const scenario of AI.talentScenarios) {
    assert.ok(scenario.label && scenario.prompt);
    const result = AI.matchTeam(scenario.prompt, D.people);
    assert.equal(result.status, 'matched', scenario.id);
    assert.equal(result.scenarioId, scenario.id);
  }
});

test('the running-gels prompt returns marketing, finance and design/web roles with matching people', () => {
  const result = AI.matchTeam(gels, D.people);
  assert.deepEqual(ids(result.roles), ['marketing', 'finance', 'web']);
  assert.deepEqual(result.roles.map(item => item.label), ['Marketing', 'Finanzas', 'Diseño / desarrollo web']);
  assert.equal(role(result, 'marketing').people[0].id, 'sofia-mendoza');
  assert.equal(role(result, 'finance').people[0].id, 'camila-leon');
  assert.ok(ids(role(result, 'web').people).includes('lucia-torres'));
  assert.ok(ids(role(result, 'web').people).includes('diego-rios'));
});

test('every recommended person carries matched skills, evidence, a reason and separate declared availability', () => {
  for (const scenario of AI.talentScenarios) {
    const result = AI.matchTeam(scenario.prompt, D.people);
    assert.ok(result.roles.length >= 3, scenario.id);
    for (const item of result.roles) {
      assert.ok(item.people.length >= 1 && item.people.length <= 2, scenario.id + ' ' + item.id);
      assert.ok(item.skills.length);
      for (const person of item.people) {
        const source = D.people.find(candidate => candidate.id === person.id);
        assert.ok(person.matchedSkills.length && person.matchedSkills.every(skill => item.skills.includes(skill) && source.skills.includes(skill)));
        assert.equal(person.evidence, source.evidence);
        assert.equal(person.project, source.project);
        assert.equal(person.availability, source.availability);
        assert.equal(person.modality, source.modality);
        assert.ok(person.reason.includes(person.matchedSkills[0]));
        assert.notEqual(person.reason, person.availability);
      }
    }
  }
});

test('results contain no personal rankings, scores or compatibility percentages', () => {
  const json = JSON.stringify(AI.talentScenarios.map(scenario => AI.matchTeam(scenario.prompt, D.people)));
  assert.equal(/score|rank|ranking|compatib|%|puntaje/i.test(json), false);
});

test('recognition ignores case, accents and surrounding words, and is deterministic', () => {
  assert.equal(AI.matchTeam('  GELES PARA CORRER  ', D.people).scenarioId, 'running-gels');
  assert.equal(AI.matchTeam('Quiero armar un equipo para un hackathon de este mes', D.people).scenarioId, 'hackathon');
  assert.equal(AI.matchTeam('Busco gente para una APLICACIÓN del campus', D.people).scenarioId, 'campus-app');
  assert.deepEqual(AI.matchTeam(gels, D.people), AI.matchTeam(gels, D.people));
});

test('trigger matching avoids ordinary verbs, accepts common variants and refuses ambiguous queries', () => {
  assert.equal(AI.matchTeam('necesito alguien para correr el presupuesto', D.people).status, 'unrecognized');
  assert.equal(AI.matchTeam('Quiero correr un hackathon', D.people).scenarioId, 'hackathon');
  for (const [query, id] of [['venta de gels energéticos', 'running-gels'], ['un hackatón en el campus', 'hackathon'], ['una app para reservar salas', 'campus-app'], ['desarrollar aplicaciones para estudiantes', 'campus-app']]) {
    assert.equal(AI.matchTeam(query, D.people).scenarioId, id, query);
  }
  const ambiguous = AI.matchTeam('un hackathon para crear una app', D.people);
  assert.equal(ambiguous.status, 'unrecognized');
  assert.deepEqual(ids(ambiguous.suggestions), ['running-gels', 'hackathon', 'campus-app']);
});

test('the water and sustainability example was removed and is no longer answered', () => {
  assert.equal(AI.talentScenarios.some(item => /agua|sostenib/i.test(item.label + item.prompt)), false);
  assert.equal(AI.matchTeam('Busco colaboradores para un proyecto de agua y sostenibilidad', D.people).status, 'unrecognized');
});

test('the campus app example asks for development, security and user research', () => {
  const result = AI.matchTeam(AI.talentScenarios.find(item => item.id === 'campus-app').prompt, D.people);
  assert.deepEqual(result.roles.map(item => item.label), ['Desarrollo de la app', 'Seguridad y privacidad', 'Investigación con estudiantes']);
  assert.ok(ids(role(result, 'security').people).includes('mateo-salas'));
  assert.ok(ids(role(result, 'development').people).includes('diego-rios'));
  assert.equal(role(result, 'research').people[0].id, 'lucia-torres');
});

test('unrecognized queries return the available scenarios and no recommendations', () => {
  for (const query of ['quiero cocinar pasta', 'necesito alguien de marketing', 'hola']) {
    const result = AI.matchTeam(query, D.people);
    assert.equal(result.status, 'unrecognized', query);
    assert.equal(result.roles, undefined);
    assert.deepEqual(ids(result.suggestions), ['running-gels', 'hackathon', 'campus-app']);
    assert.ok(result.suggestions.every(item => item.prompt && item.label));
  }
});

test('empty or whitespace queries are reported as empty', () => {
  for (const query of ['', '   ', null, undefined]) assert.equal(AI.matchTeam(query, D.people).status, 'empty');
});

test("the signed-in student's own projected profile is never recommended", () => {
  const people = [...D.people, { id: 'self', isSelf: true, name: 'Valeria', skills: ['Marketing', 'Finanzas', 'UX/UI'], levels: ['Inicial', 'Inicial', 'Inicial'], evidence: 'x', project: 'y', availability: 'z', modality: 'w' }];
  const json = JSON.stringify(AI.matchTeam(gels, people));
  assert.equal(json.includes('"self"'), false);
});

test('a role without matching people is returned with an empty people list', () => {
  const result = AI.matchTeam(gels, D.people.filter(person => !person.skills.includes('Finanzas') && !person.skills.includes('Emprendimiento')));
  assert.equal(result.status, 'matched');
  assert.deepEqual(role(result, 'finance').people, []);
  assert.ok(role(result, 'marketing').people.length);
});

test('the matcher does not mutate the people data', () => {
  const before = JSON.stringify(D.people);
  AI.matchTeam(gels, D.people);
  assert.equal(JSON.stringify(D.people), before);
});
