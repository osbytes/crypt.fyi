import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import { migrateLegacyQueryKey } from './lib/secretUrl';

async function bootstrap() {
  const currentUrl = new URL(window.location.href);
  const legacyQueryKeyMigrated = migrateLegacyQueryKey(currentUrl);
  if (legacyQueryKeyMigrated) {
    window.history.replaceState(
      window.history.state,
      '',
      `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`,
    );
  }

  // Importing App creates the router, so migrate the unsafe parameter first.
  const { default: App } = await import('./App.tsx');
  createRoot(document.getElementById('root')!).render(
    <App legacyQueryKeyMigrated={legacyQueryKeyMigrated} />,
  );
}

void bootstrap();
