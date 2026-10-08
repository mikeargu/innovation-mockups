(function () {
  'use strict';
  const D = window.TecData;
  const C = window.TecState;
  const state = C.createState();
  const U = window.TecUI;
  const V = window.TecProfileView;
  const P = window.TecPulseView;
  const PA = window.TecPulseActionsView;
  const K = window.TecCalendar;
  const T = window.TecTalentView;
  const AI = window.TecDemoAI;
  const M = window.TecMentorView;
  const mentorContext = () => ({ state, mentors: D.mentors, route, errors });
  // Safari can start a Blob download after a zero-delay revoke has already invalidated the URL.
  const DOWNLOAD_REVOKE_DELAY_MS = 1000;
  const pulseContext = () => ({ state, items: D.pulse, route });
  const e = U.e;
  const app = document.getElementById('app');
  const media = window.matchMedia('(min-width: 1024px)');
  const sections = {
    pulse: { name: 'Campus Pulse', short: 'Pulse', icon: 'space_dashboard', hint: 'La vida del campus' },
    talent: { name: 'Talent Network', short: 'Talent', icon: 'diversity_3', hint: 'Personas para crear contigo' },
    mentor: { name: 'Mentor Match', short: 'Mentor', icon: 'school', hint: 'Otra mirada para avanzar' }
  };
  let route = null;
  let errors = {};
  let toastTimer;
  let restoring = false;
  let restoreVersion = 0;
  const { icon, tags, avatar } = U;
  const getPeople = () => C.getPeople(state, D.people);
  const sectionMetadata = () => sections[route.section] || { name: 'Mi perfil' };
  const pendingBadge = () => `<span class="status pending">${icon('schedule')}Pendiente de aceptación</span>`;
  const wordmark = () => `<a class="wordmark" href="#/pulse" aria-label="Tec Conect by CEM, inicio"><strong>Tec <span>Conect</span><i aria-hidden="true"></i></strong><small>by CEM</small></a>`;

  function announce(message, toast = false) {
    document.getElementById('live').textContent = '';
    requestAnimationFrame(() => { document.getElementById('live').textContent = message; });
    if (toast) {
      const element = document.getElementById('toast');
      element.innerHTML = `${icon('check_circle')}<span>${e(message)}</span>`;
      element.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { element.hidden = true; }, 4200);
    }
  }

  function savePosition() {
    if (!route || restoring) return;
    const key = route.section;
    const positions = state.positions[key] || (state.positions[key] = { windowY: 0, listY: 0, detailY: 0 });
    if (route.view === 'browse') positions.windowY = window.scrollY;
    else positions.detailY = window.scrollY;
    const list = document.querySelector('.directory-scroll');
    if (list && media.matches) positions.listY = list.scrollTop;
  }

  function restorePosition(options = {}) {
    restoring = true;
    const version = ++restoreVersion;
    requestAnimationFrame(() => {
      if (version !== restoreVersion) return;
      const positions = state.positions[route.section] || {};
      const list = document.querySelector('.directory-scroll');
      if (list && media.matches) list.scrollTop = positions.listY || 0;
      const y = options.keepY != null ? options.keepY : route.view === 'browse' ? (positions.windowY || 0) : options.sameDetail ? (positions.detailY || 0) : 0;
      window.scrollTo(0, y);
      if (options.afterRestore) options.afterRestore();
      requestAnimationFrame(() => { if (version === restoreVersion) restoring = false; });
    });
  }

  function scrollBelowHeader(element) {
    const headerHeight = document.querySelector('.topbar').getBoundingClientRect().height;
    window.scrollTo(0, Math.max(0, window.scrollY + element.getBoundingClientRect().top - headerHeight - 24));
  }

  function shell(content) {
    const s = sectionMetadata();
    const profileName = state.profile.displayName;
    const profileInitials = C.initials(profileName);
    const nav = Object.entries(sections).map(([key, item]) => `<a class="nav-link ${key === route.section ? 'active' : ''}" href="#/${key}"${key === route.section ? ' aria-current="page"' : ''}>${icon(item.icon)}<span><strong>${item.name}</strong><small>${item.hint}</small></span></a>`).join('');
    const bottom = Object.entries(sections).map(([key, item]) => `<a href="#/${key}" class="${key === route.section ? 'active' : ''}"${key === route.section ? ' aria-current="page"' : ''}>${icon(item.icon)}<span>${item.name}</span></a>`).join('');
    return `<div class="app-shell ${route.section}">
      <aside class="sidebar" aria-label="Navegación principal">
        ${wordmark()}
        <p class="sidebar-kicker">TU COMUNIDAD, CONECTADA</p>
        <nav>${nav}</nav>
        <div class="sidebar-note">${icon('hub')}<p>Las buenas ideas<br>empiezan con personas.</p></div>
        <div class="sidebar-footer"><a class="account" href="#/profile" aria-label="Mi perfil"><span class="avatar account-avatar" aria-hidden="true">${e(profileInitials)}</span><div><strong>${e(profileName)}</strong><small>Estudiante · cuenta ficticia</small></div></a><button type="button" class="reset-button" data-action="reset">${icon('restart_alt')}Reiniciar demo</button></div>
      </aside>
      <div class="workspace">
        <header class="topbar"><div class="mobile-brand">${wordmark()}</div><span class="desktop-context">Campus Estado de México <span aria-hidden="true">/</span> <strong>${s.name}</strong></span><div class="topbar-right"><span class="concept-chip">${icon('science')}Concepto · datos ficticios</span><button class="mobile-reset icon-button" type="button" data-action="reset" aria-label="Reiniciar demo" title="Reiniciar demo">${icon('restart_alt')}</button><a class="mobile-profile icon-button" href="#/profile" aria-label="Mi perfil" title="Mi perfil"><span class="avatar account-avatar" aria-hidden="true">${e(profileInitials)}</span></a><a class="top-account" href="#/profile" aria-label="Mi perfil"><span>Hola, ${e(profileName.split(/\s+/)[0])}</span><span class="avatar account-avatar" aria-hidden="true">${e(profileInitials)}</span></a></div></header>
        <main id="main" tabindex="-1" class="main-content ${route.view !== 'browse' ? 'is-detail' : ''}">${content}</main>
        <footer class="page-footer"><span>Tec Conect by CEM · propuesta estudiantil · nombre de trabajo sujeto a revisión institucional</span><span>Una demo para imaginar conexiones.</span><button class="footer-reset" type="button" data-action="reset">${icon('restart_alt')}Reiniciar demo</button></footer>
      </div>
      <nav class="bottomnav" aria-label="Navegación principal">${bottom}</nav>
    </div>`;
  }

  function pageTitle(section) {
    const titles = {
      pulse: ['La vida del campus empieza aquí.', 'Descubre encuentros, ideas y oportunidades para ser parte.'],
      talent: ['Tu próxima idea necesita otra mirada.', 'Encuentra personas, habilidades y proyectos para colaborar.'],
      mentor: ['Tu meta, con un camino para explorar.', 'Conecta tu objetivo con materias, profesores y opciones. Tu red de apoyo está debajo.']
    };
    return `<div class="page-title"><div><span class="eyebrow">${sections[section].name}</span><h1>${titles[section][0]}</h1><p>${titles[section][1]}</p></div><span class="date-label">${icon('today')}Martes, 6 de octubre</span></div>`;
  }

  function filters(section) {
    if (section === 'pulse') return P.filters(pulseContext());
    if (section === 'talent') {
      const skills = [...new Set(getPeople().flatMap(person => person.skills))];
      return `<div class="directory-filters"><div class="search-field">${icon('search')}<label class="sr-only" for="people-search">Buscar personas por nombre, carrera o habilidad</label><input id="people-search" type="search" placeholder="Nombre, carrera o habilidad" value="${e(state.filters.talent.search)}" autocomplete="off"><button type="button" class="clear-search icon-button" data-action="clear-search" aria-label="Borrar búsqueda"${state.filters.talent.search ? '' : ' hidden'}>${icon('close')}</button></div><div class="select-field"><label for="skill-filter">Habilidad</label><select id="skill-filter" data-filter="skill"><option value="all">Todas las habilidades</option>${skills.map(skill => `<option${skill === state.filters.talent.skill ? ' selected' : ''}>${e(skill)}</option>`).join('')}</select></div></div>`;
    }
    // The explorer lists professors only, so it offers only their topics; detail views keep every contact's topics.
    const topicSource = route.view === 'browse' ? D.mentors.filter(person => person.supportRole === 'professor') : D.mentors;
    const topics = [...new Set(topicSource.flatMap(person => person.topics))];
    return `<div class="directory-filters mentor-filters"><div class="filter-intro">${icon('explore')}¿En qué quieres avanzar?</div><div class="select-field"><label for="topic-filter">Tema de orientación</label><select id="topic-filter" data-filter="topic"><option value="all">Todos los temas</option>${topics.map(topic => `<option${topic === state.filters.mentor ? ' selected' : ''}>${e(topic)}</option>`).join('')}</select></div></div>`;
  }

  function filteredItems(section) {
    if (section === 'pulse') return C.getPulseItems(state, D.pulse);
    if (section === 'talent') return C.filterPeople(getPeople(), state.filters.talent);
    if (route.view === 'browse') return M.filteredProfessors(mentorContext());
    return C.filterMentors(D.mentors, state.filters.mentor);
  }

  function personCard(person, mentor = false, compact = false) {
    const section = mentor ? 'mentor' : 'talent';
    const request = mentor ? state.mentorRequests[person.id] : state.contacts[person.id];
    return `<article class="card person-card ${compact ? 'compact' : ''}${route.id === person.id ? ' current-card' : ''}" data-item="${person.id}"><div class="person-card-top">${avatar(person)}<div><h3><a href="#/${section}/${person.id}"${route.id === person.id ? ' aria-current="true"' : ''}>${e(person.name)}</a>${person.isSelf ? '<span class="self-profile-label">Tu perfil</span>' : ''}</h3><p class="person-career">${e(mentor ? person.role : person.career)}</p>${!mentor ? `<small class="semester">${e(person.semester)} · CEM</small>` : ''}</div></div><p class="person-bio">${e(person.bio)}</p><div class="tags">${tags(mentor ? person.topics : person.skills)}</div><div class="person-card-footer">${request ? pendingBadge() : `<span class="availability">${icon(mentor ? 'video_chat' : 'handshake')}${mentor ? 'En línea o presencial' : 'Abierta/o a colaborar'}</span>`}<a class="text-link" href="#/${section}/${person.id}">Ver perfil ${icon('arrow_forward')}</a></div></article>`;
  }

  function resultContent(section, compact = false) {
    if (section === 'pulse') return P.results(pulseContext(), compact);
    const items = filteredItems(section);
    if (section === 'mentor' && !compact) return M.explorer(mentorContext());
    const noun = section === 'talent' ? 'personas' : 'contactos';
    return `<div class="results-summary"><span><strong>${items.length}</strong> ${noun}${section === 'talent' ? ' para descubrir' : ''}</span><span class="declared-note">${icon('info')}Perfiles ficticios</span></div><div class="cards-grid ${compact ? 'compact-grid' : ''}">${items.length ? items.map(item => personCard(item, section === 'mentor', compact)).join('') : `<div class="empty-state">${icon('search_off')}<h3>No encontramos coincidencias.</h3><p>Prueba otra palabra o explora todas las habilidades.</p><button type="button" class="button secondary" data-action="clear-filters">Limpiar filtros</button></div>`}</div>`;
  }

  function browse(section) {
    if (section === 'pulse') return P.browse(pulseContext(), { pageTitle });
    if (section === 'mentor') return M.browse(mentorContext(), { pageTitle, filters: () => filters('mentor') });
    return `${pageTitle(section)}<div class="community-note">${icon(section === 'talent' ? 'handshake' : 'forum')}<div><strong>${section === 'talent' ? 'El primer paso es presentarte.' : 'Tu objetivo guía la conversación.'}</strong><span>${section === 'talent' ? 'Conoce su trabajo y envía una solicitud. Cada persona decide si acepta.' : 'Conoce su experiencia y cuéntale qué quieres trabajar. La solicitud espera su aceptación.'}</span></div></div>${section === 'talent' ? T.assistant({ state, people: getPeople(), errors }) : ''}<section class="browse-section" aria-label="${sections[section].name}"><div class="section-heading"><h2${section === 'talent' ? ' id="directory-heading" tabindex="-1"' : ''}>${section === 'talent' ? 'Personas para descubrir' : 'Mentores con distintas perspectivas'}</h2></div>${filters(section)}<div id="results">${resultContent(section)}</div></section>`;
  }

  function backLink(section, profile = false) {
    return `<a class="back-link" href="#/${section}${profile ? '/' + route.id : ''}">${icon('arrow_back')}${profile ? 'Volver al perfil' : section === 'pulse' ? 'Volver a Pulse' : section === 'talent' ? 'Volver a personas' : 'Volver a Mentor Match'}</a>`;
  }

  function profile(person, mentor = false) {
    const section = mentor ? 'mentor' : 'talent';
    const request = mentor ? state.mentorRequests[person.id] : state.contacts[person.id];
    return `${backLink(section)}<article class="detail-panel profile-panel"><div class="profile-banner ${person.color}"><span class="profile-banner-label">${icon(mentor ? 'school' : 'diversity_3')}${mentor ? 'Una perspectiva para tu camino' : 'Ideas que se construyen en equipo'}</span><span class="banner-orbit" aria-hidden="true"></span></div><div class="detail-body"><div class="profile-identity">${avatar(person, true)}<span class="profile-fiction">Perfil ficticio</span></div><h1>${e(person.name)}</h1><p class="profile-role">${e(mentor ? person.role : person.career)}</p>${!mentor ? `<p class="profile-semester">${e(person.semester)} · Campus Estado de México</p>` : `<p class="profile-semester">${e(person.experience)}</p>`}<p class="profile-bio">${e(person.bio)}</p>${request ? pendingBadge() : ''}<a class="button primary full-width" href="${person.isSelf ? '#/profile/edit' : `#/${section}/${person.id}/${mentor ? 'request' : 'contact'}`}">${icon(person.isSelf ? 'edit' : request ? 'schedule' : mentor ? 'forum' : 'waving_hand')}${person.isSelf ? 'Editar mi perfil' : request ? 'Ver solicitud pendiente' : mentor ? 'Solicitar orientación' : 'Enviar solicitud de contacto'}${icon('arrow_forward')}</a><p class="under-button">${person.isSelf ? 'Esta es la vista pública de tu perfil.' : request ? 'Tu solicitud ya está registrada en esta demo.' : 'El contacto empieza cuando ambas personas aceptan.'}</p>${mentor ? mentorProfileSections(person) : talentProfileSections(person)}</div></article>`;
  }

  function talentProfileSections(person) {
    return `<section class="profile-section"><div class="subsection-heading"><h2>Habilidades declaradas</h2><span class="small-label">Autoevaluación</span></div><div class="skill-list">${person.skills.map((skill, i) => `<div><span>${e(skill)}</span><span>${e(person.levels[i])}</span></div>`).join('')}</div><p class="section-note">Las habilidades son declaradas por la persona; no son certificaciones.</p></section><section class="profile-section"><h2>Su trabajo, en contexto</h2><div class="project-card"><span class="project-icon">${icon('folder_open')}</span><div><span class="eyebrow">Proyecto de ejemplo</span><h3>${e(person.project)}</h3><p>${e(person.evidence)}</p><span class="project-role">${e(person.role)}</span>${U.externalLink(person.projectURL, 'Ver proyecto')}</div></div></section>${publicContactSection(person)}<section class="profile-section"><h2>Cómo le gustaría colaborar</h2><dl class="availability-list"><div><dt>${icon('schedule')}Disponibilidad declarada</dt><dd>${e(person.availability)}</dd></div><div><dt>${icon('devices')}Modalidad</dt><dd>${e(person.modality)}</dd></div><div><dt>${icon('handshake')}Le interesa</dt><dd>${e(person.seeking)}</dd></div></dl></section>`;
  }

  function publicContactSection(person) {
    if (!person.contact || !Object.keys(person.contact).length) return '';
    const labels = { email: 'Correo electrónico', phone: 'Teléfono', linkedin: 'LinkedIn', portfolio: 'Portafolio' };
    return `<section class="profile-section public-contact"><h2>Contacto público</h2><dl class="own-contact-list">${Object.entries(person.contact).map(([key, value]) => `<div><dt>${e(labels[key])}</dt><dd>${['linkedin', 'portfolio'].includes(key) ? U.externalLink(value, value) : e(value)}</dd></div>`).join('')}</dl></section>`;
  }

  function mentorProfileSections(person) {
    return `<section class="profile-section"><h2>Temas que podemos trabajar</h2><div class="tags">${tags(person.topics)}</div><ul class="help-list">${person.help.map(item => `<li>${icon('check_circle')}${e(item)}</li>`).join('')}</ul></section><section class="profile-section"><h2>Así sería el acompañamiento</h2><p>${e(person.approach)}</p></section><section class="profile-section"><h2>Disponibilidad de ejemplo</h2><dl class="availability-list"><div><dt>${icon('event_available')}Sesiones</dt><dd>${e(person.availability)}</dd></div><div><dt>${icon('devices')}Modalidad</dt><dd>En línea o presencial</dd></div></dl><p class="section-note">La fecha y los acuerdos se definirían después de aceptar la solicitud.</p></section>`;
  }

  function requestForm(person, mentor = false) {
    const section = mentor ? 'mentor' : 'talent';
    const request = mentor ? state.mentorRequests[person.id] : state.contacts[person.id];
    if (request) return requestConfirmation(person, mentor, request);
    const draft = mentor ? state.drafts.mentor[person.id] || { goal: '', modality: '' } : { message: state.drafts.contacts[person.id] || '' };
    return `${backLink(section, true)}<section class="detail-panel form-panel"><div class="detail-body"><span class="eyebrow">${mentor ? 'Mentor Match' : 'Talent Network'}</span><h1>${mentor ? 'Dale dirección a tu próximo paso.' : 'Una colaboración empieza con un hola.'}</h1><p class="detail-intro">${mentor ? 'Comparte tu objetivo y la forma en que te gustaría conversar.' : 'Cuéntale qué te llamó la atención y qué te gustaría construir.'}</p><div class="recipient">${avatar(person)}<div><span>Solicitud para</span><strong>${e(person.name)}</strong><small>${e(mentor ? person.role : person.career)}</small></div></div><form id="request-form" data-kind="${mentor ? 'mentor' : 'contact'}" novalidate><div class="form-field"><label for="${mentor ? 'goal' : 'message'}">${mentor ? '¿Qué te gustaría trabajar?' : 'Tu mensaje'} <span class="required-label">Obligatorio</span></label><p class="field-hint" id="text-hint">${mentor ? 'Un objetivo concreto ayuda a preparar la conversación.' : 'Preséntate y explica tu interés en colaborar.'}</p><textarea id="${mentor ? 'goal' : 'message'}" name="${mentor ? 'goal' : 'message'}" rows="5" required maxlength="1200" aria-describedby="text-hint${errors[mentor ? 'goal' : 'message'] ? ' text-error' : ''}"${errors[mentor ? 'goal' : 'message'] ? ' aria-invalid="true"' : ''} placeholder="${mentor ? 'Me gustaría revisar qué materias y opciones me conviene explorar para mi meta…' : 'Hola, soy Valeria. Me gustó tu proyecto y me gustaría sumar mi experiencia en…'}">${e(mentor ? draft.goal : draft.message)}</textarea>${errors[mentor ? 'goal' : 'message'] ? `<p class="field-error" id="text-error">${icon('error')}${e(errors[mentor ? 'goal' : 'message'])}</p>` : ''}<span class="field-limit">Hasta 1,200 caracteres</span></div>${mentor ? `<fieldset class="modality-field"${errors.modality ? ' aria-describedby="modality-error"' : ''}><legend>¿Cómo prefieres conversar? <span class="required-label">Obligatorio</span></legend><div class="modality-options"><label><input type="radio" name="modality" value="online"${draft.modality === 'online' ? ' checked' : ''} required><span>${icon('videocam')}En línea</span></label><label><input type="radio" name="modality" value="presential"${draft.modality === 'presential' ? ' checked' : ''} required><span>${icon('location_on')}Presencial</span></label></div>${errors.modality ? `<p class="field-error" id="modality-error">${icon('error')}${e(errors.modality)}</p>` : ''}</fieldset>` : ''}<div class="consent-note">${icon('handshake')}<p>Tu solicitud quedará pendiente de aceptación. ${e(person.name.split(' ')[0])} decide si desea continuar la conversación.</p></div><p class="conduct-note">${icon('favorite')}Preséntate con respeto, comparte solo lo necesario y cuida el tiempo de la otra persona.</p><button type="submit" class="button primary full-width">Enviar solicitud ${icon('arrow_forward')}</button><p class="under-button">Se simula el envío dentro de esta demo.</p></form></div></section>`;
  }

  function requestConfirmation(person, mentor, request) {
    const section = mentor ? 'mentor' : 'talent';
    return `${backLink(section, true)}<section class="detail-panel confirmation-panel"><div class="detail-body"><span class="confirmation-icon">${icon('mark_email_read')}</span><span class="eyebrow">Solicitud registrada</span><h1>El primer paso ya está dado.</h1><p class="detail-intro">Tu solicitud para ${e(person.name)} quedó registrada en esta demo.</p>${pendingBadge()}<div class="request-summary"><h2>${mentor ? 'Tu objetivo' : 'Tu mensaje'}</h2><p class="user-message">${e(mentor ? request.goal : request.message)}</p>${mentor ? `<div class="summary-modality">${icon(request.modality === 'online' ? 'videocam' : 'location_on')}${request.modality === 'online' ? 'En línea' : 'Presencial'}</div>` : ''}</div><div class="consent-note">${icon('schedule')}<p>${e(person.name.split(' ')[0])} tendría que aceptar antes de iniciar el contacto. Puedes seguir explorando mientras tanto.</p></div><a class="button primary full-width" href="#/${section}">Seguir explorando ${icon('arrow_forward')}</a><p class="under-button">Una solicitud por persona durante esta demo.</p></div></section>`;
  }

  function detailLayout(section) {
    const entity = (section === 'pulse' ? D.pulse : section === 'talent' ? getPeople() : D.mentors).find(item => item.id === route.id);
    const pulseContent = () => route.view === 'register' ? PA.register(pulseContext()) : route.view === 'apply' ? PA.apply({ ...pulseContext(), errors }) : P.detail(entity, pulseContext());
    const content = section === 'pulse' ? pulseContent() : route.view === 'detail' ? profile(entity, section === 'mentor') : requestForm(entity, section === 'mentor');
    return `<div class="detail-layout"><aside class="directory-panel" aria-label="${section === 'pulse' ? 'Más publicaciones' : section === 'talent' ? 'Directorio de personas' : 'Red de apoyo y profesores'}"><div class="directory-panel-heading"><span class="eyebrow">${sections[section].name}</span><h2>${section === 'pulse' ? 'Sigue explorando' : section === 'talent' ? 'Personas para crear' : 'Tu red de apoyo'}</h2></div>${filters(section)}<div class="directory-scroll" tabindex="0" aria-label="Lista desplazable"><div id="results">${resultContent(section, true)}</div></div></aside><div class="selected-content">${content}</div></div>`;
  }

  function syncDrafts() {
    const form = document.getElementById('profile-form');
    if (form && state.drafts.profile) {
      const draft = state.drafts.profile;
      form.querySelectorAll('[data-profile-field]').forEach(field => {
        const parts = field.dataset.profileField.split('.');
        let owner = draft;
        parts.slice(0, -1).forEach(part => { owner = owner[part]; });
        let value = field.type === 'checkbox' ? field.checked : field.value;
        owner[parts.at(-1)] = value;
      });
    }
    const preferences = document.getElementById('preferences-form');
    if (preferences && state.drafts.preferences) {
      state.drafts.preferences.topicsByCategory = Object.fromEntries(C.PULSE_GROUPS.map(group => [group, [...preferences.querySelectorAll(`input[name="topics-${group}"]:checked`)].map(field => field.value)]));
      state.drafts.preferences.enabled = preferences.querySelector('[name="enabled"]').checked;
      preferences.querySelectorAll('[data-section-visibility]').forEach(field => { state.drafts.preferences.sectionVisibility[field.dataset.sectionVisibility] = field.checked; });
    }
  }

  function clearResolvedFieldError(field) {
    if (!field.dataset.profileField || !state.drafts.profile) return;
    const key = field.dataset.profileField;
    const validation = C.validateProfile(state.drafts.profile);
    if (validation.errors[key]) return;
    delete errors[key];
    field.removeAttribute('aria-invalid');
    const error = document.getElementById(field.id + '-error');
    if (error) error.remove();
    const descriptions = (field.getAttribute('aria-describedby') || '').split(' ').filter(id => id && id !== field.id + '-error');
    if (descriptions.length) field.setAttribute('aria-describedby', descriptions.join(' ')); else field.removeAttribute('aria-describedby');
  }

  function ownProfileContent() {
    if (route.view === 'edit') return V.editor({ draft: C.beginProfileDraft(state), errors });
    if (route.view === 'preferences') return V.preferences({ draft: C.beginPreferencesDraft(state), career: state.profile.career });
    return V.preview({ profile: state.profile, preferences: state.pulsePreferences });
  }

  function render(options = {}) {
    if (!options.skipDraftSync) syncDrafts();
    if (route.section === 'talent') C.reconcileTalentSkillFilter(state, getPeople());
    const active = document.activeElement;
    const focusID = options.preserveFocus && active ? active.id : '';
    const caret = active && typeof active.selectionStart === 'number' ? active.selectionStart : null;
    const caretEnd = active && typeof active.selectionEnd === 'number' ? active.selectionEnd : caret;
    app.innerHTML = shell(route.section === 'profile' ? ownProfileContent() : route.view === 'browse' ? browse(route.section) : route.view === 'plan' ? M.plan(mentorContext()) : detailLayout(route.section));
    document.title = `Tec Conect by CEM · ${sectionMetadata().name}`;
    restorePosition(options);
    if (focusID) {
      const input = document.getElementById(focusID);
      if (input) { input.focus({ preventScroll: true }); if (caret != null && input.setSelectionRange && input.type !== 'search') input.setSelectionRange(caret, caretEnd); }
    }
    const list = document.querySelector('.directory-scroll');
    if (list) list.addEventListener('scroll', savePosition, { passive: true });
  }

  function onRoute() {
    syncDrafts();
    savePosition();
    const previous = route;
    const next = C.resolveRoute(location.hash, D, state);
    if (!next.valid) {
      history.replaceState(null, '', '#/pulse');
      announce('Esta vista no existe. Volviste a Campus Pulse.', true);
    } else if (!location.hash || location.hash === '#' || location.hash === '#/') history.replaceState(null, '', '#/pulse');
    route = next.valid ? next : { section: 'pulse', view: 'browse', valid: true };
    errors = {};
    render({ sameDetail: !!(previous && previous.id === route.id && previous.view === route.view && previous.section === route.section) });
    if (previous) {
      const heading = document.querySelector('.selected-content h1, .page-title h1');
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
    }
  }

  function updateResults() {
    const list = document.querySelector('.directory-scroll');
    const currentY = list ? list.scrollTop : window.scrollY;
    document.getElementById('results').innerHTML = resultContent(route.section, route.view !== 'browse');
    if (list) list.scrollTop = currentY;
    const noun = route.section === 'pulse' ? 'publicaciones encontradas' : route.section === 'talent' ? 'personas encontradas' : route.view === 'browse' ? 'profesores encontrados' : 'contactos encontrados';
    announce(`${filteredItems(route.section).length} ${noun}.`);
  }

  app.addEventListener('click', event => {
    const save = event.target.closest('[data-save]');
    if (save) {
      savePosition();
      const focusID = save.id;
      const savedContext = save.dataset.saveContext;
      const saved = C.toggleSaved(state, save.dataset.save);
      render({ keepY: window.scrollY, preserveFocus: true });
      const replacement = document.getElementById(focusID);
      const fallback = savedContext === 'dashboard-saved' ? document.getElementById('widget-saved-heading') : document.getElementById('pulse-filter-saved');
      if (replacement || fallback) (replacement || fallback).focus({ preventScroll: true });
      announce(saved ? 'Publicación guardada.' : 'Publicación quitada de guardados.', true);
      return;
    }
    const mode = event.target.closest('[data-pulse-mode]');
    if (mode && !mode.disabled) {
      state.pulseMode = mode.dataset.pulseMode;
      render({ keepY: window.scrollY, preserveFocus: true });
      announce(state.pulseMode === 'forYou' ? 'Contenido para ti: tus temas aparecen primero.' : 'Todo el campus en su orden general.');
      return;
    }
    const filter = event.target.closest('button[data-filter="pulse"]');
    if (filter) {
      const fromWidget = !!filter.closest('.pulse-widget');
      state.filters.pulse = filter.dataset.value;
      app.querySelectorAll('.filter-pills button[data-filter="pulse"]').forEach(button => { const selected = button.dataset.value === state.filters.pulse; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected)); });
      updateResults();
      const current = document.getElementById('pulse-filter-' + state.filters.pulse);
      if (fromWidget) {
        requestAnimationFrame(() => {
          const context = document.querySelector('.pulse-browse .filter-pills');
          const header = document.querySelector('.topbar');
          if (context && header) window.scrollTo(0, Math.max(0, window.scrollY + context.getBoundingClientRect().top - header.getBoundingClientRect().height - 16));
          if (current) current.focus({ preventScroll: true });
        });
      } else if (current) current.focus({ preventScroll: true });
      return;
    }
    const action = event.target.closest('[data-action]');
    if (!action) return;
    if (action.dataset.action === 'move-preference-section') {
      syncDrafts();
      C.movePreferencesSection(state, action.dataset.sectionId, Number(action.dataset.direction));
      const focusID = action.id;
      render({ keepY: window.scrollY, skipDraftSync: true, afterRestore: () => {
        const control = document.getElementById(focusID);
        const fallback = document.getElementById('preference-section-' + action.dataset.sectionId);
        if (control && !control.disabled) control.focus({ preventScroll: true }); else if (fallback) fallback.focus({ preventScroll: true });
      } });
      announce('Orden de secciones actualizado en el borrador. Guarda para aplicarlo.');
      return;
    }
    if (action.dataset.action === 'restore-pulse-sections' || action.dataset.action === 'restore-preference-sections') {
      syncDrafts();
      const draftOnly = action.dataset.action === 'restore-preference-sections';
      C.restorePulseSections(state, draftOnly);
      render({ keepY: window.scrollY, skipDraftSync: true, afterRestore: () => {
        const control = draftOnly ? document.querySelector('[data-action="restore-preference-sections"]') : document.querySelector('.pulse-customize');
        if (control) control.focus({ preventScroll: true });
      } });
      announce(draftOnly ? 'Secciones restauradas en el borrador. Guarda para aplicarlo.' : 'Secciones del dashboard restauradas.', true);
      return;
    }

    if (['add-skill', 'add-project', 'remove-skill', 'remove-project'].includes(action.dataset.action)) {
      syncDrafts();
      const collection = action.dataset.action.includes('skill') ? 'skills' : 'projects';
      const adding = action.dataset.action.startsWith('add-');
      let focusID;
      if (adding) {
        C.addProfileRow(state, collection);
        const index = state.drafts.profile[collection].length - 1;
        const key = collection + '.' + index + (collection === 'skills' ? '.name' : '.title');
        errors[key] = collection === 'skills' ? 'Escribe el nombre de la habilidad o elimina esta fila.' : 'Escribe un título para el proyecto o elimina esta fila.';
        focusID = 'profile-' + (collection === 'skills' ? 'skill-' : 'project-') + index + (collection === 'skills' ? '-name' : '-title');
      } else {
        C.removeProfileRow(state, collection, action.dataset.rowId);
        errors = {};
        focusID = collection === 'skills' ? 'add-skill' : 'add-project';
      }
      render({ keepY: window.scrollY, skipDraftSync: true, afterRestore: () => {
        const field = document.getElementById(focusID);
        if (field) { field.focus({ preventScroll: true }); field.scrollIntoView({ block: 'nearest' }); }
      } });
      announce(adding ? (collection === 'skills' ? 'Completa la nueva habilidad.' : 'Completa el nuevo proyecto.') : 'Fila eliminada del borrador.');
      return;
    }
    if (action.dataset.action === 'add-calendar') {
      const item = D.pulse.find(candidate => candidate.id === action.dataset.itemId);
      const ics = K.buildICS(item);
      if (!ics) return;
      const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url; link.download = K.fileName(item);
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), DOWNLOAD_REVOKE_DELAY_MS);
      announce('Se descargó un archivo .ics de ejemplo. Agregarlo al calendario no te registra en la actividad.', true);
      return;
    }
    if (action.dataset.action === 'assistant-chip') {
      const scenario = AI.talentScenarios.find(candidate => candidate.id === action.dataset.scenario);
      if (!scenario) return;
      C.setTalentAssistantQuery(state, scenario.prompt);
      errors = {};
      render({ keepY: window.scrollY, afterRestore: () => {
        const field = document.getElementById('assistant-query');
        if (field) { field.focus({ preventScroll: true }); scrollBelowHeader(field); }
      } });
      announce('Consulta de ejemplo añadida. Pulsa Encontrar mi equipo para ver la respuesta.');
      return;
    }
    if (action.dataset.action === 'explore-skill') {
      if (!C.exploreTalentSkill(state, getPeople(), action.dataset.skill)) return;
      errors = {};
      render({ keepY: window.scrollY, afterRestore: () => {
        const heading = document.getElementById('directory-heading');
        if (heading) { scrollBelowHeader(heading); heading.focus({ preventScroll: true }); }
      } });
      announce(`Directorio filtrado por ${action.dataset.skill}.`);
      return;
    }
    if (action.dataset.action === 'career-chip') {
      const scenario = AI.careerScenarios.find(candidate => candidate.id === action.dataset.scenario);
      if (!scenario) return;
      C.setCareerGoal(state, scenario.prompt);
      errors = {};
      render({ keepY: window.scrollY, afterRestore: () => {
        const field = document.getElementById('career-goal');
        if (field) { field.focus({ preventScroll: true }); scrollBelowHeader(field); }
      } });
      announce('Meta de ejemplo añadida. Pulsa Explorar mi ruta para ver la ruta.');
      return;
    }
    if (action.dataset.action === 'toggle-pin') {
      const person = D.mentors.find(candidate => candidate.id === action.dataset.person);
      if (!person) return;
      const wasPinned = state.pinnedSupportIds.includes(person.id);
      const result = wasPinned ? C.unpinSupport(state, D.mentors, person.id) : C.pinSupport(state, D.mentors, person.id);
      if (!result.ok) return;
      const focusID = action.id;
      render({ keepY: window.scrollY, afterRestore: () => {
        const control = document.getElementById(focusID) || document.getElementById('pinned-heading');
        if (control) control.focus({ preventScroll: true });
      } });
      announce(wasPinned ? `Quitaste a ${person.name} de tu red de apoyo.` : `Fijaste a ${person.name} en tu red de apoyo.`, true);
      return;
    }
    if (action.dataset.action === 'select-alternative') {
      if (!C.selectCareerAlternative(state, action.dataset.alternative)) return;
      const focusID = action.id;
      render({ keepY: window.scrollY, afterRestore: () => {
        const control = document.getElementById(focusID);
        if (control) control.focus({ preventScroll: true });
      } });
      const option = state.careerAssistant.result.alternatives.find(candidate => candidate.id === action.dataset.alternative);
      announce(`Exploras la opción ${option.label}. Ambas opciones siguen disponibles.`);
      return;
    }
    if (action.dataset.action === 'cancel-profile' || action.dataset.action === 'cancel-preferences') {
      const profile = action.dataset.action === 'cancel-profile';
      if (profile) C.cancelProfileDraft(state); else C.cancelPreferencesDraft(state);
      history.replaceState(null, '', '#/profile'); onRoute();
      announce(profile ? 'Cambios de perfil descartados.' : 'Cambios de preferencias descartados.', true);
      return;
    }
    if (action.dataset.action === 'reset') {
      C.resetState(state); errors = {}; route = null;
      history.replaceState(null, '', '#/pulse'); onRoute();
      announce('Demo reiniciada. Se restauró el perfil de ejemplo y se borraron guardados, solicitudes, registros, postulaciones, borradores y filtros.', true);
      // The clicked reset button no longer exists; give keyboard users a defined place to continue.
      const heading = document.querySelector('.page-title h1');
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
      return;
    }
    if (action.dataset.action === 'clear-search') {
      state.filters.talent.search = '';
      const field = document.getElementById('people-search'); field.value = ''; action.hidden = true; field.focus(); updateResults();
    }
    if (action.dataset.action === 'clear-filters') {
      if (route.section === 'talent') state.filters.talent = { search: '', skill: 'all' };
      else state.filters[route.section] = 'all';
      savePosition(); render({ keepY: window.scrollY });
      const filterControl = document.querySelector(route.section === 'talent' ? '#people-search' : route.section === 'mentor' ? '#topic-filter' : '[data-filter="pulse"][aria-pressed="true"]');
      if (filterControl) filterControl.focus({ preventScroll: true });
      announce('Filtros limpiados.');
    }
  });

  app.addEventListener('input', event => {
    if (event.target.closest('#profile-form, #preferences-form')) { syncDrafts(); clearResolvedFieldError(event.target); }
    if (event.target.id === 'people-search') {
      state.filters.talent.search = event.target.value;
      document.querySelector('.clear-search').hidden = !event.target.value;
      updateResults();
    }
    if (event.target.id === 'message') state.drafts.contacts[route.id] = event.target.value;
    if (event.target.id === 'interest') state.drafts.applications[route.id] = event.target.value;
    if (event.target.id === 'assistant-query') C.setTalentAssistantQuery(state, event.target.value);
    if (event.target.id === 'career-goal') C.setCareerGoal(state, event.target.value);
    if (event.target.id === 'goal') {
      const draft = state.drafts.mentor[route.id] || (state.drafts.mentor[route.id] = { goal: '', modality: '' });
      draft.goal = event.target.value;
    }
  });

  app.addEventListener('change', event => {
    if (event.target.closest('#profile-form, #preferences-form')) { syncDrafts(); clearResolvedFieldError(event.target); }
    if (event.target.dataset.filter === 'skill') { state.filters.talent.skill = event.target.value; updateResults(); }
    if (event.target.dataset.filter === 'topic') { state.filters.mentor = event.target.value; updateResults(); }
    if (event.target.name === 'modality') {
      const draft = state.drafts.mentor[route.id] || (state.drafts.mentor[route.id] = { goal: '', modality: '' });
      draft.modality = event.target.value;
    }
  });

  app.addEventListener('submit', event => {
    if (event.target.id === 'profile-form' || event.target.id === 'preferences-form') {
      event.preventDefault(); syncDrafts();
      const isProfile = event.target.id === 'profile-form';
      const result = isProfile ? C.saveProfile(state) : C.savePreferences(state);
      errors = result.errors || {};
      if (result.ok) {
        history.replaceState(null, '', '#/profile'); onRoute();
        announce(isProfile ? 'Perfil guardado.' : 'Preferencias guardadas.', true);
      } else {
        render({ keepY: window.scrollY, afterRestore: () => {
          const invalid = app.querySelector('[aria-invalid="true"]');
          if (invalid) {
            invalid.focus({ preventScroll: true });
            const headerHeight = document.querySelector('.topbar').getBoundingClientRect().height;
            window.scrollTo(0, Math.max(0, window.scrollY + invalid.getBoundingClientRect().top - headerHeight - 24));
          }
        } });
        announce('Revisa los campos del perfil: ' + Object.values(errors).join(' '));
      }
      return;
    }
    if (event.target.id === 'career-form') {
      event.preventDefault(); savePosition();
      const result = C.submitCareerAssistant(state, AI.planCareer, new FormData(event.target).get('goal'));
      errors = result.errors || {};
      if (result.ok && state.careerAssistant.result.status === 'matched') {
        location.hash = '#/mentor/plan';
        announce('Ruta de ejemplo lista: etapas, materias, profesores y opciones.', true);
        return;
      }
      render({ keepY: window.scrollY, afterRestore: () => {
        const target = document.getElementById(result.ok ? 'career-result-heading' : 'career-goal');
        if (target) { target.focus({ preventScroll: true }); scrollBelowHeader(target); }
      } });
      announce(result.ok ? 'No tenemos un ejemplo de orientación para esa meta. Usa el ejemplo disponible.' : 'Revisa el campo obligatorio: ' + Object.values(errors).join(' '));
      return;
    }
    if (event.target.id === 'assistant-form') {
      event.preventDefault(); savePosition();
      const result = C.submitTalentAssistant(state, getPeople(), AI.matchTeam, new FormData(event.target).get('query'));
      errors = result.errors || {};
      render({ keepY: window.scrollY, afterRestore: () => {
        const target = document.getElementById(result.ok ? 'assistant-result-heading' : 'assistant-query');
        if (target) { target.focus({ preventScroll: true }); scrollBelowHeader(target); }
      } });
      if (!result.ok) {
        announce('Revisa el campo obligatorio: ' + Object.values(errors).join(' '));
        return;
      }
      const answer = state.talentAssistant.result;
      announce(answer.status === 'matched' ? `Respuesta de ejemplo: ${answer.roles.length} roles con personas para descubrir.` : 'No tenemos una respuesta de ejemplo para esa consulta. Elige una de las situaciones disponibles.', true);
      return;
    }
    if (event.target.id === 'register-form' || event.target.id === 'apply-form') {
      event.preventDefault(); savePosition();
      const applying = event.target.id === 'apply-form';
      const result = applying ? C.applyToInternship(state, D.pulse, route.id, new FormData(event.target).get('interest')) : C.registerForEvent(state, D.pulse, route.id);
      errors = result.errors || {};
      render({ keepY: result.ok || result.reason === 'duplicate' ? 0 : window.scrollY });
      if (!result.ok && result.reason === 'invalid') {
        const invalid = document.querySelector('[aria-invalid="true"]');
        if (invalid) {
          invalid.focus({ preventScroll: true });
          const headerHeight = document.querySelector('.topbar').getBoundingClientRect().height;
          window.scrollTo(0, Math.max(0, window.scrollY + invalid.getBoundingClientRect().top - headerHeight - 24));
        }
        announce('Revisa el campo obligatorio: ' + Object.values(errors).join(' '));
        return;
      }
      const heading = document.querySelector('.selected-content h1');
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
      const messages = applying ? { ok: 'Postulación simulada enviada.', duplicate: 'Ya enviaste una postulación simulada para esta vacante.' } : { ok: 'Registro simulado. Puedes agregar la actividad a tu calendario.', duplicate: 'Ya tienes un registro simulado para esta actividad.' };
      announce(result.ok ? messages.ok : messages.duplicate, true);
      window.scrollTo(0, 0);
      return;
    }
    if (event.target.id !== 'request-form') return;
    event.preventDefault(); savePosition();
    const mentor = event.target.dataset.kind === 'mentor';
    const values = new FormData(event.target);
    const result = mentor ? C.submitMentor(state, route.id, values.get('goal'), values.get('modality')) : C.submitContact(state, route.id, values.get('message'));
    errors = result.errors || {};
    render({ keepY: result.ok || result.reason === 'duplicate' ? 0 : window.scrollY });
    if (!result.ok && result.reason === 'invalid') {
      const invalid = document.querySelector('[aria-invalid="true"]') || document.querySelector('input[name="modality"]');
      if (invalid) invalid.focus({ preventScroll: true });
      announce('Revisa los campos obligatorios: ' + Object.values(errors).join(' '));
    } else {
      const heading = document.querySelector('.selected-content h1');
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
      announce(result.reason === 'duplicate' ? 'Ya tienes una solicitud pendiente para esta persona.' : 'Solicitud registrada. Pendiente de aceptación.', true);
      window.scrollTo(0, 0);
    }
  });

  document.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    const main = document.getElementById('main');
    main.focus();
    main.scrollIntoView({ block: 'start' });
  });
  window.addEventListener('hashchange', onRoute);
  window.addEventListener('scroll', savePosition, { passive: true });
  // Scroll handlers already recorded the old layout. Reading a newly hidden
  // directory here would overwrite its real position with zero.
  media.addEventListener('change', () => { render({ keepY: window.scrollY, preserveFocus: true }); });
  onRoute();
})();
