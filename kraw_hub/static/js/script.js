// Interações básicas: alternância de tema e busca em tempo real
(function() {
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('kraw-theme');

  function applyTheme(theme) {
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
  }

  applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = root.getAttribute('data-theme') === 'dark';
      const next = isDark ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem('kraw-theme', next);
    });
  }

  // Busca
  const searchInput = document.getElementById('searchInput');
  const gamesGrid = document.getElementById('gamesGrid');
  const gameCount = document.getElementById('gameCount');

  if (searchInput && gamesGrid) {
    const cards = Array.from(gamesGrid.querySelectorAll('.game-card'));
    const normalize = (s) => (s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

    function filter() {
      const q = normalize(searchInput.value);
      let visible = 0;
      cards.forEach(card => {
        const name = normalize(card.dataset.name);
        const author = normalize(card.dataset.author);
        const tags = normalize(card.dataset.tags);
        const show = !q || name.includes(q) || author.includes(q) || tags.includes(q);
        card.style.display = show ? '' : 'none';
        if (show) visible += 1;
      });
      if (gameCount) gameCount.textContent = String(visible);
    }

    searchInput.addEventListener('input', filter);
  }
})();
