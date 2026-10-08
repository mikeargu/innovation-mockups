const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../state.js');
function views() {
  const file = path.join(__dirname, '../views/profile.js');
  assert.ok(fs.existsSync(file), 'F1 profile renderers exist');
  return require(file);
}

test('own preview renders private contact labels, projects, skills and saved topics', () => {
  const V = views(); const state = C.createState();
  const html = V.preview({ profile: state.profile, preferences: state.pulsePreferences });
  assert.ok(html.includes('valeria.alvarez@example.com'));
  assert.ok(html.includes('Privado'));
  assert.ok(html.includes('Presupuesto para una idea'));
  assert.ok(html.includes('Inicial'));
  assert.ok(html.includes('Emprendimiento'));
  assert.ok(html.includes('#/profile/edit'));
  assert.ok(html.includes('#/profile/preferences'));
  assert.equal(html.includes('Enviar solicitud de contacto'), false);
});

test('profile renderer escapes every user text and never renders unsafe links', () => {
  const V = views(); const state = C.createState(); const p = state.profile;
  const attack = '<img src=x onerror="alert(1)">';
  p.displayName = attack; p.career = attack; p.bio = attack;
  p.projects[0] = { id: 'quoted"id', title: attack, description: attack, role: attack, tags: [attack], url: 'javascript:alert(1)' };
  p.skills[0].name = attack; p.contact.portfolio = 'javascript:alert(1)';
  const html = V.preview({ profile: p, preferences: state.pulsePreferences });
  assert.equal(html.includes(attack), false);
  assert.ok(html.includes(C.escapeHTML(attack)));
  assert.equal(html.includes('href="javascript:'), false);
  const editor = V.editor({ draft: p, errors: { 'projects.0.title': 'Escribe un título.' } });
  assert.equal(editor.includes(attack), false);
  assert.ok(editor.includes('aria-invalid="true"'));
  assert.ok(editor.includes('Escribe un título.'));
});

test('editor has labeled identity, projects, skill levels and field visibility controls', () => {
  const V = views(); const state = C.createState();
  const html = V.editor({ draft: C.beginProfileDraft(state), errors: {} });
  for (const id of ['profile-name', 'profile-career', 'profile-semester', 'profile-bio', 'profile-interests', 'profile-email', 'profile-phone', 'profile-linkedin', 'profile-portfolio']) {
    assert.ok(html.includes('id="' + id + '"'), id);
    assert.ok(html.includes('for="' + id + '"'), id + ' label');
  }
  for (const label of ['Guardar perfil', 'Cancelar', 'Añadir proyecto', 'Añadir habilidad', 'Avanzado', 'Mostrar mi perfil en Talent', 'Abierta a colaborar']) assert.ok(html.includes(label), label);
  assert.ok(html.includes('data-profile-field="contactVisibility.email"'));
  assert.ok(html.includes('data-profile-field="projects.0.title"'));
});

test('preferences exposes topics, enabling, accessible section order and visibility controls', () => {
  const V = views(); const state = C.createState();
  const html = V.preferences({ draft: C.beginPreferencesDraft(state) });
  for (const topic of C.topicTaxonomy) assert.ok(html.includes('value="' + topic.id + '"'), topic.id);
  assert.ok(html.includes('Guardar preferencias'));
  assert.ok(html.includes('Elige los temas que te interesan'));
  for (const section of C.pulseSections) {
    assert.ok(html.includes('data-dashboard-section=\"' + section.id + '\"'));
    assert.ok(html.includes('name=\"sectionVisibility.' + section.id + '\"'));
    assert.ok(html.includes('Subir ' + section.label));
    assert.ok(html.includes('Bajar ' + section.label));
  }
  assert.ok(html.includes('Restaurar secciones'));
});

test('returning to an incomplete project draft retains inline errors without a submitted form', () => {
  const V = views(); const state = C.createState(); C.addProfileRow(state, 'projects');
  const html = V.editor({ draft: state.drafts.profile, errors: {} });
  const input = html.match(/<input[^>]*id="profile-project-1-title"[^>]*>/)?.[0];
  assert.ok(input, 'incomplete staged project has a title input');
  assert.ok(input.includes('aria-invalid="true"'));
  assert.ok(input.includes('aria-describedby="profile-project-1-title-error"'));
  assert.ok(html.includes('id="profile-project-1-title-error"'));
  assert.ok(html.includes('Escribe un título para el proyecto o elimina esta fila.'));
});
