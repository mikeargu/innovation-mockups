(function (root) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const C = node ? require('../state.js') : root.TecState;
  const U = node ? require('../ui.js') : root.TecUI;
  const AI = node ? require('../demo-ai.js') : root.TecDemoAI;
  const { e, icon, tags, avatar } = U;
  const exampleTag = () => `<span class="assistant-example-tag">${icon('science')}Respuesta de ejemplo</span>`;
  const pendingBadge = () => `<span class="status pending">${icon('schedule')}Pendiente de aceptación</span>`;

  function chips(items, idPrefix) {
    return `<div class="assistant-chips" role="group" aria-label="${idPrefix === 'assistant-chip' ? 'Consultas de ejemplo' : 'Situaciones disponibles'}">${items.map(item => `<button type="button" class="assistant-chip" id="${idPrefix}-${e(item.id)}" data-action="assistant-chip" data-scenario="${e(item.id)}">${e(item.label)}</button>`).join('')}</div>`;
  }

  function exploreButtons(role, directorySkills) {
    const available = role.skills.filter(skill => directorySkills.includes(skill));
    return available.length ? `<div class="assistant-explore">${available.map(skill => `<button type="button" class="button secondary" data-action="explore-skill" data-skill="${e(skill)}">${icon('search')}Explorar personas con ${e(skill)}</button>`).join('')}</div>` : '';
  }

  function personCard(person, role, state) {
    return `<article class="assistant-person" data-person="${e(person.id)}"><div class="assistant-person-top">${avatar(person)}<div><h5>${e(person.name)}</h5><p class="person-career">${e(person.career)}</p></div></div><div class="tags">${tags(person.matchedSkills)}</div><dl class="assistant-facts"><div><dt>Por qué coincide</dt><dd>${e(person.reason)}</dd></div><div><dt>Evidencia del perfil</dt><dd>${e(person.evidence)}</dd></div><div><dt>${icon('schedule')}Disponibilidad declarada</dt><dd>${e(person.availability)} · ${e(person.modality)}</dd></div></dl><div class="assistant-person-actions">${state.contacts[person.id] ? pendingBadge() : ''}<a class="text-link" href="#/talent/${e(person.id)}">Ver perfil ${icon('arrow_forward')}</a></div></article>`;
  }

  function roleSection(role, state, directorySkills) {
    return `<section class="assistant-role" aria-labelledby="assistant-role-${e(role.id)}"><h4 id="assistant-role-${e(role.id)}">${e(role.label)}</h4><p class="assistant-need">${e(role.need)}</p>${role.people.length ? `<div class="assistant-people">${role.people.map(person => personCard(person, role, state)).join('')}</div>` : `<p class="assistant-empty">${icon('info')}Aún no hay perfiles de ejemplo con estas habilidades. Puedes explorar el directorio.</p>`}${exploreButtons(role, directorySkills)}</section>`;
  }

  const answered = query => `<p class="assistant-answered"><strong>Consulta respondida:</strong> «${e(query)}»</p>`;

  function result(ctx, directorySkills) {
    const value = ctx.state.talentAssistant.result;
    if (!value || value.status === 'empty') return '';
    if (value.status === 'unrecognized') {
      return `<div id="assistant-result" class="assistant-result" data-status="unrecognized">${exampleTag()}<h3 id="assistant-result-heading" tabindex="-1">No tenemos una respuesta de ejemplo para esa consulta</h3>${answered(value.query)}<p class="assistant-note">Esta demo conoce tres situaciones. Elige una para ver cómo funcionaría; no inventamos recomendaciones para otras consultas.</p>${chips(value.suggestions, 'assistant-suggestion')}</div>`;
    }
    return `<div id="assistant-result" class="assistant-result" data-status="matched" data-scenario="${e(value.scenarioId)}">${exampleTag()}<h3 id="assistant-result-heading" tabindex="-1">Equipo sugerido: ${e(value.scenarioLabel)}</h3>${answered(value.query)}<p class="assistant-note">${e(value.note)}</p><div class="assistant-roles">${value.roles.map(role => roleSection(role, ctx.state, directorySkills)).join('')}</div></div>`;
  }

  function assistant(ctx) {
    const errors = ctx.errors || {};
    const directorySkills = [...new Set(ctx.people.filter(person => !person.isSelf).flatMap(person => person.skills))];
    const describedBy = 'assistant-query-hint' + (errors.query ? ' assistant-query-error' : '');
    return `<section class="talent-assistant" aria-labelledby="assistant-heading"><span class="eyebrow">Asistente de equipos</span><h2 id="assistant-heading">Cuéntanos qué equipo necesitas</h2><p class="assistant-intro">Describe tu proyecto y los roles que buscas. Te mostramos personas de ejemplo para empezar a conversar.</p><form id="assistant-form" novalidate><label for="assistant-query">Tu proyecto y los roles que necesitas <span class="required-label">Obligatorio</span></label><p class="field-hint" id="assistant-query-hint">Escribe con tus palabras o toca una consulta de ejemplo.</p><textarea id="assistant-query" name="query" rows="4" required maxlength="${C.TALENT_QUERY_MAX_LENGTH}" aria-describedby="${describedBy}"${errors.query ? ' aria-invalid="true"' : ''} placeholder="Estoy empezando un proyecto y necesito…">${e(ctx.state.talentAssistant.query)}</textarea>${errors.query ? `<p class="field-error" id="assistant-query-error">${icon('error')}${e(errors.query)}</p>` : ''}${chips(AI.talentScenarios, 'assistant-chip')}<button type="submit" class="button primary">${icon('groups')}Encontrar mi equipo</button></form>${result(ctx, directorySkills)}</section>`;
  }

  const api = { assistant };
  if (node) module.exports = api; else root.TecTalentView = api;
})(typeof window !== 'undefined' ? window : globalThis);
