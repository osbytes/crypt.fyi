export interface TranslationKeys {
  common: {
    createSecret: string;
    starOnGithub: string;
    features: string;
    learnMore: string;
    loading: string;
    create: string;
    delete: string;
    copy: string;
    share: string;
    download: string;
    success: string;
    error: string;
    confirm: string;
    requestNewLanguage: string;
    footer: {
      tagline: string;
    };
    time: {
      minute_one: string;
      minute_other: string;
      hour_one: string;
      hour_other: string;
      day_one: string;
      day_other: string;
    };
  };
  landing: {
    title: string;
    subtitle: string;
    pillars: {
      title: string;
      zeroKnowledge: {
        title: string;
        description: string;
      };
      ephemeral: {
        title: string;
        description: string;
      };
      defense: {
        title: string;
        description: string;
      };
      open: {
        title: string;
        description: string;
      };
    };
    alsoIncludes: {
      label: string;
      password: string;
      files: string;
      webhooks: string;
      qrCode: string;
      ipControl: string;
      readLimits: string;
    };
    selfHost: {
      title: string;
      description: string;
      deployOnRailway: string;
      dockerCompose: string;
    };
    ecosystem: {
      cli: string;
      chromeExtension: string;
      github: string;
    };
    steps: {
      encrypt: {
        title: string;
        description: string;
      };
      share: {
        title: string;
        description: string;
      };
      autoDelete: {
        title: string;
        description: string;
      };
    };
  };
  create: {
    form: {
      content: {
        label: string;
        placeholder: string;
        fileHint: string;
        fileSelected: string;
        dropFile: string;
        invalidFileType: string;
      };
      password: {
        label: string;
        placeholder: string;
      };
      ttl: {
        label: string;
        placeholder: string;
      };
      burn: {
        label: string;
        description: string;
      };
      advanced: {
        toggle: string;
        ip: {
          label: string;
          placeholder: string;
          description: string;
        };
        readCount: {
          label: string;
          description: string;
        };
        failedAttempts: {
          label: string;
          description: string;
        };
        webhook: {
          label: string;
          placeholder: string;
          description: string;
          read: string;
          burn: string;
          failureToReadPK: string;
          failureToReadIP: string;
          nameLabel: string;
          namePlaceholder: string;
          nameDescription: string;
        };
      };
    };
    success: {
      title: string;
      description: {
        main: string;
        password: string;
        separateKey: string;
      };
      combinedUrl: string;
      keylessUrl: string;
      decryptionKey: string;
      urlCopied: string;
      keyCopied: string;
      secretDeleted: string;
      qrDownloaded: string;
      qrDownloadFailed: string;
      qrCode: {
        title: string;
        description: string;
      };
      actions: {
        showUrl: string;
        hideUrl: string;
        showKey: string;
        hideKey: string;
        shareUrl: string;
        copyUrl: string;
        copyKey: string;
        showQr: string;
      };
      createAnother: string;
      deleteSecret: string;
      info: {
        expires: string;
        burn: string;
        passwordProtected: string;
        ipRestrictions: string;
        readCount: string;
        webhook: string;
        failureCount: string;
      };
    };
    errors: {
      contentRequired: string;
      readCountWithBurn: string;
      tooManyIps: string;
      invalidIp: string;
      uploadFailed: string;
      deleteFailed: string;
      secretNotFound: string;
      unexpectedStatus: string;
      webhookConfigInvalid: string;
      fileSizeExceeded: string;
      fileReadError: string;
      fileReadAborted: string;
    };
  };
  view: {
    notFound: {
      title: string;
      description: string;
      createNew: string;
    };
    invalidLink: {
      title: string;
      description: string;
      createNew: string;
    };
    connectionError: {
      title: string;
      description: string;
      tryAgain: string;
    };
    password: {
      title: string;
      placeholder: string;
      description: string;
      error: string;
    };
    key: {
      title: string;
      label: string;
      placeholder: string;
      description: string;
      required: string;
      error: string;
      show: string;
      hide: string;
      change: string;
      submit: string;
    };
    legacyKey: {
      warning: string;
    };
    content: {
      fileShared: string;
      downloadFile: string;
      hideContent: string;
      showContent: string;
      copyToClipboard: string;
      copiedToClipboard: string;
      clickToReveal: string;
      passwordProtected: string;
      ariaLabel: string;
    };
    info: {
      burnedAfterReading: string;
      expiresIn: string;
    };
    errors: {
      notFound: string;
      unexpectedStatus: string;
    };
    actions: {
      viewSecret: string;
    };
  };
  about: {
    title: string;
    what: {
      description: string;
      traditionalTitle: string;
      traditionalDescription: string;
    };
    letter: {
      title: string;
      p1: string;
      p2: string;
      p3: string;
      signOff: string;
    };
    openSource: {
      description: string;
    };
    technical: {
      prompt: string;
      specLink: string;
    };
  };
  privacy: {
    title: string;
    intro: string;
    doNotCollect: {
      title: string;
      description: string;
      items: {
        secrets: string;
        keys: string;
        urls: string;
        content: string;
        recipients: string;
      };
    };
    collect: {
      title: string;
      description: string;
      items: {
        encrypted: string;
        hashes: string;
        metadata: string;
        webhooks: string;
      };
      note: string;
    };
    usage: {
      title: string;
      description: string;
      items: {
        transmission: string;
        rateLimits: string;
        ipControl: string;
        notifications: string;
        security: string;
      };
    };
    security: {
      title: string;
      description: string;
      items: {
        encryption: string;
        csp: string;
        tls: string;
        expiration: string;
        deletion: string;
        storage: string;
      };
    };
    thirdParty: {
      title: string;
      description: string;
      items: {
        webhooks: string;
        infrastructure: string;
      };
    };
    rights: {
      title: string;
      description: string;
      items: {
        expiration: string;
        burn: string;
        password: string;
        ip: string;
        readLimits: string;
      };
    };
    changes: {
      title: string;
      description: string;
    };
    contact: {
      title: string;
      description: string;
    };
  };
}

export type TranslationNamespace = keyof TranslationKeys;

export type NestedKeys<T> = T extends string
  ? []
  : {
      [K in keyof T]: [K, ...NestedKeys<T[K]>];
    }[keyof T];

export type TranslationKey = NestedKeys<TranslationKeys>;
