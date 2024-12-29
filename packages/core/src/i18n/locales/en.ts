import type { TranslationKeys } from '../types';

export const en: TranslationKeys = {
  common: {
    createSecret: 'Create Secret',
    starOnGithub: 'Star on GitHub',
    features: 'Features',
    learnMore: 'Learn More',
    loading: 'Loading...',
    create: 'Create',
    delete: 'Delete',
    copy: 'Copy',
    share: 'Share',
    download: 'Download',
    success: 'Success!',
    error: 'Error',
    confirm: 'Confirm',
    footer: {
      tagline: 'Built with security and privacy in mind - because ignorance can be bliss',
    },
    header: {
      tagline:
        'Ephemeral secret sharing with zero-knowledge <aesLink>AES-256</aesLink> <e2eLink>end-to-end encryption</e2eLink>',
    },
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
    features: {
      encryption: {
        title: 'End-to-end Encryption',
        description: 'Secure your data with AES-256-GCM encryption before it leaves your browser',
      },
      security: {
        title: 'Enhanced Security',
        description:
          'Strict Content Security Policy (CSP) and rate limits to mitigate XSS and brute-force attacks',
      },
      zeroKnowledge: {
        title: 'Zero-knowledge',
        description:
          'Our servers never see your unencrypted data - only you and your recipient have access',
      },
      burn: {
        title: 'Burn After Reading',
        description: 'Automatically destroy secrets after they are accessed for maximum security',
      },
      expiration: {
        title: 'Auto-Expiration',
        description:
          "Set custom expiration times to ensure secrets don't persist longer than needed",
      },
      password: {
        title: 'Password Protection',
        description: 'Add an extra layer of security with optional password protection',
      },
      files: {
        title: 'File Sharing',
        description: 'Securely share files with simple drag and drop functionality',
      },
      webhooks: {
        title: 'Webhooks',
        description: 'Get notified when your secrets are accessed, burned, or fail to be read',
      },
      ipControl: {
        title: 'IP Restrictions',
        description:
          'Control access by limiting which IP addresses or CIDR ranges can view your secrets',
      },
      readLimits: {
        title: 'Read Limits',
        description: 'Set maximum view counts to restrict how many times a secret can be accessed',
      },
      qrCode: {
        title: 'QR Codes',
        description: 'Generate QR codes for easy mobile sharing of your secret URLs',
      },
      cli: {
        title: 'CLI Tool',
        description: 'Automate secret sharing with our command-line interface',
      },
      docker: {
        title: 'Docker Support',
        description: 'Deploy your own instance using our official Docker images',
      },
    },
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
        placeholder: 'Enter your secret content or file here...',
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
        webhook: {
          label: 'Webhook',
          placeholder: 'https://example.com/webhook',
          description:
            'Webhook URL to call when the secret is read, burned, or fails to read (configurable, if set)',
          read: 'Read',
          burn: 'Burn',
          failureToReadPK: 'Failure (pass or key)',
          failureToReadIP: 'Failure (IP or CIDR)',
          nameLabel: 'Name',
          namePlaceholder: 'Enter a name for this webhook',
          nameDescription: 'A name to identify this webhook in notifications',
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
      webhookConfigInvalid:
        'Webhook configuration is invalid - at least one webhook event type is required',
    },
  },
  view: {
    notFound: {
      title: 'Secret Not Found',
      description: 'This secret may have expired or been deleted.',
      createNew: 'Create New Secret',
    },
    password: {
      title: 'Enter Password',
      placeholder: 'Enter the password',
      description: 'This secret is protected with a password - request from the sender',
      error: 'Incorrect password',
    },
    content: {
      fileShared: 'A file has been shared with you',
      downloadFile: 'Download File',
      hideContent: 'Hide content',
      showContent: 'Show content',
      copyToClipboard: 'Copy to clipboard',
      copiedToClipboard: 'Secret copied to clipboard',
      clickToReveal: 'Click the eye icon above to reveal the secret',
      passwordProtected: 'This secret is password protected. Click to enter password.',
      clickToEnterPassword: 'Click to enter password',
    },
    info: {
      burnedAfterReading:
        'This secret was deleted after your viewing and is no longer available after leaving the page.',
      expiresIn: 'Expires {{time}}',
    },
    errors: {
      notFound: 'not found',
      unexpectedStatus: 'unexpected status code {{code}}',
    },
    actions: {
      viewSecret: 'View Secret',
    },
  },
  about: {
    title: 'About',
    intro:
      "crypt.fyi is a secure, open-source, ephemeral secret-sharing platform that enables you to share sensitive information safely. Whether it's passwords, API keys, or confidential messages, crypt.fyi ensures your data remains private and automatically disappears after being accessed.",
    whyCryptFyi: {
      title: 'Why crypt.fyi?',
      commonPractices: {
        title: 'The Problem with Common Practices',
        description:
          'Every day, sensitive information like passwords, API keys, and private data is shared through insecure channels:',
        problems: {
          email: 'Email - can be intercepted, stored indefinitely, and forwarded without control',
          slack: 'Slack/Teams messages - remain in chat history and company logs',
          sms: 'SMS/Text messages - stored on multiple devices and carrier servers',
          messaging: 'Instant messaging - often lacks proper encryption and data deletion',
        },
      },
      existingSolutions: {
        title: 'Existing Solutions and Their Limitations',
        description: 'While there are other tools in this space, each has its limitations:',
        limitations: {
          onePassword: '1Password - excellent for team password management, but',
          onePasswordLink: "doesn't support external non-users sharing internally",
          otherTools:
            'PrivateBin/PwPush/OneTimeSecret - similar core functionality, but dated user interfaces and technology stacks as well as some missing',
          otherToolsConfigLink: 'configurability',
          otherToolsSecurityLink: 'security features',
        },
      },
      approach: {
        title: 'The crypt.fyi Approach',
        description:
          "crypt.fyi was built to address these challenges while embracing modern web technologies. It combines the security principles of existing solutions with a clean, intuitive interface and a modern tech stack. The result is a tool that's both highly secure and pleasant to use.",
      },
    },
    howItWorks: {
      title: 'How It Works',
      steps: {
        encrypt: {
          title: '1. Encrypt',
          description:
            "Your secret is encrypted right in your browser before it ever leaves your device. Only people with the special link, that you've explicitly shared, can decrypt it.",
        },
        share: {
          title: '2. Share',
          description:
            'Share the secure link with your intended recipient. The link contains everything needed to decrypt the message, unless a password is specified.',
        },
        burn: {
          title: '3. Burn after read',
          description:
            "Once accessed, if 'burn after read' is checked, the secret is permanently deleted from our servers. No traces left behind.",
        },
      },
    },
    security: {
      title: 'Security Implementation',
      encryption: {
        title: 'End-to-End Encryption',
        description:
          'All secrets are encrypted using AES-256-GCM encryption in your browser before transmission. The encryption key never leaves your device, ensuring true end-to-end encryption.',
        features: {
          key: 'Encryption key is derived from a cryptographically secure random generation',
          derivation: 'Key derivation uses PBKDF2 with SHA-256',
          vector: 'Each secret has a unique initialization vector (IV)',
        },
      },
      zeroKnowledge: {
        title: 'Zero-Knowledge Architecture',
        description:
          'Our servers never see your unencrypted data. We employ a zero-knowledge architecture where:',
        features: {
          clientSide: 'All encryption/decryption happens client-side',
          storage: 'Servers only store encrypted data',
          keys: 'Encryption keys are transmitted via URL fragments, which never reach the backend api server',
        },
      },
      protection: {
        title: 'Data Protection',
        description: 'Multiple layers of security ensure your data remains protected:',
        features: {
          encryption: 'Client-side encryption/decryption',
          tls: 'TLS encryption for all API communications',
          destruction: 'Automatic secret destruction after access',
          logging: 'No server-side logging of sensitive data',
          password: 'Optional password protection for additional security',
        },
      },
    },
    openSource: {
      title: 'Open Source',
      description:
        'crypt.fyi is open source and auditable. You can review our code, submit issues, and contribute on',
      cta: 'Create a Secret Now',
    },
  },
};
