(function (root) {
  'use strict';
  var U = root.SCUI, S = root.SCState;
  function facts(space) {
    return '<div class="detail-facts"><div class="fact">' + U.icon('location_on') + '<div><strong>Ubicación conceptual</strong>' + U.escape(space.location.label) + '</div></div><div class="fact">' + U.icon('schedule') + '<div><strong>Horario</strong>' + U.escape(space.hours) + '</div></div>' + (space.capacity ? '<div class="fact">' + U.icon('group') + '<div><strong>Capacidad de ejemplo</strong>' + space.capacity + ' personas</div></div>' : '') + '</div>';
  }
  function section(title, body) { return '<section class="detail-section"><h2>' + title + '</h2>' + body + '</section>'; }
  root.SCViews.space = function (state, ui, route) {
    var space = S.getSpace(route.id), favorite = state.favorites.includes(space.id);
    var action = space.category === 'library' ? '<a class="button" href="#/library/' + space.id + '/book">' + U.icon('calendar_add_on') + 'Elegir horario</a><a class="button secondary" href="#/library">Ver salas de biblioteca</a>' : space.category === 'gyms' ? '<a class="button" href="#/gym/' + space.id + '">' + U.icon('qr_code_scanner') + 'Ver gimnasio y registrar asistencia</a>' : '<a class="button" href="#/space/' + space.id + '/access">' + U.icon('assignment') + (space.category === 'labs' ? 'Ver proceso de acceso' : 'Ver procedimiento') + '</a>';
    return '<a class="back-link" href="#/explore">' + U.icon('arrow_back') + 'Explorar</a><div class="detail-hero tone-' + space.category + '">' + U.icon(U.icons[space.category], 'giant-symbol') + '<button class="icon-button' + (favorite ? ' active' : '') + '" data-action="favorite" data-id="' + space.id + '" aria-label="' + (favorite ? 'Quitar de favoritos' : 'Guardar en favoritos') + '" aria-pressed="' + favorite + '">' + U.icon(favorite ? 'bookmark_added' : 'bookmark_add') + '</button><span class="badge">' + U.escape(space.location.zone) + '</span></div><div class="detail-title"><span class="eyebrow">' + U.escape(U.category(space.category).label) + '</span><h1>' + U.escape(space.name) + '</h1><p>' + U.escape(space.description) + '</p></div>' + facts(space) + '<div class="stack">' + action + '</div>' +
      (space.category === 'pool' ? U.message('Tier 2 · etiqueta ficticia. Consulta requisitos y autorización con Deportes.') : '') + section('Recursos y equipo', U.list(space.resources)) +
      (space.software.length ? section('Software de ejemplo', U.list(space.software)) : '') + section(space.category === 'labs' ? 'Inducción y requisitos' : 'Requisitos de uso', U.list(space.requirements)) + section('Área responsable', '<p>' + U.escape(space.responsibleArea) + '</p>') + U.source(space);
  };
  root.SCViews.access = function (state, ui, route) {
    var space = S.getSpace(route.id);
    return U.heading(space.category === 'labs' ? 'Antes de usar el laboratorio' : 'Consulta el procedimiento', space.name, '#/space/' + space.id) + '<div class="soft-card"><span class="eyebrow">Área responsable</span><h2>' + U.escape(space.responsibleArea) + '</h2></div><ol class="procedure-steps"><li><div><strong>Prepara tu solicitud</strong><p>' + U.escape(space.requirements.join('. ')) + '.</p></div></li><li><div><strong>Contacta al área responsable</strong><p>' + U.escape(space.procedure) + '</p></div></li><li><div><strong>Espera la confirmación del área</strong><p>El responsable verifica requisitos, disponibilidad y autorización.</p></div></li></ol>' + U.message('Este recorrido es informativo: no concede acceso ni crea una solicitud institucional.') + '<a class="button secondary" href="#/space/' + space.id + '">Volver al espacio</a>' + U.source(space);
  };
})(globalThis);
