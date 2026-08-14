import type { TranslationKeys } from '../types';

export const zh: TranslationKeys = {
  common: {
    createSecret: '创建密文',
    starOnGithub: '在 GitHub 上标星',
    features: '功能特点',
    learnMore: '了解更多',
    loading: '加载中...',
    create: '创建',
    delete: '删除',
    copy: '复制',
    share: '分享',
    download: '下载',
    success: '成功！',
    error: '错误',
    confirm: '确认',
    requestNewLanguage: '请求新语言或修正翻译',
    footer: {
      tagline: '以安全和隐私为设计理念，因为无知也是一种幸福',
    },
    time: {
      minute_one: '{{count}} 分钟',
      minute_other: '{{count}} 分钟',
      hour_one: '{{count}} 小时',
      hour_other: '{{count}} 小时',
      day_one: '{{count}} 天',
      day_other: '{{count}} 天',
    },
  },
  landing: {
    title: '零知识秘密共享',
    subtitle:
      '在浏览器中加密。分享一次。永久消失。后量子端到端加密——我们的服务器永远看不到您的秘密。',
    pillars: {
      title: '为信任而构建',
      zeroKnowledge: {
        title: '真正的零知识',
        description:
          '加密密钥永远不会离开您的设备。解密仅在接收者的浏览器中进行——服务器永远看不到明文。',
      },
      ephemeral: {
        title: '默认即用即焚',
        description: '阅后即焚、自定义 TTL 和阅读限制，确保敏感数据不会存留超过必要时间。',
      },
      defense: {
        title: '纵深防御',
        description:
          'ML-KEM 后量子加密、严格 CSP、速率限制和可选 IP 白名单——分层保护，而非单一勾选项。',
      },
      open: {
        title: '开放且可审计',
        description: '完全开源，专为自托管设计。检查代码、运行自己的实例或参与贡献。',
      },
    },
    alsoIncludes: {
      label: '还包括',
      password: '密码保护',
      files: '文件共享',
      webhooks: 'Webhook',
      qrCode: '二维码',
      ipControl: 'IP 白名单',
      readLimits: '阅读限制',
    },
    selfHost: {
      title: '运行您自己的实例',
      description:
        '在您的基础设施上部署相同的零知识技术栈——一键部署到 Railway，或使用 Docker Compose 随处部署。',
      deployOnRailway: '部署到 Railway',
      dockerCompose: 'Docker Compose',
    },
    ecosystem: {
      cli: 'CLI',
      chromeExtension: 'Chrome 扩展',
      github: 'GitHub',
    },
    steps: {
      encrypt: {
        title: '1. 加密',
        description: '您的密文在存之前会在浏览器中进行加密',
      },
      share: {
        title: '2. 分享',
        description: '将安全链接发送给预期接收者',
      },
      autoDelete: {
        title: '3. 自动删除',
        description: '密文在被查看后将永久删除',
      },
    },
  },
  create: {
    form: {
      content: {
        label: '密文内容',
        placeholder: '在此输入您的密文内容...',
        fileHint: '拖放或点击此处添加文件（最大 1 MB）',
        fileSelected: '已选择文件：{{name}}（{{size}} KB）',
        dropFile: '拖放文件到此处',
        invalidFileType: '无效的文件类型',
      },
      password: {
        label: '密码',
        placeholder: '可选（但建议使用）',
        placeholderRequired: '输入密码（至少{{min}}个字符）',
      },
      ttl: {
        label: '有效期',
        placeholder: '选择过期时间',
      },
      burn: {
        label: '阅后即焚',
        description: '确保密文只能被读取一次——由第一个打开链接的人',
      },
      advanced: {
        toggle: '高级配置',
        ip: {
          label: 'IP/CIDR 白名单',
          placeholder: '192.168.1.1, 10.0.0.0/24, 等',
          description: '限制特定 IP 地址或 CIDR 块的访问（逗号分隔）',
        },
        readCount: {
          label: '阅读次数',
          description: '密文可被阅读的最大次数',
        },
        failedAttempts: {
          label: '失败尝试后销毁',
          description: '在多次访问失败尝试后自动销毁密文',
        },
        webhook: {
          label: 'Webhook',
          placeholder: 'https://example.com/webhook',
          description: '当密文被读取、销毁或读取失败时调用的 Webhook URL（如果设置，可配置）',
          read: '读取',
          burn: '销毁',
          failureToReadPK: '失败（密码或密钥）',
          failureToReadIP: '失败（IP 或 CIDR）',
          nameLabel: '名称',
          namePlaceholder: '输入此 webhook 的名称',
          nameDescription: '用于在通知中识别此 webhook 的名称',
        },
      },
    },
    success: {
      title: '密文已创建！',
      description: {
        main: '您的密文已创建。请从下方选择分享方式。',
        password: '请通过单独的渠道发送密码。',
        separateKey: '若要分开发送，请通过不同渠道发送无密钥 URL 和解密密钥。',
      },
      combinedUrl: '完整 URL（含密钥）',
      keylessUrl: '无密钥 URL',
      decryptionKey: '解密密钥',
      urlCopied: 'URL 已复制到剪贴板',
      keyCopied: '解密密钥已复制到剪贴板',
      secretDeleted: '密文已删除',
      qrDownloaded: '二维码已下载',
      qrDownloadFailed: '下载二维码失败：{{error}}',
      qrCode: {
        title: '密文 URL 二维码',
        description: '下载并分享密文 URL 二维码',
      },
      actions: {
        showUrl: '显示密文 URL',
        hideUrl: '隐藏密文 URL',
        showKey: '显示解密密钥',
        hideKey: '隐藏解密密钥',
        shareUrl: '分享密文 URL',
        shareKey: '分享解密密钥',
        copyUrl: '复制密文 URL',
        copyKey: '复制解密密钥',
        showQr: '显示完整 URL 二维码',
      },
      createAnother: '创建另一个',
      deleteSecret: '删除密文',
      info: {
        expires: '过期时间：{{time}}',
        burn: '密文将在查看后删除',
        passwordProtected: '密码保护',
        ipRestrictions: 'IP限制：{{ips}}',
        readCount: '阅读次数：{{count}}',
        webhook: 'Webhook已配置：{{events}} ({{url}})',
        failureCount: '密文将在{{count}}次失败尝试后删除',
      },
    },
    errors: {
      contentRequired: '内容为必填项',
      passwordMinLength: '密码必须至少{{min}}个字符',
      passwordTooSimple: '密码太简单',
      readCountWithBurn: '阅后即焚模式下不能设置阅读次数',
      tooManyIps: 'IP 限制过多（最大 {{max}}）',
      invalidIp: '无效的 IP 地址或 CIDR 块：{{ip}}',
      uploadFailed: '处理上传内容失败：{{error}}',
      deleteFailed: '删除密文失败：{{error}}',
      secretNotFound: '未找到密文',
      unexpectedStatus: '意外的状态码 {{code}}',
      webhookConfigInvalid: 'Webhook配置无效 - 至少需要一个Webhook事件类型',
      fileSizeExceeded: '文件过大。最大大小为 {{max}}。',
      fileReadError: '读取文件失败',
      fileReadAborted: '文件读取已中止',
    },
  },
  view: {
    notFound: {
      title: '未找到密文',
      description: '此密文可能已过期或被删除。',
      createNew: '创建新密文',
    },
    invalidLink: {
      title: '此链接无效',
      description: '链接不完整或在传输过程中被更改，因此无法解密密文。请让发送者重新分享完整链接。',
      createNew: '创建新密文',
    },
    connectionError: {
      title: '无法连接服务器',
      description: '密文可能仍然存在。请检查您的网络连接后重试。',
      tryAgain: '重试',
    },
    rateLimit: {
      title: '请求过多',
      description: '您的请求过于频繁。请稍等片刻后重试。',
      tryAgain: '重试',
    },
    password: {
      title: '输入密码',
      label: '密码',
      placeholder: '输入密码',
      description: '此密文受密码保护 - 请向发送者索要密码',
      error: '解密密钥或密码错误',
      required: '请输入密码。',
      show: '显示密码',
      hide: '隐藏密码',
    },
    key: {
      title: '输入解密密钥',
      label: '解密密钥',
      placeholder: '输入发送者提供的密钥',
      description: '请通过单独的渠道向发送者索取解密密钥。该密钥仅在此浏览器中使用。',
      required: '请输入解密密钥。',
      error: '此解密密钥无法解锁密文。请检查密钥后重试。',
      show: '显示解密密钥',
      hide: '隐藏解密密钥',
      change: '输入其他密钥',
      submit: '解锁密文',
    },
    credentials: {
      title: '解锁密文',
      description: '请输入发送者提供的解密密钥和密码。两者仅在此浏览器中使用。',
      submit: '解锁密文',
    },
    legacyKey: {
      warning:
        '此链接由过时的客户端创建，该客户端将解密密钥放在查询字符串中。请让发送者升级客户端，以便后续链接将密钥排除在服务器日志之外。',
    },
    content: {
      fileShared: '有人与您分享了一个文件',
      downloadFile: '下载文件',
      hideContent: '隐藏内容',
      showContent: '显示内容',
      copyToClipboard: '复制到剪贴板',
      copiedToClipboard: '密文已复制到剪贴板',
      clickToReveal: '点击上方的眼睛图标显示密文',
      passwordProtected: '此密文受密码保护。点击输入密码。',
      ariaLabel: '密文内容',
    },
    info: {
      burnedAfterReading: '此密文在您查看后已被删除，离开页面后将无法再次访问。',
      expiresIn: '{{time}}后过期',
    },
    errors: {
      notFound: '未找到',
      unexpectedStatus: '意外的状态码 {{code}}',
    },
    actions: {
      viewSecret: '查看密文',
    },
  },
  about: {
    title: '关于',
    what: {
      description:
        'crypt.fyi 是一种零知识方式，通过链接分享敏感信息——密码、API 密钥、文件。加密在您的浏览器中完成，我们的服务器永远看不到明文，秘密可在被读取后消失。',
      traditionalTitle: '为什么不直接发邮件或短信？',
      traditionalDescription:
        '邮件、短信、Slack 和聊天都会留下副本：收件箱、消息记录、运营商日志，以及每台同步过的设备。一旦把密码粘贴到这些渠道，你就失去了对谁能事后找到它的控制。crypt.fyi 用于一次刻意的交接——分享链接，可选添加密码或 IP 白名单，并在用完后让秘密消失。',
    },
    letter: {
      title: '作者的一封短笺',
      p1: '我创建 crypt.fyi，是因为我已经在用的工具，在我需要分享敏感内容时——尤其是对密码管理器之外的人——往往缺少真正符合我工作方式的控制能力。',
      p2: '现有方案常常缺少日常真正重要的体验细节：丰富的限制能力（如 IP 白名单、阅读次数、失败尝试后销毁、Webhook）；CLI 与浏览器扩展；已保存/预填配置。技术上，有些也落后于现代加密标准，或缺少真正的原子读后即焚，从而无法避免竞态条件下被多次读取。',
      p3: '于是我做了新的东西：开源、可自托管，并在我自己想要的密码学与控制能力上旗帜鲜明。',
      signOff: '— Dillon',
    },
    openSource: {
      description: 'crypt.fyi 开源且可审计。你可以审查实现、自行托管，或在此贡献：',
    },
    technical: {
      prompt: '想了解更多技术细节？',
      specLink: '阅读协议规范',
    },
  },
  privacy: {
    title: '隐私政策',
    intro:
      '在 crypt.fyi，我们严肃对待您的隐私。本隐私政策说明了当您使用我们的零知识、端到端加密的秘密共享平台时，我们如何处理您的信息。',
    doNotCollect: {
      title: '我们不收集的信息',
      description: '由于我们的零知识架构，我们在技术上无法访问：',
      items: {
        secrets: '您的未加密秘密或文件',
        keys: '加密密钥或密码',
        urls: '包含解密信息的 URL 片段',
        content: '您的加密数据的内容',
        recipients: '您的秘密接收者的信息',
      },
    },
    collect: {
      title: '我们收集的信息',
      description: '我们仅收集和存储最少必需的信息：',
      items: {
        encrypted: '加密数据（我们无法解密）',
        hashes: '密钥验证哈希（用于验证访问权限而无需知道实际密钥）',
        metadata: '基本请求元数据（IP 地址、时间戳）用于速率限制和滥用预防',
        webhooks: '如果提供了 webhook URL（用于秘密访问和删除通知）',
      },
      note: '所有存储的数据在过期后或访问时自动删除（如果启用了阅后即焚）。',
    },
    usage: {
      title: '我们如何使用信息',
      description: '我们仅将收集的信息用于：',
      items: {
        transmission: '促进您的加密秘密的安全传输',
        rateLimits: '实施速率限制以防止滥用',
        ipControl: '在配置时实施 IP/CIDR 白名单',
        notifications: '在启用时发送 webhook 通知',
        security: '维护系统安全并防止未授权访问',
      },
    },
    security: {
      title: '数据存储和安全',
      description: '我们的安全措施包括：',
      items: {
        encryption: '所有加密/解密都在您的浏览器中使用 ML-KEM 后量子加密进行',
        csp: '严格的内容安全策略 (CSP) 以防止 XSS 攻击',
        tls: '所有 API 通信都使用 TLS 加密',
        expiration: '具有可配置生存时间 (TTL) 的自动数据过期',
        deletion: '访问或过期后安全删除数据',
        storage: '不持久存储敏感信息',
      },
    },
    thirdParty: {
      title: '第三方服务',
      description: '除以下情况外，我们不与第三方共享信息：',
      items: {
        webhooks: '当您启用 webhooks 时，我们向您提供的 URL 发送有关秘密访问和删除的通知',
        infrastructure: '托管我们服务的基础设施提供商（他们只能看到无法解密的加密数据）',
      },
    },
    rights: {
      title: '您的权利和选择',
      description: '您可以控制您的数据：',
      items: {
        expiration: '为您的秘密选择自定义过期时间',
        burn: '启用阅后即焚以在访问后立即删除',
        password: '添加密码保护以增加安全性',
        ip: '配置 IP 限制以控制访问',
        readLimits: '设置阅读限制',
      },
    },
    changes: {
      title: '本政策的变更',
      description:
        '我们可能会不时更新本隐私政策。我们会通过在此页面上发布新的隐私政策来通知用户重大变更。我们建议您定期查看本隐私政策以了解任何变更。',
    },
    contact: {
      title: '联系我们',
      description: '如果您对本隐私政策有任何问题，您可以通过我们的',
    },
  },
};
