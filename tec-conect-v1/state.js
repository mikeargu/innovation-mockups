(function (root) {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const topicTaxonomy = [
    { id: 'finance', label: 'Finanzas' }, { id: 'ai', label: 'IA' },
    { id: 'entrepreneurship', label: 'Emprendimiento' }, { id: 'marketing', label: 'Marketing' },
    { id: 'technology', label: 'Tecnología / Desarrollo web' }, { id: 'water-sustainability', label: 'Agua / Sostenibilidad' },
    { id: 'research', label: 'Investigación' }, { id: 'communication', label: 'Comunicación / Storytelling' },
    { id: 'community', label: 'Comunidad' }, { id: 'professional-development', label: 'Desarrollo profesional / CV' },
    { id: 'health', label: 'Salud' }, { id: 'government', label: 'Gobierno' },
    { id: 'psychology', label: 'Psicología' }
  ];
  // Each Pulse category is personalised by its own group of topics (F5A).
  const PULSE_GROUPS = ['events', 'articles', 'opportunities'];
  const PULSE_GROUP_BY_CATEGORY = { events: 'events', news: 'articles', opportunities: 'opportunities' };
  const validTopics = list => [...new Set((Array.isArray(list) ? list : []).filter(id => topicTaxonomy.some(topic => topic.id === id)))];
  const normalizeTopicGroups = groups => Object.fromEntries(PULSE_GROUPS.map(group => [group, validTopics((groups || {})[group])]));
  // Converts a single shared topic list into Eventos and Artículos; reading interests never become job areas.
  function migratePulsePreferences(preferences) {
    const { topics, topicsByCategory, ...rest } = JSON.parse(JSON.stringify(preferences || {}));
    const legacy = validTopics(topics);
    return { ...rest, topicsByCategory: normalizeTopicGroups(topicsByCategory || { events: legacy, articles: legacy, opportunities: [] }) };
  }
  const pulseSections = [
    { id: 'events', category: 'events', label: 'Eventos y talleres', icon: 'event' },
    { id: 'articles', category: 'news', label: 'Artículos', icon: 'article' },
    { id: 'opportunities', category: 'opportunities', label: 'Oportunidades CVDP', icon: 'work' },
    { id: 'saved', category: 'saved', label: 'Mis guardados', icon: 'bookmark' }
  ];
  function normalizePulseLayout(preferences) {
    const ids = pulseSections.map(section => section.id);
    const requested = Array.isArray(preferences.sectionOrder) ? preferences.sectionOrder : [];
    const sectionOrder = [...new Set(requested.filter(id => ids.includes(id)))];
    ids.forEach(id => { if (!sectionOrder.includes(id)) sectionOrder.push(id); });
    const visibility = preferences.sectionVisibility || {};
    return { sectionOrder, sectionVisibility: Object.fromEntries(ids.map(id => [id, visibility[id] !== false])) };
  }
  const DEMO_DATE = '2026-10-06';
  const INTEREST_MAX_LENGTH = 1200;
  const TALENT_QUERY_MAX_LENGTH = 600;
  const CAREER_GOAL_MAX_LENGTH = 600;
  function createState() {
    return {
      saved: [], contacts: {}, mentorRequests: {}, pulseMode: 'forYou',
      drafts: { contacts: {}, mentor: {}, profile: null, preferences: null, applications: {} },
      filters: { pulse: 'all', talent: { search: '', skill: 'all' }, mentor: 'all' }, positions: {},
      profile: {
        displayName: 'Valeria Álvarez', career: 'Finanzas', semester: 1, campus: 'CEM',
        bio: 'Me interesa entender cómo una idea puede convertirse en un proyecto con recursos y decisiones claras.',
        professionalInterests: ['Finanzas', 'Emprendimiento'],
        skills: [{ id: 'skill-finance', name: 'Finanzas', level: 'Inicial' }, { id: 'skill-communication', name: 'Comunicación', level: 'Inicial' }],
        projects: [{ id: 'project-budget', title: 'Presupuesto para una idea', description: 'Ejercicio ficticio de planeación de recursos para un proyecto estudiantil.', role: 'Análisis de costos', tags: ['Finanzas'], url: '' }],
        contact: { email: 'valeria.alvarez@example.com', phone: '', linkedin: '', portfolio: '' },
        contactVisibility: { email: false, phone: false, linkedin: false, portfolio: false },
        openToCollaborate: true, discoverable: false
      },
      pulsePreferences: { topicsByCategory: { events: ['finance', 'ai', 'entrepreneurship'], articles: ['finance', 'ai', 'entrepreneurship'], opportunities: ['finance'] }, enabled: true,
        sectionOrder: ['events', 'articles', 'opportunities', 'saved'],
        sectionVisibility: { events: true, articles: true, opportunities: true, saved: true } },
      registrations: {}, applications: {}, talentAssistant: { query: '', result: null },
      careerAssistant: { goal: '', result: null, selectedAlternative: null }, assignedMentorId: 'elena-cruz', pinnedSupportIds: ['rodrigo-navarro']
    };
  }
  const text = value => String(value == null ? '' : value).trim();
  const commaValues = value => (Array.isArray(value) ? value : String(value || '').split(',')).map(text).filter(Boolean);
  function isSafeURL(value) {
    if (typeof value !== 'string' || /[\s\\]/.test(value) || !/^https?:\/\//i.test(value)) return false;
    try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !!url.hostname; }
    catch (_) { return false; }
  }
  function initials(name) { return text(name).split(/\s+/).filter(Boolean).slice(0, 2).map(part => Array.from(part)[0]).join('').toUpperCase(); }
  function beginProfileDraft(state) { return state.drafts.profile || (state.drafts.profile = clone(state.profile)); }
  function cancelProfileDraft(state) { state.drafts.profile = null; }
  function addProfileRow(state, collection) {
    if (!['skills', 'projects'].includes(collection)) return null;
    const rows = beginProfileDraft(state)[collection];
    let suffix = 1;
    while (rows.some(row => row.id === collection + '-' + suffix)) suffix++;
    const row = collection === 'skills' ? { id: collection + '-' + suffix, name: '', level: 'Inicial' } :
      { id: collection + '-' + suffix, title: '', description: '', role: '', tags: [], url: '' };
    rows.push(row); return row;
  }
  function removeProfileRow(state, collection, id) {
    if (!['skills', 'projects'].includes(collection)) return;
    const draft = beginProfileDraft(state);
    draft[collection] = draft[collection].filter(row => row.id !== id);
  }
  function validateProfile(draft) {
    const profile = clone(draft);
    const errors = {};
    profile.displayName = text(draft.displayName); profile.career = text(draft.career);
    if (!profile.displayName) errors.displayName = 'Escribe tu nombre.';
    if (!profile.career) errors.career = 'Escribe tu carrera.';
    profile.semester = Number(draft.semester);
    if (!Number.isInteger(profile.semester) || profile.semester < 1 || profile.semester > 12) errors.semester = 'Elige un semestre entero del 1 al 12.';
    profile.bio = text(draft.bio); profile.professionalInterests = commaValues(draft.professionalInterests);
    profile.openToCollaborate = !!draft.openToCollaborate; profile.discoverable = !!draft.discoverable;
    for (const key of ['email', 'phone', 'linkedin', 'portfolio']) {
      profile.contact[key] = text(draft.contact[key]); profile.contactVisibility[key] = !!draft.contactVisibility[key];
      if (key === 'email' && profile.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.contact.email)) errors['contact.email'] = 'Escribe un correo válido.';
      if (['linkedin', 'portfolio'].includes(key) && profile.contact[key] && !isSafeURL(profile.contact[key])) errors['contact.' + key] = 'Usa un enlace completo que empiece con http:// o https://.';
    }
    profile.skills.forEach((skill, index) => {
      skill.name = text(skill.name);
      if (!skill.name) errors['skills.' + index + '.name'] = 'Escribe el nombre de la habilidad o elimina esta fila.';
      if (!['Inicial', 'Intermedio', 'Avanzado'].includes(skill.level)) errors['skills.' + index + '.level'] = 'Elige un nivel válido.';
    });
    profile.projects.forEach((project, index) => {
      for (const key of ['title', 'description', 'role', 'url']) project[key] = text(project[key]);
      project.tags = commaValues(project.tags);
      if (!project.title) errors['projects.' + index + '.title'] = 'Escribe un título para el proyecto o elimina esta fila.';
      if (project.url && !isSafeURL(project.url)) errors['projects.' + index + '.url'] = 'Usa un enlace completo que empiece con http:// o https://.';
    });
    if (Object.keys(errors).length) return { ok: false, reason: 'invalid', errors };
    return { ok: true, profile, errors: {} };
  }
  function saveProfile(state) {
    const result = validateProfile(beginProfileDraft(state));
    if (!result.ok) return result;
    state.profile = result.profile; state.drafts.profile = null;
    return { ok: true };
  }
  function beginPreferencesDraft(state) { return state.drafts.preferences || (state.drafts.preferences = clone(state.pulsePreferences)); }
  function cancelPreferencesDraft(state) { state.drafts.preferences = null; }
  function savePreferences(state) {
    const draft = beginPreferencesDraft(state);
    const preferences = clone(state.pulsePreferences);
    preferences.topicsByCategory = normalizeTopicGroups(draft.topicsByCategory); preferences.enabled = !!draft.enabled;
    Object.assign(preferences, normalizePulseLayout(draft));
    state.pulsePreferences = preferences; state.drafts.preferences = null;
    return { ok: true };
  }
  function movePreferencesSection(state, id, direction) {
    const draft = beginPreferencesDraft(state);
    Object.assign(draft, normalizePulseLayout(draft));
    const index = draft.sectionOrder.indexOf(id), next = index + direction;
    if (![-1, 1].includes(direction) || index < 0 || next < 0 || next >= draft.sectionOrder.length) return false;
    [draft.sectionOrder[index], draft.sectionOrder[next]] = [draft.sectionOrder[next], draft.sectionOrder[index]];
    return true;
  }
  function restorePulseSections(state, draftOnly = false) {
    const layout = normalizePulseLayout({});
    if (draftOnly) Object.assign(beginPreferencesDraft(state), clone(layout));
    else {
      Object.assign(state.pulsePreferences, clone(layout));
      if (state.drafts.preferences) Object.assign(state.drafts.preferences, clone(layout));
    }
  }
  const groupTopics = (state, group) => validTopics((state.pulsePreferences.topicsByCategory || {})[group]);
  const hasPulseTopics = state => PULSE_GROUPS.some(group => groupTopics(state, group).length > 0);
  function effectivePulseMode(state) {
    return state.pulseMode === 'forYou' && state.pulsePreferences.enabled && hasPulseTopics(state) ? 'forYou' : 'all';
  }
  // Events and articles match their own topic group; opportunities match the role's professional
  // areas against the chosen job areas, never reading or event interests nor the company sector.
  function pulseMatchTopics(state, item) {
    if (effectivePulseMode(state) !== 'forYou') return [];
    const group = PULSE_GROUP_BY_CATEGORY[item.category];
    if (!group) return [];
    const selected = groupTopics(state, group);
    const itemTopics = group === 'opportunities' ? (item.professionalAreaIds || []) : (item.topics || []);
    return topicTaxonomy.filter(topic => selected.includes(topic.id) && itemTopics.includes(topic.id));
  }
  function getPulseItems(state, items, category = state.filters.pulse) {
    const ranked = effectivePulseMode(state) === 'forYou' ? items.map((item, index) => ({ item, index, score: pulseMatchTopics(state, item).length }))
      .sort((a, b) => b.score - a.score || a.index - b.index).map(entry => entry.item) : items.slice();
    return ranked.filter(item => category === 'all' || (category === 'saved' ? state.saved.includes(item.id) : item.category === category));
  }
  function getPulseWidgets(state, items) {
    const layout = normalizePulseLayout(state.pulsePreferences);
    const personalised = effectivePulseMode(state) === 'forYou';
    return layout.sectionOrder.filter(id => layout.sectionVisibility[id]).map(id => {
      const section = pulseSections.find(section => section.id === id);
      const list = getPulseItems(state, items, section.category);
      const group = PULSE_GROUP_BY_CATEGORY[section.category];
      if (!personalised || !group) return { ...section, items: list };
      if (!groupTopics(state, group).length) return { ...section, items: list, generalContent: true };
      if (group !== 'opportunities') return { ...section, items: list };
      // The personalised dashboard only recommends offers in the chosen job areas.
      const matching = list.filter(item => pulseMatchTopics(state, item).length > 0);
      return matching.length ? { ...section, items: matching } : { ...section, items: [], emptyReason: 'no-matching-opportunities' };
    });
  }
  function getPeople(state, people) {
    if (!state || !state.profile.discoverable || !state.profile.openToCollaborate) return people.slice();
    const p = state.profile;
    const first = p.projects[0];
    const contact = {};
    for (const key of ['email', 'phone', 'linkedin', 'portfolio']) {
      const value = p.contact[key];
      if (p.contactVisibility[key] && value && (!['linkedin', 'portfolio'].includes(key) || isSafeURL(value))) contact[key] = value;
    }
    return [...people, { id: 'self', isSelf: true, name: p.displayName, initials: initials(p.displayName), career: p.career,
      semester: p.semester + '.º semestre', bio: p.bio, skills: p.skills.map(skill => skill.name), levels: p.skills.map(skill => skill.level),
      color: 'blue', availability: 'Por definir', modality: 'Por definir', seeking: p.professionalInterests.join(', ') || 'Por definir',
      project: first ? first.title : 'Sin proyectos declarados', evidence: first ? first.description : '', role: first ? first.role : '',
      projectURL: first && isSafeURL(first.url) ? first.url : '', contact }];
  }
  const normalized = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  function submitContact(state, id, message) {
    if (state.contacts[id]) return { ok: false, reason: 'duplicate' };
    const value = String(message || '').trim();
    if (!value) return { ok: false, reason: 'invalid', errors: { message: 'Escribe un mensaje para presentarte.' } };
    state.contacts[id] = { message: value, status: 'pending' };
    return { ok: true };
  }
  function submitMentor(state, id, goal, modality) {
    if (state.mentorRequests[id]) return { ok: false, reason: 'duplicate' };
    const value = String(goal || '').trim();
    const errors = {};
    if (!value) errors.goal = 'Cuéntanos qué te gustaría trabajar.';
    if (!['online', 'presential'].includes(modality)) errors.modality = 'Elige una modalidad para la mentoría.';
    if (Object.keys(errors).length) return { ok: false, reason: 'invalid', errors };
    state.mentorRequests[id] = { goal: value, modality, status: 'pending' };
    return { ok: true };
  }
  function pulseActions(item) {
    const event = !!item && ['event', 'workshop'].includes(item.kind);
    return { register: event, calendar: event, apply: !!item && item.kind === 'internship' && item.applyMode === 'local' };
  }
  function actionProfileSummary(state) {
    const { displayName, career, semester, contact } = state.profile;
    return { displayName, career, semester, email: contact.email };
  }
  function registerForEvent(state, items, id) {
    const item = items.find(candidate => candidate.id === id);
    if (!item) return { ok: false, reason: 'not-found' };
    if (!pulseActions(item).register) return { ok: false, reason: 'invalid-kind' };
    if (state.registrations[id]) return { ok: false, reason: 'duplicate' };
    state.registrations[id] = { status: 'registered', simulatedAt: DEMO_DATE };
    return { ok: true };
  }
  function applyToInternship(state, items, id, interest) {
    const item = items.find(candidate => candidate.id === id);
    if (!item) return { ok: false, reason: 'not-found' };
    if (item.kind !== 'internship') return { ok: false, reason: 'invalid-kind' };
    if (!pulseActions(item).apply) return { ok: false, reason: 'external' };
    if (state.applications[id]) return { ok: false, reason: 'duplicate' };
    const value = text(interest);
    if (!value) return { ok: false, reason: 'invalid', errors: { interest: 'Cuéntanos qué te interesa de esta práctica.' } };
    if (value.length > INTEREST_MAX_LENGTH) return { ok: false, reason: 'invalid', errors: { interest: 'Usa hasta 1,200 caracteres.' } };
    state.applications[id] = { status: 'submitted', interest: value, simulatedAt: DEMO_DATE };
    delete state.drafts.applications[id];
    return { ok: true };
  }
  function setTalentAssistantQuery(state, query) {
    state.talentAssistant = { ...state.talentAssistant, query: String(query == null ? '' : query) };
  }
  function submitTalentAssistant(state, people, matcher, query) {
    const value = text(query);
    if (!value) return { ok: false, reason: 'invalid', errors: { query: 'Escribe qué equipo necesitas.' } };
    if (value.length > TALENT_QUERY_MAX_LENGTH) return { ok: false, reason: 'invalid', errors: { query: 'Usa hasta ' + TALENT_QUERY_MAX_LENGTH + ' caracteres.' } };
    state.talentAssistant = { query: value, result: matcher(value, people) };
    return { ok: true };
  }
  function exploreTalentSkill(state, people, skill) {
    if (!people.some(person => person.skills.includes(skill))) return false;
    state.filters.talent = { ...state.filters.talent, search: '', skill };
    return true;
  }
  function setCareerGoal(state, goal) {
    state.careerAssistant = { ...state.careerAssistant, goal: String(goal == null ? '' : goal) };
  }
  function submitCareerAssistant(state, planner, goal) {
    const value = text(goal);
    if (!value) return { ok: false, reason: 'invalid', errors: { goal: 'Escribe tu meta.' } };
    if (value.length > CAREER_GOAL_MAX_LENGTH) return { ok: false, reason: 'invalid', errors: { goal: 'Usa hasta ' + CAREER_GOAL_MAX_LENGTH + ' caracteres.' } };
    const { career, semester } = state.profile;
    state.careerAssistant = { goal: value, result: planner(value, { career, semester }), selectedAlternative: null };
    return { ok: true };
  }
  function selectCareerAlternative(state, id) {
    const result = state.careerAssistant.result;
    if (!result || result.status !== 'matched' || !result.alternatives.some(option => option.id === id)) return false;
    state.careerAssistant = { ...state.careerAssistant, selectedAlternative: id };
    return true;
  }
  function pinSupport(state, mentors, id) {
    const person = mentors.find(candidate => candidate.id === id);
    if (!person) return { ok: false, reason: 'not-found' };
    if (person.supportRole !== 'professor') return { ok: false, reason: 'not-professor' };
    if (state.pinnedSupportIds.includes(id)) return { ok: false, reason: 'duplicate' };
    state.pinnedSupportIds = [...state.pinnedSupportIds, id];
    return { ok: true };
  }
  function unpinSupport(state, mentors, id) {
    const person = mentors.find(candidate => candidate.id === id);
    if (!person) return { ok: false, reason: 'not-found' };
    if (person.supportRole !== 'professor') return { ok: false, reason: 'fixed' };
    if (!state.pinnedSupportIds.includes(id)) return { ok: false, reason: 'not-pinned' };
    state.pinnedSupportIds = state.pinnedSupportIds.filter(pinned => pinned !== id);
    return { ok: true };
  }
  function supportNetwork(state, mentors) {
    const byId = id => mentors.find(candidate => candidate.id === id);
    return {
      mentor: byId(state.assignedMentorId),
      director: mentors.find(candidate => candidate.supportRole === 'degreeDirector'),
      professors: [...new Set(state.pinnedSupportIds)].map(byId).filter(person => person && person.supportRole === 'professor')
    };
  }
  function toggleSaved(state, id) {
    const at = state.saved.indexOf(id);
    if (at >= 0) { state.saved.splice(at, 1); return false; }
    state.saved.push(id); return true;
  }
  function reconcileTalentSkillFilter(state, people) {
    const filter = state.filters.talent;
    if (filter.skill !== 'all' && !people.some(person => person.skills.includes(filter.skill))) filter.skill = 'all';
  }
  function filterPeople(people, filter) {
    const query = normalized(filter.search);
    return people.filter(person => (filter.skill === 'all' || person.skills.includes(filter.skill)) &&
      normalized([person.name, person.career, person.bio, ...person.skills].join(' ')).includes(query));
  }
  function resolveRoute(hash, data, state) {
    const invalid = { section: 'pulse', view: 'browse', valid: false };
    if (!hash || hash === '#' || hash === '#/') return { section: 'pulse', view: 'browse', valid: true };
    if (!hash.startsWith('#/')) return invalid;
    const parts = hash.slice(2).split('/');
    const [section, id, action] = parts;
    if (section === 'profile') {
      if (parts.length === 1) return { section, view: 'preview', valid: true };
      if (parts.length === 2 && ['edit', 'preferences'].includes(id)) return { section, view: id, valid: true };
      return invalid;
    }
    // Only the three known areas are sections; this also rejects prototype keys like #/constructor.
    if (!['pulse', 'talent', 'mentor'].includes(section)) return invalid;
    if (section === 'mentor' && id === 'plan') return parts.length === 2 ? { section, view: 'plan', valid: true } : invalid;
    const collection = { pulse: data.pulse, talent: getPeople(state, data.people), mentor: data.mentors }[section];
    if (!collection || parts.length > 3 || parts.some(part => !part)) return invalid;
    if (parts.length === 1) return { section, view: 'browse', valid: true };
    if (!collection.some(item => item.id === id)) return invalid;
    if (parts.length === 2) return { section, view: 'detail', id, valid: true };
    if (section === 'talent' && id === 'self') return invalid;
    if (section === 'pulse') {
      const allowed = pulseActions(collection.find(item => item.id === id));
      return (action === 'register' && allowed.register) || (action === 'apply' && allowed.apply) ? { section, view: action, id, valid: true } : invalid;
    }
    if ((section === 'talent' && action === 'contact') || (section === 'mentor' && action === 'request')) return { section, view: action, id, valid: true };
    return invalid;
  }
  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }
  const api = { createState, clone, topicTaxonomy, pulseSections, PULSE_GROUPS, migratePulsePreferences, hasPulseTopics, normalizePulseLayout, effectivePulseMode, pulseMatchTopics, getPulseItems, getPulseWidgets, movePreferencesSection, restorePulseSections, initials, isSafeURL, commaValues, beginProfileDraft, cancelProfileDraft, addProfileRow, removeProfileRow, validateProfile, saveProfile, beginPreferencesDraft, cancelPreferencesDraft, savePreferences, getPeople, submitContact, submitMentor, DEMO_DATE, INTEREST_MAX_LENGTH, TALENT_QUERY_MAX_LENGTH, CAREER_GOAL_MAX_LENGTH, setCareerGoal, submitCareerAssistant, selectCareerAlternative, pinSupport, unpinSupport, supportNetwork, setTalentAssistantQuery, submitTalentAssistant, exploreTalentSkill, pulseActions, actionProfileSummary, registerForEvent, applyToInternship, toggleSaved, reconcileTalentSkillFilter, filterPeople, resolveRoute, escapeHTML,
    filterPulse: (items, category) => items.filter(item => category === 'all' || item.category === category),
    filterMentors: (items, topic) => items.filter(item => topic === 'all' || item.topics.includes(topic)),
    resetState: state => { Object.keys(state).forEach(key => delete state[key]); return Object.assign(state, createState()); }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TecState = api;
})(typeof window !== 'undefined' ? window : globalThis);
