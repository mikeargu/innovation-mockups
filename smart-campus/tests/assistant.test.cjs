const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
function optional(name) { const file = path.join(__dirname, '..', name); return fs.existsSync(file) ? require(file) : {}; }
const D = optional('data.js'); const S = optional('state.js'); const A = optional('demo-ai.js');
function state() { assert.equal(typeof S.createState, 'function', 'createState is not implemented'); assert.equal(typeof A.answer, 'function', 'scripted assistant is not implemented'); return S.createState(); }
const date = '2026-10-07';

const query = 'Necesito una sala en la biblioteca el viernes 9 de octubre a las 11:00 para 4 personas';

test('exact user query resolves date, hour and group and offers room 4 without booking', () => {
  const a = state(); const result = A.answer(a, query);
  assert.equal(result.scenario, 'library-booking'); assert.equal(result.question, query);
  assert.deepEqual({ date: result.request.date, hour: result.request.hour, capacity: result.request.capacity }, { date: '2026-10-09', hour: 11, capacity: 4 });
  assert.deepEqual(result.request.defaults, []);
  assert.deepEqual(result.options, S.findRoomOptions(a, { date: '2026-10-09', hour: 11, capacity: 4 }));
  assert.equal(result.options[0].spaceId, 'library-room-4');
  assert.deepEqual(result.actions[0], { type: 'book-room', label: 'Revisar reserva', spaceId: 'library-room-4', roomId: 'library-room-4', date: '2026-10-09', hour: 11, capacity: 4 });
  assert.match(result.body, /Sala de estudio · 4 personas está disponible el viernes 9 de octubre de 2026, de 11:00 a 12:00, para un grupo de 4/);
  assert.equal(a.reservations.length, 0); assert.equal(a.history.length, 0);
});

test('six-person prompt still maps to library-booking with capacity 6', () => {
  const a = state(); const result = A.answer(a, 'Necesito una sala de biblioteca para seis personas', { date, hour: 11 });
  assert.equal(result.scenario, 'library-booking'); assert.equal(result.request.capacity, 6);
  assert.deepEqual(result.options, S.findRoomOptions(a, { date, hour: 11, capacity: 6 }));
  assert.equal(result.options[0].spaceId, 'library-room-6'); assert.equal(result.actions[0].capacity, 6);
  assert.equal(a.reservations.length, 0); assert.equal(a.history.length, 0);
});

test('missing pieces fall back to the booking draft and are reported', () => {
  const a = state(); a.bookingDraft.date = '2026-10-08'; a.bookingDraft.hour = 12;
  const result = A.answer(a, 'Sala para 4 personas');
  assert.deepEqual(result.request, { date: '2026-10-08', hour: 12, capacity: 4, defaults: ['date', 'hour'], outOfRange: [] });
  assert.match(result.body, /No indicaste la fecha y el horario/);
  const ctx = A.answer(a, 'Sala para 4 personas', { date, hour: 10 });
  assert.equal(ctx.request.date, date); assert.equal(ctx.request.hour, 10); assert.deepEqual(ctx.request.defaults, []);
});

test('date forms, hour forms and group words are parsed', () => {
  const a = state(); const parse = q => A.answer(a, q).request;
  assert.equal(parse('sala biblioteca 7 de octubre 4 personas').date, '2026-10-07');
  assert.equal(parse('sala biblioteca 8 oct 4 personas').date, '2026-10-08');
  assert.equal(parse('sala biblioteca el jueves').date, '2026-10-08');
  assert.equal(parse('sala biblioteca el miércoles').date, '2026-10-07');
  assert.equal(parse('sala biblioteca hoy').date, '2026-10-07');
  assert.equal(parse('sala biblioteca mañana').date, '2026-10-08');
  assert.equal(parse('sala biblioteca por la mañana el viernes').date, '2026-10-09');
  assert.equal(parse('sala biblioteca a las 15:00').hour, 15); assert.equal(parse('sala biblioteca 3 pm').hour, 15);
  assert.equal(parse('sala biblioteca 11 am').hour, 11); assert.equal(parse('sala biblioteca 14 h').hour, 14);
  assert.equal(parse('sala biblioteca a las 9').hour, 9);
  assert.equal(parse('sala biblioteca somos tres').capacity, 3); assert.equal(parse('sala biblioteca para ocho').capacity, 8);
  assert.equal(parse('sala biblioteca una persona').capacity, 1); assert.equal(parse('sala biblioteca para 2').capacity, 2);
});

test('day number and hour are not mistaken for the group size', () => {
  const r = A.answer(state(), 'Sala biblioteca el 9 de octubre a las 11 para 3 personas').request;
  assert.deepEqual([r.date, r.hour, r.capacity], ['2026-10-09', 11, 3]);
  const d = state(); const r2 = A.answer(d, 'Sala biblioteca el 9 de octubre a las 11').request;
  assert.deepEqual([r2.date, r2.hour, r2.capacity, r2.defaults], ['2026-10-09', 11, 6, ['capacity']]);
});

test('requests outside demo limits explain them and offer nothing', () => {
  const a = state();
  for (const [q, field] of [['sala biblioteca el 10 de octubre a las 11 para 4 personas', 'date'], ['sala biblioteca el sábado', 'date'], ['sala biblioteca el lunes', 'date'],
    ['sala biblioteca el viernes a las 8 para 4 personas', 'hour'], ['sala biblioteca el viernes a las 18:00', 'hour'], ['sala biblioteca el viernes a las 11:30', 'hour'],
    ['sala biblioteca el viernes a las 11 para 9 personas', 'capacity'], ['sala biblioteca el viernes a las 11 para 12 personas', 'capacity']]) {
    const result = A.answer(a, q);
    assert.equal(result.supported, true, q); assert.ok(result.request.outOfRange.includes(field), q);
    assert.deepEqual(result.options, []); assert.deepEqual(result.actions, []);
    assert.match(result.body, /7 al 9 de octubre de 2026/); assert.match(result.body, /09:00/); assert.match(result.body, /8 personas/);
  }
  assert.equal(a.reservations.length, 0);
});

test('unavailable block gives nearest alternatives at other hours and says so', () => {
  const a = state(); S.reserveRoom(a, { roomId: 'library-room-4', date: '2026-10-09', hour: 11, capacity: 4 });
  const result = A.answer(a, query);
  assert.match(result.body, /No hay una sala libre/); assert.ok(result.options.length > 0 && result.options.length <= 3);
  assert.ok(result.options.every(o => o.hour !== 11 && o.date === '2026-10-09' && o.capacity >= 4));
  const dist = result.options.map(o => Math.abs(o.hour - 11)); assert.deepEqual(dist, dist.slice().sort((x, y) => x - y));
  assert.equal(result.actions.length, result.options.length);
  result.actions.forEach((x, i) => { assert.equal(x.hour, result.options[i].hour); assert.equal(x.capacity, 4); });
  assert.equal(a.reservations.length, 1);
});

test('fully booked hour for a large group falls back to other hours', () => {
  const a = state(); const result = A.answer(a, 'Sala biblioteca hoy a las 10 para 8 personas');
  assert.deepEqual(S.findRoomOptions(a, { date, hour: 10, capacity: 8 }), []);
  assert.match(result.body, /No hay una sala libre/); assert.ok(result.options.length > 0);
  assert.ok(result.options.every(o => o.hour !== 10 && o.spaceId === 'library-room-8'));
});

test('3D lab example repeats fixture requirements and directs procedure without access', () => {
  const a = state(); const result = A.answer(a, '¿Qué necesito para impresión 3D?');
  const lab = S.getSpace('lab-3d'); assert.equal(result.scenario, 'lab-3d');
  assert.equal(result.options[0].spaceId, lab.id);
  assert.ok(lab.requirements.every(x => result.body.includes(x)));
  assert.ok(result.body.includes(lab.procedure)); assert.equal(result.actions[0].type, 'view-space');
  assert.match(result.limitations.join(' '), /no.*(autoriza|otorga|concede)/i);
  assert.equal(a.attendance.length + a.reservations.length, 0);
});

test('quiet gym example exactly reuses fixture ranking from direct path', () => {
  const a = state(); const result = A.answer(a, '¿A qué hora está más tranquilo el gimnasio?', { gymId: 'gym-profesional', date });
  assert.equal(result.scenario, 'gym-quiet');
  assert.deepEqual(result.options, S.recommendGymBlocks('gym-profesional', date).slice(0, 3));
  assert.deepEqual(result.actions.map(x => x.type), ['view-gym', 'view-gym', 'view-gym']); assert.deepEqual(result.actions[0], { type: 'view-gym', label: 'Ver gimnasio', spaceId: 'gym-profesional', gymId: 'gym-profesional' });
  assert.match(result.body, /QR/);
  assert.equal(a.attendance.length, 0); assert.match(result.body, /estimad/i);
});

test('keyword recognition handles accents and suggested prompts cover three scenarios', () => {
  state(); assert.equal(A.recognize('SALA PARA SEIS EN BIBLIOTECA'), 'library-booking');
  assert.equal(A.recognize('Impresión 3D'), 'lab-3d'); assert.equal(A.recognize('Gimnasio con menos gente'), 'gym-quiet');
  assert.equal(A.recognize(''), 'blank'); assert.equal(A.recognize('¿Dónde compro un café?'), 'unsupported');
  assert.equal(A.recognize('Laboratorio 3D para estudiantes'), 'lab-3d');
  assert.equal(A.suggestedPrompts.length, 4); assert.equal(A.suggestedPrompts[0], query); assert.equal(new Set(A.suggestedPrompts.map(A.recognize)).size, 3);
});

test('blank and unsupported questions never create operations or fabricated options', () => {
  const a = state(); const original = JSON.stringify(a);
  for (const question of ['', '   ', 'Reserva todo automáticamente', '¿Cuánto cuesta mi colegiatura?']) {
    const result = A.answer(a, question); assert.equal(result.supported, false); assert.deepEqual(result.actions, []); assert.deepEqual(result.options, []);
  }
  assert.equal(JSON.stringify(a), original);
  A.submit(a, ' '); assert.equal(a.history.length, 0);
  A.submit(a, '¿Dónde compro un café?'); assert.equal(a.history.length, 1); assert.equal(a.history[0].scenario, 'unsupported');
  assert.equal(a.attendance.length + a.reservations.length, 0);
});

test('only submission records consultations and saves displayable assistant answer', () => {
  const a = state(); A.answer(a, A.suggestedPrompts[0]); assert.equal(a.history.length, 0);
  const result = A.submit(a, '  Impresión 3D  ');
  assert.equal(a.history.length, 1); assert.equal(a.history[0].question, 'Impresión 3D'); assert.equal(a.assistant.query, 'Impresión 3D');
  assert.deepEqual(a.assistant.answer, result); assert.equal(result.source.fictional, true);
  assert.deepEqual(a.favorites, []); assert.deepEqual(a.reservations, []); assert.deepEqual(a.attendance, []);
});

test('refreshAnswer recomputes the stored answer from current state without touching history', () => {
  const a = state(); assert.equal(A.refreshAnswer(a), null);
  A.submit(a, query); assert.equal(a.assistant.answer.options[0].spaceId, 'library-room-4');
  S.reserveRoom(a, { roomId: 'library-room-4', date: '2026-10-09', hour: 11, capacity: 4 });
  const refreshed = A.refreshAnswer(a);
  assert.deepEqual(a.assistant.answer, refreshed); assert.match(refreshed.body, /No hay una sala libre/);
  assert.ok(refreshed.options.every(o => o.hour !== 11)); assert.equal(a.history.length, 1);
  const c = state(); A.submit(c, 'Sala de biblioteca para seis personas', { date, hour: 11 }); S.reserveRoom(c, { roomId: 'library-room-6', date, hour: 11, capacity: 6 });
  assert.equal(A.refreshAnswer(c).request.hour, 11);
});
