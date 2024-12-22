#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { CreateVaultResponse, encrypt, generateRandomString, sha256 } from '@crypt.fyi/core';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig } from './config';
import { ApiClient } from './api';

const program = new Command();

// Read package.json
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));

program.name('crypt').description('CLI to encrypt and share secrets securely').version(pkg.version);

program
  .command('config')
  .description('Configure the CLI')
  .option('--api-url <url>', 'Set the API URL')
  .action((options) => {
    if (options.apiUrl) {
      setConfig({ apiUrl: options.apiUrl });
      console.log(chalk.green(`API URL set to ${options.apiUrl}`));
    } else {
      const config = getConfig();
      console.log(chalk.blue('Current configuration:'));
      console.log(chalk.blue(`API URL: ${config.apiUrl}`));
    }
  });

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
    const config = getConfig();
    const spinner = ora('Encrypting content...').start();
    try {
      const key = await generateRandomString(32);
      const password = options.password || '';
      let encrypted = await encrypt(content, key);
      if (password) {
        encrypted = await encrypt(content, password);
      }
      const hash = sha256(key + password);

      spinner.text = 'Creating vault...';

      const response = await fetch(`${config.apiUrl}/vault`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      console.log(`${config.webUrl}/${id}?key=${key}`);

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
