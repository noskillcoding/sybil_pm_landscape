// assets/js/state.js
// Shared mutable UI state, imported by any module that reads or writes it.

export const state = {
  currentView: 'summary',
  catFilter: null,
  toolFilter: null,
  searchQ: '',
  testCatFilter: null,
  testHasFilter: null,
  testSearchQ: ''
};
