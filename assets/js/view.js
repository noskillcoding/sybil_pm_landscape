// assets/js/view.js

import { state } from './state.js';
import { Router } from './router.js';
import { render } from './landscape.js';
import { getTestablePMs, renderTesting } from './testing.js';
import { renderMethodology } from './methodology.js';

export function setSubtitle(view) {
  const el = document.getElementById('subtitle');
  if (!el) return;
  if (view === 'testing') {
    el.textContent = `${getTestablePMs().length} decentralized & play-money PMs with dev tools — April 2026`;
  } else {
    el.textContent = `${window.DATA.length} verified prediction markets — April 2026`;
  }
}

export function applyViewVisibility(view) {
  const mv = document.getElementById('methodologyView');
  const lv = document.getElementById('landscapeView');
  const tv = document.getElementById('testingView');
  const mh = document.getElementById('methodologyHero');
  const lh = document.getElementById('landscapeHero');
  const th = document.getElementById('testingHero');

  [mv, lv, tv].forEach(el => el && el.classList.remove('is-active'));
  [mh, lh, th].forEach(el => { if (el) el.style.display = 'none'; });

  if (view === 'methodology') {
    if (mv) mv.classList.add('is-active');
    if (mh) mh.style.display = '';
  } else if (view === 'landscape') {
    if (lv) lv.classList.add('is-active');
    if (lh) lh.style.display = '';
  } else {
    if (tv) tv.classList.add('is-active');
    if (th) th.style.display = '';
  }
}

export function initViewNav() {
  setSubtitle('landscape');
  applyViewVisibility('landscape');

  document.querySelectorAll('.t-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const view = tab.dataset.view;
      if (view === state.currentView) return;
      state.currentView = view;
      document.querySelectorAll('.t-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      setSubtitle(view);
      applyViewVisibility(view);
      if (view === 'methodology') renderMethodology();
      else if (view === 'testing') renderTesting();
      else render();
      Router.push();
    });
  });

}
