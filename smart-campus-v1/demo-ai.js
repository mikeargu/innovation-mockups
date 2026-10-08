(function (root) {
  'use strict';
  var commonJS = typeof module === 'object' && module.exports;
  var D = commonJS ? require('./data.js') : root.SCData;
  var S = commonJS ? require('./state.js') : root.SCState;
  var suggestedPrompts = [
    'Necesito una sala en la biblioteca el viernes 9 de octubre a las 11:00 para 4 personas',
    'Necesito una sala de biblioteca para seis personas',
    '¿Qué necesito para usar el laboratorio de impresión 3D?',
    '¿A qué hora está más tranquilo el gimnasio?'
  ];
  var NUM = '(\\d{1,2}|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)';
  var WORDS = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10 };
  var MIN_HOUR = 9, MAX_HOUR = 17, MAX_CAPACITY = 8;
  var FIELD_NAMES = { date: 'la fecha', hour: 'el horario', capacity: 'la cantidad de personas' };

  function recognize(question) {
    var text = S.normalize(question);
    if (!text) return 'blank';
    if (/\b3d\b/.test(text) && /(impres|imprim|lab|necesit|requisit|usar)/.test(text)) return 'lab-3d';
    if (/(gimnas|gym)/.test(text) && /(tranquil|menos gente|menos concurr|ocupacion|hora)/.test(text)) return 'gym-quiet';
    if (/(sala|biblioteca|estudio|estudiar)/.test(text)) return 'library-booking';
    return 'unsupported';
  }
  var formatHour = S.formatHour;
  function dateLabel(date) {
    var item = D.dates.find(function (entry) { return entry.value === date; });
    return item ? item.label : 'la fecha seleccionada';
  }
  function lowerFirst(text) { return text.charAt(0).toLowerCase() + text.slice(1); }
  function toNumber(token) { return WORDS[token] !== undefined ? WORDS[token] : Number(token); }

  function parseDate(text) {
    var plain = text.replace(/\b(de|por|en) la manana\b/g, ' ');
    var dm = plain.match(/\b(\d{1,2})\s*(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|oct)\b/);
    if (dm) {
      var isOct = dm[2] === 'octubre' || dm[2] === 'oct', day = Number(dm[1]);
      return isOct && day >= 7 && day <= 9 ? { value: '2026-10-0' + day } : { oor: true };
    }
    if (/\bviernes\b/.test(plain)) return { value: '2026-10-09' };
    if (/\bjueves\b/.test(plain)) return { value: '2026-10-08' };
    if (/\bmiercoles\b/.test(plain)) return { value: '2026-10-07' };
    if (/\b(lunes|martes|sabado|domingo)\b/.test(plain)) return { oor: true };
    if (/\bhoy\b/.test(plain)) return { value: D.demoDate };
    if (/\bmanana\b/.test(plain)) return { value: '2026-10-08' };
    return null;
  }
  function parseHour(text) {
    var m = text.match(/\ba las?\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/) || text.match(/\b(\d{1,2}):(\d{2})\s*(am|pm)?/) ||
      text.match(/\b(\d{1,2})()\s*(am|pm)\b/) || text.match(/\b(\d{1,2})()\s*(?:h|hs|hrs|horas)\b/);
    if (!m) return null;
    var hour = Number(m[1]), minutes = Number(m[2] || 0);
    var meridiem = m[3] || (/\bde la (tarde|noche)\b/.test(text) ? 'pm' : '');
    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
    return minutes || hour < MIN_HOUR || hour > MAX_HOUR ? { oor: true } : { value: hour };
  }
  function parseCapacity(text) {
    var m = text.match(new RegExp('\\b' + NUM + '\\s+(?:personas?|integrantes|companer[oa]s|gente|estudiantes|alumnos|amigos)\\b')) ||
      text.match(new RegExp('\\bgrupo\\s+de\\s+' + NUM + '\\b')) || text.match(new RegExp('\\bsomos\\s+' + NUM + '\\b')) ||
      text.match(new RegExp('\\bpara\\s+' + NUM + '\\b(?!\\s*(?::|h\\b|hs\\b|hrs\\b|am\\b|pm\\b|(?:de\\s+)?(?:octubre|oct)\\b))'));
    if (!m) return null;
    var value = toNumber(m[1]);
    return value < 1 || value > MAX_CAPACITY ? { oor: true } : { value: value };
  }
  function parseRequest(state, question, context) {
    var text = S.normalize(question), draft = state.bookingDraft || {};
    var parsed = { date: parseDate(text), hour: parseHour(text), capacity: parseCapacity(text) };
    var request = { date: null, hour: null, capacity: null, defaults: [] }, outOfRange = [];
    ['date', 'hour', 'capacity'].forEach(function (field) {
      if (context[field] !== undefined) request[field] = context[field];
      else if (parsed[field] && parsed[field].oor) outOfRange.push(field);
      else if (parsed[field]) request[field] = parsed[field].value;
      else { request[field] = draft[field] === undefined ? null : draft[field]; request.defaults.push(field); }
    });
    var valid = { date: D.dates.some(function (item) { return item.value === request.date; }),
      hour: Number.isInteger(request.hour) && request.hour >= MIN_HOUR && request.hour <= MAX_HOUR,
      capacity: Number.isInteger(request.capacity) && request.capacity >= 1 && request.capacity <= MAX_CAPACITY };
    Object.keys(valid).forEach(function (field) { if (!valid[field] && outOfRange.indexOf(field) < 0) outOfRange.push(field); });
    outOfRange.forEach(function (field) { request[field] = null; });
    request.outOfRange = outOfRange;
    return request;
  }
  function defaultsNote(request) {
    if (!request.defaults.length) return '';
    var names = request.defaults.map(function (field) { return FIELD_NAMES[field]; });
    var list = names.length > 1 ? names.slice(0, -1).join(', ') + ' y ' + names[names.length - 1] : names[0];
    return ' No indicaste ' + list + '; usé ' + (names.length > 1 ? 'los valores' : 'el valor') + ' del borrador de reserva.';
  }
  function roomActions(options, request) {
    return options.map(function (option) {
      return { type: 'book-room', label: 'Revisar reserva', spaceId: option.spaceId, roomId: option.roomId,
        date: option.date, hour: option.hour, capacity: request.capacity };
    });
  }
  function nearbyAlternatives(state, request) {
    var options = [];
    for (var hour = MIN_HOUR; hour <= MAX_HOUR; hour++) {
      if (hour !== request.hour) options = options.concat(S.findRoomOptions(state, { date: request.date, hour: hour, capacity: request.capacity }));
    }
    return options.sort(function (a, b) {
      return Math.abs(a.hour - request.hour) - Math.abs(b.hour - request.hour) || a.capacity - b.capacity || a.hour - b.hour;
    }).slice(0, 3);
  }
  function libraryAnswer(state, result, question, context) {
    var request = parseRequest(state, question, context);
    result.request = request;
    result.title = 'Una sala para ' + (request.capacity || 'tu grupo');
    result.limitations.push('Sugerir una sala no crea una reserva. La confirmación debe hacerse de forma explícita.');
    if (request.outOfRange.length) {
      result.title = 'Fuera de los límites de la demostración';
      result.body = 'No puedo preparar esa reserva: ' + request.outOfRange.map(function (field) { return FIELD_NAMES[field]; }).join(', ') +
        ' queda fuera de lo que cubre el ejemplo. Usa fechas del 7 al 9 de octubre de 2026, bloques de una hora entre 09:00 y 18:00 que empiecen en punto, y grupos de hasta 8 personas.';
      return result;
    }
    var when = lowerFirst(dateLabel(request.date)) + ', de ' + formatHour(request.hour) + ' a ' + formatHour(request.hour + 1);
    var group = 'para un grupo de ' + request.capacity;
    result.options = S.findRoomOptions(state, request);
    if (!result.options.length) {
      result.options = nearbyAlternatives(state, request);
      result.body = 'No hay una sala libre ' + group + ' el ' + when + '.' + defaultsNote(request) +
        (result.options.length ? ' Estas son las alternativas más cercanas ese día; revisa la reserva y confírmala para guardarla.' : ' Tampoco quedan otros bloques con sala ese día; prueba otra fecha.');
    } else {
      result.body = result.options[0].name + ' está disponible el ' + when + ', ' + group + '.' + defaultsNote(request) +
        ' Revisa la reserva y confírmala para guardarla.';
    }
    result.actions = roomActions(result.options, request);
    result.source.spaceIds = result.options.map(function (option) { return option.spaceId; });
    return result;
  }
  function baseAnswer(scenario, question) {
    return {
      label: 'Respuesta de ejemplo', supported: scenario !== 'blank' && scenario !== 'unsupported',
      scenario: scenario, question: question, title: '', body: '', options: [], actions: [], context: {},
      source: { label: 'Catálogo de ejemplo · Smart Campus', updatedAt: D.demoDate, fictional: true, spaceIds: [] },
      limitations: ['Información ficticia para explorar la propuesta.']
    };
  }
  function pickContext(context) {
    var kept = {};
    ['date', 'hour', 'capacity', 'gymId'].forEach(function (key) { if (context[key] !== undefined) kept[key] = context[key]; });
    return kept;
  }
  function answer(state, question, context) {
    context = context || {};
    var trimmed = String(question == null ? '' : question).trim();
    var scenario = recognize(trimmed);
    var result = baseAnswer(scenario, trimmed);
    result.context = pickContext(context);
    if (scenario === 'blank') {
      result.title = 'Escribe una consulta';
      result.body = 'Prueba una de las consultas sugeridas sobre biblioteca, impresión 3D o gimnasios.';
      return result;
    }
    if (scenario === 'unsupported') {
      result.title = 'Consulta fuera de los ejemplos';
      result.body = 'Esta demostración responde las consultas sugeridas sobre una sala de biblioteca para un grupo, requisitos de impresión 3D y horarios tranquilos del gimnasio. Para otras consultas, revisa el catálogo y el área responsable.';
      return result;
    }
    if (scenario === 'library-booking') return libraryAnswer(state, result, trimmed, context);
    if (scenario === 'lab-3d') {
      var lab = S.getSpace('lab-3d');
      result.title = 'Requisitos de impresión 3D';
      result.body = lab.requirements.join('. ') + '. ' + lab.procedure;
      result.options = [{ spaceId: lab.id, name: lab.name, requirements: lab.requirements.slice(), procedure: lab.procedure, responsibleArea: lab.responsibleArea }];
      result.actions = [{ type: 'view-space', label: 'Ver procedimiento', spaceId: lab.id }];
      result.source.spaceIds = [lab.id];
      result.limitations.push('Esta respuesta no autoriza ni otorga acceso al laboratorio. El área responsable confirma el procedimiento real.');
      return result;
    }
    var attendance = state.attendanceDraft || {};
    var gymId = context.gymId !== undefined ? context.gymId : (attendance.gymId || 'gym-profesional');
    var gymDate = context.date !== undefined ? context.date : ((state.gymView && state.gymView.date) || attendance.date || D.demoDate);
    result.title = 'Un horario con menos gente';
    result.options = S.recommendGymBlocks(gymId, gymDate).slice(0, 3);
    if (!result.options.length) {
      result.body = 'Sin información disponible para ese gimnasio y fecha de ejemplo. Selecciona un gimnasio y una fecha de la demostración.';
    } else {
      var best = result.options[0];
      result.body = 'En ' + best.name + ', el bloque de ' + formatHour(best.hour) + ' a ' + formatHour(best.endHour) + ' tiene la menor ocupación estimada de ejemplo: ' + best.occupancyPercent + '%. Los empates se ordenan por el horario más temprano. La asistencia se registra al llegar, escaneando el QR de la entrada.';
      result.source.spaceIds = [gymId];
      result.actions = result.options.map(function (option) {
        return { type: 'view-gym', label: 'Ver gimnasio', spaceId: option.spaceId, gymId: option.gymId };
      });
    }
    result.limitations.push('Ocupación estimada y ficticia; no representa aforo en vivo.', 'La asistencia no se registra por adelantado: se registra al llegar, escaneando el QR de la entrada. No reserva el gimnasio ni concede acceso.');
    return result;
  }
  function submit(state, question, context) {
    var trimmed = String(question == null ? '' : question).trim();
    var result = answer(state, trimmed, context);
    if (trimmed) {
      S.addConsultation(state, { question: trimmed, scenario: result.scenario, title: result.title });
      state.assistant.query = trimmed;
      state.assistant.answer = result;
    }
    return result;
  }
  function refreshAnswer(state) {
    var current = state.assistant && state.assistant.answer;
    if (!current) return null;
    state.assistant.answer = answer(state, current.question, current.context);
    return state.assistant.answer;
  }
  var api = { suggestedPrompts: suggestedPrompts, recognize: recognize, answer: answer, submit: submit, refreshAnswer: refreshAnswer };
  root.SCAssistant = api;
  if (commonJS) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
