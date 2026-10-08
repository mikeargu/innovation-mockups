(function (root) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const C = node ? require('./state.js') : root.TecState;
  const U = node ? require('./ui.js') : root.TecUI;
  const { e, icon } = U;
  const returnLink = () => `<a class="button secondary" href="index.html#/pulse">${icon('arrow_back')}Volver a Campus Pulse</a>`;
  function renderSource(query, items) {
    const params = new URLSearchParams(query);
    const type = params.get('type'), id = params.get('id');
    const item = items.find(item => item.id === id && ((type === 'article' && item.kind === 'article') || (type === 'job' && item.kind === 'internship')));
    const marker = `<span class="source-fiction">${icon('science')}Fuente de ejemplo · contenido ficticio</span>`;
    if (!item) return `<section class="source-document source-not-found">${marker}<h1>Fuente no encontrada</h1><p>El contenido solicitado no está disponible en esta demo.</p>${returnLink()}</section>`;
    const article = type === 'article';
    const body = article ? `<div class="source-prose">${item.paragraphs.map(p => `<p>${e(p)}</p>`).join('')}</div>` : `<dl class="source-facts"><div><dt>Rol</dt><dd>${e(item.role)}</dd></div><div><dt>Empresa ficticia</dt><dd>${e(item.company)}</dd></div><div><dt>Ubicación y modalidad</dt><dd>${e(item.location)} · ${e(item.modality)}</dd></div><div><dt>Cierre de ejemplo</dt><dd>${e(item.deadline)}</dd></div><div><dt>Duración ilustrativa</dt><dd>${e(item.duration)}</dd></div></dl><section class="source-prose"><h2>Actividades de ejemplo</h2><ul>${item.responsibilities.map(value => `<li>${e(value)}</li>`).join('')}</ul><h2>Perfil de ejemplo</h2><ul>${item.requirements.map(value => `<li>${e(value)}</li>`).join('')}</ul><h2>Acerca de esta oportunidad</h2><p>${e(item.process)}</p></section>`;
    return `<article class="source-document" data-source-kind="${e(type)}" data-source-id="${e(item.id)}">${marker}<span class="eyebrow">${article ? 'Artículo completo de ejemplo' : 'Oportunidad completa de ejemplo'}</span><h1>${e(item.title)}</h1><p class="source-context">${e(item.source)} · ${e(item.when)}</p><p class="source-intro">${e(item.summary)}</p>${body}<p class="source-note">${e(item.note)}</p>${returnLink()}</article>`;
  }
  const api = { renderSource };
  if (node) module.exports = api;
  else { root.TecDemoSource = api; document.getElementById('source-main').innerHTML = renderSource(root.location.search, root.TecData.pulse); }
})(typeof window !== 'undefined' ? window : globalThis);
