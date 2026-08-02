import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import { removeLegacyQueryKey } from './lib/secretUrl';

async function bootstrap() {
  const currentUrl = new URL(window.location.href);
  const legacyQueryKeyRemoved = removeLegacyQueryKey(currentUrl);
  if (legacyQueryKeyRemoved) {
    window.history.replaceState(
      window.history.state,
      '',
      `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`,
    );
  }

  // Importing App creates the router, so scrub the unsafe parameter first.
  const { default: App } = await import('./App.tsx');
  createRoot(document.getElementById('root')!).render(
    <App legacyQueryKeyRemoved={legacyQueryKeyRemoved} />,
  );
}

void bootstrap();
