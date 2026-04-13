// assets/js/sort.js

export const Sort = {
  state: { key: null, dir: 'asc' }, // dir: 'asc' | 'desc'
  comparators: {
    name:     (a, b) => a.name.localeCompare(b.name),
    category: (a, b) => (a.category || '').localeCompare(b.category || ''),
    volume:   (a, b) => (a.volumeNumeric || 0) - (b.volumeNumeric || 0),
  },
  apply(rows) {
    if (!this.state.key) return rows;
    const cmp = this.comparators[this.state.key];
    if (!cmp) return rows;
    const sorted = rows.slice().sort(cmp);
    if (this.state.dir === 'desc') sorted.reverse();
    return sorted;
  },
  cycle(key) {
    if (this.state.key !== key) { this.state.key = key; this.state.dir = 'asc'; }
    else if (this.state.dir === 'asc') { this.state.dir = 'desc'; }
    else { this.state.key = null; this.state.dir = 'asc'; }
  }
};
