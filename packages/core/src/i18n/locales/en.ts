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
    requestNewLanguage: 'Request new or fix translations',
    footer: {
      tagline: 'Built with security and privacy in mind - because ignorance can be bliss',
    },
    header: {
      tagline:
        'Ephemeral data sharing with zero-knowledge <aesLink>ML-KEM</aesLink> <e2eLink>post-quantum end-to-end encryption</e2eLink>',
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
    title: 'Open-Source Zero-Knowledge Secret Sharing',
    subtitle:
      'Secure one-time sharing of sensitive information with ML-KEM post-quantum end-to-end encryption. Your secrets are encrypted in your browser, never accessible to our servers, and automatically deleted after viewing. Fully auditable open-source codebase.',
    features: {
      encryption: {
        title: 'ML-KEM Post-Quantum Encryption',
        description:
          'State-of-the-art ML-KEM post-quantum encryption ensures your data remains secure even against future quantum computing threats. All encryption happens in your browser before transmission.',
      },
      security: {
        title: 'Enhanced Security',
        description:
          'Multiple layers of protection including strict Content Security Policy (CSP), rate limiting, and IP restrictions. Quantum-resistant encryption with automatic deletion after viewing.',
      },
      zeroKnowledge: {
        title: 'True Zero-Knowledge Architecture',
        description:
          'Our servers never see your unencrypted data. The encryption key never leaves your device, and all decryption happens in your browser. Complete privacy through end-to-end encryption.',
      },
      burn: {
        title: 'One-Time Secret Sharing',
        description:
          'Secrets are automatically destroyed after viewing, ensuring they can only be accessed once. Perfect for sharing sensitive information that should never persist.',
      },
      failedAttempts: {
        title: 'Burn After Failed Attempts',
        description:
          'Automatically destroy secrets after a number of failed access attempts for enhanced security',
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
      chromeExtension: {
        title: 'Chrome Extension',
        description:
          'Share secrets directly from your browser in-context with our Chrome extension',
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
        failedAttempts: {
          label: 'Burn after failed attempts',
          description: 'Automatically delete the secret after a number of failed access attempts',
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
        burn: 'Secret will be deleted after it is viewed',
        passwordProtected: 'Password protected',
        ipRestrictions: 'IP restriction(s): {{ips}}',
        readCount: 'Read count: {{count}}',
        webhook: 'Webhook configured for: {{events}} ({{url}})',
        failureCount: 'Secret will be deleted after {{count}} failed attempts',
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
      fileSizeExceeded: 'File size exceeded maximum allowed size',
      fileReadError: 'Failed to read file',
      fileReadAborted: 'File reading was aborted',
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
      "crypt.fyi is a secure, open-source, zero-knowledge data-sharing platform that enables you to share sensitive information safely with post-quantum end-to-end encryption. Whether it's passwords, API keys, or confidential messages, crypt.fyi ensures your data remains private, never accessible to our servers, and automatically disappears after being accessed.",
    whyCryptFyi: {
      title: 'Why crypt.fyi?',
      commonPractices: {
        title: 'The Problem with Common Practices',
        description:
          'Every day, sensitive information like passwords, API keys, and private data is shared through insecure channels in plain text:',
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
            'PrivateBin/PwPush/OneTimeSecret - similar core functionality, but dated user interfaces, technology stacks, and often lack',
          otherToolsConfigLink: 'zero-knowledge architecture',
          otherToolsSecurityLink: 'post-quantum encryption',
        },
      },
      approach: {
        title: 'The crypt.fyi Approach',
        description:
          "crypt.fyi was built to address these challenges while embracing modern web technologies and security standards. We combine zero-knowledge architecture with ML-KEM post-quantum encryption, ensuring your data remains private and secure. The result is a tool that's both highly secure and pleasant to use.",
      },
    },
    howItWorks: {
      title: 'How It Works',
      steps: {
        encrypt: {
          title: '1. Encrypt',
          description:
            'Your secret is encrypted in your browser using ML-KEM post-quantum encryption before it ever leaves your device. The encryption happens entirely client-side, ensuring zero-knowledge of your data.',
        },
        share: {
          title: '2. Share',
          description:
            'Share the secure link with your intended recipient. The link contains everything needed to decrypt the message, but our servers never see the unencrypted content.',
        },
        burn: {
          title: '3. Burn after read',
          description:
            "Once accessed, if 'burn after read' is checked, the secret is permanently deleted from our servers. No traces left behind, maintaining complete zero-knowledge of your data.",
        },
      },
    },
    security: {
      title: 'Security Implementation',
      encryption: {
        title: 'Zero-Knowledge Post-Quantum Encryption',
        description:
          'All secrets are encrypted using ML-KEM post-quantum encryption in your browser before transmission. The encryption key never leaves your device, ensuring true zero-knowledge end-to-end encryption.',
        features: {
          key: 'Encryption key is derived from a cryptographically secure random generation',
          derivation: 'Key derivation uses PBKDF2 with SHA-256',
          vector: 'Each secret has a unique initialization vector (IV)',
        },
      },
      zeroKnowledge: {
        title: 'True Zero-Knowledge Architecture',
        description:
          'Our servers never see your unencrypted data. We employ a zero-knowledge architecture where:',
        features: {
          clientSide: 'All encryption/decryption happens client-side in your browser',
          storage: 'Servers only store encrypted data they cannot decrypt',
          keys: 'Encryption keys are transmitted via URL fragments, which never reach the backend api server',
        },
      },
      protection: {
        title: 'Data Protection',
        description: 'Multiple layers of security ensure your data remains protected:',
        features: {
          encryption:
            'All encryption/decryption occurs in your browser using ML-KEM post-quantum encryption',
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
        'crypt.fyi is open source and auditable. You can review our zero-knowledge implementation, post-quantum encryption, and contribute on',
    },
  },
  privacy: {
    title: 'Privacy Policy',
    intro:
      'At crypt.fyi, we take your privacy seriously. This Privacy Policy explains how we handle your information when you use our zero-knowledge, end-to-end encrypted secret sharing platform.',
    doNotCollect: {
      title: "Information We Don't Collect",
      description: 'Due to our zero-knowledge architecture, we are technically unable to access:',
      items: {
        secrets: 'Your unencrypted secrets or files',
        keys: 'Encryption keys or passwords',
        urls: 'URL fragments containing decryption information',
        content: 'The content of your encrypted data',
        recipients: 'Information about the recipients of your secrets',
      },
    },
    collect: {
      title: 'Information We Do Collect',
      description: 'We collect and store only the minimum required information:',
      items: {
        encrypted: 'Encrypted data (which we cannot decrypt)',
        hashes:
          'Key verification hashes (used to verify access rights without knowing the actual keys)',
        metadata:
          'Basic request metadata (IP addresses, timestamps) for rate limiting and abuse prevention',
        webhooks:
          'Optional webhook URLs if provided (for notifications about secret access and deletion)',
      },
      note: 'All stored data is automatically deleted after expiration or when accessed (if burn after reading is enabled).',
    },
    usage: {
      title: 'How We Use Information',
      description: 'We use the collected information solely for:',
      items: {
        transmission: 'Facilitating the secure transmission of your encrypted secrets',
        rateLimits: 'Enforcing rate limits to prevent abuse',
        ipControl: 'Implementing IP/CIDR allow-listing when configured',
        notifications: 'Sending webhook notifications when enabled',
        security: 'Maintaining system security and preventing unauthorized access',
      },
    },
    security: {
      title: 'Data Storage and Security',
      description: 'Our security measures include:',
      items: {
        encryption:
          'All encryption/decryption occurs in your browser using ML-KEM post-quantum encryption',
        csp: 'Strict Content Security Policy (CSP) to prevent XSS attacks',
        tls: 'TLS encryption for all API communications',
        expiration: 'Automatic data expiration with configurable Time-To-Live (TTL)',
        deletion: 'Secure deletion of data after access or expiration',
        storage: 'No persistent storage of sensitive information',
      },
    },
    thirdParty: {
      title: 'Third-Party Services',
      description:
        'We do not share any information with third parties except in the following cases:',
      items: {
        webhooks:
          'When you enable webhooks, we send notifications to the URLs you provide about secret access and deletion',
        infrastructure:
          'Infrastructure providers that host our services (who only see encrypted data they cannot decrypt)',
      },
    },
    rights: {
      title: 'Your Rights and Choices',
      description: 'You have control over your data:',
      items: {
        expiration: 'Choose custom expiration times for your secrets',
        burn: 'Enable burn after reading for immediate deletion after access',
        password: 'Add password protection for additional security',
        ip: 'Configure IP restrictions to control access',
        readLimits: 'Set read count limits',
      },
    },
    changes: {
      title: 'Changes to This Policy',
      description:
        'We may update this Privacy Policy from time to time. We will notify users of any material changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.',
    },
    contact: {
      title: 'Contact Us',
      description:
        'If you have any questions about this Privacy Policy, you can contact us through our',
    },
  },
};
