#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'fs';
import {
  CreateVaultResponse,
  encrypt,
  generateRandomString,
  sha256,
  decrypt,
  GetVaultResponse,
} from '@crypt.fyi/core';
import chalk from 'chalk';
import ora from 'ora';
import { config } from './config';

const program = new Command();

// Read package.json
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));

program.name('crypt').description('CLI to encrypt and share secrets securely').version(pkg.version);

program
  .command('encrypt')
  .description('Encrypt and share a secret')
  .argument('<content>', 'Content to encrypt')
  .option('-p, --password <password>', 'Password to encrypt with')
  .option('-t, --ttl <duration>', 'Time to live (e.g., 1h, 1d)', '1h')
  .option('-b, --burn', 'Burn after reading', true)
  .option('--ip <ip>', 'Restrict access to specific IP address')
  .option('-r, --reads <count>', 'Number of times the secret can be read', undefined)
  .action(async (content, options) => {
    const spinner = ora('Encrypting content...').start();
    try {
      const key = await generateRandomString(32);
      const password = options.password || '';
      let encrypted = await encrypt(content, key);
      if (password) {
        encrypted = await encrypt(encrypted, password);
      }
      const hash = sha256(key + password);

      spinner.text = 'Creating vault...';

      const response = await fetch(`${config.apiUrl}/vault`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client': `@crypt.fyi/cli:0.0.1`,
        },
        body: JSON.stringify({
          c: encrypted,
          h: hash,
          b: options.burn,
          ttl: parseDuration(options.ttl),
          ips: options.ip,
          rc: options.reads ? parseInt(options.reads, 10) : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create vault: ${response.statusText}`);
      }

      const { id, dt } = (await response.json()) as CreateVaultResponse;

      spinner.succeed('Secret encrypted and stored successfully!');

      console.log('\nShare these details with the recipient:');
      console.log(chalk.blue('\nSecret URL:'));
      console.log(`${config.webUrl}/${id}?key=${key}${password ? `&p=true` : ''}`);

      if (options.password) {
        console.log(chalk.yellow('\nPassword:'));
        console.log(options.password);
      }

      console.log(chalk.red('\nDelete Token:'));
      console.log(dt);
    } catch (error) {
      spinner.fail('Failed to encrypt and store content');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });

program
  .command('decrypt')
  .description('Decrypt a secret from the URL')
  .argument('<url>', 'Secret URL')
  .option('-p, --password <password>', 'Password (if secret is password protected)')
  .action(async (urlString, options) => {
    const spinner = ora('Fetching secret...').start();

    try {
      const url = new URL(urlString);
      const id = url.pathname.split('/').pop();
      const key = url.searchParams.get('key');
      if (!id || !key) {
        throw new Error('Invalid URL');
      }

      const password = options.password || '';
      const hash = sha256(key + password);

      const response = await fetch(`${config.apiUrl}/vault/${id}?h=${hash}`, {
        headers: {
          'X-Client': `@crypt.fyi/cli:0.0.1`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Secret not found. It may have expired or been deleted.');
        } else if (response.status === 400) {
          throw new Error('Invalid key and/or password.');
        }
        throw new Error(`Failed to fetch secret: ${response.statusText}`);
      }

      const { c: encrypted, b: burned } = (await response.json()) as GetVaultResponse;

      spinner.text = 'Decrypting content...';

      let decrypted = encrypted;
      if (password) {
        decrypted = await decrypt(decrypted, password);
      }
      decrypted = await decrypt(decrypted, key);

      spinner.succeed('Secret decrypted successfully!');

      // Check if content is a file
      try {
        const parsed = JSON.parse(decrypted);
        if (parsed.type === 'file') {
          console.log('\nFile detected:');
          console.log(chalk.blue('File name:'), parsed.name);
          console.log(chalk.yellow('File content (base64):'), parsed.content);
        } else {
          console.log('\nDecrypted content:');
          console.log(decrypted);
        }
      } catch {
        // Not JSON, print as regular text
        console.log('\nDecrypted content:');
        console.log(decrypted);
      }

      if (burned) {
        console.log(
          chalk.yellow('\nNote: This secret has been burned and is no longer available.'),
        );
      }
    } catch (error) {
      spinner.fail('Failed to decrypt content');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });

program.parse();

function parseDuration(duration: string): number {
  const units: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error('Invalid duration format. Use <number><unit> where unit is s, m, h, or d');
  }

  const [, value, unit] = match;
  return parseInt(value, 10) * units[unit];
}
