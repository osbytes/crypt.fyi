// Runs synchronously before first paint so a stored or OS-preferred theme never
// flashes the wrong colors. Lives in its own file because CSP forbids inline scripts
// (script-src 'self'). Keep the colors in sync with --background in src/index.css.
(function () {
  var preference = 'system';
  try {
    var stored = window.localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') preference = stored;
  } catch (_) {
    // Storage can be blocked (private modes, policies); fall back to the OS preference.
  }
  var isDark =
    preference === 'dark' ||
    (preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', isDark ? '#0e0f12' : '#f5f6f7');
})();
