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
      tagline: '以安全和隐私为设计理念 - 因为无知也是一种幸福',
    },
    header: {
      tagline: '使用零知识<aesLink>AES-256</aesLink><e2eLink>端到端加密</e2eLink>的临时密文分享',
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
    title: '安全共享密文',
    subtitle: '使用零知识端到端加密和自动删除功能发送密码和敏感信息',
    features: {
      encryption: {
        title: '端到端加密',
        description: '在数据离开浏览器之前使用 AES-256-GCM 加密确保安全',
      },
      security: {
        title: '增强安全性',
        description: '严格的内容安全策略（CSP）和速率限制，以减轻 XSS 和暴力攻击',
      },
      zeroKnowledge: {
        title: '零知识架构',
        description: '我们的服务器永远不会看到您的未加密数据 - 只有您和接收者可以访问',
      },
      burn: {
        title: '阅后即焚',
        description: '访问后自动销毁密文以确保最大安全性',
      },
      expiration: {
        title: '自动过期',
        description: '设置自定义过期时间，确保密文不会持续超过所需时间',
      },
      password: {
        title: '密码保护',
        description: '通过可选的密码保护添加额外的安全层',
      },
      files: {
        title: '文件共享',
        description: '使用简单的拖放功能安全地共享文件',
      },
      webhooks: {
        title: 'Webhook 通知',
        description: '当您的密文被访问、销毁或无法读取时获得通知',
      },
      ipControl: {
        title: 'IP 限制',
        description: '通过限制可以查看密文的 IP 地址或 CIDR 范围来控制访问',
      },
      readLimits: {
        title: '阅读限制',
        description: '设置最大查看次数以限制密文可被访问的次数',
      },
      qrCode: {
        title: '二维码',
        description: '生成二维码以便在移动设备上轻松共享您的密文 URL',
      },
      cli: {
        title: 'CLI 工具',
        description: '使用我们的命令行界面自动化密文共享',
      },
      docker: {
        title: 'Docker 支持',
        description: '使用我们的官方 Docker 镜像部署您自己的实例',
      },
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
        fileHint: '拖放或点击此处添加文件',
        fileSelected: '已选择文件：{{name}}（{{size}} KB）',
      },
      password: {
        label: '密码',
        placeholder: '可选（但建议使用）',
      },
      ttl: {
        label: '有效期',
        placeholder: '选择过期时间',
      },
      burn: {
        label: '阅后即焚',
        description: '确保只有一个接收者可以访问密文',
      },
      advanced: {
        toggle: '高级配置',
        ip: {
          label: 'IP/CIDR 白名单',
          placeholder: '192.168.1.1, 10.0.0.0/24 等',
          description: '限制特定 IP 地址或 CIDR 块的访问（逗号分隔）',
        },
        readCount: {
          label: '阅读次数',
          description: '密文可被阅读的最大次数',
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
        main: '您的密文已创建，URL 已复制到剪贴板',
        password: '与预期接收者分享 URL 和密码',
      },
      urlCopied: 'URL 已复制到剪贴板',
      qrCode: {
        title: '密文 URL 二维码',
        description: '下载并分享密文 URL 二维码',
      },
      createAnother: '创建另一个',
      deleteSecret: '删除密文',
      info: {
        expires: '过期时间：{{time}}',
        burnAfterReading: '查看后密文将被删除',
        passwordProtected: '密码保护',
        ipRestrictions: 'IP限制：{{ips}}',
        readCount: '阅读次数：{{count}}',
        webhook: 'Webhook已配置：{{events}} ({{url}})',
      },
    },
    errors: {
      contentRequired: '内容为必填项',
      readCountWithBurn: '阅后即焚模式下不能设置阅读次数',
      tooManyIps: 'IP 限制过多（最大 {{max}}）',
      invalidIp: '无效的 IP 地址或 CIDR 块：{{ip}}',
      uploadFailed: '处理上传内容失败：{{error}}',
      deleteFailed: '删除密文失败：{{error}}',
      secretNotFound: '未找到密文',
      unexpectedStatus: '意外的状态码 {{code}}',
      webhookConfigInvalid: 'Webhook 配置无效 - 至少需要一个 webhook',
    },
  },
  view: {
    notFound: {
      title: '未找到密文',
      description: '此密文可能已过期或被删除。',
      createNew: '创建新密文',
    },
    password: {
      title: '输入密码',
      placeholder: '输入密码',
      description: '此密文受密码保护 - 请向发送者索要密码',
      error: '密码错误',
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
      clickToEnterPassword: '点击输入密码',
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
    intro:
      'crypt.fyi 是一个安全、开源、临时的密文分享平台，使您能够安全地分享敏感信息。无论是密码、API 密钥还是机密消息，crypt.fyi 都能确保您的数据保持私密，并在被访问后自动消失。',
    whyCryptFyi: {
      title: '为什么选择 crypt.fyi？',
      commonPractices: {
        title: '常见做法的问题',
        description: '每天，敏感信息如密码、API 密钥和私密数据都通过不安全的渠道共享：',
        problems: {
          email: '电子邮件 - 可能被拦截、无限期存储和转发',
          slack: 'Slack/Teams 消息 - 保留在聊天历史和公司日志中',
          sms: '短信 - 存储在多个设备和运营商服务器上',
          messaging: '即时通讯 - 通常缺乏适当的加密和数据删除',
        },
      },
      existingSolutions: {
        title: '现有解决方案及其局限性',
        description: '虽然这个领域有其他工具，但每个都有其局限性：',
        limitations: {
          onePassword: '1Password - 出色的团队密码管理工具，但',
          onePasswordLink: '不支持与外部非用户共享',
          otherTools:
            'PrivateBin/PwPush/OneTimeSecret - 核心功能相似，但用户界面和技术栈较旧，且缺少一些',
          otherToolsConfigLink: '可配置性',
          otherToolsSecurityLink: '安全功能',
        },
      },
      approach: {
        title: 'crypt.fyi 的方法',
        description:
          'crypt.fyi 在拥抱现代网络技术的同时解决这些挑战。它将现有解决方案的安全原则与清晰、直观的界面和现代技术栈相结合。结果是一个既高度安全又易于使用的工具。',
      },
    },
    howItWorks: {
      title: '工作原理',
      steps: {
        encrypt: {
          title: '1. 加密',
          description:
            '您的密文在离开设备之前就在浏览器中加密。只有拥有您明确共享的特殊链接的人才能解密。',
        },
        share: {
          title: '2. 分享',
          description: '与预期接收者分享安全链接。除非指定密码，否则链接包含解密消息所需的一切。',
        },
        burn: {
          title: '3. 阅后即焚',
          description:
            '一旦被访问，如果选中了"阅后即焚"，密文将从我们的服务器上永久删除。不留任何痕迹。',
        },
      },
    },
    security: {
      title: '安全实现',
      encryption: {
        title: '端到端加密',
        description:
          '所有密文在传输前都使用 AES-256-GCM 加密在您的浏览器中进行加密。加密密钥永远不会离开您的设备，确保真正的端到端加密。',
        features: {
          key: '加密密钥来自密码学安全的随机生成',
          derivation: '密钥派生使用 PBKDF2 和 SHA-256',
          vector: '每个密文都有唯一的初始化向量（IV）',
        },
      },
      zeroKnowledge: {
        title: '零知识架构',
        description: '我们的服务器永远不会看到您的未加密数据。我们采用零知识架构：',
        features: {
          clientSide: '所有加密/解密都在客户端进行',
          storage: '服务器只存储加密数据',
          keys: '加密密钥通过 URL 片段传输，永远不会到达后端 API 服务器',
        },
      },
      protection: {
        title: '数据保护',
        description: '多层安全确保您的数据受到保护：',
        features: {
          encryption: '客户端加密/解密',
          tls: '所有 API 通信都使用 TLS 加密',
          destruction: '访问后自动销毁密文',
          logging: '不记录敏感数据的服务器日志',
          password: '可选的密码保护以提供额外安全性',
        },
      },
    },
    openSource: {
      title: '开源',
      description: 'crypt.fyi 是开源且可审计的。您可以在以下位置查看我们的代码、提交问题和贡献',
      cta: '立即创建密文',
    },
  },
};
