const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function optional(name) {
  const file = path.join(__dirname, '..', name);
  return fs.existsSync(file) ? require(file) : {};
}
const D = optional('data.js');
const S = optional('state.js');
function state() {
  assert.equal(typeof S.createState, 'function', 'createState is not implemented');
  return S.createState();
}
const room = 'library-room-6';
const date = '2026-10-07';
const booking = (extra = {}) => ({ roomId: room, date, hour: 11, capacity: 6, ...extra });
const T0 = Date.parse('2026-10-07T11:00:00-06:00');
const MIN = 60000, HOUR = 60 * MIN;
const PRO = 'gym-profesional', PREPA = 'gym-prepatec';
const qr = gymId => D.gymEntryCodes[gymId];
const scan = (a, extra = {}) => S.verifyGymArrival(a, { gymId: PRO, code: qr(extra.gymId || PRO), now: T0, ...extra });
const session = (extra = {}) => ({ gymId: PRO, duration: 1, type: 'pecho', now: T0 + MIN, ...extra });
function start(a, extra = {}) {
  const at = extra.now === undefined ? T0 + MIN : extra.now;
  assert.equal(scan(a, { gymId: extra.gymId || PRO, now: at - MIN }).ok, true);
  return S.startGymSession(a, session({ ...extra, now: at }));
}
function unchanged(a, fn) { const before = JSON.parse(JSON.stringify(a)); const result = fn(); assert.deepEqual(a, before); return result; }

test('catalog covers nine categories and required conceptual fixtures with provenance', () => {
  assert.ok(Array.isArray(D.categories), 'category fixtures are not implemented');
  assert.equal(D.categories.length, 9);
  assert.deepEqual(D.spaces.filter(x => x.category === 'library').map(x => x.capacity), [2, 4, 6, 8]);
  assert.equal(D.spaces.filter(x => x.category === 'gyms').length, 2);
  assert.equal(D.spaces.filter(x => x.category === 'labs').length, 2);
  for (const category of D.categories) assert.ok(D.spaces.some(x => x.category === category.id));
  for (const space of D.spaces) {
    for (const key of ['id', 'name', 'category', 'location', 'hours', 'resources', 'software', 'requirements', 'responsibleArea', 'procedure', 'source']) assert.ok(space[key] !== undefined, `${space.id}: ${key}`);
    assert.equal(space.source.fictional, true);
    assert.equal(space.source.updatedAt, date);
    assert.ok(Number.isFinite(space.location.x) && Number.isFinite(space.location.y));
  }
  const pool = D.spaces.find(x => x.category === 'pool');
  assert.match(JSON.stringify(pool), /Tier 2/);
  assert.match(JSON.stringify(pool), /fictici/);
  assert.match(pool.procedure, /no.*(permiso|acceso)/i);
});

test('account and three Spanish date labels are explicitly fictional and fixed', () => {
  assert.ok(D.account, 'account fixture is not implemented');
  assert.match(D.account.matricula, /DEMO/);
  assert.equal(D.account.fictional, true);
  assert.equal(D.account.level, 'Profesional');
  assert.ok(D.account.semester >= 1 && D.account.semester <= 8);
  assert.equal(D.demoDate, date);
  assert.deepEqual(D.dates.map(x => x.value), [date, '2026-10-08', '2026-10-09']);
  assert.ok(D.dates.every(x => /octubre/.test(x.label)));
});

test('fresh states are independent and reset restores all original fields in place', () => {
  const a = state(); const b = state();
  a.account.name = 'Cambio'; a.explore.query = 'laboratorio'; a.favorites.push(room);
  a.reservations.push({ id: 'x' }); a.attendance.push({ id: 'x' }); a.history.push({ id: 'x' });
  a.assistant.query = 'Cambio'; a.assistant.answer = {}; a.bookingDraft.hour = 17; a.attendanceDraft.type = 'otro';
  a.gymView.date = '2026-10-09'; a.arrival = { id: 'x' }; a.nextIds.arrival = 9;
  assert.notEqual(b.account.name, 'Cambio'); assert.deepEqual(b.favorites, []);
  assert.equal(S.resetState(a), a);
  assert.deepEqual(a, b);
});

test('search is accent and case insensitive across software, capacity, resources and requirements', () => {
  const a = state();
  assert.ok(S.searchSpaces(a, { query: 'ROBÓTICA' }).some(x => x.id === 'lab-robotics'));
  assert.ok(S.searchSpaces(a, { query: 'solidworks' }).some(x => x.category === 'computers'));
  assert.ok(S.searchSpaces(a, { query: '6 personas' }).some(x => x.id === room));
  assert.ok(S.searchSpaces(a, { query: 'pizarrón' }).some(x => x.category === 'library'));
  assert.ok(S.searchSpaces(a, { query: 'inducción' }).some(x => x.id === 'lab-3d'));
});

test('explore query, category and minimum capacity filters combine', () => {
  const a = state(); a.explore = { query: 'sala', category: 'library', minCapacity: 6, mode: 'map' };
  assert.deepEqual(S.searchSpaces(a).map(x => x.capacity), [6, 8]);
  assert.equal(S.searchSpaces(a, { category: 'pool', minCapacity: 500 }).length, 0);
  assert.equal(S.searchSpaces(a, { query: 'inexistente', category: 'all', minCapacity: 0 }).length, 0);
});

test('library offers one-hour starts 9 to 17 and fixture occupancy', () => {
  const a = state(); const slots = S.getLibrarySlots(a, booking());
  assert.deepEqual(slots.map(x => x.hour), [9, 10, 11, 12, 13, 14, 15, 16, 17]);
  assert.ok(slots.every(x => x.endHour === x.hour + 1));
  assert.equal(slots.find(x => x.hour === 10).available, false);
  assert.equal(slots.find(x => x.hour === 11).available, true);
  assert.deepEqual(S.getLibrarySlots(a, booking({ date: '2026-10-10' })), []);
});

test('explicit reservation saves the student and updates availability only on invocation', () => {
  const a = state(); S.findRoomOptions(a, { date, hour: 11, capacity: 6 });
  assert.equal(a.reservations.length, 0);
  const result = S.reserveRoom(a, booking());
  assert.equal(result.ok, true); assert.equal(a.reservations.length, 1);
  assert.equal(result.reservation.userId, a.account.id);
  assert.equal(result.reservation.status, 'confirmed');
  assert.equal(S.getLibrarySlots(a, booking()).find(x => x.hour === 11).available, false);
  assert.equal(a.attendance.length, 0);
});

test('occupied fixture slot returns real available alternatives without reserving', () => {
  const a = state(); const result = S.reserveRoom(a, booking({ hour: 10 }));
  assert.equal(result.ok, false); assert.equal(result.code, 'unavailable');
  assert.ok(result.alternatives.length > 0); assert.equal(a.reservations.length, 0);
  for (const option of result.alternatives) assert.ok(S.findRoomOptions(a, option).some(x => x.spaceId === option.spaceId));
});

test('same room, date and hour cannot be booked twice', () => {
  const a = state(); S.reserveRoom(a, booking());
  assert.equal(S.reserveRoom(a, booking()).ok, false); assert.equal(a.reservations.length, 1);
});

test('student cannot overlap bookings across different rooms', () => {
  const a = state(); S.reserveRoom(a, booking());
  const result = S.reserveRoom(a, booking({ roomId: 'library-room-8' }));
  assert.equal(result.ok, false); assert.equal(result.code, 'user-conflict');
  assert.ok(result.alternatives.every(x => x.hour !== 11));
  assert.equal(S.reserveRoom(a, booking({ roomId: 'library-room-8', hour: 12 })).ok, true);
});

test('room alternatives prefer fitting capacity before earlier hour at equal distance', () => {
  const a = state(); S.reserveRoom(a, booking({ capacity: 2 }));
  const result = S.reserveRoom(a, booking({ roomId: 'library-room-8', capacity: 2 }));
  assert.equal(result.code, 'user-conflict');
  assert.deepEqual(result.alternatives.map(x => [x.spaceId, x.hour]), [
    ['library-room-2', 12], ['library-room-4', 10], ['library-room-4', 12]
  ]);
});

test('public room alternatives query validates input and matches conflict results without mutation', () => {
  assert.equal(typeof S.findRoomAlternatives, 'function', 'findRoomAlternatives is not implemented');
  const a = state(); const original = JSON.stringify(a); const input = booking({ hour: 10 });
  const options = S.findRoomAlternatives(a, input);
  assert.ok(options.length > 0);
  assert.deepEqual(options, S.reserveRoom(a, input).alternatives);
  for (const invalid of [{ roomId: 'missing' }, { date: '2026-10-10' }, { hour: 18 }, { capacity: 7 }]) {
    assert.deepEqual(S.findRoomAlternatives(a, booking(invalid)), []);
  }
  assert.deepEqual(S.findRoomAlternatives(a, null), []);
  assert.equal(JSON.stringify(a), original);
});

test('booking rejects non-library and missing spaces', () => {
  const a = state();
  for (const roomId of ['gym-profesional', 'lab-3d', 'classroom-flex', 'missing']) {
    assert.equal(S.reserveRoom(a, booking({ roomId })).ok, false);
  }
  assert.equal(a.reservations.length, 0);
});

test('booking rejects invalid dates, hours and requested capacities', () => {
  const a = state();
  for (const extra of [{ date: '2026-10-06' }, { date: null }, { hour: 8 }, { hour: 18 }, { hour: 11.5 }, { hour: '11' }, { capacity: 0 }, { capacity: 7 }, { capacity: -1 }, { capacity: 1.5 }, { capacity: '6' }]) {
    assert.equal(S.reserveRoom(a, booking(extra)).ok, false, JSON.stringify(extra));
  }
  assert.equal(a.reservations.length, 0);
});

test('six-person room options rank fitting rooms and share direct availability', () => {
  const a = state(); const options = S.findRoomOptions(a, { date, hour: 11, capacity: 6 });
  assert.deepEqual(options.map(x => x.spaceId), [room, 'library-room-8']);
  assert.equal(S.findRoomOptions(a, { date, hour: 11, capacity: 9 }).length, 0);
  for (const option of options) assert.equal(S.getLibrarySlots(a, { ...option, roomId: option.spaceId }).find(x => x.hour === 11).available, true);
});

test('cancelling own confirmed reservation restores availability while fixtures persist', () => {
  const a = state(); const saved = S.reserveRoom(a, booking()).reservation;
  assert.equal(S.cancelReservation(a, saved.id).ok, true);
  assert.equal(a.reservations[0].status, 'cancelled');
  const slots = S.getLibrarySlots(a, booking());
  assert.equal(slots.find(x => x.hour === 11).available, true);
  assert.equal(slots.find(x => x.hour === 10).available, false);
  assert.equal(S.reserveRoom(a, booking()).ok, true);
});

test('unknown, foreign and already cancelled reservations cannot be cancelled', () => {
  const a = state(); assert.equal(S.cancelReservation(a, 'missing').ok, false);
  const saved = S.reserveRoom(a, booking()).reservation;
  saved.userId = 'other'; assert.equal(S.cancelReservation(a, saved.id).ok, false);
  saved.userId = a.account.id; S.cancelReservation(a, saved.id);
  assert.equal(S.cancelReservation(a, saved.id).ok, false);
});

test('gym blocks cover 7 to 18 starts with known, closed and unknown samples', () => {
  state(); const blocks = S.getGymBlocks('gym-profesional', date);
  assert.deepEqual(blocks.map(x => x.hour), [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
  assert.ok(blocks.some(x => x.status === 'closed')); assert.ok(blocks.some(x => x.status === 'unknown'));
  assert.ok(blocks.filter(x => x.status === 'open').every(x => Number.isFinite(x.occupancyPercent) && x.occupancyPercent >= 0 && x.occupancyPercent <= 100));
  assert.ok(blocks.every(x => x.endHour === x.hour + 1 && x.estimated === true));
});

test('gym recommendation ranks lowest known open occupancy with earliest tie', () => {
  state(); const options = S.recommendGymBlocks('gym-profesional', date);
  assert.equal(options[0].hour, 11); assert.equal(options[1].hour, 12);
  assert.equal(options[0].occupancyPercent, 18);
  assert.ok(options.every(x => x.status === 'open' && Number.isFinite(x.occupancyPercent)));
  const source = S.getGymBlocks('gym-profesional', date);
  assert.ok(options.every(x => source.some(y => y.hour === x.hour && y.occupancyPercent === x.occupancyPercent)));
});

test('unknown gym and invalid dates cannot produce blocks or recommendations', () => {
  state();
  assert.deepEqual(S.getGymBlocks('missing', date), []);
  assert.deepEqual(S.getGymBlocks('gym-profesional', '2026-10-10'), []);
  assert.deepEqual(S.recommendGymBlocks('pool-main', date), []);
});

test('gym fixtures expose fictional entry QR codes and frozen arrival rules', () => {
  assert.deepEqual(D.gymEntryCodes, { [PRO]: 'SC-QR-ENTRADA-GYM-PROFESIONAL', [PREPA]: 'SC-QR-ENTRADA-GYM-PREPATEC' });
  assert.equal(D.gymRules.arrivalWindowMs, 10 * MIN);
  assert.deepEqual(D.gymRules.durations, [1, 1.5]);
  assert.ok(Object.isFrozen(D.gymEntryCodes) && Object.isFrozen(D.gymRules) && Object.isFrozen(D.gymRules.durations));
  assert.equal(S.registerAttendance, undefined);
});

test('attendance draft no longer chooses date or hour; gym view and arrival start clean', () => {
  const a = state();
  assert.deepEqual(a.attendanceDraft, { gymId: PRO, duration: 1, type: 'pecho' });
  assert.deepEqual(a.gymView, { date });
  assert.equal(a.arrival, null); assert.equal(a.nextIds.arrival, 1);
});

test('scanning the entrance QR verifies arrival for that gym with a 10 minute window', () => {
  const a = state(); const result = scan(a);
  assert.equal(result.ok, true);
  assert.deepEqual(result.arrival, { id: 'arrival-1', gymId: PRO, code: qr(PRO), verifiedAt: T0, expiresAt: T0 + 10 * MIN, method: 'qr-simulated', status: 'verified' });
  assert.deepEqual(a.arrival, result.arrival);
  const again = scan(a, { gymId: PREPA, now: T0 + MIN });
  assert.equal(again.arrival.id, 'arrival-2'); assert.equal(a.arrival.gymId, PREPA);
  assert.equal(a.attendance.length, 0);
});

test('scan rejects the other gym QR, unknown codes and non-gym spaces without mutation', () => {
  const a = state();
  const other = unchanged(a, () => scan(a, { code: qr(PREPA) }));
  assert.equal(other.code, 'invalid-code'); assert.match(other.message, /otro gimnasio/i);
  for (const code of ['SC-QR-FALSO', '', null, undefined]) assert.equal(unchanged(a, () => scan(a, { code })).code, 'invalid-code');
  assert.doesNotMatch(unchanged(a, () => scan(a, { code: 'SC-QR-FALSO' })).message, /otro gimnasio/i);
  for (const gymId of ['missing', room, undefined]) assert.equal(unchanged(a, () => scan(a, { gymId, code: qr(PRO) })).code, 'invalid-gym');
  assert.equal(unchanged(a, () => S.verifyGymArrival(a, null)).code, 'invalid-gym');
  assert.equal(unchanged(a, () => scan(a, { now: NaN })).code, 'invalid-time');
});

test('scan is blocked while a session is active in either gym', () => {
  const a = state(); assert.equal(start(a).ok, true);
  for (const gymId of [PRO, PREPA]) {
    const result = unchanged(a, () => scan(a, { gymId, now: T0 + 10 * MIN }));
    assert.equal(result.code, 'active-session'); assert.match(result.message, /Finalizar entrenamiento/);
  }
});

test('starting a session requires a verified, unexpired arrival at the same gym', () => {
  const a = state();
  assert.equal(unchanged(a, () => S.startGymSession(a, session())).code, 'arrival-required');
  scan(a);
  assert.equal(unchanged(a, () => S.startGymSession(a, session({ gymId: PREPA }))).code, 'arrival-other-gym');
  assert.equal(unchanged(a, () => S.startGymSession(a, session({ now: T0 + 10 * MIN }))).code, 'arrival-expired');
  assert.equal(S.startGymSession(a, session({ now: T0 + 10 * MIN - 1 })).ok, true);
});

test('session start validates gym, duration, training type and time', () => {
  const a = state(); scan(a);
  for (const [extra, code] of [[{ gymId: 'missing' }, 'invalid-gym'], [{ gymId: room }, 'invalid-gym'], [{ duration: 0 }, 'invalid-duration'], [{ duration: 2 }, 'invalid-duration'], [{ duration: '1' }, 'invalid-duration'],
    [{ type: 'box' }, 'invalid-type'], [{ type: null }, 'invalid-type'], [{ now: 'ahora' }, 'invalid-time']]) {
    assert.equal(unchanged(a, () => S.startGymSession(a, session(extra))).code, code, JSON.stringify(extra));
  }
  assert.equal(unchanged(a, () => S.startGymSession(a, null)).code, 'invalid-gym');
  for (const type of D.trainingTypes) {
    const b = state(); assert.equal(start(b, { type, duration: 1.5 }).ok, true, type);
  }
});

test('starting a session records a timed attendance snapshot and consumes the arrival', () => {
  const a = state(); scan(a);
  const result = S.startGymSession(a, session({ duration: 1.5, type: 'cardio' }));
  assert.equal(result.ok, true); assert.equal(a.arrival, null);
  assert.deepEqual(result.attendance, {
    id: 'attendance-1', kind: 'attendance', gymId: PRO, spaceId: PRO, name: 'Gimnasio Profesional', date,
    startedAt: T0 + MIN, plannedEndAt: T0 + MIN + 1.5 * HOUR, endedAt: null, endReason: null, duration: 1.5, type: 'cardio',
    account: a.account, verification: { method: 'qr-simulated', arrivalId: 'arrival-1', verifiedAt: T0 },
    status: 'active', grantsAccess: false
  });
  assert.equal(a.attendance.length, 1); assert.equal(a.reservations.length, 0);
  a.account.semester = 6; assert.equal(result.attendance.account.semester, 5);
  assert.equal(unchanged(a, () => S.startGymSession(a, session({ now: T0 + 2 * MIN }))).code, 'arrival-required');
});

test('overlapping sessions are impossible in the same gym or across gyms', () => {
  const a = state(); assert.equal(start(a).ok, true);
  a.arrival = { id: 'arrival-x', gymId: PREPA, code: qr(PREPA), verifiedAt: T0 + 30 * MIN, expiresAt: T0 + 40 * MIN, method: 'qr-simulated', status: 'verified' };
  assert.equal(unchanged(a, () => S.startGymSession(a, session({ gymId: PREPA, now: T0 + 31 * MIN }))).code, 'active-session');
  a.arrival.gymId = PRO; a.arrival.code = qr(PRO);
  assert.equal(unchanged(a, () => S.startGymSession(a, session({ now: T0 + 31 * MIN }))).code, 'active-session');
  assert.equal(a.attendance.length, 1);
});

test('finishing early records the real end time; a new session can start afterwards without overlap', () => {
  const a = state(); const record = start(a).attendance;
  const result = S.finishGymSession(a, record.id, { now: T0 + 20 * MIN, reason: 'manual' });
  assert.equal(result.ok, true);
  assert.equal(result.attendance.status, 'finished'); assert.equal(result.attendance.endReason, 'manual');
  assert.equal(result.attendance.endedAt, T0 + 20 * MIN); assert.equal(a.attendance[0].status, 'finished');
  assert.equal(S.getActiveGymSession(a, T0 + 20 * MIN), null);
  const next = start(a, { gymId: PREPA, now: T0 + 25 * MIN });
  assert.equal(next.ok, true); assert.ok(next.attendance.startedAt >= a.attendance[0].endedAt);
  assert.equal(unchanged(a, () => S.finishGymSession(a, record.id, { now: T0 + 30 * MIN, reason: 'manual' })).code, 'not-active');
});

test('manual finish after the planned end is clamped to the planned end', () => {
  const a = state(); const record = start(a).attendance;
  const result = S.finishGymSession(a, record.id, { now: record.plannedEndAt + 15 * MIN, reason: 'manual' });
  assert.equal(result.ok, true); assert.equal(result.attendance.endedAt, record.plannedEndAt);
  assert.equal(result.attendance.endReason, 'timeout');
});

test('timeout finish is only accepted at or after the planned end', () => {
  const a = state(); const record = start(a).attendance;
  const early = unchanged(a, () => S.finishGymSession(a, record.id, { now: record.plannedEndAt - 1, reason: 'timeout' }));
  assert.equal(early.code, 'not-expired');
  const result = S.finishGymSession(a, record.id, { now: record.plannedEndAt + 5000, reason: 'timeout' });
  assert.equal(result.ok, true); assert.equal(result.attendance.endedAt, record.plannedEndAt); assert.equal(result.attendance.endReason, 'timeout');
});

test('finish rejects unknown, foreign and invalid requests without mutation', () => {
  const a = state(); const record = start(a).attendance;
  assert.equal(unchanged(a, () => S.finishGymSession(a, 'missing', { now: T0 + 2 * MIN, reason: 'manual' })).code, 'not-found');
  assert.equal(unchanged(a, () => S.finishGymSession(a, record.id, { now: T0 + 2 * MIN, reason: 'cansancio' })).code, 'invalid-reason');
  assert.equal(unchanged(a, () => S.finishGymSession(a, record.id, { now: Infinity, reason: 'manual' })).code, 'invalid-time');
  a.attendance[0].account.id = 'other';
  assert.equal(unchanged(a, () => S.finishGymSession(a, record.id, { now: T0 + 2 * MIN, reason: 'manual' })).code, 'not-owner');
});

test('sync finishes expired sessions by timeout exactly once', () => {
  const a = state(); const record = start(a).attendance;
  assert.deepEqual(unchanged(a, () => S.syncGymSessions(a, record.plannedEndAt - 1)), { ok: true, finished: [] });
  const result = S.syncGymSessions(a, record.plannedEndAt);
  assert.equal(result.ok, true); assert.equal(result.finished.length, 1);
  assert.equal(result.finished[0].id, record.id);
  assert.equal(a.attendance[0].status, 'finished'); assert.equal(a.attendance[0].endReason, 'timeout'); assert.equal(a.attendance[0].endedAt, record.plannedEndAt);
  assert.deepEqual(unchanged(a, () => S.syncGymSessions(a, record.plannedEndAt + HOUR)), { ok: true, finished: [] });
  assert.equal(unchanged(a, () => S.syncGymSessions(a, NaN)).code, 'invalid-time');
});

test('active session lookup and presence ignore expired but unsynced sessions', () => {
  const a = state(); const record = start(a).attendance;
  assert.equal(S.getActiveGymSession(a, T0 + 30 * MIN).id, record.id);
  assert.deepEqual(S.getGymPresence(a, PRO, T0 + 30 * MIN), { gymId: PRO, activeSessions: 1 });
  assert.deepEqual(S.getGymPresence(a, PREPA, T0 + 30 * MIN), { gymId: PREPA, activeSessions: 0 });
  assert.equal(S.getActiveGymSession(a, record.plannedEndAt), null);
  assert.deepEqual(S.getGymPresence(a, PRO, record.plannedEndAt), { gymId: PRO, activeSessions: 0 });
  assert.equal(a.attendance[0].status, 'active');
  assert.equal(S.getActiveGymSession(state(), T0), null);
  const after = scan(a, { now: record.plannedEndAt + MIN });
  assert.equal(after.ok, true); assert.equal(a.attendance[0].status, 'finished');
});

test('remaining time counts down to zero and is zero once finished', () => {
  const a = state(); const record = start(a).attendance;
  assert.equal(S.getSessionRemainingMs(record, record.startedAt), HOUR);
  assert.equal(S.getSessionRemainingMs(record, record.startedAt + 15 * MIN), 45 * MIN);
  assert.equal(S.getSessionRemainingMs(record, record.plannedEndAt + MIN), 0);
  S.finishGymSession(a, record.id, { now: T0 + 10 * MIN, reason: 'manual' });
  assert.equal(S.getSessionRemainingMs(a.attendance[0], T0 + 11 * MIN), 0);
  assert.equal(S.getSessionRemainingMs(null, T0), 0);
});

test('time defaults to the current clock when omitted', () => {
  const a = state(); const before = Date.now();
  const arrival = S.verifyGymArrival(a, { gymId: PRO, code: qr(PRO) }).arrival;
  assert.ok(arrival.verifiedAt >= before && arrival.verifiedAt <= Date.now());
  const record = S.startGymSession(a, { gymId: PRO, duration: 1, type: 'pierna' }).attendance;
  assert.equal(S.getActiveGymSession(a).id, record.id);
  assert.equal(S.finishGymSession(a, record.id, { reason: 'manual' }).ok, true);
});

test('favorites toggle only for real spaces', () => {
  const a = state(); assert.equal(S.toggleFavorite(a, room).favorite, true);
  assert.deepEqual(a.favorites, [room]); assert.equal(S.toggleFavorite(a, room).favorite, false);
  assert.deepEqual(a.favorites, []); assert.equal(S.toggleFavorite(a, 'missing').ok, false);
});

test('consultation clear preserves reservations, attendance and favorites', () => {
  const a = state(); S.reserveRoom(a, booking()); start(a); S.toggleFavorite(a, room);
  assert.equal(S.addConsultation(a, { question: ' Consulta ', scenario: 'unsupported', title: 'Ejemplo' }).ok, true);
  assert.equal(a.history[0].question, 'Consulta');
  assert.equal(S.addConsultation(a, { question: '   ' }).ok, false);
  S.clearConsultations(a);
  assert.equal(a.history.length, 0); assert.equal(a.reservations.length, 1); assert.equal(a.attendance.length, 1); assert.deepEqual(a.favorites, [room]);
});

test('navigation drafts and explore state retain edits until explicit reset', () => {
  const a = state(); a.bookingDraft.capacity = 8; a.attendanceDraft.duration = 1.5; a.explore.mode = 'list';
  a.gymView.date = '2026-10-08'; S.searchSpaces(a); S.getGymBlocks(a.attendanceDraft.gymId, a.gymView.date);
  assert.equal(a.bookingDraft.capacity, 8); assert.equal(a.attendanceDraft.duration, 1.5); assert.equal(a.explore.mode, 'list');
  assert.equal(a.gymView.date, '2026-10-08');
  scan(a); S.resetState(a); assert.deepEqual(a.bookingDraft, state().bookingDraft); assert.equal(a.explore.mode, 'map');
  assert.deepEqual(a.attendanceDraft, state().attendanceDraft); assert.deepEqual(a.gymView, { date }); assert.equal(a.arrival, null);
});

test('classic scripts expose browser globals without module or network', () => {
  const context = vm.createContext({});
  for (const name of ['data.js', 'state.js', 'demo-ai.js']) {
    const file = path.join(__dirname, '..', name);
    assert.ok(fs.existsSync(file), `${name} is not implemented`);
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: name });
  }
  assert.equal(typeof context.SCState.createState, 'function');
  assert.equal(typeof context.SCAssistant.submit, 'function');
  assert.equal(context.SCData.demoDate, date);
});

test('own confirmed booking is reported as the user\'s reservation, not a generic occupied slot', () => {
  const a = state(); const result = S.reserveRoom(a, booking());
  const slot = S.getLibrarySlots(a, booking()).find(x => x.hour === 11);
  assert.equal(slot.available, false); assert.equal(slot.reason, 'own-reservation');
  assert.equal(slot.reservationId, result.reservation.id);
  const other = S.getLibrarySlots(a, booking({ roomId: 'library-room-8' })).find(x => x.hour === 11);
  assert.equal(other.reason, 'user-conflict'); assert.equal(other.reservationId, result.reservation.id);
  S.cancelReservation(a, result.reservation.id);
  assert.equal(S.getLibrarySlots(a, booking()).find(x => x.hour === 11).reason, null);
  assert.equal(S.reserveRoom(a, booking()).ok, true);
  assert.equal(S.reserveRoom(a, booking()).code, 'user-conflict');
});

test('another account\'s booking in the room stays a generic reserved slot', () => {
  const a = state(); a.reservations.push({ id: 'reservation-99', userId: 'someone-else', roomId: room, spaceId: room, date, hour: 11, endHour: 12, capacity: 2, status: 'confirmed' });
  const slot = S.getLibrarySlots(a, booking()).find(x => x.hour === 11);
  assert.equal(slot.reason, 'reserved'); assert.equal(slot.reservationId, undefined);
});

test('formatHour is the single shared hour formatter', () => {
  assert.equal(S.formatHour(9), '09:00'); assert.equal(S.formatHour(12.5), '12:30'); assert.equal(S.formatHour(17), '17:00');
});
