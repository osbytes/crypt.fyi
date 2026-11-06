import '@crypt.fyi/theme/fonts/inter';
import '@crypt.fyi/theme/fonts/space-grotesk';
import {
  applyResolvedTheme,
  isThemePreference,
  readStoredPreference,
  resolveTheme,
  subscribeToStoredPreference,
  subscribeToSystemTheme,
  systemPrefersDark,
  type ThemePreference,
  writeStoredPreference,
} from '@crypt.fyi/theme';

const options = document.querySelectorAll<HTMLButtonElement>('[data-theme-option]');

let preference = readStoredPreference();

function render() {
  applyResolvedTheme(resolveTheme(preference, systemPrefersDark()));
  for (const option of options) {
    option.setAttribute('aria-pressed', String(option.dataset.themeOption === preference));
  }
}

function setPreference(next: ThemePreference) {
  preference = next;
  writeStoredPreference(next);
  render();
}

for (const option of options) {
  option.addEventListener('click', () => {
    const next = option.dataset.themeOption;
    if (isThemePreference(next)) setPreference(next);
  });
}

subscribeToSystemTheme(render);
subscribeToStoredPreference(() => {
  preference = readStoredPreference();
  render();
});

render();
