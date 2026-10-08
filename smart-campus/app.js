(function (root) {
  'use strict';
  var D = root.SCData, S = root.SCState, A = root.SCAssistant, U = root.SCUI, V = root.SCViews;
  var state = S.createState(), ui = freshUI(), route, main = document.querySelector('main'), live = document.getElementById('live-status'), dialog = document.getElementById('confirm-dialog'), toastTimer, ticker = null;
  var TICK_MS = 1000, TIMEOUT_MESSAGE = 'Tiempo completado. Entrenamiento finalizado.', EXPIRED_MESSAGE = 'La verificación de llegada expiró. Escanea de nuevo el QR de la entrada.', dialogSessionId = null;
  function freshUI() { return { filtersOpen: false, libraryError: '', libraryAlternatives: null, attendanceError: '', scanError: '', scanCode: '', assistantError: '' }; }
  function announce(message) { live.textContent = ''; setTimeout(function () { live.textContent = message; }, 20); }
  function toast(message) { var node = document.getElementById('toast'); node.textContent = message; node.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(function () { node.classList.remove('show'); }, 2800); announce(message); }
  function navigate(hash) { if (location.hash === hash) render(false); else location.hash = hash; }
  function focusedControl() {
    var node = document.activeElement;
    if (!main.contains(node) || node === main) return null;
    if (!node.id && !node.dataset.action) return null;
    return { id: node.id, action: node.dataset.action, attrs: Object.assign({}, node.dataset), start: node.selectionStart, end: node.selectionEnd };
  }
  function restoreFocus(control) {
    if (!control) return;
    var node = control.id ? document.getElementById(control.id) : Array.from(main.querySelectorAll('[data-action]')).find(function (candidate) { return Object.keys(control.attrs).every(function (key) { return candidate.dataset[key] === control.attrs[key]; }); });
    if (!node || node.disabled) return;
    node.focus({ preventScroll: true });
    if (typeof control.start === 'number' && typeof node.setSelectionRange === 'function') { try { node.setSelectionRange(control.start, control.end); } catch (_) {} }
  }
  function prepareRoute() {
    if (route.view === 'libraryBook' || route.view === 'libraryReview') {
      var room = S.getSpace(route.id);
      if (state.bookingDraft.roomId !== room.id) { state.bookingDraft.roomId = room.id; state.bookingDraft.capacity = Math.min(state.bookingDraft.capacity, room.capacity); ui.libraryError = ''; ui.libraryAlternatives = null; }
    }
    if (['gym', 'gymScan', 'gymAttendance'].includes(route.view) && state.attendanceDraft.gymId !== route.id) { state.attendanceDraft.gymId = route.id; ui.attendanceError = ''; clearScanError(); }
    if (route.view === 'assistant') A.refreshAnswer(state);
  }
  function clearScanError() { ui.scanError = ''; ui.scanCode = ''; }
  function findSession(id) { return state.attendance.find(function (record) { return record.id === id; }); }
  function stopTimer() { clearInterval(ticker); ticker = null; }
  function syncTimer() {
    var running = state.attendance.some(function (record) { return record.status === 'active'; }) || arrivalPending();
    if (running && !ticker) ticker = setInterval(tick, TICK_MS);
    if (!running) stopTimer();
  }
  function arrivalPending() { return route && route.view === 'gymAttendance' && !!state.arrival && Date.now() < state.arrival.expiresAt; }
  function arrivalExpiredOnForm() { return route.view === 'gymAttendance' && !!state.arrival && Date.now() >= state.arrival.expiresAt && !!main.querySelector('#attendance-form'); }
  function updateCountdowns() {
    var now = Date.now();
    main.querySelectorAll('[data-arrival-countdown]').forEach(function (node) { if (state.arrival) node.textContent = U.duration(state.arrival.expiresAt - now); });
    main.querySelectorAll('[data-countdown]').forEach(function (node) { var record = findSession(node.dataset.countdown); if (record) node.textContent = U.duration(S.getSessionRemainingMs(record, now)); });
    main.querySelectorAll('[data-progress]').forEach(function (node) {
      var record = findSession(node.dataset.progress), total = record ? record.plannedEndAt - record.startedAt : 0;
      if (total > 0) node.style.transform = 'scaleX(' + Math.min(1, Math.max(0, (now - record.startedAt) / total)).toFixed(4) + ')';
    });
  }
  function focusHeading() { var heading = main.querySelector('h1'); main.scrollTop = 0; heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
  function tick() {
    if (arrivalExpiredOnForm()) { focusError(EXPIRED_MESSAGE); syncTimer(); return; }
    var synced = S.syncGymSessions(state);
    if (!synced.ok || !synced.finished.length) { updateCountdowns(); return; }
    if (dialog.open && synced.finished.some(function (record) { return record.id === dialogSessionId; })) dialog.close();
    var hadFocus = main.contains(document.activeElement);
    render(false);
    if (hadFocus && !main.contains(document.activeElement) && !dialog.open) focusHeading();
    toast(TIMEOUT_MESSAGE);
  }
  function focusError(message) { render(false); var error = main.querySelector('.notice.error'); error.setAttribute('tabindex', '-1'); error.focus(); announce(message); }
  function render(changedRoute) {
    var parsed = U.parseRoute(location.hash), recovery = '';
    if (!parsed) { history.replaceState(null, '', '#/explore'); parsed = { view: 'explore' }; recovery = 'Esta pantalla no está disponible. Volviste a Explorar.'; }
    route = parsed;
    S.syncGymSessions(state);
    prepareRoute();
    var control = changedRoute ? null : focusedControl(), y = changedRoute ? 0 : main.scrollTop;
    main.innerHTML = V[route.view](state, ui, route);
    main.scrollTop = y;
    var current = route.view === 'assistant' ? 'assistant' : ['activity', 'reservation', 'attendance'].includes(route.view) ? 'activity' : 'explore';
    document.querySelectorAll('[data-nav]').forEach(function (node) { if (node.dataset.nav === current) node.setAttribute('aria-current', 'page'); else node.removeAttribute('aria-current'); });
    var h1 = main.querySelector('h1');
    document.title = h1.textContent + ' · Smart Campus';
    if (changedRoute) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); announce(recovery || h1.textContent); }
    else if (recovery) announce(recovery);
    else restoreFocus(control);
    syncTimer();
  }
  function updateExploreResults(query) {
    var region = document.getElementById('explore-results');
    if (state.explore.query === query && region) return;
    state.explore.query = query;
    if (!region) { render(false); return; }
    region.innerHTML = V.exploreResults(state);
    announce(S.searchSpaces(state).length + ' espacios encontrados.');
  }
  function clearBookingError() { ui.libraryError = ''; ui.libraryAlternatives = null; }
  function confirm(config) {
    var opener = document.activeElement;
    dialogSessionId = config.sessionId || null;
    dialog.innerHTML = '<span class="dialog-icon">' + U.icon(config.icon || 'info') + '</span><h2 id="dialog-title">' + U.escape(config.title) + '</h2><p id="dialog-description">' + U.escape(config.body) + '</p><div class="button-row"><button class="button ' + (config.danger ? 'danger' : '') + '" id="dialog-confirm">' + U.escape(config.label) + '</button><button class="button ghost" id="dialog-cancel">Volver</button></div>';
    function close() { dialog.close(); }
    dialog.querySelector('#dialog-cancel').addEventListener('click', close);
    dialog.querySelector('#dialog-confirm').addEventListener('click', function () { dialog.close(); config.onConfirm(); });
    dialog.addEventListener('close', function restore() {
      dialog.removeEventListener('close', restore); dialogSessionId = null;
      var replacement = opener && opener.dataset.action ? Array.from(main.querySelectorAll('[data-action]')).find(function (candidate) { return candidate.dataset.action === opener.dataset.action && candidate.dataset.id === opener.dataset.id; }) : null;
      if (opener && opener.isConnected) opener.focus();
      else if (replacement) replacement.focus();
      else { var heading = main.querySelector('h1'); main.scrollTop = 0; heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
    }, { once: true });
    dialog.showModal();
    dialog.querySelector('#dialog-cancel').focus();
  }
  main.addEventListener('input', function (event) {
    if (event.target.id === 'explore-query' && !event.isComposing) updateExploreResults(event.target.value);
    if (event.target.id === 'assistant-query') state.assistant.query = event.target.value;
  });
  main.addEventListener('compositionend', function (event) { if (event.target.id === 'explore-query') updateExploreResults(event.target.value); });
  main.addEventListener('change', function (event) {
    var node = event.target;
    if (node.id === 'min-capacity') { state.explore.minCapacity = Number(node.value); render(false); announce(S.searchSpaces(state).length + ' espacios encontrados.'); }
    if (node.id === 'booking-date') { state.bookingDraft.date = node.value; clearBookingError(); render(false); }
    if (node.id === 'booking-capacity') { state.bookingDraft.capacity = Number(node.value); clearBookingError(); render(false); }
    if (node.id === 'gym-date') { state.gymView.date = node.value; render(false); announce('Disponibilidad estimada del ' + U.date(node.value, true) + '.'); }
    if (node.name === 'duration') { state.attendanceDraft.duration = Number(node.value); ui.attendanceError = ''; }
    if (node.id === 'training-type') { state.attendanceDraft.type = node.value; ui.attendanceError = ''; }
  });
  main.addEventListener('submit', function (event) {
    event.preventDefault();
    if (event.target.id === 'booking-form') navigate('#/library/' + state.bookingDraft.roomId + '/review');
    if (event.target.id === 'attendance-form') {
      var draft = state.attendanceDraft, result = S.startGymSession(state, { gymId: route.id, duration: draft.duration, type: draft.type });
      if (result.ok) { ui.attendanceError = ''; navigate('#/attendance/' + result.attendance.id); }
      else { ui.attendanceError = result.message; focusError(result.message); }
    }
    if (event.target.id === 'assistant-form') {
      if (!state.assistant.query.trim()) { ui.assistantError = 'Escribe una consulta o elige una idea para comenzar.'; render(false); document.getElementById('assistant-query').focus(); announce(ui.assistantError); return; }
      A.submit(state, state.assistant.query); ui.assistantError = ''; render(false); var response = main.querySelector('.assistant-response'), heading = response.querySelector('h2'); heading.setAttribute('tabindex', '-1'); response.scrollIntoView({ block: 'nearest' }); heading.focus({ preventScroll: true }); announce('Respuesta de ejemplo disponible.');
    }
  });
  main.addEventListener('click', function (event) {
    var node = event.target.closest('[data-action]');
    if (!node || node.disabled) return;
    var action = node.dataset.action;
    if (action === 'explore-mode') { state.explore.mode = node.dataset.mode; render(false); }
    if (action === 'category' || action === 'map-category') { state.explore.category = node.dataset.category; render(false); announce(S.searchSpaces(state).length + ' espacios en ' + U.category(node.dataset.category).label); if (action === 'map-category') main.querySelector('#space-results').scrollIntoView({ block: 'nearest' }); }
    if (action === 'filters') { ui.filtersOpen = !ui.filtersOpen; render(false); }
    if (action === 'favorite') { var favorite = S.toggleFavorite(state, node.dataset.id); render(false); toast(favorite.favorite ? 'Espacio guardado en favoritos.' : 'Espacio eliminado de favoritos.'); }
    if (action === 'library-slot') {
      state.bookingDraft.hour = Number(node.dataset.hour); clearBookingError();
      var slot = S.getLibrarySlots(state, state.bookingDraft).find(function (item) { return item.hour === state.bookingDraft.hour; });
      if (!slot.available) { ui.libraryError = slot.reason === 'user-conflict' ? 'Ya tienes una reserva en este bloque. Revisa las alternativas.' : 'Ese horario está ocupado. Hay otras opciones para tu equipo.'; ui.libraryAlternatives = S.findRoomAlternatives(state, state.bookingDraft); }
      render(false); announce(slot.available ? 'Seleccionaste ' + U.hour(slot.hour) : ui.libraryError);
    }
    if (action === 'library-alternative') {
      Object.assign(state.bookingDraft, { roomId: node.dataset.room, date: node.dataset.date, hour: Number(node.dataset.hour), capacity: Number(node.dataset.capacity) }); clearBookingError(); navigate('#/library/' + node.dataset.room + '/book'); announce('Alternativa seleccionada. Revisa la reserva.');
    }
    if (action === 'confirm-reservation') {
      var reserved = S.reserveRoom(state, Object.assign({}, state.bookingDraft));
      if (reserved.ok) { clearBookingError(); navigate('#/reservation/' + reserved.reservation.id); }
      else { ui.libraryError = reserved.message; ui.libraryAlternatives = reserved.alternatives || null; render(false); announce(reserved.message); }
    }
    if (action === 'cancel-reservation') confirm({ title: '¿Cancelar esta reserva?', body: 'El horario quedará disponible para otra sesión. La reserva aparecerá como cancelada en tu actividad.', label: 'Confirmar cancelación', icon: 'event_busy', danger: true, onConfirm: function () { var cancelled = S.cancelReservation(state, node.dataset.id); render(false); toast(cancelled.ok ? 'Reserva cancelada. El bloque vuelve a estar disponible.' : cancelled.message); } });
    if (action === 'scan-qr' || action === 'scan-wrong-qr') {
      var codeOwner = action === 'scan-qr' ? route.id : Object.keys(D.gymEntryCodes).find(function (id) { return id !== route.id; });
      var verified = S.verifyGymArrival(state, { gymId: route.id, code: D.gymEntryCodes[codeOwner] });
      if (verified.ok) { clearScanError(); ui.attendanceError = ''; navigate('#/gym/' + route.id + '/attendance'); }
      else { ui.scanError = verified.message; ui.scanCode = verified.code; focusError(verified.message); }
    }
    if (action === 'finish-session') confirm({ title: '¿Finalizar entrenamiento?', body: 'Se registrará tu hora de salida y la sesión aparecerá como finalizada en tu actividad.', label: 'Confirmar finalización', icon: 'stop_circle', sessionId: node.dataset.id, onConfirm: function () { S.syncGymSessions(state); var record = findSession(node.dataset.id), alreadyOver = record && record.status !== 'active', finished = alreadyOver ? null : S.finishGymSession(state, node.dataset.id, { reason: 'manual' }); render(false); toast(alreadyOver ? TIMEOUT_MESSAGE : finished.ok ? 'Entrenamiento finalizado.' : finished.message); } });
    if (action === 'simulate-timeout') {
      var running = findSession(node.dataset.id), ended = running ? S.finishGymSession(state, running.id, { reason: 'timeout', now: running.plannedEndAt }) : { ok: false, message: 'No se encontró el registro de asistencia.' };
      render(false); focusHeading(); toast(ended.ok ? TIMEOUT_MESSAGE : ended.message);
    }
    if (action === 'assistant-prompt') { state.assistant.query = A.suggestedPrompts[Number(node.dataset.index)]; ui.assistantError = ''; render(false); document.getElementById('assistant-query').focus({ preventScroll: true }); announce('Consulta sugerida lista para enviar.'); }
    if (action === 'assistant-action') {
      var choice = state.assistant.answer.actions[Number(node.dataset.index)];
      if (choice.type === 'book-room') { Object.assign(state.bookingDraft, { roomId: choice.roomId, date: choice.date, hour: choice.hour, capacity: choice.capacity }); clearBookingError(); navigate('#/library/' + choice.roomId + '/book'); }
      if (choice.type === 'view-space') navigate('#/space/' + choice.spaceId + '/access');
      if (choice.type === 'view-gym') { var gymOption = state.assistant.answer.options[Number(node.dataset.index)]; state.attendanceDraft.gymId = choice.gymId; if (gymOption && gymOption.date) state.gymView.date = gymOption.date; navigate('#/gym/' + choice.gymId); }
    }
    if (action === 'clear-history') confirm({ title: '¿Borrar tus consultas?', body: 'Se borrará el historial del asistente. Tus reservas, asistencias y favoritos seguirán en Mi actividad.', label: 'Confirmar borrado', icon: 'delete_outline', onConfirm: function () { S.clearConsultations(state); render(false); toast('Historial de consultas borrado.'); } });
    if (action === 'reset') confirm({ title: '¿Comenzar de nuevo?', body: 'Se borrarán las reservas, asistencias, favoritos y consultas de esta sesión. También se reiniciarán tus selecciones.', label: 'Confirmar reinicio', icon: 'restart_alt', danger: true, onConfirm: function () { stopTimer(); S.resetState(state); ui = freshUI(); navigate('#/explore'); toast('Demostración reiniciada.'); } });
  });
  document.getElementById('skip-link').addEventListener('click', function (event) { event.preventDefault(); main.focus({ preventScroll: true }); });
  window.addEventListener('hashchange', function () { ui.libraryError = ''; ui.libraryAlternatives = null; ui.attendanceError = ''; clearScanError(); render(true); });
  var navigationEntry = performance.getEntriesByType('navigation')[0];
  if (!location.hash || navigationEntry && navigationEntry.type === 'reload') history.replaceState(null, '', '#/explore');
  render(false);
})(globalThis);
