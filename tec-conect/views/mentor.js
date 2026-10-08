(function (root) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const C = node ? require('../state.js') : root.TecState;
  const U = node ? require('../ui.js') : root.TecUI;
  const AI = node ? require('../demo-ai.js') : root.TecDemoAI;
  const { e, icon, tags, avatar } = U;
  const ROLE_LABELS = { institutionalMentor: 'Mentoría institucional asignada', degreeDirector: 'Dirección de carrera', professor: 'Docente' };
  const pendingBadge = () => `<span class="status pending">${icon('schedule')}Pendiente de aceptación</span>`;
  const orientationTag = (text, symbol = 'science') => `<span class="orientation-tag">${icon(symbol)}${e(text)}</span>`;
  const findContact = (ctx, id) => ctx.mentors.find(person => person.id === id);

  function filteredProfessors(ctx) {
    const topic = ctx.state.filters.mentor;
    return ctx.mentors.filter(person => person.supportRole === 'professor' && (topic === 'all' || person.topics.includes(topic)));
  }

  function pinButton(person, state, context, describedBy) {
    const pinned = state.pinnedSupportIds.includes(person.id);
    // The status chip states the current state; the button label states the next action.
    return `${pinned && context !== 'network' ? `<span class="pulse-status pinned-status">${icon('push_pin')}Fijado en tu red</span>` : ''}<button type="button" id="pin-${context}-${e(person.id)}" class="button ${pinned ? 'secondary' : 'primary'} pin-button" data-action="toggle-pin" data-person="${e(person.id)}" data-pinned="${pinned}" aria-describedby="${describedBy}">${icon(pinned ? 'bookmark_remove' : 'push_pin')}<span>${pinned ? 'Quitar de mi red' : 'Fijar en mi red'}</span></button>`;
  }

  function supportCard(person, ctx, { context, pinnable = false, why = '', headingLevel = 4 }) {
    const nameId = `support-name-${context}-${e(person.id)}`;
    const request = ctx.state.mentorRequests[person.id];
    const heading = 'h' + headingLevel;
    return `<article class="support-card" data-person="${e(person.id)}"><div class="support-card-top">${avatar(person)}<div><span class="support-role-label">${e(ROLE_LABELS[person.supportRole] || '')}</span><${heading} id="${nameId}" class="support-name"><a href="#/mentor/${e(person.id)}">${e(person.name)}</a></${heading}><p class="person-career">${e(person.role)}</p></div></div>${why ? `<p class="support-why"><strong>Por qué conversar:</strong> ${e(why)}</p>` : ''}<div class="support-card-actions">${request ? pendingBadge() : `<a class="text-link" href="#/mentor/${e(person.id)}/request">Solicitar orientación ${icon('arrow_forward')}</a>`}${pinnable ? pinButton(person, ctx.state, context, nameId) : ''}</div></article>`;
  }

  function chip(scenario, prefix) {
    return `<button type="button" class="assistant-chip" id="${prefix}-${e(scenario.id)}" data-action="career-chip" data-scenario="${e(scenario.id)}">${e(scenario.label)}</button>`;
  }

  function assistantSummary(ctx) {
    const result = ctx.state.careerAssistant.result;
    if (!result || result.status === 'empty') return '';
    if (result.status === 'unrecognized') {
      return `<div class="career-summary" data-status="unrecognized">${orientationTag('Ejemplo de orientación')}<h3 id="career-result-heading" tabindex="-1">No tenemos un ejemplo de orientación para esa meta</h3><p class="assistant-answered"><strong>Meta respondida:</strong> «${e(result.goal)}»</p><p class="assistant-note">Esta demo conoce un ejemplo. Úsalo para ver cómo funcionaría; no inventamos rutas para otras metas.</p><div class="assistant-chips" role="group" aria-label="Ejemplo disponible">${result.suggestions.map(item => chip(item, 'career-suggestion')).join('')}</div></div>`;
    }
    return `<div class="career-summary" data-status="matched">${orientationTag('Ejemplo de orientación')}<h3 id="career-result-heading" tabindex="-1">Tu ruta de ejemplo está lista</h3><p class="assistant-answered"><strong>Meta respondida:</strong> «${e(result.goal)}»</p><a class="button secondary" href="#/mentor/plan">Ver mi ruta ${icon('arrow_forward')}</a></div>`;
  }

  function assistant(ctx) {
    const { careerAssistant, profile } = ctx.state;
    const errors = ctx.errors || {};
    const describedBy = 'career-goal-hint' + (errors.goal ? ' career-goal-error' : '');
    return `<section class="mentor-assistant" aria-labelledby="career-heading"><span class="eyebrow">Asistente de orientación</span><h2 id="career-heading">Conecta tu meta con un camino</h2><p class="assistant-intro">Cuéntanos qué quieres lograr. Te mostramos materias, profesores y opciones de ejemplo para conversar con tu red.</p><div class="career-context-row"><dl class="career-context"><div><dt>Carrera</dt><dd>${e(profile.career)}</dd></div><div><dt>Semestre</dt><dd>${e(profile.semester)}.º semestre</dd></div></dl><a class="text-link" href="#/profile/edit">${icon('edit')}Actualizar en mi perfil</a></div><form id="career-form" novalidate><label for="career-goal">Tu meta <span class="required-label">Obligatorio</span></label><p class="field-hint" id="career-goal-hint">Escribe con tus palabras o usa la meta de ejemplo.</p><textarea id="career-goal" name="goal" rows="4" required maxlength="${C.CAREER_GOAL_MAX_LENGTH}" aria-describedby="${describedBy}"${errors.goal ? ' aria-invalid="true"' : ''} placeholder="Al terminar mi carrera quiero…">${e(careerAssistant.goal)}</textarea>${errors.goal ? `<p class="field-error" id="career-goal-error">${icon('error')}${e(errors.goal)}</p>` : ''}<div class="assistant-chips" role="group" aria-label="Meta de ejemplo">${AI.careerScenarios.map(item => chip(item, 'career-chip')).join('')}</div><button type="submit" class="button primary">${icon('route')}Explorar mi ruta</button></form>${assistantSummary(ctx)}</section>`;
  }

  function network(ctx) {
    const { mentor, director, professors } = C.supportNetwork(ctx.state, ctx.mentors);
    return `<section class="support-network" aria-labelledby="network-heading"><div class="section-heading"><h2 id="network-heading">Tu red de apoyo</h2></div><p class="network-intro">Personas que pueden acompañar tu ruta. Los perfiles son ficticios y cada conversación empieza con una solicitud.</p><div class="network-groups"><section class="network-group" aria-labelledby="network-mentor-heading"><h3 id="network-mentor-heading">Mi mentor institucional</h3>${mentor ? supportCard(mentor, ctx, { context: 'network' }) : ''}<p class="network-note">${icon('lock')}Asignado a tu cuenta; siempre visible.</p></section><section class="network-group" aria-labelledby="network-director-heading"><h3 id="network-director-heading">Mi director de carrera</h3>${director ? supportCard(director, ctx, { context: 'network' }) : ''}</section><section class="network-group network-pinned" aria-labelledby="pinned-heading"><h3 id="pinned-heading" tabindex="-1">Profesores fijados</h3>${professors.length ? professors.map(person => supportCard(person, ctx, { context: 'network', pinnable: true })).join('') : `<p class="network-empty">${icon('push_pin')}Aún no fijas profesores. Fíjalos desde tu ruta o desde el explorador de profesores.</p>`}</section></div></section>`;
  }

  function explorerCard(person, ctx) {
    const nameId = `support-name-explorer-${e(person.id)}`;
    const request = ctx.state.mentorRequests[person.id];
    return `<article class="card person-card support-explorer-card" data-item="${e(person.id)}"><div class="person-card-top">${avatar(person)}<div><h3 id="${nameId}"><a href="#/mentor/${e(person.id)}">${e(person.name)}</a></h3><p class="person-career">${e(person.role)}</p></div></div><p class="person-bio">${e(person.bio)}</p><div class="tags">${tags(person.topics)}</div><div class="person-card-footer">${request ? pendingBadge() : `<span class="availability">${icon('schedule')}${e(person.availability)}</span>`}${pinButton(person, ctx.state, 'explorer', nameId)}</div></article>`;
  }

  function explorer(ctx) {
    const professors = filteredProfessors(ctx);
    return `<div class="results-summary"><span><strong>${professors.length}</strong> profesores</span><span class="declared-note">${icon('info')}Perfiles ficticios</span></div><div class="cards-grid">${professors.length ? professors.map(person => explorerCard(person, ctx)).join('') : `<div class="empty-state">${icon('search_off')}<h3>No hay profesores con ese tema.</h3><p>Prueba otro tema o explora todos los profesores.</p><button type="button" class="button secondary" data-action="clear-filters">Limpiar filtros</button></div>`}</div>`;
  }

  function browse(ctx, helpers) {
    return `${helpers.pageTitle('mentor')}${assistant(ctx)}${network(ctx)}<section class="browse-section support-explorer" aria-labelledby="explorer-heading"><div class="section-heading"><h2 id="explorer-heading">Explora profesores</h2><span class="section-caption">Fija en tu red a quienes quieras tener a mano.</span></div>${helpers.filters()}<div id="results">${explorer(ctx)}</div></section>`;
  }

  function alternativeCard(option, selected) {
    return `<article class="plan-card alternative-card${selected ? ' is-selected' : ''}"><h3>${e(option.label)}</h3>${selected ? `<span class="pulse-status alternative-status">${icon('check_circle')}Opción que estás explorando</span>` : ''}<dl class="alternative-facts"><div><dt>Objetivo</dt><dd>${e(option.goal)}</dd></div><div><dt>Experiencia que buscarías</dt><dd>${e(option.experience)}</dd></div></dl>${selected ? `<h4>Qué revisar con tu director</h4><ul>${option.review.map(item => `<li>${e(item)}</li>`).join('')}</ul>` : ''}<button type="button" id="alt-button-${e(option.id)}" class="button ${selected ? 'secondary' : 'primary'}" data-action="select-alternative" data-alternative="${e(option.id)}" aria-pressed="${selected}">${icon(selected ? 'check' : 'travel_explore')}Explorar esta opción</button></article>`;
  }

  function conversationCard(person, label, topics) {
    if (!person) return '';
    return `<article class="plan-card"><h3>Con ${e(person.name)} · ${e(label)}</h3><ul>${topics.map(item => `<li>${e(item)}</li>`).join('')}</ul><a class="text-link" href="#/mentor/${e(person.id)}/request">Solicitar orientación ${icon('arrow_forward')}</a></article>`;
  }

  function emptyPlan() {
    return `<a class="back-link mentor-plan-back" href="#/mentor">${icon('arrow_back')}Volver a Mentor Match</a><div class="page-title"><div><span class="eyebrow">Mentor Match</span><h1>Aún no hay una ruta</h1><p>Escribe tu meta en el asistente de Mentor Match para ver una ruta de ejemplo.</p></div></div><a class="button primary" href="#/mentor">Ir al asistente ${icon('arrow_forward')}</a>`;
  }

  function plan(ctx) {
    const { result, selectedAlternative } = ctx.state.careerAssistant;
    if (!result || result.status !== 'matched') return emptyPlan();
    const { mentor, director } = C.supportNetwork(ctx.state, ctx.mentors);
    // Career and semester come from the live profile so a later profile edit never leaves the plan stale.
    const start = { career: ctx.state.profile.career, semester: ctx.state.profile.semester, summary: result.startingPoint.summary };
    return `<a class="back-link mentor-plan-back" href="#/mentor">${icon('arrow_back')}Volver a Mentor Match</a><div class="page-title"><div><span class="eyebrow">Mentor Match · Ejemplo de orientación</span><h1>Tu ruta de ejemplo</h1><p>${e(result.scenarioLabel)}</p></div></div><p class="orientation-note">${icon('science')}${e(result.note)}</p><div class="career-plan">
<section class="plan-section" aria-labelledby="plan-start"><h2 id="plan-start">Tu meta y punto de partida</h2><dl class="career-context"><div><dt>Carrera</dt><dd>${e(start.career)}</dd></div><div><dt>Semestre</dt><dd>${e(start.semester)}.º semestre</dd></div><div><dt>Hacia dónde vas</dt><dd>${e(start.summary)}</dd></div></dl><p class="plan-goal">«${e(result.goal)}»</p></section>
<section class="plan-section" aria-labelledby="plan-route"><h2 id="plan-route">Ruta sugerida</h2><ol class="plan-stages">${result.stages.map((stage, index) => `<li class="plan-stage"><span class="plan-stage-number" aria-hidden="true">${index + 1}</span><div><h3>${e(stage.label)}</h3><p class="plan-period">${e(stage.period)}</p><ul>${stage.actions.map(action => `<li>${e(action)}</li>`).join('')}</ul></div></li>`).join('')}</ol></section>
<section class="plan-section" aria-labelledby="plan-courses"><h2 id="plan-courses">Materias para explorar</h2><div class="plan-grid">${result.courses.map(course => `<article class="plan-card">${orientationTag('Materia de ejemplo', 'menu_book')}<h3>${e(course.name)}</h3><p>${e(course.why)}</p></article>`).join('')}</div></section>
<section class="plan-section" aria-labelledby="plan-professors"><h2 id="plan-professors">Profesores para conversar</h2><div class="plan-grid">${result.professors.map(item => { const person = findContact(ctx, item.id); return person ? supportCard(person, ctx, { context: 'plan', pinnable: true, why: item.why, headingLevel: 3 }) : ''; }).join('')}</div></section>
<section class="plan-section" aria-labelledby="plan-alternatives"><h2 id="plan-alternatives">Intercambio o concentración</h2><p class="plan-hint">Ambas opciones siguen disponibles. Elige una para ver qué revisar con tu director.</p><div class="plan-grid">${result.alternatives.map(option => alternativeCard(option, option.id === selectedAlternative)).join('')}</div></section>
<section class="plan-section" aria-labelledby="plan-next"><h2 id="plan-next">Siguiente conversación</h2><div class="plan-grid">${conversationCard(mentor, 'tu mentoría institucional', result.nextConversation.mentor)}${conversationCard(director, director ? director.role : '', result.nextConversation.director)}</div></section>
</div><p class="orientation-note">${icon('info')}Esta ruta no inscribe materias, no resuelve equivalencias ni confirma un intercambio o una conversación con profesores. Para avanzar, envía una solicitud de orientación.</p>`;
  }

  const api = { browse, assistant, network, explorer, plan, filteredProfessors };
  if (node) module.exports = api; else root.TecMentorView = api;
})(typeof window !== 'undefined' ? window : globalThis);
