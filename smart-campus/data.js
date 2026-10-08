(function (root) {
  'use strict';

  var demoDate = '2026-10-07';
  var dates = [
    { value: demoDate, label: 'Miércoles 7 de octubre de 2026', shortLabel: 'Mié 7 oct' },
    { value: '2026-10-08', label: 'Jueves 8 de octubre de 2026', shortLabel: 'Jue 8 oct' },
    { value: '2026-10-09', label: 'Viernes 9 de octubre de 2026', shortLabel: 'Vie 9 oct' }
  ];
  var categories = [
    { id: 'library', label: 'Biblioteca', color: '#8270dd' },
    { id: 'classrooms', label: 'Aulas', color: '#4982b7' },
    { id: 'labs', label: 'Labs y makerspaces', color: '#ce8048' },
    { id: 'computers', label: 'Computadoras', color: '#527eb7' },
    { id: 'gyms', label: 'Gimnasios', color: '#619b76' },
    { id: 'pool', label: 'Alberca', color: '#489cb4' },
    { id: 'esports', label: 'Esports', color: '#9a6cc5' },
    { id: 'wellbeing', label: 'Bienestar', color: '#bc6e96' },
    { id: 'tec-services', label: 'Tec Services', color: '#698898' }
  ];
  var source = {
    label: 'Datos de ejemplo · Smart Campus',
    basis: 'Propuesta Smart Campus; espacios, horarios y procedimientos simulados',
    updatedAt: demoDate,
    fictional: true
  };

  function space(id, name, category, location, details) {
    return Object.assign({
      id: id, name: name, category: category,
      description: 'Espacio ficticio del campus conceptual.',
      location: location, hours: 'Consulta el procedimiento del área responsable.',
      capacity: null, resources: [], software: [], requirements: [],
      responsibleArea: '', procedure: '', source: Object.assign({}, source)
    }, details);
  }

  var spaces = [2, 4, 6, 8].map(function (capacity, index) {
    return space('library-room-' + capacity, 'Sala de estudio · ' + capacity + ' personas', 'library',
      { label: 'Biblioteca · nivel conceptual 1', zone: 'Zona de estudio', x: 18 + index * 4, y: 26 + index * 5 }, {
        description: 'Sala de uso general para estudiar y trabajar en equipo.',
        hours: '09:00–18:00 · bloques de 1 hora', capacity: capacity, reservable: true,
        resources: ['Mesa de trabajo', 'Sillas', 'Pizarrón', 'Conexiones eléctricas'],
        requirements: ['Cuenta estudiantil de demostración', 'Respetar la capacidad de la sala'],
        responsibleArea: 'Biblioteca',
        procedure: 'Selecciona una fecha y un bloque disponible; confirma la reserva de ejemplo en Smart Campus.'
      });
  });
  spaces.push(
    space('classroom-flex', 'Aula flexible', 'classrooms', { label: 'Edificio académico conceptual · nivel 2', zone: 'Zona académica', x: 55, y: 24 }, {
      description: 'Aula para actividades académicas; la disponibilidad requiere consulta con el área.',
      hours: '08:00–18:00 · horario de ejemplo', capacity: 30,
      resources: ['Proyector', 'Pizarrón', 'Mesas móviles'], requirements: ['Solicitud al área académica'],
      responsibleArea: 'Servicios Académicos', procedure: 'Consulta al área académica para conocer el uso autorizado. Este prototipo no reserva aulas.'
    }),
    space('lab-3d', 'Laboratorio de impresión 3D', 'labs', { label: 'Makerspace conceptual · planta baja', zone: 'Zona de creación', x: 75, y: 29 }, {
      description: 'Espacio de ejemplo para fabricar prototipos mediante impresión 3D.',
      hours: '09:00–17:00 · horario de ejemplo', capacity: 12,
      resources: ['Impresoras 3D', 'Mesas de prototipado', 'Herramientas de acabado'], software: ['SolidWorks', 'Software de laminado'],
      requirements: ['Inducción de seguridad de ejemplo', 'Validación del archivo con el responsable', 'Consulta de materiales y equipo disponible'],
      responsibleArea: 'Coordinación de Makerspace',
      procedure: 'Contacta a Coordinación de Makerspace por el canal institucional para consultar inducción, revisión del archivo y disponibilidad. El responsable confirma los requisitos y el acceso.'
    }),
    space('lab-robotics', 'Laboratorio de robótica', 'labs', { label: 'Labs conceptuales · nivel 1', zone: 'Zona de creación', x: 84, y: 38 }, {
      description: 'Laboratorio de ejemplo para proyectos de robótica y electrónica.', hours: '09:00–18:00 · horario de ejemplo', capacity: 16,
      resources: ['Kits de robótica', 'Sensores', 'Estaciones de electrónica'], software: ['Arduino IDE', 'Python'],
      requirements: ['Inducción de ejemplo', 'Acompañamiento del responsable del laboratorio'],
      responsibleArea: 'Coordinación de Laboratorios', procedure: 'Consulta al responsable del laboratorio para revisar el proyecto y el procedimiento de acceso.'
    }),
    space('computer-design', 'Computadoras de diseño', 'computers', { label: 'Centro de cómputo conceptual', zone: 'Zona académica', x: 52, y: 40 }, {
      description: 'Estaciones de ejemplo con software de diseño e ingeniería.', hours: '08:00–19:00 · horario de ejemplo', capacity: 24,
      resources: ['Computadoras', 'Monitores', 'Teclados y mouse'], software: ['SolidWorks', 'AutoCAD', 'Python'],
      requirements: ['Cuenta estudiantil de demostración', 'Confirmar disponibilidad con el responsable'],
      responsibleArea: 'Centro de Cómputo', procedure: 'Consulta al personal del Centro de Cómputo para disponibilidad de estaciones y licencias. El catálogo no garantiza una licencia activa.'
    }),
    space('gym-profesional', 'Gimnasio Profesional', 'gyms', { label: 'Centro deportivo conceptual · ala A', zone: 'Zona deportiva', x: 23, y: 72 }, {
      description: 'Registro de asistencia de ejemplo para estudiantes de Profesional.', hours: '07:00–19:00 · consulta bloques de ejemplo', capacity: 60,
      resources: ['Pesas', 'Máquinas de fuerza', 'Caminadoras', 'Bicicletas'], requirements: ['Consultar requisitos de uso con Deportes'],
      responsibleArea: 'Deportes · Profesional', procedure: 'Consulta a Deportes para conocer requisitos y acceso. Smart Campus registra asistencia de ejemplo; no reserva el gimnasio ni concede permiso de entrada.'
    }),
    space('gym-prepatec', 'Gimnasio PrepaTec', 'gyms', { label: 'Centro deportivo conceptual · ala B', zone: 'Zona deportiva', x: 37, y: 78 }, {
      description: 'Segundo gimnasio del campus conceptual, asociado a PrepaTec.', hours: '07:00–19:00 · consulta bloques de ejemplo', capacity: 40,
      resources: ['Pesas', 'Máquinas de fuerza', 'Equipo de cardio'], requirements: ['Consultar elegibilidad y requisitos con Deportes PrepaTec'],
      responsibleArea: 'Deportes · PrepaTec', procedure: 'Consulta a Deportes PrepaTec para revisar elegibilidad y acceso. Un registro de asistencia no otorga acceso.'
    }),
    space('pool-main', 'Alberca', 'pool', { label: 'Centro acuático conceptual', zone: 'Zona deportiva', x: 17, y: 88 }, {
      description: 'Alberca de ejemplo. Tier 2 es una etiqueta ficticia de esta demostración; no define una clasificación real.',
      hours: '08:00–17:00 · horario de ejemplo', capacity: 25, resources: ['Carriles de nado', 'Vestidores'],
      requirements: ['Tier 2 · dato ficticio, sin definición de elegibilidad', 'Consultar requisitos vigentes con Deportes'],
      responsibleArea: 'Deportes · Centro Acuático', procedure: 'Consulta a Deportes para los requisitos y horarios reales. El dato ficticio Tier 2 no otorga permiso ni acceso.'
    }),
    space('esports-arena', 'Arena Esports', 'esports', { label: 'Centro estudiantil conceptual · nivel 1', zone: 'Zona estudiantil', x: 75, y: 61 }, {
      description: 'Espacio de ejemplo para actividades de esports.', hours: '12:00–18:00 · horario de ejemplo', capacity: 12,
      resources: ['Computadoras para gaming', 'Audífonos', 'Controles'], software: ['Juegos según actividad autorizada'],
      requirements: ['Consulta de agenda y lineamientos con el responsable'], responsibleArea: 'Vida Estudiantil · Esports',
      procedure: 'Contacta a Vida Estudiantil para consultar agenda, equipo y procedimiento de participación.'
    }),
    space('wellbeing-center', 'Centro de Bienestar', 'wellbeing', { label: 'Centro estudiantil conceptual · planta baja', zone: 'Zona estudiantil', x: 86, y: 77 }, {
      description: 'Punto de orientación y consulta de servicios de bienestar.', hours: '09:00–17:00 · horario de ejemplo',
      resources: ['Orientación de servicios', 'Área de atención'], requirements: ['Consulta de canales y cita con el área'],
      responsibleArea: 'Bienestar Estudiantil', procedure: 'Consulta el canal institucional de Bienestar Estudiantil para conocer servicios y solicitar orientación. No se crea una cita desde este prototipo.'
    }),
    space('tec-services-center', 'Tec Services', 'tec-services', { label: 'Centro de servicios conceptual', zone: 'Zona de servicios', x: 56, y: 67 }, {
      description: 'Punto de consulta de trámites y servicios estudiantiles.', hours: '09:00–18:00 · horario de ejemplo',
      resources: ['Orientación de trámites', 'Atención estudiantil'], requirements: ['Identificación estudiantil según trámite'],
      responsibleArea: 'Tec Services', procedure: 'Consulta a Tec Services por el canal institucional para confirmar documentos, horarios y procedimiento del trámite.'
    })
  );

  var libraryOccupancy = [
    { roomId: 'library-room-2', date: demoDate, hour: 9 }, { roomId: 'library-room-2', date: demoDate, hour: 10 },
    { roomId: 'library-room-4', date: demoDate, hour: 11 }, { roomId: 'library-room-6', date: demoDate, hour: 10 },
    { roomId: 'library-room-6', date: demoDate, hour: 13 }, { roomId: 'library-room-8', date: demoDate, hour: 10 },
    { roomId: 'library-room-8', date: demoDate, hour: 14 },
    { roomId: 'library-room-2', date: '2026-10-08', hour: 12 }, { roomId: 'library-room-4', date: '2026-10-08', hour: 9 },
    { roomId: 'library-room-6', date: '2026-10-08', hour: 12 }, { roomId: 'library-room-8', date: '2026-10-08', hour: 16 },
    { roomId: 'library-room-4', date: '2026-10-09', hour: 10 }, { roomId: 'library-room-6', date: '2026-10-09', hour: 15 }
  ];

  var gymOccupancy = {};
  var patterns = {
    'gym-profesional': ['closed', 70, 55, 42, 18, 18, 60, 80, 65, 35, 'unknown', 20],
    'gym-prepatec': [20, 25, 'closed', 'unknown', 30, 40, 50, 30, 20, 10, 10, 45]
  };
  Object.keys(patterns).forEach(function (gymId) {
    gymOccupancy[gymId] = {};
    dates.forEach(function (date, dayIndex) {
      gymOccupancy[gymId][date.value] = patterns[gymId].map(function (value, index) {
        var known = typeof value === 'number';
        return {
          hour: index + 7, endHour: index + 8,
          status: known ? 'open' : value,
          occupancyPercent: known ? Math.max(0, value + [0, 5, -3][dayIndex]) : null,
          estimated: true
        };
      });
    });
  });

  var api = {
    demoDate: demoDate, dates: dates, categories: categories, spaces: spaces,
    account: { id: 'student-demo', name: 'Sofía Torres · cuenta de ejemplo', matricula: 'DEMO-A00000000', level: 'Profesional', semester: 5, fictional: true },
    libraryOccupancy: libraryOccupancy, gymOccupancy: gymOccupancy,
    trainingTypes: ['pecho', 'pierna', 'tren superior', 'cardio', 'otro'],
    gymEntryCodes: { 'gym-profesional': 'SC-QR-ENTRADA-GYM-PROFESIONAL', 'gym-prepatec': 'SC-QR-ENTRADA-GYM-PREPATEC' },
    gymRules: { arrivalWindowMs: 10 * 60 * 1000, durations: [1, 1.5] },
    campus: {
      name: 'Campus conceptual · mapa de ejemplo', width: 100, height: 100,
      regions: [
        { category: 'library', label: 'Biblioteca', x: 10, y: 16, width: 28, height: 35 },
        { category: 'classrooms', label: 'Aulas', x: 43, y: 13, width: 20, height: 20 },
        { category: 'labs', label: 'Labs', x: 68, y: 16, width: 24, height: 31 },
        { category: 'computers', label: 'Cómputo', x: 44, y: 35, width: 18, height: 17 },
        { category: 'gyms', label: 'Gimnasios', x: 10, y: 61, width: 33, height: 23 },
        { category: 'pool', label: 'Alberca', x: 10, y: 85, width: 25, height: 10 },
        { category: 'esports', label: 'Esports', x: 68, y: 55, width: 22, height: 14 },
        { category: 'wellbeing', label: 'Bienestar', x: 76, y: 72, width: 17, height: 17 },
        { category: 'tec-services', label: 'Tec Services', x: 45, y: 60, width: 20, height: 20 }
      ]
    }
  };
  function freezeDeep(value) {
    Object.keys(value).forEach(function (key) { if (value[key] && typeof value[key] === 'object') freezeDeep(value[key]); });
    return Object.freeze(value);
  }
  freezeDeep(api);
  root.SCData = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
