const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const stylesheets = ['styles.css', 'pulse.css', 'profile.css', 'talent.css', 'mentor.css'];
const css = Object.fromEntries(stylesheets.map(file => [file, fs.readFileSync(path.join(root, file), 'utf8')]));
const values = (pattern) => Object.entries(css).flatMap(([file, text]) => [...text.matchAll(pattern)].map(match => ({ file, value: match[1].trim() })));

test('every border radius sits on the Bamboo scale (4, 8, 12, 24) or is a circle', () => {
  const allowed = new Set(['4px', '8px', '12px', '24px', '50%', '0']);
  const offScale = values(/border-radius:([^;}]+)/g).filter(({ value }) => !value.split(/\s+/).every(part => allowed.has(part)));
  assert.deepEqual(offScale, []);
});

test('no stylesheet sets text below 12 px', () => {
  const small = values(/font-size:([0-9.]+)px/g).filter(({ value }) => Number(value) < 12);
  assert.deepEqual(small, []);
});

test('typography uses Poppins and icons use Material Symbols Rounded only', () => {
  const families = new Set(values(/font-family:([^;}]+)/g).map(({ value }) => value.replace(/["']/g, '')));
  for (const family of families) assert.ok(/^(Poppins|Material Symbols Rounded|inherit)/.test(family), family);
  assert.ok(css['styles.css'].includes("font-family:'Material Symbols Rounded'"));
});

test('the Azul TEC anchor and the area accents keep their tokens', () => {
  assert.ok(css['styles.css'].includes('--blue:#0039a6'));
  assert.ok(css['styles.css'].includes('--purple:#a12780') && css['styles.css'].includes('--orange:#bb4c02'));
});

test('the shell marks the concept, the fictitious data and the working name', () => {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.ok(app.includes('Concepto · datos ficticios'));
  assert.ok(app.includes('nombre de trabajo sujeto a revisión institucional'));
});
