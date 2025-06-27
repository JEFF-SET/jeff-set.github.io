const toggle = document.getElementById('toggle-dark');
const THEME_KEY = 'theme';
function setTheme(isDark) {
  document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
}
if (toggle) toggle.addEventListener('change', () => setTheme(toggle.checked));
(function () {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark') {
    if (toggle) toggle.checked = true;
    setTheme(true);
  } else {
    if (toggle) toggle.checked = false;
    setTheme(false);
  }
})();