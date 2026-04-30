#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import { Client } from '@crypt.fyi/core';
import chalk from 'chalk';
import ora from 'ora';
import { config } from './config';

const program = new Command();

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));

const xClient = `@crypt.fyi/cli:${pkg.version}`;

const client = new Client({
  apiUrl: config.apiUrl,
  xClient,
});

program
  .name('cfyi')
  .description('CLI to encrypt and share secrets securely via the https://crypt.fyi API')
  .version(pkg.version);

program
  .command('encrypt')
  .description('Encrypt and share a secret')
  .argument('[content]', 'Content to encrypt')
  .option('-f, --file <file>', 'Path to file to encrypt')
  .option('-p, --password <password>', 'Password to encrypt with')
  .option('-t, --ttl <duration>', 'Time to live (e.g., 1h, 1d)', '1h')
  .option('-b, --burn', 'Burn after reading', true)
  .option('--ip <ip>', 'Restrict access to specific IP address')
  .option('-r, --reads <count>', 'Number of times the secret can be read', undefined)
  .option('--webhook-url <url>', 'HTTPS (or HTTP) webhook URL for secret notifications')
  .option('--webhook-name <name>', 'Optional label for this secret in webhook payloads (max 50 chars)')
  .option(
    '--no-webhook-on-read',
    'Do not POST to the webhook when the secret is read successfully',
  )
  .option(
    '--webhook-on-failed-key',
    'POST to the webhook when decryption fails (wrong key or password)',
  )
  .option(
    '--webhook-on-failed-ip',
    'POST to the webhook when the viewer IP fails the IP allow-list',
  )
  .option('--webhook-on-burn', 'POST to the webhook when the secret is burned')
  .action(async (content, options) => {
    if (options.file && content) {
      console.error(chalk.red('Cannot provide both content and file'));
      process.exit(1);
    }

    const webhookUrl = options.webhookUrl?.trim();

    // Webhook toggles only apply with a non-empty `--webhook-url`; reject dangling options (avoids accidental API calls).
    if (!webhookUrl) {
      if (options.webhookName) {
        console.error(chalk.red('--webhook-name requires --webhook-url'));
        process.exit(1);
      }
      if (options.webhookOnRead === false) {
        console.error(chalk.red('--webhook-url is required when using --no-webhook-on-read'));
        process.exit(1);
      }
      if (
        options.webhookOnFailedKey ||
        options.webhookOnFailedIp ||
        options.webhookOnBurn
      ) {
        console.error(chalk.red('Webhook toggle flags require --webhook-url'));
        process.exit(1);
      }
    }

    if (options.file) {
      try {
        content = readFileSync(options.file, 'utf-8');
      } catch (error) {
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
      }
    }

    try {
      if (webhookUrl) {
        validateWebhookCliInput(webhookUrl, options.webhookName);
      }
    } catch (e) {
      console.error(chalk.red(e instanceof Error ? e.message : 'Unknown error'));
      process.exit(1);
    }

    const spinner = ora('Encrypting content...').start();
    try {
      spinner.text = 'Creating vault...';

      const result = await client.create({
        c: content,
        b: options.burn,
        ttl: parseDuration(options.ttl),
        ips: options.ip,
        rc: options.reads ? parseInt(options.reads, 10) : undefined,
        ...(webhookUrl
          ? {
              wh: {
                u: webhookUrl,
                n: trimmedWebhookName(options.webhookName),
                r: options.webhookOnRead,
                fpk: options.webhookOnFailedKey ?? false,
                fip: options.webhookOnFailedIp ?? false,
                b: options.webhookOnBurn ?? false,
              },
            }
          : {}),
      });

      spinner.succeed('Secret encrypted and stored successfully!');

      console.log('\nShare these details with the recipient:');
      console.log(chalk.blue('\nSecret URL:'));
      console.log(
        `${config.webUrl}/${result.id}${options.password ? `?p=true` : ''}#${result.key}`,
      );

      if (options.password) {
        console.log(chalk.yellow('\nPassword:'));
        console.log(options.password);
      }

      console.log(chalk.red('\nDelete Token:'));
      console.log(result.dt);
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
  .option('-o --output <file>', 'Output file to save the decrypted content')
  .option('-p, --password <password>', 'Password (if secret is password protected)')
  .action(async (urlString, options) => {
    const spinner = ora('Fetching secret...').start();

    try {
      const url = new URL(urlString);
      const id = url.pathname.split('/').pop();
      const key = url.hash.slice(1); // Remove the # symbol
      if (!id || !key) {
        throw new Error('Invalid URL');
      }

      spinner.text = 'Decrypting content...';

      const password = options.password || '';

      const result = await client.read(id, key, password);

      spinner.succeed('Secret decrypted successfully!');

      // Check if content is a file
      try {
        const parsed = JSON.parse(result.c);
        if (parsed.type === 'file') {
          console.log('\nFile detected:');
          console.log(chalk.blue('File name:'), parsed.name);
          console.log(chalk.yellow('File content (base64):'), parsed.content);
        } else {
          if (options.output) {
            writeIntoFile(result.c, options.output);
          } else {
            console.log('\nDecrypted content:');
            console.log(result.c);
          }
        }
      } catch {
        // Not JSON, print as regular text
        if (options.output) {
          writeIntoFile(result.c, options.output);
        } else {
          console.log('\nDecrypted content:');
          console.log(result.c);
        }
      }

      if (result.burned) {
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

function trimmedWebhookName(name: string | undefined): string | undefined {
  if (name === undefined) {
    return undefined;
  }

  const trimmedName = name.trim();
  return trimmedName === '' ? undefined : trimmedName;
}

function validateWebhookCliInput(urlString: string, name: string | undefined): void {
  let url: URL;
  
  try {
    url = new URL(urlString);
  } catch {
    throw new Error('Invalid webhook URL');
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Webhook URL must use HTTP or HTTPS');
  }

  const trimmedName = trimmedWebhookName(name);
  if (trimmedName && trimmedName.length > 50) {
    throw new Error('Webhook name must be at most 50 characters');
  }
}

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

function writeIntoFile(content: string, path: string) {
  try {
    writeFileSync(path, content);
    console.log(chalk.green(`\nContent saved to ${path}`));
  } catch (error) {
    console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
    process.exit(1);
  }
}
