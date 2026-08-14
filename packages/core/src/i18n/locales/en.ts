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
      tagline: 'Built with security and privacy in mind, because ignorance can be bliss',
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
      'Encrypt in your browser. Share once. Gone forever. Post-quantum end-to-end encryption — our servers never see your secrets.',
    pillars: {
      title: 'Built for trust',
      zeroKnowledge: {
        title: 'True zero-knowledge',
        description:
          "Encryption keys never leave your device. Decryption happens only in the recipient's browser — the server never sees plaintext.",
      },
      ephemeral: {
        title: 'Ephemeral by default',
        description:
          'Burn after reading, custom TTLs, and read limits so sensitive data does not linger longer than it should.',
      },
      defense: {
        title: 'Defense in depth',
        description:
          'ML-KEM post-quantum encryption, strict CSP, rate limits, and optional IP allow-lists — layered protection, not a single checkbox.',
      },
      open: {
        title: 'Open and auditable',
        description:
          'Fully open-source and designed to be self-hosted. Inspect the code, run your own instance, or contribute.',
      },
    },
    alsoIncludes: {
      label: 'Also includes',
      password: 'password protection',
      files: 'file sharing',
      webhooks: 'webhooks',
      qrCode: 'QR codes',
      ipControl: 'IP allow-lists',
      readLimits: 'read limits',
    },
    selfHost: {
      title: 'Run your own instance',
      description:
        'Deploy the same zero-knowledge stack on your infrastructure — one click on Railway, or Docker Compose anywhere.',
      deployOnRailway: 'Deploy on Railway',
      dockerCompose: 'Docker Compose',
    },
    ecosystem: {
      cli: 'CLI',
      chromeExtension: 'Chrome Extension',
      github: 'GitHub',
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
        fileHint: 'add a file by drag-n-drop or clicking here (max 1 MB)',
        fileSelected: 'File selected: {{name}} ({{size}} KB)',
        dropFile: 'Drop file here',
        invalidFileType: 'Invalid file type',
      },
      password: {
        label: 'Password',
        placeholder: 'Optional (but recommended)',
        placeholderRequired: 'Enter a password (minimum {{min}} characters)',
      },
      ttl: {
        label: 'Time to live',
        placeholder: 'Select expiration time',
      },
      burn: {
        label: 'Burn after reading',
        description:
          'Guarantees the secret can be read only once — the first person to open the link',
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
        main: 'Your secret has been created. Choose a sharing option below.',
        password: 'Send the password through a separate channel.',
        separateKey:
          'For separate delivery, send the key-free URL and decryption key through different channels.',
      },
      combinedUrl: 'Combined URL (includes key)',
      keylessUrl: 'Key-free URL',
      decryptionKey: 'Decryption key',
      urlCopied: 'URL copied to clipboard',
      keyCopied: 'Decryption key copied to clipboard',
      secretDeleted: 'Secret deleted',
      qrDownloaded: 'QR code downloaded',
      qrDownloadFailed: 'Failed to download QR code: {{error}}',
      qrCode: {
        title: 'Secret URL QR Code',
        description: 'Download and share the secret URL QR Code',
      },
      actions: {
        showUrl: 'Show secret URL',
        hideUrl: 'Hide secret URL',
        showKey: 'Show decryption key',
        hideKey: 'Hide decryption key',
        shareUrl: 'Share secret URL',
        shareKey: 'Share decryption key',
        copyUrl: 'Copy secret URL',
        copyKey: 'Copy decryption key',
        showQr: 'Show combined URL QR code',
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
      passwordMinLength: 'Password must be at least {{min}} characters',
      passwordTooSimple: 'Password is too simple',
      readCountWithBurn: 'Read count cannot be used with burn after reading',
      tooManyIps: 'Too many IP restrictions (max {{max}})',
      invalidIp: 'Invalid IP address or CIDR block: {{ip}}',
      uploadFailed: 'Failed to process dropped content: {{error}}',
      deleteFailed: 'Failed to delete secret: {{error}}',
      secretNotFound: 'secret not found',
      unexpectedStatus: 'unexpected status code {{code}}',
      webhookConfigInvalid:
        'Webhook configuration is invalid - at least one webhook event type is required',
      fileSizeExceeded: 'File is too large. Maximum size is {{max}}.',
      payloadTooLarge: 'This secret is too large for this server. Try a smaller file.',
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
    invalidLink: {
      title: 'This link is invalid',
      description:
        'The link is incomplete or was altered in transit, so the secret cannot be decrypted. Ask the sender to share the full link again.',
      createNew: 'Create New Secret',
    },
    connectionError: {
      title: "Couldn't reach the server",
      description: 'The secret may still exist. Check your connection and try again.',
      tryAgain: 'Try Again',
    },
    rateLimit: {
      title: 'Too many requests',
      description: 'You have made too many requests. Wait a moment and try again.',
      tryAgain: 'Try Again',
    },
    password: {
      title: 'Enter Password',
      label: 'Password',
      placeholder: 'Enter the password',
      description: 'This secret is protected with a password - request from the sender',
      error: 'Incorrect decryption key or password',
      required: 'Enter a password.',
      show: 'Show password',
      hide: 'Hide password',
    },
    key: {
      title: 'Enter Decryption Key',
      label: 'Decryption key',
      placeholder: 'Enter the key provided by the sender',
      description:
        'Ask the sender for the decryption key through a separate channel. The key is used only in this browser.',
      required: 'Enter a decryption key.',
      error: 'That decryption key could not unlock this secret. Check the key and try again.',
      show: 'Show decryption key',
      hide: 'Hide decryption key',
      change: 'Enter a different key',
      submit: 'Unlock secret',
    },
    credentials: {
      title: 'Unlock Secret',
      description:
        'Enter the decryption key and password provided by the sender. Both are used only in this browser.',
      submit: 'Unlock secret',
    },
    legacyKey: {
      warning:
        'This link was created with an outdated client that puts the decryption key in the query string. Ask the sender to upgrade so future links keep the key out of server logs.',
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
      ariaLabel: 'Secret content',
    },
    info: {
      burnedAfterReading:
        'This secret has been permanently deleted. Once you leave this page, it cannot be viewed again.',
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
    what: {
      description:
        'crypt.fyi is a zero-knowledge way to share sensitive information — passwords, API keys, files — with a link. Encryption happens in your browser, our servers never see the plaintext, and secrets can vanish after they are read.',
      traditionalTitle: 'Why not just email or text it?',
      traditionalDescription:
        'Email, SMS, Slack, and chat keep copies: in inboxes, message history, carrier logs, and every synced device. Once you paste a password into those channels, you lose control over who can find it later. crypt.fyi is for a deliberate, one-time handoff — share the link, optionally add a password or IP allow-list, and let the secret disappear when it is done.',
    },
    letter: {
      title: 'A note from the author',
      p1: 'I built crypt.fyi because the tools I already reached for kept falling short when I needed to share something sensitive — especially with someone outside my password manager — with controls that matched how I actually work.',
      p2: 'Incumbents often missed the UX details that matter day to day: expansive restrictions like IP allow-lists, read counts, burn after failed attempts, and webhooks; a CLI and browser extension; saved and pre-fill configuration. Technically, some were also behind on modern encryption standards, or lacked true atomic read-and-burn so a secret could not be race-conditioned into multiple reads.',
      p3: 'So I built something new: open source, self-hostable, and opinionated about the cryptography and controls I wanted for myself.',
      signOff: '— Dillon',
    },
    openSource: {
      description:
        'crypt.fyi is open source and auditable. You can review the implementation, self-host it, or contribute on',
    },
    technical: {
      prompt: 'Want to get more technical?',
      specLink: 'Read the protocol specification',
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
