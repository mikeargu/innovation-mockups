(function (root) {
  'use strict';
  const MAX_PEOPLE_PER_ROLE = 2;
  const EXAMPLE_NOTE = 'Respuesta de ejemplo: perfiles ficticios y habilidades declaradas por cada persona, sin recomendaciones validadas.';
  const talentScenarios = [
    { id: 'running-gels', label: 'Startup de geles para correr', triggers: ['gel', 'geles', 'gels'],
      prompt: 'Estoy empezando una startup de geles para correr. Necesito alguien de marketing, alguien de finanzas y alguien que diseñe la página web.',
      roles: [
        { id: 'marketing', label: 'Marketing', need: 'Quién te ayude a comunicar el producto', skills: ['Marketing', 'Comunicación'] },
        { id: 'finance', label: 'Finanzas', need: 'Quién ordene costos y recursos', skills: ['Finanzas', 'Emprendimiento'] },
        { id: 'web', label: 'Diseño / desarrollo web', need: 'Quién diseñe y construya la página web', skills: ['UX/UI', 'Desarrollo web'] }
      ] },
    { id: 'hackathon', label: 'Equipo para un hackathon', triggers: ['hackathon', 'hackaton', 'hackathones', 'hackatones'],
      prompt: 'Quiero formar un equipo para un hackathon de este mes. Necesito desarrollo, datos, diseño y alguien que presente la idea.',
      roles: [
        { id: 'development', label: 'Desarrollo', need: 'Quién construya el prototipo', skills: ['Desarrollo web', 'Python'] },
        { id: 'data', label: 'Datos', need: 'Quién analice y visualice información', skills: ['Datos', 'Python'] },
        { id: 'design', label: 'Diseño', need: 'Quién diseñe la experiencia', skills: ['UX/UI', 'Investigación'] },
        { id: 'pitch', label: 'Comunicación y presentación', need: 'Quién cuente la idea al jurado', skills: ['Comunicación', 'Marketing'] }
      ] },
    { id: 'campus-app', label: 'App para el campus', triggers: ['app', 'apps', 'aplicacion', 'aplicaciones'],
      prompt: 'Quiero crear una app para reservar espacios de estudio en el campus. Necesito alguien que la programe, alguien que cuide la seguridad de los datos y alguien que investigue qué necesitan los estudiantes.',
      roles: [
        { id: 'development', label: 'Desarrollo de la app', need: 'Quién programe la aplicación', skills: ['Desarrollo web'] },
        { id: 'security', label: 'Seguridad y privacidad', need: 'Quién cuide los datos de quienes reservan', skills: ['Ciberseguridad'] },
        { id: 'research', label: 'Investigación con estudiantes', need: 'Quién descubra qué necesitan las personas usuarias', skills: ['Investigación', 'UX/UI'] }
      ] }
  ];
  const tokens = value => String(value == null ? '' : value).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const suggestions = () => talentScenarios.map(({ id, label, prompt }) => ({ id, label, prompt }));
  function recommend(role, people) {
    return people.map((person, index) => ({ person, index, matched: role.skills.filter(skill => person.skills.includes(skill)) }))
      .filter(entry => entry.matched.length)
      .sort((a, b) => b.matched.length - a.matched.length || a.index - b.index)
      .slice(0, MAX_PEOPLE_PER_ROLE)
      .map(({ person, matched }) => ({
        id: person.id, name: person.name, initials: person.initials, color: person.color, career: person.career,
        matchedSkills: matched, evidence: person.evidence, project: person.project,
        availability: person.availability, modality: person.modality,
        reason: 'Declara ' + matched.join(' y ') + ' y su proyecto «' + person.project + '» muestra ese trabajo.'
      }));
  }
  function matchTeam(query, people) {
    const text = String(query == null ? '' : query).trim();
    if (!text) return { status: 'empty' };
    const words = tokens(text);
    const named = talentScenarios.filter(candidate => candidate.triggers.some(trigger => words.includes(trigger)));
    // A query that names no scenario, or names several, is never answered with guessed recommendations.
    if (named.length !== 1) return { status: 'unrecognized', query: text, suggestions: suggestions() };
    const scenario = named[0];
    const candidates = people.filter(person => !person.isSelf);
    return { status: 'matched', query: text, scenarioId: scenario.id, scenarioLabel: scenario.label, note: EXAMPLE_NOTE,
      roles: scenario.roles.map(role => ({ id: role.id, label: role.label, need: role.need, skills: role.skills.slice(), people: recommend(role, candidates) })) };
  }
  const ORIENTATION_NOTE = 'Ejemplo de orientación: materias, profesores y opciones ficticias para imaginar la experiencia. No es un mapa curricular ni una oferta vigente; no inscribe materias, no resuelve equivalencias ni gestiona intercambios.';
  const careerScenarios = [
    { id: 'stock-market', label: 'Finanzas → mercado bursátil mexicano', triggers: [['bursatil'], ['bursatiles'], ['bmv'], ['trading'], ['bolsa', 'de', 'valores']],
      prompt: 'Estoy en primer semestre de Finanzas y al terminar mi carrera quiero trabajar en el mercado bursátil mexicano. ¿Qué profesores y materias me ayudarían? ¿Me conviene un intercambio o una concentración?',
      summary: 'Quieres trabajar en el mercado bursátil mexicano al terminar tu carrera.',
      stages: [
        { id: 'foundations', label: 'Fundamentos', period: 'Semestres 1 y 2', actions: ['Refuerza matemáticas financieras y contabilidad básica.', 'Lee el reporte trimestral de una empresa que cotiza en bolsa y anota tres dudas.'] },
        { id: 'exploration', label: 'Exploración', period: 'Semestres 3 y 4', actions: ['Sigue un índice bursátil durante un mes y registra qué noticias lo mueven.', 'Únete a un reto o club de inversión simulada.'] },
        { id: 'specialization', label: 'Especialización', period: 'Semestres 5 a 7', actions: ['Elige optativas de mercados e instrumentos financieros.', 'Decide con tu director si te conviene más un intercambio o una concentración.'] },
        { id: 'professional', label: 'Preparación profesional', period: 'Semestres 8 y 9', actions: ['Busca una práctica de análisis financiero.', 'Prepara un portafolio con dos análisis de empresas explicados con claridad.'] }
      ],
      courses: [
        { id: 'applied-statistics', name: 'Estadística aplicada', why: 'Te da las herramientas para leer series de precios, riesgo y rendimiento con evidencia.' },
        { id: 'market-analysis', name: 'Análisis de mercados', why: 'Conecta noticias, sectores y empresas con el comportamiento de un mercado bursátil.' },
        { id: 'financial-instruments', name: 'Instrumentos financieros', why: 'Explica cómo funcionan acciones, bonos y derivados antes de operar con ellos.' }
      ],
      professors: [
        { id: 'paula-ortiz', why: 'Trabaja con mercados e instrumentos financieros y puede orientarte sobre optativas.' },
        { id: 'gabriel-soto', why: 'Puede ayudarte a usar estadística e investigación para analizar mercados.' }
      ],
      alternatives: [
        { id: 'exchange', label: 'Intercambio', goal: 'Conocer otro mercado financiero y practicar en otro idioma.', experience: 'Un semestre en una universidad con oferta fuerte en finanzas.', review: ['Semestre en el que conviene salir', 'Equivalencia de materias con tu plan', 'Requisitos de idioma y promedio'] },
        { id: 'concentration', label: 'Concentración', goal: 'Profundizar en mercados sin salir de tu campus.', experience: 'Un bloque de materias especializadas y un proyecto aplicado.', review: ['Concentraciones relacionadas con mercados', 'Materias que forman parte del bloque', 'Cómo combinarla con una práctica'] }
      ],
      nextConversation: {
        mentor: ['Cómo organizar tu primer semestre para reforzar fundamentos', 'Qué actividad de exploración puedes empezar este mes'],
        director: ['En qué semestre conviene decidir entre intercambio y concentración', 'Qué requisitos habría que revisar para cada opción']
      } }
  ];
  const containsSequence = (words, sequence) => words.some((_, index) => sequence.every((part, offset) => words[index + offset] === part));
  function planCareer(goal, profile) {
    const text = String(goal == null ? '' : goal).trim();
    if (!text) return { status: 'empty' };
    const words = tokens(text);
    const scenario = careerScenarios.find(candidate => candidate.triggers.some(sequence => containsSequence(words, sequence)));
    if (!scenario) return { status: 'unrecognized', goal: text, suggestions: careerScenarios.map(({ id, label, prompt }) => ({ id, label, prompt })) };
    const copy = value => JSON.parse(JSON.stringify(value));
    return { status: 'matched', scenarioId: scenario.id, scenarioLabel: scenario.label, goal: text, note: ORIENTATION_NOTE,
      startingPoint: { career: profile.career, semester: profile.semester, summary: scenario.summary },
      stages: copy(scenario.stages), courses: copy(scenario.courses), professors: copy(scenario.professors),
      alternatives: copy(scenario.alternatives), nextConversation: copy(scenario.nextConversation) };
  }
  const api = { talentScenarios: talentScenarios.map(({ id, label, prompt }) => ({ id, label, prompt })), matchTeam,
    careerScenarios: careerScenarios.map(({ id, label, prompt }) => ({ id, label, prompt })), planCareer };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TecDemoAI = api;
})(typeof window !== 'undefined' ? window : globalThis);
