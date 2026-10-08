(function (root) {
  'use strict';
  const C = typeof module !== 'undefined' && module.exports ? require('./state.js') : root.TecState;
  const e = C.escapeHTML;
  const icon = name => `<span class="icon" aria-hidden="true">${e(name)}</span>`;
  const tags = values => values.map(value => `<span class="tag">${e(value)}</span>`).join('');
  const avatar = (person, large = false) => `<span class="avatar ${e(person.color || 'blue')}${large ? ' large' : ''}" aria-hidden="true">${e(person.initials || C.initials(person.displayName))}</span>`;
  const externalLink = (url, label) => C.isSafeURL(url) ? `<a class="text-link" href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(label)} ${icon('open_in_new')}</a>` : '';
  function isSafeOutboundURL(url, items) {
    if (typeof url !== 'string') return false;
    try { if (/(^|\/)\.{1,2}(\/|[?#]|$)/.test(decodeURIComponent(url))) return false; }
    catch (_) { return false; }
    if (C.isSafeURL(url)) return true;
    if (!/^demo-source\.html\?type=(article|job)&id=[a-z0-9-]+$/.test(url)) return false;
    return items.some(item => (item.kind === 'article' && item.articleUrl === url) || (item.kind === 'internship' && item.ctaUrl === url));
  }
  const outboundLink = (url, label, items, classes = 'text-link') => isSafeOutboundURL(url, items) ? `<a class="${e(classes)}" href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(label)} ${icon('open_in_new')}</a>` : '';
  const api = { e, icon, tags, avatar, externalLink, isSafeOutboundURL, outboundLink };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TecUI = api;
})(typeof window !== 'undefined' ? window : globalThis);
