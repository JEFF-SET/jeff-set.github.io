// Theme toggle logic (dark by default, two colors only)
const toggle = document.getElementById('toggle-dark');
const THEME_KEY = 'theme';

function setTheme(isDark) {
  document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
}

if (toggle) {
  toggle.addEventListener('change', () => setTheme(toggle.checked));
}

// On load: dark mode by default (even для первого захода)
(function () {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light') {
    if (toggle) toggle.checked = false;
    setTheme(false);
  } else {
    if (toggle) toggle.checked = true;
    setTheme(true);
  }
})();