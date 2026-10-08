const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../state.js');
const D = require('../data.js');
const P = require('../views/pulse.js');
const V = require('../views/profile.js');

const ids = list => list.map(item => item.id);
const byId = id => D.pulse.find(item => item.id === id);
const internships = D.pulse.filter(item => item.kind === 'internship');
const ctx = state => ({ state, items: D.pulse, route: { section: 'pulse', view: 'browse' } });
const withGroups = groups => { const state = C.createState(); Object.assign(state.pulsePreferences.topicsByCategory, groups); return state; };
const widget = (state, id) => C.getPulseWidgets(state, D.pulse).find(item => item.id === id);
const finance = 'finance', psychology = 'psychology';

test('preferences hold three independent groups; opportunities start explicitly at Finanzas', () => {
  const state = C.createState();
  assert.deepEqual(state.pulsePreferences.topicsByCategory, { events: ['finance', 'ai', 'entrepreneurship'], articles: ['finance', 'ai', 'entrepreneurship'], opportunities: ['finance'] });
  assert.equal('topics' in state.pulsePreferences, false, 'the single shared list is retired');
  assert.equal(state.pulsePreferences.enabled, true);
  assert.deepEqual(state.pulsePreferences.sectionOrder, ['events', 'articles', 'opportunities', 'saved']);
});

test('Psicología is a selectable topic distinct from Salud, with a fictitious article and local full source', () => {
  assert.ok(C.topicTaxonomy.some(topic => topic.id === psychology && topic.label === 'Psicología'));
  assert.ok(C.topicTaxonomy.some(topic => topic.id === 'health' && topic.label === 'Salud'));
  const articles = D.pulse.filter(item => item.kind === 'article' && item.topics.includes(psychology));
  assert.ok(articles.length >= 1);
  for (const article of articles) {
    assert.equal(article.articleUrl, 'demo-source.html?type=article&id=' + article.id);
    assert.ok(article.paragraphs.length >= 2); assert.ok(article.note.includes('ficticio'));
  }
});

test('internships carry professional areas for the role, independent of the company sector', () => {
  for (const job of internships) {
    assert.ok(Array.isArray(job.professionalAreaIds) && job.professionalAreaIds.length, job.id);
    assert.ok(job.professionalAreaIds.every(id => C.topicTaxonomy.some(topic => topic.id === id)), job.id);
  }
  assert.deepEqual(byId('practica-finanzas').professionalAreaIds, ['finance']);
  assert.deepEqual(byId('practica-marketing').professionalAreaIds, ['marketing']);
  assert.deepEqual(byId('practica-web').professionalAreaIds, ['technology']);
  const crossSector = internships.find(job => job.professionalAreaIds.includes(finance) && job.topics.includes(psychology));
  assert.ok(crossSector, 'a finance role at a psychology-sector company illustrates area ≠ sector');
});

test('CP5A: reading Psicología prioritises the article without recommending a Psicología vacancy', () => {
  const state = withGroups({ articles: [psychology], opportunities: [finance] });
  const firstArticle = C.getPulseItems(state, D.pulse, 'news')[0];
  assert.ok(firstArticle.topics.includes(psychology));
  assert.deepEqual(C.pulseMatchTopics(state, firstArticle).map(topic => topic.label), ['Psicología']);
  const offers = widget(state, 'opportunities').items;
  assert.ok(offers.length >= 1);
  assert.ok(offers.every(job => job.professionalAreaIds.includes(finance)));
  const synthetic = [...D.pulse, { id: 'psy-job', category: 'opportunities', kind: 'internship', topics: [psychology], professionalAreaIds: [psychology] }];
  assert.equal(C.getPulseWidgets(state, synthetic).find(item => item.id === 'opportunities').items.some(job => job.id === 'psy-job'), false);
  assert.deepEqual(C.pulseMatchTopics(state, synthetic.at(-1)), []);
});

test('a finance role at a company of another sector matches Finanzas by its area', () => {
  const state = withGroups({ opportunities: [finance] });
  const job = { id: 'x', category: 'opportunities', kind: 'internship', topics: [psychology, 'health'], professionalAreaIds: [finance] };
  assert.deepEqual(C.pulseMatchTopics(state, job).map(topic => topic.id), [finance]);
});

test('changing only Eventos changes its recommendations and keeps Artículos and Oportunidades', () => {
  const before = C.createState();
  const after = withGroups({ events: ['water-sustainability'] });
  assert.notDeepEqual(ids(widget(before, 'events').items), ids(widget(after, 'events').items));
  assert.equal(widget(after, 'events').items[0].id, 'tratamiento-agua');
  assert.deepEqual(ids(widget(before, 'articles').items), ids(widget(after, 'articles').items));
  assert.deepEqual(ids(widget(before, 'opportunities').items), ids(widget(after, 'opportunities').items));
});

test('an empty group shows general content for that group only, without reasons', () => {
  const state = withGroups({ articles: [] });
  const news = D.pulse.filter(item => item.category === 'news');
  assert.deepEqual(ids(C.getPulseItems(state, D.pulse, 'news')), ids(news));
  assert.ok(news.every(item => C.pulseMatchTopics(state, item).length === 0));
  assert.equal(widget(state, 'articles').generalContent, true);
  assert.ok(C.pulseMatchTopics(state, byId('primer-sueldo')).length > 0, 'events keep their personalisation');
  const noAreas = withGroups({ opportunities: [] });
  assert.equal(widget(noAreas, 'opportunities').generalContent, true);
  assert.equal(widget(noAreas, 'opportunities').items.length, internships.length);
});

test('chosen areas with no matching offers produce an explicit empty state', () => {
  const state = withGroups({ opportunities: ['government'] });
  assert.deepEqual(widget(state, 'opportunities').items, []);
  assert.equal(widget(state, 'opportunities').emptyReason, 'no-matching-opportunities');
  const html = P.results(ctx(state));
  assert.ok(html.includes('Ver todas las oportunidades')); assert.ok(html.includes('Editar mis áreas'));
  assert.ok(html.includes('href="#/profile/preferences"'));
});

test('Todo el campus keeps every publication and gives no recommendation reasons', () => {
  const state = withGroups({ opportunities: ['government'] }); state.pulseMode = 'all';
  assert.equal(C.getPulseItems(state, D.pulse, 'opportunities').length, internships.length);
  assert.equal(widget(state, 'opportunities').items.length, internships.length);
  assert.ok(D.pulse.every(item => C.pulseMatchTopics(state, item).length === 0));
});

test('personalisation turns off only when disabled or when all three groups are empty', () => {
  assert.equal(C.effectivePulseMode(withGroups({ events: [], articles: [] })), 'forYou');
  assert.equal(C.effectivePulseMode(withGroups({ events: [], articles: [], opportunities: [] })), 'all');
  const disabled = C.createState(); disabled.pulsePreferences.enabled = false;
  assert.equal(C.effectivePulseMode(disabled), 'all');
});

test('save normalises each group independently; cancel keeps the confirmed groups; reset restores them', () => {
  const state = C.createState(); const confirmed = C.clone(state.pulsePreferences);
  const draft = C.beginPreferencesDraft(state);
  draft.topicsByCategory.events = ['ai', 'unknown', 'ai']; draft.topicsByCategory.articles = [psychology];
  C.cancelPreferencesDraft(state);
  assert.deepEqual(state.pulsePreferences, confirmed);
  const next = C.beginPreferencesDraft(state);
  next.topicsByCategory.events = ['ai', 'unknown', 'ai']; next.topicsByCategory.articles = [psychology]; next.sectionOrder = ['saved', 'events', 'articles', 'opportunities'];
  C.savePreferences(state);
  assert.deepEqual(state.pulsePreferences.topicsByCategory, { events: ['ai'], articles: [psychology], opportunities: ['finance'] });
  assert.deepEqual(state.pulsePreferences.sectionOrder, ['saved', 'events', 'articles', 'opportunities']);
  C.resetState(state);
  assert.deepEqual(state.pulsePreferences, C.createState().pulsePreferences);
});

test('migration converts a single shared list into Eventos and Artículos without copying it to Oportunidades', () => {
  const legacy = { topics: ['finance', 'unknown', 'finance'], enabled: false, sectionOrder: ['saved', 'events', 'articles', 'opportunities'], sectionVisibility: { events: true, articles: false, opportunities: true, saved: true } };
  const migrated = C.migratePulsePreferences(legacy);
  assert.deepEqual(migrated.topicsByCategory, { events: ['finance'], articles: ['finance'], opportunities: [] });
  assert.equal(migrated.enabled, false);
  assert.deepEqual(migrated.sectionOrder, legacy.sectionOrder);
  assert.deepEqual(migrated.sectionVisibility, legacy.sectionVisibility);
  assert.equal('topics' in migrated, false);
  assert.deepEqual(legacy.topics, ['finance', 'unknown', 'finance'], 'migration does not mutate its input');
  assert.deepEqual(C.migratePulsePreferences(C.createState().pulsePreferences), C.createState().pulsePreferences);
});

test('recommendation reasons name the group that produced them', () => {
  const state = withGroups({ articles: [psychology], opportunities: [finance] });
  const article = C.getPulseItems(state, D.pulse, 'news')[0];
  assert.ok(P.card(byId('primer-sueldo'), ctx(state)).includes('Por tu interés en Finanzas · Eventos'));
  assert.ok(P.card(article, ctx(state)).includes('Por tu interés en Psicología · Lecturas'));
  assert.ok(P.card(byId('practica-finanzas'), ctx(state)).includes('Por tu área de búsqueda: Finanzas'));
  assert.equal(P.card(byId('practica-marketing'), ctx(state)).includes('pulse-reason'), false, 'no false match explanation');
});

test('opportunity details say a match does not confirm eligibility', () => {
  const html = P.detail(byId('practica-finanzas'), ctx(C.createState()));
  assert.ok(html.includes('no confirma tu elegibilidad'));
});

test('Preferences shows three labelled groups with independent controls and the career as context', () => {
  const state = C.createState();
  const html = V.preferences({ draft: C.beginPreferencesDraft(state), career: state.profile.career });
  for (const legend of ['Eventos y talleres que me interesan', 'Temas que me gusta leer', 'Áreas donde busco oportunidades']) assert.ok(html.includes(legend), legend);
  for (const group of ['events', 'articles', 'opportunities']) assert.ok(html.includes('name="topics-' + group + '"'), group);
  assert.ok(html.includes('id="preference-articles-psychology"'));
  assert.ok(html.includes('Tu carrera: Finanzas'));
  const found = [...html.matchAll(/ id="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(found).size, found.length);
});

test('Mi perfil summarises each group separately', () => {
  const state = withGroups({ articles: [psychology] });
  const html = V.preview({ profile: state.profile, preferences: state.pulsePreferences });
  for (const label of ['Eventos y talleres', 'Lecturas', 'Oportunidades']) assert.ok(html.includes(label), label);
  assert.ok(html.includes('Psicología'));
});
