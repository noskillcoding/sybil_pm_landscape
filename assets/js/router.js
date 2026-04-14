// assets/js/router.js

import { state } from './state.js';
import { Sort } from './sort.js';
import { render } from './landscape.js';
import { renderTesting } from './testing.js';
import { renderMethodology } from './methodology.js';

export const Router = {
  parse() {
    const hash = (location.hash || '').replace(/^#\/?/, '');
    const [pathPart, queryPart] = hash.split('?');
    const segments = pathPart.split('/').filter(Boolean);
    const view = segments[0] || 'landscape';
    const pmSlug = segments[1] || null;
    const params = new URLSearchParams(queryPart || '');
    const validView = (view === 'testing' || view === 'landscape' || view === 'methodology') ? view : 'landscape';
    return {
      view: validView,
      pm: pmSlug,
      cat: params.get('cat') || null,
      has: params.get('has') || null,
      q:   params.get('q')   || '',
      sort: params.get('sort') || null,
      dir:  params.get('dir')  === 'desc' ? 'desc' : 'asc',
    };
  },
  write(s) {
    const params = new URLSearchParams();
    if (s.cat) params.set('cat', s.cat);
    if (s.has) params.set('has', s.has);
    if (s.q)   params.set('q', s.q);
    if (s.sort){ params.set('sort', s.sort); params.set('dir', s.dir); }
    const path = s.view + (s.pm ? '/' + s.pm : '');
    const qs = params.toString();
    const next = '#/' + path + (qs ? '?' + qs : '');
    if (next !== location.hash) history.replaceState(null, '', next);
  },
  slug(name) { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); },
  init() {
    window.addEventListener('hashchange', () => this.applyToState());
    this.applyToState();
  },
  applyToState() {
    const s = this.parse();
    state.catFilter = s.cat;
    state.toolFilter = s.has;
    state.searchQ = s.q;
    const sb = document.getElementById('searchBox');
    if (sb && sb.value !== s.q) sb.value = s.q;
    Sort.state.key = s.sort;
    Sort.state.dir = s.dir;
    const targetView = s.view;
    const renderFor = (v) => {
      if (v === 'methodology') renderMethodology();
      else if (v === 'landscape') render();
      else renderTesting();
    };
    if (state.currentView !== targetView) {
      const tab = document.querySelector(`.t-tab[data-view="${targetView}"]`);
      if (tab) tab.click();
      else renderFor(targetView);
    } else {
      renderFor(targetView);
    }
    if (s.pm) setTimeout(() => this.scrollToAndExpand(s.pm), 0);
  },
  scrollToAndExpand(slug) {
    const rows = document.querySelectorAll('#tableBody .t-row');
    for (const row of rows) {
      if (this.slug(row.dataset.pm || '') === slug) {
        if (!row.classList.contains('expanded')) row.click();
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      }
    }
  },
  currentState() {
    return {
      view: state.currentView,
      pm: null,
      cat: state.catFilter,
      has: state.toolFilter,
      q:   state.searchQ,
      sort: Sort.state.key,
      dir:  Sort.state.dir,
    };
  },
  push() { this.write(this.currentState()); }
};
