(function() {
  const root = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const savedTheme = localStorage.getItem("kraw-theme");

  function applyTheme(theme) {
    const safe = theme === "light" ? "light" : "dark";
    root.setAttribute("data-theme", safe);
    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", safe === "dark" ? "true" : "false");
    }
    applyThemeToIframes(safe);
  }

  applyTheme(savedTheme || (prefersDark ? "dark" : "light"));

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = root.getAttribute("data-theme") || (prefersDark ? "dark" : "light");
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem("kraw-theme", next);
    });
  }

  function applyThemeToIframes(theme) {
    const iframes = document.querySelectorAll(".game-embed");
    iframes.forEach((frame) => {
      const doc = frame.contentDocument;
      if (doc && doc.documentElement) {
        doc.documentElement.setAttribute("data-theme", theme);
        if (doc.body) {
          doc.body.setAttribute("data-theme", theme);
        }
      }
    });
  }

  const searchInput = document.getElementById("searchInput");
  const gamesGrid = document.getElementById("gamesGrid");
  const countTargets = document.querySelectorAll("[data-count-target]");
  const emptyState = document.getElementById("emptyState");
  const gameIframe = document.querySelector(".game-embed");

  if (searchInput && gamesGrid) {
    const cards = Array.from(gamesGrid.querySelectorAll(".game-card"));
    const normalize = (s) => (s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

    function updateCount(value) {
      countTargets.forEach((el) => (el.textContent = String(value)));
    }

    function filter() {
      const q = normalize(searchInput.value);
      let visible = 0;
      cards.forEach((card) => {
        const name = normalize(card.dataset.name);
        const author = normalize(card.dataset.author);
        const tags = normalize(card.dataset.tags);
        const show = !q || name.includes(q) || author.includes(q) || tags.includes(q);
        card.style.display = show ? "" : "none";
        if (show) visible += 1;
      });
      updateCount(visible);
      if (emptyState) {
        emptyState.hidden = visible !== 0;
      }
    }

    searchInput.addEventListener("input", filter);
    filter();
  }

  if (gameIframe) {
    gameIframe.addEventListener("load", () => {
      applyThemeToIframes(root.getAttribute("data-theme") || (prefersDark ? "dark" : "light"));
    });
  }
})();
