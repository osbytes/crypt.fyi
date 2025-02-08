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
    header: {
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
    features: {
      encryption: {
        title: string;
        description: string;
      };
      security: {
        title: string;
        description: string;
      };
      zeroKnowledge: {
        title: string;
        description: string;
      };
      burn: {
        title: string;
        description: string;
      };
      expiration: {
        title: string;
        description: string;
      };
      password: {
        title: string;
        description: string;
      };
      files: {
        title: string;
        description: string;
      };
      webhooks: {
        title: string;
        description: string;
      };
      ipControl: {
        title: string;
        description: string;
      };
      readLimits: {
        title: string;
        description: string;
      };
      qrCode: {
        title: string;
        description: string;
      };
      cli: {
        title: string;
        description: string;
      };
      chromeExtension: {
        title: string;
        description: string;
      };
      docker: {
        title: string;
        description: string;
      };
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
      };
      urlCopied: string;
      qrCode: {
        title: string;
        description: string;
      };
      createAnother: string;
      deleteSecret: string;
      info: {
        expires: string;
        burnAfterReading: string;
        passwordProtected: string;
        ipRestrictions: string;
        readCount: string;
        webhook: string;
        failedAttempts: string;
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
    };
  };
  view: {
    notFound: {
      title: string;
      description: string;
      createNew: string;
    };
    password: {
      title: string;
      placeholder: string;
      description: string;
      error: string;
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
      clickToEnterPassword: string;
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
    intro: string;
    whyCryptFyi: {
      title: string;
      commonPractices: {
        title: string;
        description: string;
        problems: {
          email: string;
          slack: string;
          sms: string;
          messaging: string;
        };
      };
      existingSolutions: {
        title: string;
        description: string;
        limitations: {
          onePassword: string;
          onePasswordLink: string;
          otherTools: string;
          otherToolsConfigLink: string;
          otherToolsSecurityLink: string;
        };
      };
      approach: {
        title: string;
        description: string;
      };
    };
    howItWorks: {
      title: string;
      steps: {
        encrypt: {
          title: string;
          description: string;
        };
        share: {
          title: string;
          description: string;
        };
        burn: {
          title: string;
          description: string;
        };
      };
    };
    security: {
      title: string;
      encryption: {
        title: string;
        description: string;
        features: {
          key: string;
          derivation: string;
          vector: string;
        };
      };
      zeroKnowledge: {
        title: string;
        description: string;
        features: {
          clientSide: string;
          storage: string;
          keys: string;
        };
      };
      protection: {
        title: string;
        description: string;
        features: {
          encryption: string;
          tls: string;
          destruction: string;
          logging: string;
          password: string;
        };
      };
    };
    openSource: {
      title: string;
      description: string;
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
