// assets/js/theme.js

export const Theme = {
  get current() { return document.documentElement.getAttribute('data-theme') || 'dark'; },
  set(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}
    document.querySelectorAll('[data-theme-icon]').forEach(el => {
      el.textContent = theme === 'dark' ? '◐' : '◑';
    });
  },
  toggle() { this.set(this.current === 'dark' ? 'light' : 'dark'); },
  init() {
    document.addEventListener('click', e => {
      if (e.target.closest('[data-theme-toggle]')) { e.preventDefault(); this.toggle(); }
    });
    this.set(this.current); // refresh icon on load
  }
};
