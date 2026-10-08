const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const uiFile = path.join(__dirname, '..', 'ui.js');
const U = fs.existsSync(uiFile) ? require(uiFile) : null;

test('Rendering helpers escape user text and quoted attribute values', () => {
  assert.ok(U, 'UI rendering helpers must be implemented');
  assert.equal(U.escape('<script>"hello" & \'bye\'</script>'), '&lt;script&gt;&quot;hello&quot; &amp; &#39;bye&#39;&lt;/script&gt;');
});

test('Countdown formatter rounds up to whole seconds and switches to hours', () => {
  assert.ok(U, 'UI rendering helpers must be implemented');
  assert.equal(U.duration(3600000), '1:00:00');
  assert.equal(U.duration(5400000), '1:30:00');
  assert.equal(U.duration(3599000), '59:59');
  assert.equal(U.duration(59000), '00:59');
  assert.equal(U.duration(1500), '00:02');
  assert.equal(U.duration(0), '00:00');
  assert.equal(U.duration(-500), '00:00');
  assert.equal(U.duration(NaN), '00:00');
});

test('Clock, trained-time and duration labels read naturally in Spanish', () => {
  assert.ok(U, 'UI rendering helpers must be implemented');
  assert.equal(U.clock(new Date(2026, 9, 7, 14, 5, 30).getTime()), '14:05');
  assert.equal(U.clock(new Date(2026, 9, 7, 7, 0).getTime()), '07:00');
  assert.equal(U.span(30000), 'menos de 1 min');
  assert.equal(U.span(12 * 60000 + 59000), '12 min');
  assert.equal(U.span(3600000), '1 h');
  assert.equal(U.span(5400000), '1 h 30 min');
  assert.equal(U.hours(1), '1 hora');
  assert.equal(U.hours(1.5), '1,5 horas');
  assert.equal(U.hour, require(path.join(__dirname, '..', 'state.js')).formatHour);
});

test('Routing accepts supported journeys and rejects unknown IDs or suffixes', () => {
  assert.ok(U, 'UI rendering helpers must be implemented');
  assert.deepEqual(U.parseRoute('#/library/library-room-6/review'), { view: 'libraryReview', id: 'library-room-6' });
  assert.deepEqual(U.parseRoute('#/gym/gym-profesional/attendance'), { view: 'gymAttendance', id: 'gym-profesional' });
  assert.deepEqual(U.parseRoute('#/gym/gym-prepatec/scan'), { view: 'gymScan', id: 'gym-prepatec' });
  assert.deepEqual(U.parseRoute('#/attendance/attendance-3'), { view: 'attendance', id: 'attendance-3' });
  assert.equal(U.parseRoute('#/gym/library-room-6/scan'), null);
  assert.equal(U.parseRoute('#/gym/invented/scan'), null);
  assert.equal(U.parseRoute('#/gym/gym-prepatec/scan/extra'), null);
  assert.equal(U.parseRoute('#/space/gym-prepatec/scan'), null);
  assert.equal(U.parseRoute('#/space/invented'), null);
  assert.equal(U.parseRoute('#/gym/gym-profesional/extra'), null);
  assert.equal(U.parseRoute('#/activity/invented'), null);
});

test('Room alternatives carry their real date, hour and fitting capacity', () => {
  assert.ok(U, 'UI rendering helpers must be implemented');
  const html = U.alternatives([{ roomId: 'library-room-6', name: 'Sala & seis', date: '2026-10-08', hour: 12, capacity: 6 }], 4);
  assert.match(html, /data-date="2026-10-08"/);
  assert.match(html, /data-hour="12"/);
  assert.match(html, /data-capacity="4"/);
  assert.match(html, /Sala &amp; seis/);
});
