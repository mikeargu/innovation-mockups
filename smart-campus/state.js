(function (root) {
  'use strict';
  var D = typeof module === 'object' && module.exports ? require('./data.js') : root.SCData;
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function normalize(value) {
    return String(value == null ? '' : value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
  function getSpace(id) { return D.spaces.find(function (space) { return space.id === id; }) || null; }
  function validDate(date) { return D.dates.some(function (item) { return item.value === date; }); }
  function failure(code, message) { return { ok: false, code: code, message: message }; }

  function createState() {
    return {
      account: copy(D.account),
      explore: { query: '', mode: 'map', category: 'all', minCapacity: 0 },
      bookingDraft: { roomId: 'library-room-6', date: D.demoDate, hour: 11, capacity: 6 },
      attendanceDraft: { gymId: 'gym-profesional', duration: 1, type: 'pecho' },
      gymView: { date: D.demoDate }, arrival: null,
      reservations: [], attendance: [], favorites: [], history: [],
      assistant: { query: '', answer: null },
      nextIds: { reservation: 1, attendance: 1, consultation: 1, arrival: 1 }
    };
  }
  function resetState(state) {
    Object.keys(state).forEach(function (key) { delete state[key]; });
    return Object.assign(state, createState());
  }

  function searchSpaces(state, overrides) {
    var filters = Object.assign({}, state.explore, overrides || {});
    var query = normalize(filters.query);
    var minCapacity = Number(filters.minCapacity) || 0;
    return D.spaces.filter(function (space) {
      if (filters.category && filters.category !== 'all' && space.category !== filters.category) return false;
      if (minCapacity > 0 && (space.capacity == null || space.capacity < minCapacity)) return false;
      var text = [space.name, space.description, space.category, space.location.label, space.location.zone,
        space.capacity == null ? '' : space.capacity + ' personas']
        .concat(space.resources, space.software, space.requirements).join(' ');
      return !query || normalize(text).includes(query);
    });
  }

  function isLibraryRoom(space) { return space && space.category === 'library' && space.reservable === true; }
  function validateBooking(input) {
    input = input || {};
    var space = getSpace(input.roomId);
    if (!isLibraryRoom(space)) return failure('invalid-room', 'Solo las salas de uso general de biblioteca admiten reservas de ejemplo.');
    if (!validDate(input.date)) return failure('invalid-date', 'Selecciona una fecha de la demostración: 7, 8 o 9 de octubre de 2026.');
    if (!Number.isInteger(input.hour) || input.hour < 9 || input.hour > 17) return failure('invalid-hour', 'Selecciona un bloque de una hora entre 09:00 y 18:00.');
    if (!Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > space.capacity) return failure('invalid-capacity', 'La cantidad de personas debe estar dentro de la capacidad de la sala.');
    return null;
  }
  function slotReason(state, roomId, date, hour) {
    if (D.libraryOccupancy.some(function (slot) { return slot.roomId === roomId && slot.date === date && slot.hour === hour; })) return 'occupied-fixture';
    if (state.reservations.some(function (slot) { return slot.status === 'confirmed' && slot.roomId === roomId && slot.date === date && slot.hour === hour; })) return 'reserved';
    if (state.reservations.some(function (slot) { return slot.status === 'confirmed' && slot.userId === state.account.id && slot.date === date && slot.hour === hour; })) return 'user-conflict';
    return null;
  }
  function getLibrarySlots(state, input) {
    input = input || {};
    if (validateBooking(Object.assign({}, input, { hour: 9, capacity: input.capacity === undefined ? 1 : input.capacity }))) return [];
    var slots = [];
    for (var hour = 9; hour <= 17; hour++) {
      var reason = slotReason(state, input.roomId, input.date, hour);
      slots.push({ spaceId: input.roomId, roomId: input.roomId, date: input.date, hour: hour, endHour: hour + 1,
        available: reason === null, status: reason === null ? 'available' : 'unavailable', reason: reason });
    }
    return slots;
  }
  function findRoomOptions(state, input) {
    input = input || {};
    if (!validDate(input.date) || !Number.isInteger(input.hour) || input.hour < 9 || input.hour > 17 || !Number.isInteger(input.capacity) || input.capacity < 1) return [];
    return D.spaces.filter(function (space) {
      return isLibraryRoom(space) && space.capacity >= input.capacity && slotReason(state, space.id, input.date, input.hour) === null;
    }).sort(function (a, b) { return a.capacity - b.capacity || a.name.localeCompare(b.name, 'es'); })
      .map(function (space) { return { spaceId: space.id, roomId: space.id, name: space.name, capacity: space.capacity,
        date: input.date, hour: input.hour, endHour: input.hour + 1 }; });
  }
  function roomAlternatives(state, input) {
    var options = [];
    for (var hour = 9; hour <= 17; hour++) {
      options = options.concat(findRoomOptions(state, { date: input.date, hour: hour, capacity: input.capacity }));
    }
    return options.sort(function (a, b) {
      return Math.abs(a.hour - input.hour) - Math.abs(b.hour - input.hour) || a.capacity - b.capacity || a.hour - b.hour;
    }).slice(0, 3);
  }
  function findRoomAlternatives(state, input) {
    return validateBooking(input) ? [] : roomAlternatives(state, input);
  }
  function reserveRoom(state, input) {
    var invalid = validateBooking(input);
    if (invalid) return invalid;
    var reason = slotReason(state, input.roomId, input.date, input.hour);
    if (reason) return {
      ok: false, code: reason === 'user-conflict' ? 'user-conflict' : 'unavailable',
      message: reason === 'user-conflict' ? 'Ya tienes una reserva confirmada en ese bloque. Revisa otro horario.' : 'Ese bloque no está disponible. Revisa las alternativas.',
      alternatives: findRoomAlternatives(state, input)
    };
    var space = getSpace(input.roomId);
    var reservation = {
      id: 'reservation-' + state.nextIds.reservation++, userId: state.account.id,
      roomId: space.id, spaceId: space.id, name: space.name, date: input.date,
      hour: input.hour, endHour: input.hour + 1, capacity: input.capacity, status: 'confirmed'
    };
    state.reservations.push(reservation);
    return { ok: true, reservation: reservation };
  }
  function cancelReservation(state, id) {
    var reservation = state.reservations.find(function (item) { return item.id === id; });
    if (!reservation) return failure('not-found', 'No se encontró la reserva.');
    if (reservation.userId !== state.account.id) return failure('not-owner', 'Solo puedes cancelar tus propias reservas.');
    if (reservation.status !== 'confirmed') return failure('not-confirmed', 'La reserva ya no está confirmada.');
    reservation.status = 'cancelled';
    return { ok: true, reservation: reservation };
  }

  function getGymBlocks(gymId, date) {
    var space = getSpace(gymId);
    if (!space || space.category !== 'gyms' || !validDate(date)) return [];
    return D.gymOccupancy[gymId][date].map(function (block) {
      return Object.assign({ spaceId: gymId, gymId: gymId, name: space.name, date: date }, block);
    });
  }
  function recommendGymBlocks(gymId, date) {
    return getGymBlocks(gymId, date).filter(function (block) { return block.status === 'open' && Number.isFinite(block.occupancyPercent); })
      .sort(function (a, b) { return a.occupancyPercent - b.occupancyPercent || a.hour - b.hour; });
  }
  function getGym(id) { var space = getSpace(id); return space && space.category === 'gyms' ? space : null; }
  function clock(now) { return now === undefined ? Date.now() : now; }
  function invalidTime() { return failure('invalid-time', 'No se pudo leer la hora actual. Intenta de nuevo.'); }
  function isLive(record, now) { return record.status === 'active' && record.plannedEndAt > now; }
  function liveSession(state, now) { return state.attendance.find(function (record) { return isLive(record, now); }) || null; }
  function activeFailure(record) {
    return failure('active-session', 'Ya tienes un entrenamiento en curso en ' + record.name + '. Usa «Finalizar entrenamiento» antes de registrar una nueva asistencia.');
  }
  function endSession(record, endedAt, reason) {
    record.status = 'finished'; record.endedAt = endedAt; record.endReason = reason;
    return record;
  }
  function syncGymSessions(state, now) {
    now = clock(now);
    if (!Number.isFinite(now)) return invalidTime();
    var finished = state.attendance.filter(function (record) { return record.status === 'active' && record.plannedEndAt <= now; })
      .map(function (record) { return endSession(record, record.plannedEndAt, 'timeout'); });
    return { ok: true, finished: finished };
  }
  function verifyGymArrival(state, input) {
    input = input || {};
    var gym = getGym(input.gymId), now = clock(input.now);
    if (!gym) return failure('invalid-gym', 'Selecciona uno de los dos gimnasios.');
    if (!Number.isFinite(now)) return invalidTime();
    var code = String(input.code == null ? '' : input.code).trim();
    if (code !== D.gymEntryCodes[gym.id]) {
      var owner = Object.keys(D.gymEntryCodes).find(function (id) { return D.gymEntryCodes[id] === code; });
      return failure('invalid-code', owner
        ? 'Este QR pertenece a otro gimnasio (' + getSpace(owner).name + '). Escanea el QR de la entrada de ' + gym.name + '.'
        : 'No reconocimos este código. Escanea el QR de la entrada de ' + gym.name + '.');
    }
    var active = liveSession(state, now);
    if (active) return activeFailure(active);
    syncGymSessions(state, now);
    state.arrival = { id: 'arrival-' + state.nextIds.arrival++, gymId: gym.id, code: code, verifiedAt: now,
      expiresAt: now + D.gymRules.arrivalWindowMs, method: 'qr-simulated', status: 'verified' };
    return { ok: true, arrival: copy(state.arrival) };
  }
  function startGymSession(state, input) {
    input = input || {};
    var gym = getGym(input.gymId), now = clock(input.now), arrival = state.arrival;
    if (!gym) return failure('invalid-gym', 'Selecciona uno de los dos gimnasios.');
    if (!Number.isFinite(now)) return invalidTime();
    if (!arrival || arrival.status !== 'verified') return failure('arrival-required', 'Escanea el QR de la entrada del gimnasio antes de registrar tu asistencia.');
    if (arrival.gymId !== gym.id) return failure('arrival-other-gym', 'Tu llegada se verificó en otro gimnasio. Escanea el QR de la entrada de ' + gym.name + '.');
    if (now >= arrival.expiresAt) return failure('arrival-expired', 'La verificación de llegada expiró. Escanea de nuevo el QR de la entrada.');
    if (D.gymRules.durations.indexOf(input.duration) === -1) return failure('invalid-duration', 'Selecciona una duración de 1 o 1.5 horas.');
    if (D.trainingTypes.indexOf(input.type) === -1) return failure('invalid-type', 'Selecciona un tipo de entrenamiento de la lista.');
    var active = liveSession(state, now);
    if (active) return activeFailure(active);
    syncGymSessions(state, now);
    var record = {
      id: 'attendance-' + state.nextIds.attendance++, kind: 'attendance', gymId: gym.id, spaceId: gym.id, name: gym.name, date: D.demoDate,
      startedAt: now, plannedEndAt: now + input.duration * 3600000, endedAt: null, endReason: null,
      duration: input.duration, type: input.type, account: copy(state.account),
      verification: { method: arrival.method, arrivalId: arrival.id, verifiedAt: arrival.verifiedAt },
      status: 'active', grantsAccess: false
    };
    state.attendance.push(record);
    state.arrival = null;
    return { ok: true, attendance: record };
  }
  function finishGymSession(state, id, input) {
    input = input || {};
    var reason = input.reason === undefined ? 'manual' : input.reason, now = clock(input.now);
    if (reason !== 'manual' && reason !== 'timeout') return failure('invalid-reason', 'Motivo de cierre no válido.');
    if (!Number.isFinite(now)) return invalidTime();
    var record = state.attendance.find(function (item) { return item.id === id; });
    if (!record) return failure('not-found', 'No se encontró el registro de asistencia.');
    if (record.account.id !== state.account.id) return failure('not-owner', 'Solo puedes finalizar tus propios entrenamientos.');
    if (record.status !== 'active') return failure('not-active', 'Este entrenamiento ya finalizó.');
    if (reason === 'timeout' && now < record.plannedEndAt) return failure('not-expired', 'El tiempo del entrenamiento aún no termina.');
    var expired = now >= record.plannedEndAt;
    return { ok: true, attendance: endSession(record, expired ? record.plannedEndAt : now, expired ? 'timeout' : 'manual') };
  }
  function getActiveGymSession(state, now) {
    var record = liveSession(state, clock(now));
    return record ? copy(record) : null;
  }
  function getSessionRemainingMs(session, now) {
    if (!session || session.status !== 'active') return 0;
    return Math.max(0, session.plannedEndAt - clock(now));
  }
  function getGymPresence(state, gymId, now) {
    now = clock(now);
    return { gymId: gymId, activeSessions: state.attendance.filter(function (record) { return record.gymId === gymId && isLive(record, now); }).length };
  }
  function toggleFavorite(state, spaceId) {
    if (!getSpace(spaceId)) return failure('invalid-space', 'Ese espacio no existe en el catálogo.');
    var index = state.favorites.indexOf(spaceId);
    if (index === -1) state.favorites.push(spaceId);
    else state.favorites.splice(index, 1);
    return { ok: true, favorite: index === -1, spaceId: spaceId };
  }
  function addConsultation(state, input) {
    input = input || {};
    var question = String(input.question == null ? '' : input.question).trim();
    if (!question) return failure('blank-question', 'Escribe una consulta.');
    var record = { id: 'consultation-' + state.nextIds.consultation++, question: question,
      scenario: input.scenario || 'unsupported', title: input.title || 'Consulta de ejemplo', date: D.demoDate };
    state.history.push(record);
    return { ok: true, consultation: record };
  }
  function clearConsultations(state) { state.history.length = 0; return { ok: true }; }

  var api = {
    createState: createState, resetState: resetState, normalize: normalize, getSpace: getSpace, searchSpaces: searchSpaces,
    getLibrarySlots: getLibrarySlots, findRoomOptions: findRoomOptions, findRoomAlternatives: findRoomAlternatives, reserveRoom: reserveRoom, cancelReservation: cancelReservation,
    getGymBlocks: getGymBlocks, recommendGymBlocks: recommendGymBlocks,
    verifyGymArrival: verifyGymArrival, startGymSession: startGymSession, finishGymSession: finishGymSession, syncGymSessions: syncGymSessions,
    getActiveGymSession: getActiveGymSession, getSessionRemainingMs: getSessionRemainingMs, getGymPresence: getGymPresence,
    toggleFavorite: toggleFavorite, addConsultation: addConsultation, clearConsultations: clearConsultations
  };
  root.SCState = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
