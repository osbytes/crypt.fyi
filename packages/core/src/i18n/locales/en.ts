import type { TranslationKeys } from '../types';

export const en: TranslationKeys = {
  common: {
    createSecret: 'Create Secret',
    starOnGithub: 'Star on GitHub',
    learnMore: 'Learn More',
    loading: 'Loading...',
    create: 'Create',
    delete: 'Delete',
    copy: 'Copy',
    share: 'Share',
    download: 'Download',
    success: 'Success!',
    error: 'Error',
    time: {
      minute_one: '{{count}} minute',
      minute_other: '{{count}} minutes',
      hour_one: '{{count}} hour',
      hour_other: '{{count}} hours',
      day_one: '{{count}} day',
      day_other: '{{count}} days',
    },
  },
  landing: {
    title: 'Share Secrets Securely',
    subtitle:
      'Send passwords and sensitive information with zero-knowledge end-to-end encryption and automatic deletion',
    steps: {
      encrypt: {
        title: '1. Encrypt',
        description: 'Your secret is encrypted in your browser before being stored',
      },
      share: {
        title: '2. Share',
        description: 'Send the secure link to your intended recipient',
      },
      autoDelete: {
        title: '3. Auto-Delete',
        description: 'Secret is permanently deleted after being viewed',
      },
    },
  },
  create: {
    form: {
      content: {
        label: 'Secret content',
        placeholder: 'Enter your secret content here...',
        fileHint: 'add a file by drag-n-drop or clicking here',
        fileSelected: 'File selected: {{name}} ({{size}} KB)',
      },
      password: {
        label: 'Password',
        placeholder: 'Optional (but recommended)',
      },
      ttl: {
        label: 'Time to live',
        placeholder: 'Select expiration time',
      },
      burn: {
        label: 'Burn after reading',
        description: 'Guarantees only one recipient can access the secret',
      },
      advanced: {
        toggle: 'advanced configuration',
        ip: {
          label: 'IP/CIDR allow-list',
          placeholder: '192.168.1.1, 10.0.0.0/24, etc.',
          description: 'Restrict access to specific IP addresses or CIDR blocks (comma separated)',
        },
        readCount: {
          label: 'Read count',
          description: 'Maximum number of times the secret can be read',
        },
      },
    },
    success: {
      title: 'Secret Created!',
      description: {
        main: 'Your secret has been created and the URL has been copied to your clipboard',
        password: 'Share the URL and password with the desired recipient',
      },
      urlCopied: 'URL copied to clipboard',
      qrCode: {
        title: 'Secret URL QR Code',
        description: 'Download and share the secret URL QR Code',
      },
      createAnother: 'Create Another',
      deleteSecret: 'Delete Secret',
      info: {
        expires: 'Expires in: {{time}}',
        burnAfterReading: 'Secret will be deleted after it is viewed',
        passwordProtected: 'Password protected',
        ipRestrictions: 'IP restriction(s): {{ips}}',
        readCount: 'Read count: {{count}}',
      },
    },
    errors: {
      contentRequired: 'Content is required',
      readCountWithBurn: 'Read count cannot be used with burn after reading',
      tooManyIps: 'Too many IP restrictions (max {{max}})',
      invalidIp: 'Invalid IP address or CIDR block: {{ip}}',
      uploadFailed: 'Failed to process dropped content: {{error}}',
      deleteFailed: 'Failed to delete secret: {{error}}',
      secretNotFound: 'secret not found',
      unexpectedStatus: 'unexpected status code {{code}}',
    },
  },
};
