const { test } = require('node:test');
const assert = require('node:assert/strict');
const D = require('../data.js');
const K = require('../calendar.js');

const event = D.pulse.find(item => item.id === 'laboratorio-ideas');
const unfold = text => text.replace(/\r\n[ \t]/g, '');
const lines = text => unfold(text).split('\r\n');
const octets = value => Buffer.byteLength(value, 'utf8');

test('buildICS produces a CRLF calendar with one example event and complete times', () => {
  const ics = K.buildICS(event);
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
  assert.equal(ics.replace(/\r\n/g, '').includes('\n'), false, 'no bare line feeds');
  assert.equal(ics.replace(/\r\n/g, '').includes('\r'), false, 'no bare carriage returns');
  const body = lines(ics);
  for (const required of ['VERSION:2.0', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', 'END:VEVENT']) assert.ok(body.includes(required), required);
  assert.ok(body.some(line => line.startsWith('PRODID:')));
  assert.equal(body.filter(line => line === 'BEGIN:VEVENT').length, 1);
  assert.ok(body.includes('DTSTART:20261009T220000Z'), '16:00-06:00 is 22:00 UTC');
  assert.ok(body.includes('DTEND:20261010T000000Z'), '18:00-06:00 is 00:00 UTC the next day');
  assert.ok(body.some(line => /^DTSTAMP:\d{8}T\d{6}Z$/.test(line)));
});

test('events are marked as examples and carry location, organizer text and the example note', () => {
  const body = lines(K.buildICS(event));
  assert.ok(body.includes('SUMMARY:[EJEMPLO] ' + event.title));
  assert.ok(body.some(line => line.startsWith('LOCATION:') && line.includes('Espacio de colaboración')));
  const description = body.find(line => line.startsWith('DESCRIPTION:'));
  assert.ok(description.includes('Colectivo Crea CEM'));
  assert.ok(description.includes('ficticia'), 'description repeats that the event is fictitious');
});

test('UID is stable for the same publication and distinct across publications', () => {
  const uid = item => lines(K.buildICS(item)).find(line => line.startsWith('UID:'));
  assert.equal(uid(event), uid(event));
  assert.equal(uid(event), 'UID:laboratorio-ideas@tec-conect.example');
  assert.notEqual(uid(event), uid(D.pulse.find(item => item.id === 'prototipo')));
});

test('text values escape backslashes, commas, semicolons and line breaks', () => {
  const item = { ...event, title: 'A, B; C\\ D\nE', location: 'Sala 1, edificio; B', organizer: 'Org', note: 'Nota' };
  const body = lines(K.buildICS(item));
  assert.ok(body.includes('SUMMARY:[EJEMPLO] A\\, B\\; C\\\\ D\\nE'));
  assert.ok(body.includes('LOCATION:Sala 1\\, edificio\\; B'));
});

test('long lines are folded to 75 octets without splitting multibyte characters', () => {
  const item = { ...event, title: 'Taller de comunicación ' + 'ñandú '.repeat(40) };
  const ics = K.buildICS(item);
  for (const physical of ics.split('\r\n')) assert.ok(octets(physical) <= 75, physical);
  assert.ok(ics.includes('\r\n '), 'folding used a leading space');
  assert.ok(unfold(ics).includes('ñandú ñandú'), 'unfolded text is intact');
  assert.equal(unfold(ics).includes('�'), false);
});

test('only events and workshops with valid times can be exported', () => {
  assert.equal(K.buildICS(D.pulse.find(item => item.kind === 'article')), null);
  assert.equal(K.buildICS(D.pulse.find(item => item.kind === 'internship')), null);
  assert.equal(K.buildICS({ ...event, endsAt: event.startsAt }), null);
  assert.equal(K.buildICS({ ...event, startsAt: 'not a date' }), null);
  assert.equal(K.buildICS({ ...event, startsAt: '2026-10-09T16:00:00' }), null, 'times without a UTC offset are ambiguous');
  assert.equal(K.buildICS({ ...event, endsAt: '2026-10-09T18:00:00' }), null);
  assert.ok(K.buildICS({ ...event, startsAt: '2026-10-09T22:00:00Z', endsAt: '2026-10-10T00:00:00Z' }), 'Z offsets are accepted');
  assert.equal(K.buildICS(null), null);
  for (const item of D.pulse.filter(candidate => ['event', 'workshop'].includes(candidate.kind))) assert.ok(K.buildICS(item), item.id);
});

test('file names are safe and based on the publication id', () => {
  assert.equal(K.fileName(event), 'laboratorio-ideas.ics');
  assert.equal(K.fileName({ id: '../x y/Evil' }), 'x-y-evil.ics');
  assert.equal(K.fileName({ id: '' }), 'evento.ics');
});
