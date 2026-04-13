// assets/js/main.js
// Entry point. Fetches data, wires modules, handles keyboard shortcuts.

import { Theme } from './theme.js';
import { Router } from './router.js';
import { initViewNav } from './view.js';

async function boot() {
  const [pms, aa, tests] = await Promise.all([
    fetch('./data/pms.json').then(r => r.json()),
    fetch('./data/accessibility.json').then(r => r.json()),
    fetch('./data/tests.json').then(r => r.json())
  ]);
  window.DATA = pms;
  window.AA_RESULTS = aa;
  window.TEST_RESULTS = tests.current || tests;
  window.TEST_RESULTS_LEGACY = tests.legacy || null;

  Theme.init();
  initViewNav();
  Router.init();
}

// Keyboard shortcuts (/ focuses search, Esc clears)
document.addEventListener('keydown', e => {
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    e.preventDefault();
    const sb = document.getElementById('searchBox');
    if (sb && sb.offsetParent) sb.focus();
  }
  if (e.key === 'Escape' && document.activeElement.tagName === 'INPUT') {
    document.activeElement.value = '';
    document.activeElement.dispatchEvent(new Event('input', { bubbles: true }));
  }
});

window.addEventListener('DOMContentLoaded', boot);
