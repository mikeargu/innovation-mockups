(function (root) {
  'use strict';
  var U = root.SCUI, D = root.SCData, S = root.SCState;
  var positions = { library: [23, 31], classrooms: [53, 21], labs: [80, 30], computers: [53, 44], gyms: [26, 73], pool: [23, 91], esports: [79, 61], wellbeing: [84, 81], 'tec-services': [55, 70] };
  function map(state, matches) {
    var matchingCategories = matches.map(function (space) { return space.category; });
    var buildings = D.campus.regions.map(function (r) { return '<rect x="' + r.x + '" y="' + r.y + '" width="' + r.width + '" height="' + r.height + '" rx="3" fill="' + (r.category === 'pool' ? '#b7dfe8' : ['gyms', 'wellbeing'].includes(r.category) ? '#d3dfcc' : '#e8dbca') + '" stroke="#d4c6b4" stroke-width=".6"/>'; }).join('');
    var svg = '<svg viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" fill="#eaf1e9"/><path d="M3 56H96M40 5V98M65 8V95" stroke="#fff" stroke-width="6"/><path d="M3 56H96M40 5V98M65 8V95" stroke="#d6e1d4" stroke-width=".4" stroke-dasharray="1 1.4"/>' + buildings + '<g fill="#c1d8bc" stroke="#b1cdae" stroke-width=".4"><circle cx="5" cy="13" r="3"/><circle cx="4" cy="39" r="2.4"/><circle cx="96" cy="49" r="3"/><circle cx="71" cy="90" r="3"/><circle cx="48" cy="91" r="3"/><circle cx="91" cy="9" r="2.4"/><circle cx="6" cy="80" r="2.1"/></g><path d="M95 94V87M92 90L95 87 98 90" stroke="#7c9180" stroke-width=".7" fill="none"/><text x="95" y="98" text-anchor="middle" font-size="3" fill="#7c9180">N</text></svg>';
    return '<div class="campus-map" role="group" aria-label="Diagrama conceptual del campus. Selecciona una categoría para ver sus espacios.">' + svg + '<span class="map-stamp">' + U.icon('map') + 'Campus conceptual</span>' + D.campus.regions.map(function (r) {
      var p = positions[r.category], active = state.explore.category === r.category;
      return '<button class="map-pin' + (!matchingCategories.includes(r.category) ? ' dimmed' : '') + '" data-action="map-category" data-category="' + r.category + '" style="left:' + p[0] + '%;top:' + p[1] + '%" aria-pressed="' + active + '" aria-label="' + U.escape(U.category(r.category).label) + ' · ver espacios"><span class="pin-icon">' + U.icon(U.icons[r.category]) + '</span><span class="pin-label">' + U.escape(r.label) + '</span></button>';
    }).join('') + '</div><p class="map-caption">' + U.icon('info') + 'Mapa conceptual · sin escala ni indicaciones reales</p>';
  }
  function results(state) {
    var matches = S.searchSpaces(state);
    return (state.explore.mode === 'map' ? map(state, matches) : '') + '<div class="section-heading" id="space-results"><h2>' + (state.explore.category === 'all' ? 'Espacios para ti' : U.escape(U.category(state.explore.category).label)) + '</h2><span class="result-count">' + matches.length + ' espacios</span></div>' +
      (matches.length ? '<div class="stack">' + matches.map(function (space) { return U.spaceCard(space, state); }).join('') + '</div>' : U.empty('No encontramos espacios', 'Prueba otro nombre, recurso o software. También puedes ajustar los filtros.', 'search_off'));
  }
  root.SCViews.exploreResults = results;
  root.SCViews.explore = function (state, ui) {
    return U.heading('Explora tu campus', 'Encuentra el lugar para tu próximo plan.') + '<div class="search-row"><div class="search"><label class="sr-only" for="explore-query">Buscar espacios</label>' + U.icon('search') + '<input id="explore-query" name="query" type="search" placeholder="Espacio, equipo o software" value="' + U.escape(state.explore.query) + '" autocomplete="off"></div><button class="icon-button' + (ui.filtersOpen || state.explore.minCapacity ? ' active' : '') + '" data-action="filters" aria-label="Filtrar por capacidad" aria-expanded="' + !!ui.filtersOpen + '">' + U.icon('tune') + '</button></div>' +
      (ui.filtersOpen ? '<div class="filter-panel"><label class="field"><span>Capacidad mínima</span><select id="min-capacity" name="minCapacity">' + [0, 2, 4, 6, 8, 12, 20, 30].map(function (value) { return '<option value="' + value + '"' + (state.explore.minCapacity === value ? ' selected' : '') + '>' + (value ? value + ' personas' : 'Cualquier capacidad') + '</option>'; }).join('') + '</select></label></div>' : '') +
      '<div class="segmented" role="group" aria-label="Vista de espacios"><button data-action="explore-mode" data-mode="map" aria-pressed="' + (state.explore.mode === 'map') + '">' + U.icon('map') + 'Mapa</button><button data-action="explore-mode" data-mode="list" aria-pressed="' + (state.explore.mode === 'list') + '">' + U.icon('view_list') + 'Lista</button></div>' +
      '<div class="chips" role="group" aria-label="Categorías"><button class="chip" data-action="category" data-category="all" aria-pressed="' + (state.explore.category === 'all') + '">Todos</button>' + D.categories.map(function (c) { return '<button class="chip" data-action="category" data-category="' + c.id + '" aria-pressed="' + (state.explore.category === c.id) + '">' + U.icon(U.icons[c.id]) + U.escape(c.label) + '</button>'; }).join('') + '</div>' +
      '<div id="explore-results">' + results(state) + '</div>' +
      '<div class="explore-callout">' + U.icon('auto_awesome') + '<div><h3>¿Ya tienes un plan?</h3><p>Consulta salas, requisitos de labs y horarios del gimnasio.</p><a href="#/assistant">Explorar con el asistente →</a></div></div>';
  };
})(globalThis);
