const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../state.js');
const D = require('../data.js');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('prototype keys never resolve as sections and never throw', () => {
  const state = C.createState();
  for (const hash of ['#/constructor', '#/constructor/x', '#/__proto__', '#/__proto__/x/y', '#/toString', '#/hasOwnProperty/x', '#/valueOf']) {
    let route;
    assert.doesNotThrow(() => { route = C.resolveRoute(hash, D, state); }, hash);
    assert.equal(route.valid, false, hash);
  }
  assert.equal(C.resolveRoute('#/talent', D, state).valid, true);
});

test('the toast is a visual duplicate hidden from assistive technology; #live announces once', () => {
  const html = read('index.html');
  assert.ok(/id="live"[^>]*role="status"/.test(html));
  const toast = html.match(/<div id="toast"[^>]*>/)[0];
  assert.ok(toast.includes('aria-hidden="true"'), toast);
  assert.equal(/role="status"|aria-live/.test(toast), false, toast);
});

test('placeholder and search icon colours meet text contrast on white', () => {
  const css = read('styles.css');
  const hex = selector => (css.match(new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\{[^}]*color:(#[0-9a-f]{6})', 'i')) || [])[1];
  const lum = value => { const c = [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const ratio = value => 1.05 / (lum(value) + 0.05);
  assert.ok(ratio(hex('.search-field input::placeholder')) >= 4.5, 'placeholder');
  assert.ok(ratio(hex('.search-field>.icon')) >= 3, 'search icon (non-text 3:1)');
});

test('form fields use 16 px text on phones so iOS does not zoom on focus', () => {
  const css = read('styles.css');
  assert.ok(/@media\s*\(max-width:\s*767px\)\s*\{[^}]*input[^}]*textarea[^}]*select[^}]*\{[^}]*font-size:16px/.test(css.replace(/\n/g, ' ')), 'a phone rule sets inputs, textareas and selects to 16px');
});
