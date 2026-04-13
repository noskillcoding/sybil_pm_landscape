// assets/js/view.js

import { state } from './state.js';
import { Router } from './router.js';
import { getTestablePMs, renderTesting } from './testing.js';

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
  const lv = document.getElementById('landscapeView');
  const tv = document.getElementById('testingView');
  const lh = document.getElementById('landscapeHero');
  const th = document.getElementById('testingHero');
  if (view === 'landscape') {
    if (lv) lv.classList.add('is-active');
    if (tv) tv.classList.remove('is-active');
    if (lh) lh.style.display = '';
    if (th) th.style.display = 'none';
  } else {
    if (lv) lv.classList.remove('is-active');
    if (tv) tv.classList.add('is-active');
    if (lh) lh.style.display = 'none';
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
      if (view === 'testing') renderTesting();
      Router.push();
    });
  });

  // Static methodology panel tabs (legacy — the panel is hidden by CSS but
  // still in the DOM, and this handler keeps its mContent-* toggles working).
  document.querySelectorAll('#mTabs .m-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const target = this.dataset.mtab;
      document.querySelectorAll('#mTabs .m-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      ['mContent-aa','mContent-cli','mContent-skill','mContent-framework'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('open');
      });
      const content = document.getElementById('mContent-' + target);
      if (content) content.classList.add('open');
    });
  });
}
