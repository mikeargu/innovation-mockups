(function (root) {
  'use strict';
  var U = root.SCUI, D = root.SCData, S = root.SCState;
  var REASONS = { manual: 'Finalizado por ti', timeout: 'Tiempo completado' };
  function crowd(block) { return block.status === 'closed' ? 'Cerrado' : block.status === 'unknown' ? 'Sin información' : block.occupancyPercent <= 30 ? 'Poca gente' : block.occupancyPercent <= 60 ? 'Afluencia media' : 'Muy concurrido'; }
  function accountCard(account) {
    return '<div class="account-card"><span class="avatar" aria-hidden="true">ST</span><div><strong>' + U.escape(account.name) + '</strong><p>' + U.escape(account.matricula) + '</p><p>' + U.escape(account.level) + ' · semestre ' + account.semester + '</p><span class="eyebrow">Datos de tu cuenta · solo lectura</span></div></div>';
  }
  function progress(record, now) { var total = record.plannedEndAt - record.startedAt; return total > 0 ? Math.min(1, Math.max(0, (now - record.startedAt) / total)) : 1; }
  function noAccess(gym) { return U.message('Registrar tu asistencia no concede acceso al gimnasio. Consulta elegibilidad y requisitos con ' + gym.responsibleArea + '.'); }
  function sessionBanner(active) {
    return '<a class="session-banner" href="#/attendance/' + U.escape(active.id) + '"><span class="live-dot" aria-hidden="true"></span><span class="session-banner-text"><strong>Entrenamiento en curso · <span data-countdown="' + U.escape(active.id) + '">' + U.duration(S.getSessionRemainingMs(active)) + '</span> restantes</strong><span>' + U.escape(active.name) + ' · ' + U.escape(U.capital(active.type)) + ' · ver sesión</span></span>' + U.icon('chevron_right') + '</a>';
  }
  function facts(gym) {
    return '<div class="detail-facts"><div class="fact">' + U.icon('schedule') + '<div><strong>Horario</strong>' + U.escape(gym.hours) + '</div></div><div class="fact">' + U.icon('location_on') + '<div><strong>Ubicación conceptual</strong>' + U.escape(gym.location.label) + '</div></div><div class="fact">' + U.icon('group') + '<div><strong>Capacidad de ejemplo</strong>' + gym.capacity + ' personas</div></div></div>';
  }
  function presence(state, gym) {
    var mine = S.getGymPresence(state, gym.id).activeSessions > 0;
    return '<p class="presence-line' + (mine ? ' here' : '') + '">' + U.icon(mine ? 'how_to_reg' : 'qr_code_2') + '<span>' + (mine ? 'Tu sesión está en curso aquí.' : 'Al escanear el QR de la entrada, tu llegada cuenta como presencia en el gimnasio. La demo no muestra registros de otras personas.') + '</span></p>';
  }
  function availability(state, gym) {
    var day = state.gymView.date, blocks = S.getGymBlocks(gym.id, day), best = S.recommendGymBlocks(gym.id, day)[0];
    var recommendation = '<section class="gym-recommendation" data-testid="gym-recommendation"><span class="eyebrow">' + U.icon('eco') + 'Un buen momento para entrenar</span>' + (best ? '<p class="recommendation-hour">' + U.hour(best.hour) + '–' + U.hour(best.endHour) + '</p><p>' + best.occupancyPercent + '% de ocupación estimada · ' + crowd(best).toLowerCase() + '</p>' : '<p class="recommendation-hour">Sin información</p><p>No hay estimaciones disponibles para esta fecha.</p>') + '</section>';
    var chart = '<div class="gym-chart" role="img" aria-label="Ocupación estimada por hora. Los valores están también en la lista de bloques.">' + blocks.map(function (block) { return '<div class="chart-column"><div class="chart-bar"><i class="' + (block.status !== 'open' ? block.status : block.occupancyPercent > 60 ? 'busy' : '') + '" style="height:' + (block.occupancyPercent || 0) + '%"></i></div><span>' + block.hour + '</span></div>'; }).join('') + '</div>';
    var slots = '<ul class="gym-hour-grid" aria-label="Ocupación estimada por bloque">' + blocks.map(function (block) { return '<li class="gym-slot ' + (block.status !== 'open' ? block.status : block.occupancyPercent <= 30 ? 'quiet' : '') + '"><strong>' + U.hour(block.hour) + '–' + U.hour(block.endHour) + '</strong><span class="estimate">' + U.icon(block.status === 'closed' ? 'lock' : block.status === 'unknown' ? 'help' : 'group') + crowd(block) + '</span>' + (block.status === 'open' ? '<span class="meta">' + block.occupancyPercent + '% estimado</span><span class="slot-bar" aria-hidden="true"><i style="width:' + block.occupancyPercent + '%"></i></span>' : '') + '</li>'; }).join('') + '</ul>';
    return '<section class="detail-section"><h2>Disponibilidad estimada</h2>' + U.dateField(day, 'gym-date') + recommendation + '<h3>Así se ve el día</h3>' + chart + '<div class="gym-legend"><span><i></i>Poca / media</span><span><i class="busy"></i>Alta</span><span>— Cerrado / sin información</span></div><p class="legend-note">Estimaciones ficticias, sin aforo en vivo. El menor porcentaje conocido se recomienda primero; en empate, la hora más temprana. Es información para planear: la asistencia se registra al llegar.</p>' + slots + '</section>';
  }
  root.SCViews.gym = function (state, ui, route) {
    var gym = S.getSpace(route.id), active = S.getActiveGymSession(state);
    var cta = active ? sessionBanner(active) : '<a class="button" href="#/gym/' + gym.id + '/scan">' + U.icon('qr_code_scanner') + 'Registrar asistencia</a><p class="cta-hint">Al llegar, escanea el QR de la entrada del gimnasio.</p>';
    return U.heading(gym.name, 'Información general, disponibilidad y registro de asistencia.', '#/explore') + '<div class="gym-switch"><a href="#/gym/gym-profesional"' + (gym.id === 'gym-profesional' ? ' aria-current="page"' : '') + '>Profesional</a><a href="#/gym/gym-prepatec"' + (gym.id === 'gym-prepatec' ? ' aria-current="page"' : '') + '>PrepaTec</a></div><div class="gym-cta">' + cta + presence(state, gym) + '</div>' + facts(gym) +
      '<section class="detail-section"><h2>Recursos y equipo</h2>' + U.list(gym.resources) + '</section><section class="detail-section"><h2>Requisitos de uso</h2>' + U.list(gym.requirements) + '<p class="section-note">Área responsable: ' + U.escape(gym.responsibleArea) + '</p></section>' + availability(state, gym) + noAccess(gym) + U.source(gym);
  };
  function qrCode(seed) {
    var size = 21, cells = '', n = 0, i, x, y;
    for (i = 0; i < seed.length; i++) n = (n * 31 + seed.charCodeAt(i)) % 2147483647;
    function finder(fx, fy) { return '<path d="M' + fx + ' ' + fy + 'h7v7h-7zM' + (fx + 1) + ' ' + (fy + 1) + 'v5h5v-5z" fill-rule="evenodd"/><rect x="' + (fx + 2) + '" y="' + (fy + 2) + '" width="3" height="3"/>'; }
    for (y = 0; y < size; y++) for (x = 0; x < size; x++) {
      if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue;
      n = (n * 1103515245 + 12345) % 2147483648;
      if (n % 7 < 3) cells += 'M' + x + ' ' + y + 'h1v1h-1z';
    }
    return '<svg class="scanner-qr" viewBox="-1 -1 23 23" aria-hidden="true" focusable="false"><rect x="-1" y="-1" width="23" height="23" rx="1.5" fill="#fff"/><g fill="#0f1c33">' + finder(0, 0) + finder(14, 0) + finder(0, 14) + '<path d="' + cells + '"/></g></svg>';
  }
  root.SCViews.gymScan = function (state, ui, route) {
    var gym = S.getSpace(route.id), active = ui.scanCode === 'active-session' ? S.getActiveGymSession(state) : null;
    return U.heading('Escanea el QR de la entrada', gym.name, '#/gym/' + gym.id) + '<figure class="scanner"><div class="scanner-view" role="img" aria-label="Vista simulada de la cámara apuntando al QR de la entrada de ' + U.escape(gym.name) + '"><span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>' + qrCode(D.gymEntryCodes[gym.id]) + '<span class="scanner-line"></span><span class="scanner-tag">' + U.icon('photo_camera') + 'Cámara simulada</span></div><figcaption><strong>Escaneo simulado · concepto: en la versión real se abriría la cámara</strong><span>Apunta al código que está en la entrada de ' + U.escape(gym.name) + '.</span></figcaption></figure>' +
      U.message(ui.scanError, 'error') + (active ? '<a class="button secondary" href="#/attendance/' + U.escape(active.id) + '">' + U.icon('timer') + 'Ver entrenamiento en curso</a>' : '') +
      '<div class="stack scan-actions"><button class="button" data-action="scan-qr">' + U.icon('qr_code_scanner') + 'Simular escaneo del QR de entrada</button><button class="text-button" data-action="scan-wrong-qr">Probar con el QR del otro gimnasio</button></div>' +
      '<div class="soft-card scan-why"><span class="eyebrow">' + U.icon('verified_user') + '¿Por qué escanear?</span><p>El QR está físicamente en la entrada: solo quien llega al gimnasio puede registrar su asistencia. Así se evita registrar entrenamientos a distancia y se sabe quién sigue presente. La verificación es válida por ' + Math.round(D.gymRules.arrivalWindowMs / 60000) + ' minutos.</p></div>' + U.message('Demostración: no se usa la cámara del dispositivo. La validación real de presencia es un requisito para una implementación institucional.');
  };
  function arrivalProblem(state, gym) {
    var arrival = state.arrival;
    if (!arrival || arrival.status !== 'verified') return 'Primero verifica tu llegada: escanea el QR de la entrada de ' + gym.name + '.';
    if (arrival.gymId !== gym.id) return 'Tu llegada se verificó en ' + S.getSpace(arrival.gymId).name + '. Escanea el QR de la entrada de ' + gym.name + '.';
    if (Date.now() >= arrival.expiresAt) return 'La verificación de llegada expiró. Escanea de nuevo el QR de la entrada.';
    return '';
  }
  root.SCViews.gymAttendance = function (state, ui, route) {
    var gym = S.getSpace(route.id), draft = state.attendanceDraft, problem = arrivalProblem(state, gym);
    if (problem) return U.heading('Registra tu asistencia', gym.name, '#/gym/' + gym.id) + '<div class="guard-card"><span class="empty-symbol">' + U.icon('qr_code_scanner') + '</span>' + U.message(problem, 'error') + '<a class="button" href="#/gym/' + gym.id + '/scan">' + U.icon('qr_code_scanner') + 'Escanear QR de entrada</a></div>';
    var arrival = state.arrival;
    return U.heading('Registra tu asistencia', 'Tu llegada está verificada. Elige cómo vas a entrenar.', '#/gym/' + gym.id) + '<div class="verified-card">' + U.icon('verified', 'verified-symbol') + '<div><span class="badge success">' + U.icon('check') + 'Llegada verificada</span><strong>' + U.escape(gym.name) + '</strong><span class="meta">QR de entrada · ' + U.clock(arrival.verifiedAt) + ' · válida hasta ' + U.clock(arrival.expiresAt) + '</span><span class="meta arrival-left">Quedan <strong data-arrival-countdown>' + U.duration(arrival.expiresAt - Date.now()) + '</strong> para registrar</span></div></div>' + accountCard(state.account) +
      '<form id="attendance-form"><span class="form-label" id="duration-label">¿Cuánto tiempo vas a entrenar?</span><div class="duration-options" role="group" aria-labelledby="duration-label">' + D.gymRules.durations.map(function (duration) { return '<label class="duration-option"><input type="radio" name="duration" value="' + duration + '"' + (draft.duration === duration ? ' checked' : '') + '><span>' + U.hours(duration) + '</span></label>'; }).join('') + '</div><label class="field"><span>Tipo de entrenamiento</span><select id="training-type" name="type">' + D.trainingTypes.map(function (type) { return '<option value="' + U.escape(type) + '"' + (draft.type === type ? ' selected' : '') + '>' + U.escape(U.capital(type)) + '</option>'; }).join('') + '</select></label>' + U.message(ui.attendanceError, 'error') + U.message('Al registrar comienza un temporizador con la duración elegida. Puedes finalizar antes; al llegar a cero, la sesión termina por tiempo.') + '<button class="button" type="submit">' + U.icon('play_arrow') + 'Registrar</button></form>' + noAccess(gym);
  };
  function activeSession(record, gym) {
    var now = Date.now();
    return '<a class="back-link" href="#/activity/attendance">' + U.icon('arrow_back') + 'Mi actividad</a><div class="session-hero"><span class="badge success live-badge"><span class="live-dot" aria-hidden="true"></span>En curso</span><h1>Entrenamiento en curso</h1><p>' + U.escape(record.name) + ' · ' + U.escape(U.capital(record.type)) + '</p></div>' +
      '<section class="countdown-card"><span class="countdown-label" id="countdown-label">Tiempo restante</span><div class="countdown" role="timer" aria-live="off" aria-atomic="true" aria-labelledby="countdown-label" data-countdown="' + U.escape(record.id) + '">' + U.duration(S.getSessionRemainingMs(record, now)) + '</div><div class="session-progress" aria-hidden="true"><i data-progress="' + U.escape(record.id) + '" style="transform:scaleX(' + progress(record, now).toFixed(4) + ')"></i></div><div class="session-times"><span><small>Inicio</small>' + U.clock(record.startedAt) + '</span><span><small>Fin previsto</small>' + U.clock(record.plannedEndAt) + '</span></div></section>' +
      '<div class="review-card"><dl class="summary-list"><div><dt>Duración elegida</dt><dd>' + U.hours(record.duration) + '</dd></div><div><dt>Entrenamiento</dt><dd>' + U.escape(U.capital(record.type)) + '</dd></div><div><dt>Llegada verificada</dt><dd>QR de entrada · ' + U.clock(record.verification.verifiedAt) + '</dd></div></dl></div>' +
      '<button class="button" data-action="finish-session" data-id="' + U.escape(record.id) + '">' + U.icon('stop_circle') + 'Finalizar entrenamiento</button>' +
      '<section class="demo-control"><span class="eyebrow">' + U.icon('science') + 'Control de demostración</span><p>Adelanta el reloj de esta demo hasta el fin previsto para ver el cierre automático.</p><button class="button ghost" data-action="simulate-timeout" data-id="' + U.escape(record.id) + '">Demo · simular fin del tiempo</button></section>' + accountCard(record.account) + noAccess(gym);
  }
  function finishedSession(record, gym) {
    var timeout = record.endReason === 'timeout';
    return '<a class="back-link" href="#/activity/attendance">' + U.icon('arrow_back') + 'Mi actividad</a><div class="success-hero"><span class="success-ring">' + U.icon(timeout ? 'timer_off' : 'check_circle') + '</span><h1>Entrenamiento finalizado</h1><p>' + (timeout ? 'Se completó el tiempo que elegiste. Tu salida quedó registrada.' : 'Finalizaste antes del tiempo previsto. Tu salida quedó registrada.') + '</p></div>' +
      '<div class="review-card"><span class="badge neutral">Finalizada · ' + REASONS[record.endReason] + '</span><h2>' + U.escape(record.name) + '</h2><dl class="summary-list"><div><dt>Motivo</dt><dd>' + REASONS[record.endReason] + '</dd></div><div><dt>Inicio</dt><dd>' + U.clock(record.startedAt) + '</dd></div><div><dt>Fin</dt><dd>' + U.clock(record.endedAt) + '</dd></div><div><dt>Tiempo entrenado</dt><dd>' + U.span(record.endedAt - record.startedAt) + '</dd></div><div><dt>Duración elegida</dt><dd>' + U.hours(record.duration) + '</dd></div><div><dt>Entrenamiento</dt><dd>' + U.escape(U.capital(record.type)) + '</dd></div></dl></div>' + accountCard(record.account) + noAccess(gym) +
      '<div class="stack"><a class="button secondary" href="#/activity/attendance">Ver mis asistencias</a><a class="button ghost" href="#/gym/' + gym.id + '">Volver al gimnasio</a></div>';
  }
  root.SCViews.attendance = function (state, ui, route) {
    var record = state.attendance.find(function (item) { return item.id === route.id; });
    if (!record) return U.heading('Asistencia', '', '#/activity/attendance') + U.empty('No encontramos este registro', 'Revisa tus asistencias en Mi actividad.', 'fitness_center', '#/activity/attendance', 'Ver mis asistencias');
    var gym = S.getSpace(record.gymId);
    return record.status === 'active' ? activeSession(record, gym) : finishedSession(record, gym);
  };
})(globalThis);
