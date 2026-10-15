const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../state.js');
const D = require('../data.js');
const U = require('../ui.js');

test('Pulse separates 21 regular items from the 50-year special and keeps complete destinations', () => {
  assert.equal(D.pulse.length, 23);
  const regular = D.pulse.filter(item => !item.special);
  assert.equal(regular.length, 21);
  assert.deepEqual(['events', 'news', 'opportunities'].map(category => regular.filter(item => item.category === category).length), [9, 8, 4]);
  assert.equal(D.pulse.filter(item => item.special).length, 2);
  assert.equal(new Set(D.pulse.map(item => item.id)).size, 23);
  for (const id of ['laboratorio-ideas', 'prototipo', 'cem-obra-musical-fitu-2026', 'cem-lluvia-inundaciones-foro-2026', 'cem-infrarisk-360-inundaciones-2026']) assert.ok(D.pulse.some(item => item.id === id));
  for (const item of D.pulse) {
    const sentenceCount = item.summary.split(/[.!?]+/).filter(value => value.trim()).length;
    assert.ok(sentenceCount >= 2 && sentenceCount <= 3, item.id + ' has a concise two or three sentence summary');
    assert.ok(item.topics.length); assert.ok(item.topics.every(id => C.topicTaxonomy.some(topic => topic.id === id)));
    assert.ok(['event', 'workshop', 'article', 'internship'].includes(item.kind));
    if (item.kind === 'article') { assert.ok(item.note.includes('CONECTA')); assert.ok(item.articleUrl.startsWith('https://conecta.tec.mx/')); }
    else assert.ok(item.note.includes('fictic') || item.note.includes('conceptual'));
    if (item.category === 'events') { assert.equal(item.timezone, 'America/Mexico_City'); assert.ok(Date.parse(item.endsAt) > Date.parse(item.startsAt)); }
    if (item.kind === 'internship') { assert.equal(item.ctaLabel, 'Saber más'); for (const key of ['role', 'company', 'modality', 'deadline', 'ctaUrl']) assert.ok(item[key]); }
  }
  assert.equal(D.people.length, 6); assert.equal(D.mentors.length, 4);
  assert.ok(D.pulse.find(item => item.id === 'practica-marketing').topics.includes('entrepreneurship'), 'marketing internship includes Emprendimiento');
  const state = C.createState(); state.pulsePreferences.topicsByCategory.opportunities = ['marketing']; state.filters.pulse = 'opportunities';
  assert.equal(C.getPulseItems(state, D.pulse)[0].id, 'practica-marketing', 'the internship matches a saved Marketing job area');
});

test('outbound links permit exact known local sources and HTTP(S), reject injected or unknown targets', () => {
  assert.equal(typeof U.isSafeOutboundURL, 'function');
  const article = D.pulse.find(item => item.kind === 'article');
  assert.equal(U.isSafeOutboundURL(article.articleUrl, D.pulse), true);
  assert.equal(U.isSafeOutboundURL('https://example.com/article', D.pulse), true);
  for (const value of ['javascript:alert(1)', 'data:text/html,x', '../demo-source.html?type=article&id=huerto', 'demo-source.html?type=article&id=missing', 'demo-source.html?type=job&id=huerto', 'demo-source.html?type=article&id=huerto&extra=x', 'demo-source.html?type=article&id=%2e%2e%2fhuerto', 'https://example.com/../private', 'https://example.com/%2e%2e/private']) assert.equal(U.isSafeOutboundURL(value, D.pulse), false, value);
});

function pulseView() { const fs = require('node:fs'); assert.ok(fs.existsSync(require('node:path').join(__dirname, '../views/pulse.js')), 'focused Pulse views exist'); return require('../views/pulse.js'); }
test('dashboard previews three cards per widget with totals, unique save controls and matching reasons', () => {
  const V = pulseView(); const state = C.createState(); state.saved = ['laboratorio-ideas'];
  const html = V.results({ state, items: D.pulse, route: { section: 'pulse', view: 'browse' } });
  for (const label of ['Eventos y talleres', 'Artículos', 'Oportunidades CVDP', 'Mis guardados']) assert.ok(html.includes(label));
  assert.equal((html.match(/data-widget=/g) || []).length, 4);
  assert.ok(html.includes('3 de 9')); assert.ok(html.includes('3 de 8')); assert.ok(html.includes('50 años del Tec CEM')); assert.ok(html.includes('Por tu interés en'));
  const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(match => match[1]); assert.equal(new Set(ids).size, ids.length);
  assert.equal((html.match(/class="saved-count"/g) || []).length, 1);
});

test('article and internship cards/details contain summaries and outbound CTAs without complete source bodies', () => {
  const V = pulseView(); const state = C.createState();
  for (const original of D.pulse.filter(item => ['article', 'internship'].includes(item.kind))) {
    const item = { ...original, detail: 'FULL PRIVATE SOURCE BODY', bullets: ['FULL JOB REQUIREMENT'], paragraphs: ['FULL ARTICLE PARAGRAPH'], requirements: ['FULL JOB REQUIREMENT'] };
    const ctx = { state, items: D.pulse, route: { section: 'pulse', id: item.id, view: 'detail' } };
    for (const html of [V.card(item, ctx), V.detail(item, ctx)]) { assert.ok(html.includes(C.escapeHTML(item.summary))); assert.equal(html.includes('FULL'), false); assert.ok(html.includes('target="_blank"')); assert.ok(html.includes('rel="noopener noreferrer"')); }
  }
});

test('general mode has no recommendation reason and all hidden widgets have restore control', () => {
  const V = pulseView(); const state = C.createState(); state.pulsePreferences.enabled = false;
  state.pulsePreferences.sectionVisibility = { events: false, articles: false, opportunities: false, saved: false };
  const html = V.results({ state, items: D.pulse, route: { view: 'browse' } });
  assert.ok(html.includes('Personalizar dashboard')); assert.ok(html.includes('Restaurar secciones')); assert.equal(html.includes('Por tu interés'), false);
  state.filters.pulse = 'events'; const filtered = V.results({ state, items: D.pulse, route: { view: 'browse' } });
  assert.equal((filtered.match(/data-item=/g) || []).length, 9);
});

test('topic chips and article source attribution remain visible in general mode cards and overview', () => {
  const V = pulseView(); const state = C.createState(); state.pulseMode = 'all';
  const item = D.pulse.find(item => item.id === 'cem-infrarisk-360-inundaciones-2026');
  const ctx = { state, items: D.pulse, route: { section: 'pulse', view: 'browse' } };
  for (const html of [V.card(item, ctx), V.card(item, ctx, true), V.detail(item, ctx)]) {
    for (const topicId of item.topics) {
      const topic = C.topicTaxonomy.find(topic => topic.id === topicId);
      assert.ok(html.includes('data-topic="' + topicId + '"'), topicId + ' is shown as a topic chip');
      assert.ok(html.includes(C.escapeHTML(topic.label)));
    }
    assert.equal(html.includes('Por tu interés'), false);
    assert.ok(html.includes(C.escapeHTML(item.source)), 'article has visible source attribution');
  }
});

test('source renderer keeps the local opportunity example and rejects obsolete or unsafe IDs', () => {
  const fs = require('node:fs'); assert.ok(fs.existsSync(require('node:path').join(__dirname, '../demo-source.js')), 'demo source renderer exists');
  const S = require('../demo-source.js');
  const job = D.pulse.find(item => item.kind === 'internship');
  const html = S.renderSource('?type=job&id=' + encodeURIComponent(job.id), D.pulse);
  assert.ok(html.includes('Fuente de ejemplo · contenido ficticio')); assert.ok(html.includes(job.title)); assert.ok(html.includes('index.html#/pulse'));
  assert.ok(html.includes(C.escapeHTML(job.requirements[0])), 'the source includes the complete job requirements omitted from Pulse');
  for (const query of ['?type=article&id=missing', '?type=job&id=missing', '?type=evil&id=' + job.id, '?type=article&id=%3Cimg%20src=x%3E']) {
    const notFound = S.renderSource(query, D.pulse); assert.ok(notFound.includes('Fuente no encontrada')); assert.equal(notFound.includes('<img'), false);
  }
});

test('Pulse and source renderers escape fixture text and hide unsafe source CTAs', () => {
  const V = pulseView(); const S = require('../demo-source.js'); const state = C.createState();
  const attack = '<img src=x onerror="alert(1)">';
  const original = D.pulse.find(item => item.kind === 'article');
  const item = { ...original, title: attack, summary: attack, organizer: attack, source: attack, paragraphs: [attack], articleUrl: 'javascript:alert(1)' };
  const ctx = { state, items: [item], route: { view: 'browse' } };
  for (const html of [V.card(item, ctx), V.detail(item, ctx), S.renderSource('?type=article&id=' + item.id, [item])]) {
    assert.equal(html.includes(attack), false); assert.ok(html.includes(C.escapeHTML(attack))); assert.equal(html.includes('href="javascript:'), false);
  }
});
