const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../state.js');
const D = require('../data.js');

test('F1 initializes isolated profile, preferences and inert future state', () => {
  const first = C.createState();
  const second = C.createState();
  assert.equal(first.profile?.displayName, 'Valeria Álvarez');
  assert.equal(first.profile.career, 'Finanzas');
  assert.equal(first.profile.semester, 1);
  assert.equal(first.profile.campus, 'CEM');
  assert.equal(first.profile.discoverable, false);
  assert.equal(first.profile.openToCollaborate, true);
  assert.deepEqual(first.profile.contactVisibility, { email: false, phone: false, linkedin: false, portfolio: false });
  assert.deepEqual(first.pulsePreferences.topicsByCategory, { events: ['finance', 'ai', 'entrepreneurship'], articles: ['finance', 'ai', 'entrepreneurship'], opportunities: ['finance'] });
  assert.deepEqual(first.pulsePreferences.sectionOrder, ['events', 'articles', 'opportunities', 'saved']);
  assert.deepEqual(first.registrations, {});
  assert.deepEqual(first.applications, {});
  assert.deepEqual(first.talentAssistant, { query: '', result: null });
  assert.deepEqual(first.careerAssistant, { goal: '', result: null, selectedAlternative: null });
  assert.equal(first.assignedMentorId, 'elena-cruz');
  assert.deepEqual(first.pinnedSupportIds, ['rodrigo-navarro']);
  first.profile.skills[0].name = 'Changed';
  first.pulsePreferences.topicsByCategory.events.push('marketing');
  assert.notEqual(second.profile.skills[0].name, 'Changed');
  assert.equal(second.pulsePreferences.topicsByCategory.events.includes('marketing'), false);
});

test('profile draft survives repeated reads, saves as a clone and preserves requests', () => {
  assert.equal(typeof C.beginProfileDraft, 'function');
  const state = C.createState();
  C.submitContact(state, 'lucia-torres', 'Un proyecto');
  C.submitMentor(state, 'elena-cruz', 'Mi portafolio', 'online');
  const draft = C.beginProfileDraft(state);
  draft.displayName = '  Ana López  ';
  draft.projects[0].title = 'Nuevo proyecto';
  assert.equal(C.beginProfileDraft(state), draft);
  assert.equal(state.profile.displayName, 'Valeria Álvarez');
  assert.equal(C.saveProfile(state).ok, true);
  assert.equal(state.profile.displayName, 'Ana López');
  assert.equal(state.profile.projects[0].title, 'Nuevo proyecto');
  draft.projects[0].title = 'Mutation after save';
  assert.equal(state.profile.projects[0].title, 'Nuevo proyecto');
  assert.equal(state.drafts.profile, null);
  assert.equal(state.contacts['lucia-torres'].status, 'pending');
  assert.equal(state.mentorRequests['elena-cruz'].status, 'pending');
});

test('cancel discards changed profile without mutating its confirmed values', () => {
  assert.equal(typeof C.cancelProfileDraft, 'function');
  const state = C.createState();
  const original = JSON.parse(JSON.stringify(state.profile));
  const draft = C.beginProfileDraft(state);
  draft.contact.email = 'different@example.com'; draft.skills.splice(0, 1); draft.discoverable = true;
  C.cancelProfileDraft(state);
  assert.deepEqual(state.profile, original);
  assert.deepEqual(C.beginProfileDraft(state), original);
});

test('invalid required fields, semester and malformed email reject the whole save', () => {
  assert.equal(typeof C.saveProfile, 'function');
  for (const [field, value] of [['displayName', ' '], ['career', ''], ['semester', 0], ['semester', 13], ['semester', 1.5], ['semester', ''], ['contact.email', 'broken@']]) {
    const state = C.createState(); const draft = C.beginProfileDraft(state);
    if (field.includes('.')) draft.contact.email = value; else draft[field] = value;
    draft.bio = 'Must not be partially committed';
    const result = C.saveProfile(state);
    assert.equal(result.ok, false, field + '=' + value);
    assert.ok(result.errors[field]);
    assert.notEqual(state.profile.bio, draft.bio);
    assert.equal(state.drafts.profile, draft);
  }
});

test('empty added rows reject saving until completed or removed', () => {
  assert.equal(typeof C.addProfileRow, 'function');
  const state = C.createState();
  const skill = C.addProfileRow(state, 'skills');
  const project = C.addProfileRow(state, 'projects');
  let result = C.saveProfile(state);
  assert.equal(result.ok, false);
  assert.ok(result.errors['skills.2.name']);
  assert.ok(result.errors['projects.1.title']);
  skill.name = 'Datos'; skill.level = 'Avanzado'; project.title = 'Análisis';
  assert.equal(C.saveProfile(state).ok, true);
  assert.equal(state.profile.skills.at(-1).level, 'Avanzado');
  C.addProfileRow(state, 'projects');
  C.removeProfileRow(state, 'projects', state.drafts.profile.projects.at(-1).id);
  assert.equal(C.saveProfile(state).ok, true);
});

test('URLs accept only absolute HTTP and HTTPS and unsafe links block saving', () => {
  assert.equal(typeof C.isSafeURL, 'function');
  for (const value of ['https://example.com/x?q=1', 'http://example.com']) assert.equal(C.isSafeURL(value), true);
  for (const value of ['javascript:alert(1)', 'data:text/html,x', '//example.com', '/example', 'ftp://example.com', 'https://', 'https:\\example.com', 'https://example.com\n']) assert.equal(C.isSafeURL(value), false, value);
  for (const key of ['linkedin', 'portfolio']) {
    const state = C.createState(); const draft = C.beginProfileDraft(state);
    draft.contact[key] = 'javascript:alert(1)';
    assert.ok(C.saveProfile(state).errors['contact.' + key]);
  }
  const state = C.createState(); C.beginProfileDraft(state).projects[0].url = 'data:text/html,x';
  assert.ok(C.saveProfile(state).errors['projects.0.url']);
});

test('Talent projects only published collaborating profile and public contact fields', () => {
  assert.equal(typeof C.getPeople, 'function');
  const state = C.createState();
  assert.equal(C.getPeople(state, D.people).length, D.people.length);
  let draft = C.beginProfileDraft(state); draft.discoverable = true;
  draft.contact.phone = 'private-phone'; draft.contact.linkedin = 'https://example.com/ana';
  draft.contactVisibility.linkedin = true;
  assert.equal(C.saveProfile(state).ok, true);
  const person = C.getPeople(state, D.people).at(-1);
  assert.equal(person.id, 'self'); assert.equal(person.isSelf, true);
  assert.deepEqual(person.contact, { linkedin: 'https://example.com/ana' });
  assert.equal(JSON.stringify(person).includes('valeria.alvarez@example.com'), false);
  assert.equal(JSON.stringify(person).includes('private-phone'), false);
  assert.deepEqual(person.levels, state.profile.skills.map(skill => skill.level));
  assert.equal(person.availability, 'Por definir');
  assert.equal(person.project, state.profile.projects[0].title);
  draft = C.beginProfileDraft(state); draft.openToCollaborate = false; C.saveProfile(state);
  assert.equal(C.getPeople(state, D.people).length, D.people.length);
});

test('own reserved routes are independent of discovery while Talent self route requires publication', () => {
  const state = C.createState();
  assert.deepEqual(C.resolveRoute('#/profile', D, state), { section: 'profile', view: 'preview', valid: true });
  assert.deepEqual(C.resolveRoute('#/profile/edit', D, state), { section: 'profile', view: 'edit', valid: true });
  assert.deepEqual(C.resolveRoute('#/profile/preferences', D, state), { section: 'profile', view: 'preferences', valid: true });
  assert.equal(C.resolveRoute('#/profile/nope', D, state).valid, false);
  assert.equal(C.resolveRoute('#/talent/self', D, state).valid, false);
  const draft = C.beginProfileDraft(state); draft.discoverable = true; C.saveProfile(state);
  assert.equal(C.resolveRoute('#/talent/self', D, state).valid, true);
  assert.equal(C.resolveRoute('#/talent/self/contact', D, state).valid, false);
});

test('preference drafts save topics and personalization without changing future dashboard controls', () => {
  assert.equal(typeof C.beginPreferencesDraft, 'function');
  const state = C.createState(); const draft = C.beginPreferencesDraft(state);
  draft.topicsByCategory.events = ['water-sustainability', 'communication']; draft.enabled = false;
  assert.equal(C.beginPreferencesDraft(state), draft);
  assert.equal(state.pulsePreferences.enabled, true);
  assert.equal(C.savePreferences(state).ok, true);
  assert.deepEqual(state.pulsePreferences.topicsByCategory.events, ['water-sustainability', 'communication']);
  assert.equal(state.pulsePreferences.enabled, false);
  assert.deepEqual(state.pulsePreferences.sectionOrder, ['events', 'articles', 'opportunities', 'saved']);
  draft.topicsByCategory.events.push('research');
  assert.equal(state.pulsePreferences.topicsByCategory.events.includes('research'), false);
  C.beginPreferencesDraft(state).enabled = true; C.cancelPreferencesDraft(state);
  assert.equal(C.beginPreferencesDraft(state).enabled, false);
});

test('reset restores F1 values and clears both new drafts without sharing references', () => {
  assert.equal(typeof C.beginProfileDraft, 'function');
  const state = C.createState();
  C.beginProfileDraft(state).displayName = 'Otra persona'; C.saveProfile(state);
  C.beginProfileDraft(state).bio = 'Borrador'; C.beginPreferencesDraft(state).topics = [];
  state.registrations.event = { status: 'registered' };
  C.resetState(state);
  assert.deepEqual(state, C.createState());
  assert.equal(state.drafts.profile, null); assert.equal(state.drafts.preferences, null);
});

test('validation reports staged errors without mutating the draft or confirmed profile', () => {
  assert.equal(typeof C.validateProfile, 'function');
  const state = C.createState(); const draft = C.beginProfileDraft(state);
  draft.professionalInterests = 'Finanzas, Datos, '; draft.projects[0].tags = 'Uno, Dos, ';
  const snapshot = JSON.stringify(draft);
  const result = C.validateProfile(draft);
  assert.equal(result.ok, true);
  assert.deepEqual(result.profile.professionalInterests, ['Finanzas', 'Datos']);
  assert.deepEqual(result.profile.projects[0].tags, ['Uno', 'Dos']);
  assert.equal(JSON.stringify(draft), snapshot);
  draft.projects[0].title = '';
  assert.ok(C.validateProfile(draft).errors['projects.0.title']);
  draft.projects[0].title = 'Datos';
  assert.equal(C.validateProfile(draft).ok, true);
  assert.equal(state.profile.projects[0].title, 'Presupuesto para una idea');
});

test('a renamed confirmed own skill clears its obsolete Talent selection', () => {
  assert.equal(typeof C.reconcileTalentSkillFilter, 'function');
  const state = C.createState();
  let draft = C.beginProfileDraft(state); draft.discoverable = true;
  draft.skills[0].name = 'Escenarios bursátiles'; C.saveProfile(state);
  state.filters.talent.skill = 'Escenarios bursátiles';
  assert.equal(C.filterPeople(C.getPeople(state, D.people), state.filters.talent).length, 1);
  draft = C.beginProfileDraft(state); draft.skills[0].name = 'Análisis bursátil'; C.saveProfile(state);
  C.reconcileTalentSkillFilter(state, C.getPeople(state, D.people));
  assert.equal(state.filters.talent.skill, 'all');
  assert.equal(C.filterPeople(C.getPeople(state, D.people), state.filters.talent).length, D.people.length + 1);
});

test('reconciling Talent keeps valid selections, search and other area filters', () => {
  assert.equal(typeof C.reconcileTalentSkillFilter, 'function');
  const state = C.createState();
  state.filters.talent = { skill: 'Finanzas', search: 'Camila' };
  state.filters.pulse = 'events'; state.filters.mentor = 'Diseño';
  C.reconcileTalentSkillFilter(state, C.getPeople(state, D.people));
  assert.deepEqual(state.filters, { pulse: 'events', talent: { skill: 'Finanzas', search: 'Camila' }, mentor: 'Diseño' });
  assert.equal(C.filterPeople(C.getPeople(state, D.people), state.filters.talent).length, 1);
  state.filters.talent.skill = 'all';
  C.reconcileTalentSkillFilter(state, C.getPeople(state, D.people));
  assert.equal(state.filters.talent.skill, 'all');
});

test('hiding or pausing the own profile clears a unique selected skill while preserving search', () => {
  assert.equal(typeof C.reconcileTalentSkillFilter, 'function');
  for (const visibilityField of ['discoverable', 'openToCollaborate']) {
    const state = C.createState();
    let draft = C.beginProfileDraft(state); draft.discoverable = true;
    draft.skills[0].name = 'Escenarios bursátiles'; C.saveProfile(state);
    state.filters.talent = { skill: 'Escenarios bursátiles', search: 'Camila' };
    draft = C.beginProfileDraft(state); draft[visibilityField] = false; C.saveProfile(state);
    C.reconcileTalentSkillFilter(state, C.getPeople(state, D.people));
    assert.deepEqual(state.filters.talent, { skill: 'all', search: 'Camila' });
    assert.equal(C.getPeople(state, D.people).length, D.people.length);
    assert.equal(C.filterPeople(C.getPeople(state, D.people), state.filters.talent).length, 1);
  }
});

test('unconfirmed skill changes preserve the selection until the skill is removed and saved', () => {
  assert.equal(typeof C.reconcileTalentSkillFilter, 'function');
  const state = C.createState();
  let draft = C.beginProfileDraft(state); draft.discoverable = true;
  const skill = C.addProfileRow(state, 'skills'); skill.name = 'Escenarios bursátiles'; C.saveProfile(state);
  state.filters.talent.skill = 'Escenarios bursátiles';
  C.removeProfileRow(state, 'skills', skill.id);
  C.reconcileTalentSkillFilter(state, C.getPeople(state, D.people));
  assert.equal(state.filters.talent.skill, 'Escenarios bursátiles');
  C.saveProfile(state);
  C.reconcileTalentSkillFilter(state, C.getPeople(state, D.people));
  assert.equal(state.filters.talent.skill, 'all');
});
