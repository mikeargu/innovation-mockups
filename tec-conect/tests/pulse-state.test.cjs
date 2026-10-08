const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../state.js');
const D = require('../data.js');
const ids = items => items.map(item => item.id);

test('Para ti ranks explicit saved topic matches stably without removing other items', () => {
  assert.equal(typeof C.getPulseItems, 'function');
  const state = C.createState();
  state.profile.professionalInterests = ['Marketing'];
  state.pulsePreferences.topicsByCategory = { events: ['finance', 'ai'], articles: ['finance', 'ai'], opportunities: [] };
  const items = [{ id: 'a', category: 'events', topics: ['community'] }, { id: 'b', category: 'news', topics: ['finance'] }, { id: 'c', category: 'events', topics: ['finance', 'ai'] }, { id: 'd', category: 'events', topics: ['finance'] }];
  assert.deepEqual(ids(C.getPulseItems(state, items)), ['c', 'b', 'd', 'a']);
  state.filters.pulse = 'events';
  assert.deepEqual(ids(C.getPulseItems(state, items)), ['c', 'd', 'a']);
  state.pulseMode = 'all';
  assert.deepEqual(ids(C.getPulseItems(state, items)), ['a', 'c', 'd']);
});

test('general content is effective for disabled personalization and no selected topics', () => {
  assert.equal(typeof C.effectivePulseMode, 'function');
  for (const customize of [s => { s.pulsePreferences.enabled = false; }, s => { s.pulsePreferences.topicsByCategory = { events: [], articles: [], opportunities: [] }; }, s => { s.pulseMode = 'all'; }]) {
    const state = C.createState(); customize(state);
    assert.equal(C.effectivePulseMode(state), 'all');
    assert.deepEqual(ids(C.getPulseItems(state, D.pulse)), ids(D.pulse));
  }
});

test('widgets follow confirmed order and visibility while a hidden category remains accessible', () => {
  assert.equal(typeof C.getPulseWidgets, 'function');
  const state = C.createState(); state.saved = [D.pulse[0].id];
  state.pulsePreferences.sectionOrder = ['saved', 'opportunities', 'articles', 'events'];
  state.pulsePreferences.sectionVisibility.events = false;
  const widgets = C.getPulseWidgets(state, D.pulse);
  assert.deepEqual(ids(widgets), ['saved', 'opportunities', 'articles']);
  assert.equal(widgets[0].items.length, 1);
  state.filters.pulse = 'events';
  assert.equal(C.getPulseItems(state, D.pulse).length, D.pulse.filter(item => item.category === 'events').length);
  state.filters.pulse = 'saved';
  assert.deepEqual(ids(C.getPulseItems(state, D.pulse)), [D.pulse[0].id]);
});

test('preferences atomically save normalized layout and topics, cancel preserves confirmed state', () => {
  const state = C.createState(); const before = C.clone(state); const draft = C.beginPreferencesDraft(state);
  draft.topicsByCategory.events = ['marketing', 'unknown', 'marketing']; draft.enabled = false;
  draft.sectionOrder = ['saved', 'saved', 'bad', 'events']; draft.sectionVisibility = { saved: false, articles: false, bad: false };
  C.savePreferences(state);
  assert.deepEqual(state.pulsePreferences.topicsByCategory.events, ['marketing']);
  assert.deepEqual(state.pulsePreferences.sectionOrder, ['saved', 'events', 'articles', 'opportunities']);
  assert.deepEqual(state.pulsePreferences.sectionVisibility, { events: true, articles: false, opportunities: true, saved: false });
  for (const key of ['profile', 'filters', 'saved', 'contacts', 'mentorRequests', 'registrations', 'applications']) assert.deepEqual(state[key], before[key]);
  const confirmed = C.clone(state.pulsePreferences); C.beginPreferencesDraft(state).sectionOrder.reverse(); C.cancelPreferencesDraft(state);
  assert.deepEqual(state.pulsePreferences, confirmed);
  C.resetState(state); assert.deepEqual(state, C.createState());
});

test('restore sections reconciles a pending draft layout without losing staged topics or enabled', () => {
  assert.equal(typeof C.restorePulseSections, 'function');
  const state = C.createState(); state.saved = ['huerto']; state.filters.pulse = 'news';
  state.pulsePreferences.sectionOrder.reverse(); state.pulsePreferences.sectionVisibility.events = false;
  const draft = C.beginPreferencesDraft(state); draft.topicsByCategory.articles = ['water-sustainability']; draft.enabled = false;
  C.restorePulseSections(state);
  assert.deepEqual(state.pulsePreferences.sectionOrder, C.createState().pulsePreferences.sectionOrder);
  assert.deepEqual(draft.sectionOrder, C.createState().pulsePreferences.sectionOrder);
  assert.deepEqual(draft.topicsByCategory.articles, ['water-sustainability']); assert.equal(draft.enabled, false);
  assert.deepEqual(state.saved, ['huerto']); assert.equal(state.filters.pulse, 'news');
  C.savePreferences(state); assert.deepEqual(state.pulsePreferences.topicsByCategory.articles, ['water-sustainability']);
});

test('section moves and draft restoration are staged until save', () => {
  assert.equal(typeof C.movePreferencesSection, 'function');
  const state = C.createState(); C.movePreferencesSection(state, 'saved', -1);
  assert.deepEqual(state.drafts.preferences.sectionOrder, ['events', 'articles', 'saved', 'opportunities']);
  assert.deepEqual(state.pulsePreferences.sectionOrder, ['events', 'articles', 'opportunities', 'saved']);
  C.movePreferencesSection(state, 'events', -1); assert.equal(state.drafts.preferences.sectionOrder[0], 'events');
  C.restorePulseSections(state, true); assert.deepEqual(state.drafts.preferences.sectionOrder, state.pulsePreferences.sectionOrder);
});
