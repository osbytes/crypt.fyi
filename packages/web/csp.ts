import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const nginxConfPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../nginx/nginx.conf',
);

/**
 * Read the production CSP from nginx.conf and substitute `$api_url`.
 * Keeps preview/e2e policy in lockstep with what we ship — no library-specific
 * hash allowlists maintained in a second place.
 */
export function loadProductionCsp(apiUrl: string): string {
  const nginxConf = fs.readFileSync(nginxConfPath, 'utf8');
  const cspMatch = nginxConf.match(/add_header\s+Content-Security-Policy\s+"([^"]*)"/);
  if (!cspMatch) {
    throw new Error(`Content-Security-Policy header not found in ${nginxConfPath}`);
  }
  return cspMatch[1].replaceAll('$api_url', apiUrl);
}
