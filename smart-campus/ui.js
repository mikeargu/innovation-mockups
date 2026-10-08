(function (root) {
  'use strict';
  var commonJS = typeof module === 'object' && module.exports;
  var D = commonJS ? require('./data.js') : root.SCData;
  var S = commonJS ? require('./state.js') : root.SCState;
  var icons = { library: 'local_library', classrooms: 'school', labs: 'precision_manufacturing', computers: 'computer', gyms: 'fitness_center', pool: 'pool', esports: 'sports_esports', wellbeing: 'spa', 'tec-services': 'support_agent' };
  function escape(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]; });
  }
  function icon(name, extra) { return '<span class="symbol ' + (extra || '') + '" aria-hidden="true">' + escape(name) + '</span>'; }
  function hour(value) { return String(Math.floor(value)).padStart(2, '0') + ':' + (value % 1 ? '30' : '00'); }
  function date(value, full) { var item = D.dates.find(function (entry) { return entry.value === value; }); return item ? item[full ? 'label' : 'shortLabel'] : value; }
  function category(id) { return D.categories.find(function (item) { return item.id === id; }) || { label: '', color: '#0039a6' }; }
  function capital(value) { return value.charAt(0).toUpperCase() + value.slice(1); }
  function heading(title, subtitle, back) {
    return (back ? '<a class="back-link" href="' + escape(back) + '">' + icon('arrow_back') + 'Volver</a>' : '') + '<div class="page-heading"><h1>' + escape(title) + '</h1>' + (subtitle ? '<p>' + escape(subtitle) + '</p>' : '') + '</div>';
  }
  function spaceCard(space, state, extra) {
    var c = category(space.category);
    return '<a class="space-card" href="#/space/' + escape(space.id) + '"><span class="space-symbol tone-' + space.category + '">' + icon(icons[space.category]) + '</span><span class="space-card-content"><span class="eyebrow">' + escape(c.label) + '</span><h3>' + escape(space.name) + '</h3><span class="meta">' + escape(extra || (space.capacity ? space.capacity + ' personas · ' : '') + space.location.zone) + '</span></span>' + icon('chevron_right', 'card-arrow') + '</a>';
  }
  function dateField(value, name) {
    return '<label class="field"><span>Fecha</span><select name="' + (name || 'date') + '" id="' + (name || 'date') + '">' + D.dates.map(function (item) { return '<option value="' + item.value + '"' + (value === item.value ? ' selected' : '') + '>' + escape(item.label) + '</option>'; }).join('') + '</select></label>';
  }
  function source(space) { return '<div class="source-note">' + icon('info') + '<span>' + escape(space.source.label) + '<br>Actualización: ' + escape(date(space.source.updatedAt)) + '</span></div>'; }
  function list(items) { return '<ul class="feature-list">' + items.map(function (value) { return '<li>' + icon('check') + '<span>' + escape(value) + '</span></li>'; }).join('') + '</ul>'; }
  function empty(title, body, symbol, href, label) {
    return '<div class="empty-state"><span class="empty-symbol">' + icon(symbol || 'inbox') + '</span><h2>' + escape(title) + '</h2><p>' + escape(body) + '</p>' + (href ? '<a class="button secondary" href="' + href + '">' + escape(label) + '</a>' : '') + '</div>';
  }
  function message(text, kind) { return text ? '<div class="notice ' + (kind || '') + '">' + icon(kind === 'error' ? 'error' : 'info') + '<p>' + escape(text) + '</p></div>' : ''; }
  function alternatives(options, requestedCapacity) {
    return '<section class="alternatives"><h2>Alternativas</h2><p class="muted">Prueba otro espacio o un horario cercano.</p>' + (options.length ? options.map(function (item) {
      return '<button class="alternative-card" data-action="library-alternative" data-room="' + item.roomId + '" data-date="' + item.date + '" data-hour="' + item.hour + '" data-capacity="' + requestedCapacity + '"><span><strong>' + escape(item.name) + '</strong><span class="meta">' + escape(date(item.date)) + ' · ' + hour(item.hour) + '–' + hour(item.hour + 1) + '</span></span>' + icon('arrow_forward') + '</button>';
    }).join('') : '<p>No hay opciones para ese grupo y fecha. Selecciona otro bloque.</p>') + '</section>';
  }
  function pad(value) { return String(value).padStart(2, '0'); }
  function duration(ms) {
    var total = Number.isFinite(ms) && ms > 0 ? Math.ceil(ms / 1000) : 0, h = Math.floor(total / 3600), m = Math.floor(total % 3600 / 60), sec = total % 60;
    return h ? h + ':' + pad(m) + ':' + pad(sec) : pad(m) + ':' + pad(sec);
  }
  function clock(epoch) { var d = new Date(epoch); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function span(ms) {
    var minutes = Math.floor(Math.max(0, ms) / 60000), h = Math.floor(minutes / 60), m = minutes % 60;
    if (!minutes) return 'menos de 1 min';
    return h ? h + ' h' + (m ? ' ' + m + ' min' : '') : m + ' min';
  }
  function hours(value) { return value + (value === 1 ? ' hora' : ' horas'); }
  function parseRoute(hash) {
    var parts = hash.replace(/^#\/?/, '').split('/');
    var first = parts[0];
    if ((first === 'explore' || first === 'assistant' || first === 'profile') && parts.length === 1) return { view: first };
    if (first === 'library' && parts.length === 1) return { view: 'library' };
    if (first === 'activity' && parts.length === 2 && ['reservations', 'attendance', 'favorites', 'history'].includes(parts[1])) return { view: 'activity', tab: parts[1] };
    if (first === 'reservation' && parts.length === 2 && /^reservation-\d+$/.test(parts[1])) return { view: 'reservation', id: parts[1] };
    if (first === 'attendance' && parts.length === 2 && /^attendance-\d+$/.test(parts[1])) return { view: 'attendance', id: parts[1] };
    var space = S.getSpace(parts[1]);
    if (!space) return null;
    if (first === 'space' && parts.length === 2) return { view: 'space', id: space.id };
    if (first === 'space' && parts.length === 3 && parts[2] === 'access') return { view: 'access', id: space.id };
    if (first === 'library' && space.category === 'library' && parts.length === 3 && ['book', 'review'].includes(parts[2])) return { view: parts[2] === 'book' ? 'libraryBook' : 'libraryReview', id: space.id };
    if (first === 'gym' && space.category === 'gyms' && parts.length === 2) return { view: 'gym', id: space.id };
    if (first === 'gym' && space.category === 'gyms' && parts.length === 3 && parts[2] === 'scan') return { view: 'gymScan', id: space.id };
    if (first === 'gym' && space.category === 'gyms' && parts.length === 3 && parts[2] === 'attendance') return { view: 'gymAttendance', id: space.id };
    return null;
  }
  var api = { escape: escape, icon: icon, icons: icons, hour: hour, date: date, category: category, capital: capital, heading: heading, spaceCard: spaceCard, dateField: dateField, source: source, list: list, empty: empty, message: message, alternatives: alternatives, duration: duration, clock: clock, span: span, hours: hours, parseRoute: parseRoute };
  root.SCUI = api;
  root.SCViews = root.SCViews || {};
  if (commonJS) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
