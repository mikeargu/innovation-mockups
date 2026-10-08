(function (root) {
  'use strict';
  const EXPORTABLE_KINDS = ['event', 'workshop'];
  const PRODID = '-//Tec Conect by CEM//Demo conceptual//ES';
  const DEMO_STAMP = '20261006T000000Z';
  const MAX_OCTETS = 75;
  const escapeText = value => String(value == null ? '' : value).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r\n|\r|\n/g, '\\n');
  const toUTC = value => {
    const time = /(Z|[+-]\d{2}:?\d{2})$/i.test(String(value)) ? Date.parse(value) : NaN;
    return Number.isNaN(time) ? null : new Date(time).toISOString().replace(/[-:]|\.\d{3}/g, '');
  };
  const byteLength = char => (char.codePointAt(0) < 0x80 ? 1 : char.codePointAt(0) < 0x800 ? 2 : char.codePointAt(0) < 0x10000 ? 3 : 4);
  function fold(line) {
    const physical = [];
    let current = '', size = 0;
    for (const char of line) {
      const width = byteLength(char);
      if (size + width > MAX_OCTETS) { physical.push(current); current = ' '; size = 1; }
      current += char; size += width;
    }
    physical.push(current);
    return physical.join('\r\n');
  }
  function buildICS(item) {
    if (!item || !EXPORTABLE_KINDS.includes(item.kind)) return null;
    const start = toUTC(item.startsAt), end = toUTC(item.endsAt);
    if (!start || !end || Date.parse(item.endsAt) <= Date.parse(item.startsAt)) return null;
    const description = [item.summary, item.organizer ? 'Organiza: ' + item.organizer + '.' : '', item.note,
      'Actividad ficticia de ejemplo: concepto de Tec Conect by CEM, sin registro real.'].filter(Boolean).join(' ');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:' + PRODID, 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      'UID:' + item.id + '@tec-conect.example', 'DTSTAMP:' + DEMO_STAMP, 'DTSTART:' + start, 'DTEND:' + end,
      'SUMMARY:' + '[EJEMPLO] ' + escapeText(item.title), 'LOCATION:' + escapeText(item.location),
      'DESCRIPTION:' + escapeText(description), 'END:VEVENT', 'END:VCALENDAR'];
    return lines.map(fold).join('\r\n') + '\r\n';
  }
  function fileName(item) {
    const slug = String(item && item.id || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return (slug || 'evento') + '.ics';
  }
  const api = { buildICS, fileName };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TecCalendar = api;
})(typeof window !== 'undefined' ? window : globalThis);
