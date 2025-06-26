// Theme toggle logic (two colors only)
const toggle = document.getElementById('toggle-dark');
const THEME_KEY = 'theme';

function setTheme(isDark) {
  document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
}

if (toggle) {
  toggle.addEventListener('change', () => setTheme(toggle.checked));
}

// On load, respect saved value or system preference
(function () {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefersDark)) {
    if (toggle) toggle.checked = true;
    setTheme(true);
  } else {
    if (toggle) toggle.checked = false;
    setTheme(false);
  }
})();