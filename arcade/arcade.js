/* Progressive enhancement: every game and version link works without JavaScript. */
(() => {
  'use strict';
  const cards = [...document.querySelectorAll('.game-card')];
  const search = document.querySelector('#game-search');
  const filters = [...document.querySelectorAll('[data-filter]')];
  const count = document.querySelector('#result-count');
  const empty = document.querySelector('#empty-state');
  const random = document.querySelector('#random-game');
  if (!cards.length || !search || !count || !empty || !random) return;
  let genre = 'all';
  const searchable = cards.map(card => ({
    card,
    text: `${card.dataset.keywords || ''} ${card.textContent}`.toLowerCase()
  }));
  function applyFilters() {
    const terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let visible = 0;
    searchable.forEach(({card, text}) => {
      const matches = (genre === 'all' || card.dataset.genre === genre) && terms.every(term => text.includes(term));
      card.hidden = !matches;
      if (matches) visible++;
    });
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === genre)));
    count.textContent = `Showing ${visible} of ${cards.length} game families`;
    empty.hidden = visible !== 0;
    random.disabled = visible === 0;
  }
  filters.forEach(button => button.addEventListener('click', () => {
    genre = button.dataset.filter;
    applyFilters();
  }));
  search.addEventListener('input', applyFilters);
  document.querySelector('#clear-filters').addEventListener('click', () => {
    genre = 'all';
    search.value = '';
    applyFilters();
    search.focus();
  });
  random.addEventListener('click', () => {
    const available = cards.filter(card => !card.hidden);
    if (!available.length) return;
    const link = available[Math.floor(Math.random() * available.length)].querySelector('.play-link');
    if (link) window.location.assign(link.href);
  });
  document.querySelector('#library-tools').hidden = false;
  count.hidden = false;
  random.hidden = false;
  applyFilters();
})();
