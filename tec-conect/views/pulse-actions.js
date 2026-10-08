(function (root) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const C = node ? require('../state.js') : root.TecState;
  const U = node ? require('../ui.js') : root.TecUI;
  const { e, icon } = U;
  const itemFor = ctx => ctx.items.find(item => item.id === ctx.route.id);
  const longDate = isoDate => new Date(isoDate + 'T00:00:00Z').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const back = (item, label) => `<a class="back-link" href="#/pulse/${e(item.id)}">${icon('arrow_back')}${label}</a>`;
  // Not live regions: app.js announce() already speaks each confirmation once.
  const registeredStatus = () => `<span class="pulse-status registered">${icon('check_circle')}Registro simulado</span>`;
  const appliedStatus = () => `<span class="pulse-status applied">${icon('check_circle')}Postulación simulada enviada</span>`;

  function statusLabel(item, state) {
    if (state.registrations[item.id]) return registeredStatus();
    if (state.applications[item.id]) return appliedStatus();
    return '';
  }

  function calendarButton(item) {
    return `<button type="button" class="button secondary pulse-calendar" data-action="add-calendar" data-item-id="${e(item.id)}">${icon('event')}Agregar a mi calendario</button>`;
  }

  function detailActions(item, { state }) {
    const actions = C.pulseActions(item);
    if (actions.register) {
      const registered = state.registrations[item.id];
      return `<div class="pulse-actions" data-actions="event">${registered ? `${registeredStatus()}<a class="button secondary" href="#/pulse/${e(item.id)}/register">${icon('how_to_reg')}Ver mi registro</a>` : `<a class="button primary" href="#/pulse/${e(item.id)}/register">${icon('how_to_reg')}Registrarme</a>`}${calendarButton(item)}<p class="pulse-actions-note">Agregar a tu calendario descarga un archivo .ics de ejemplo. No te registra en la actividad.</p></div>`;
    }
    if (actions.apply) {
      const applied = state.applications[item.id];
      return `<div class="pulse-actions" data-actions="internship">${applied ? `${appliedStatus()}<a class="button secondary" href="#/pulse/${e(item.id)}/apply">${icon('assignment_turned_in')}Ver mi postulación</a>` : `<a class="button primary" href="#/pulse/${e(item.id)}/apply">${icon('send')}Postúlate</a>`}<p class="pulse-actions-note">Abrir la oferta completa no envía una postulación.</p></div>`;
    }
    return '';
  }

  function profileReview(state) {
    const profile = C.actionProfileSummary(state);
    return `<section class="profile-review" aria-labelledby="profile-review-heading"><h2 id="profile-review-heading">Tus datos del perfil</h2><dl><div><dt>Nombre</dt><dd>${e(profile.displayName)}</dd></div><div><dt>Carrera y semestre</dt><dd>${e(profile.career)} · ${e(profile.semester)}.º semestre</dd></div><div><dt>Correo de ejemplo</dt><dd>${e(profile.email || 'Sin correo en tu perfil')}</dd></div></dl><a class="text-link" href="#/profile/edit">${icon('edit')}Editar perfil</a></section>`;
  }

  function simulationNote(text) {
    return `<div class="consent-note">${icon('science')}<p>${e(text)}</p></div>`;
  }

  function registrationConfirmation(item) {
    return `${back(item, 'Volver al detalle')}<section class="detail-panel confirmation-panel"><div class="detail-body"><span class="confirmation-icon">${icon('how_to_reg')}</span><span class="eyebrow">Campus Pulse</span><h1>Registro simulado</h1><p class="detail-intro">Tu registro a «${e(item.title)}» quedó simulado en esta demo. No se envió información fuera del prototipo.</p>${registeredStatus()}<div class="event-facts"><div>${icon('calendar_month')}<span>${e(item.when)}</span></div><div>${icon('location_on')}<span>${e(item.location)}</span></div></div><div class="pulse-actions">${calendarButton(item)}<a class="button primary" href="#/pulse">Seguir explorando ${icon('arrow_forward')}</a></div><p class="under-button">Agregar al calendario es independiente del registro y de guardar la publicación.</p></div></section>`;
  }

  function register(ctx) {
    const item = itemFor(ctx);
    if (ctx.state.registrations[item.id]) return registrationConfirmation(item);
    return `${back(item, 'Volver al detalle')}<section class="detail-panel form-panel"><div class="detail-body"><span class="eyebrow">Campus Pulse</span><h1>Revisa tu registro</h1><p class="detail-intro">Confirma que tus datos son correctos antes de registrarte.</p><div class="event-facts"><div>${icon('event')}<span>${e(item.title)}</span></div><div>${icon('calendar_month')}<span>${e(item.when)}</span></div><div>${icon('location_on')}<span>${e(item.location)}</span></div></div>${profileReview(ctx.state)}${simulationNote('Esto es una simulación: el registro solo existe dentro de esta demo y desaparece al reiniciarla.')}<form id="register-form" novalidate><button type="submit" class="button primary full-width">${icon('how_to_reg')}Confirmar registro</button></form><p class="under-button">Un registro por actividad durante esta demo.</p></div></section>`;
  }

  function applicationConfirmation(item, application) {
    return `${back(item, 'Volver a la oportunidad')}<section class="detail-panel confirmation-panel"><div class="detail-body"><span class="confirmation-icon">${icon('assignment_turned_in')}</span><span class="eyebrow">Oportunidad CVDP · ejemplo</span><h1>Postulación simulada enviada</h1><p class="detail-intro">Es una simulación: tu postulación para ${e(item.role)} en ${e(item.company)} se registró el ${e(longDate(application.simulatedAt))} solo dentro de esta demo. No se envió nada a una empresa real.</p>${appliedStatus()}<div class="request-summary"><h2>Tu interés</h2><p class="user-message">${e(application.interest)}</p></div><a class="button primary full-width" href="#/pulse">Seguir explorando ${icon('arrow_forward')}</a><p class="under-button">Una postulación por vacante durante esta demo.</p></div></section>`;
  }

  function apply(ctx) {
    const item = itemFor(ctx);
    const application = ctx.state.applications[item.id];
    if (application) return applicationConfirmation(item, application);
    const errors = ctx.errors || {};
    const draft = ctx.state.drafts.applications[item.id] || '';
    const describedBy = 'interest-hint' + (errors.interest ? ' interest-error' : '');
    return `${back(item, 'Volver a la oportunidad')}<section class="detail-panel form-panel"><div class="detail-body"><span class="eyebrow">Oportunidad CVDP · ejemplo</span><h1>Postúlate a esta práctica</h1><p class="detail-intro">Revisa tu perfil y cuéntanos qué te interesa.</p><div class="event-facts"><div>${icon('work')}<span>${e(item.role)} · ${e(item.company)}</span></div><div>${icon('location_on')}<span>${e(item.location)} · ${e(item.modality)}</span></div><div>${icon('calendar_month')}<span>Cierre de ejemplo · ${e(item.deadline)}</span></div></div>${profileReview(ctx.state)}<form id="apply-form" novalidate><div class="form-field"><label for="interest">¿Qué te interesa de esta práctica? <span class="required-label">Obligatorio</span></label><p class="field-hint" id="interest-hint">Una o dos frases bastan para esta demo.</p><textarea id="interest" name="interest" rows="5" required maxlength="1200" aria-describedby="${describedBy}"${errors.interest ? ' aria-invalid="true"' : ''} placeholder="Me interesa aprender a comparar escenarios de presupuesto y explicar los resultados…">${e(draft)}</textarea>${errors.interest ? `<p class="field-error" id="interest-error">${icon('error')}${e(errors.interest)}</p>` : ''}<span class="field-limit">Hasta 1,200 caracteres</span></div>${simulationNote('Esto es una simulación: la postulación solo existe dentro de esta demo y no llega a ninguna empresa.')}<button type="submit" class="button primary full-width">${icon('send')}Confirmar postulación</button></form><p class="under-button">Una postulación por vacante durante esta demo.</p></div></section>`;
  }

  const api = { detailActions, statusLabel, register, apply };
  if (node) module.exports = api; else root.TecPulseActionsView = api;
})(typeof window !== 'undefined' ? window : globalThis);
