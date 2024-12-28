import type { TranslationKeys } from '../types';

export const fr: TranslationKeys = {
  common: {
    createSecret: 'Créer un Secret',
    starOnGithub: 'Star sur GitHub',
    learnMore: 'En savoir plus',
    loading: 'Chargement...',
    create: 'Créer',
    delete: 'Supprimer',
    copy: 'Copier',
    share: 'Partager',
    download: 'Télécharger',
    success: 'Succès !',
    error: 'Erreur',
    confirm: 'Confirmer',
    footer: {
      tagline:
        "Construit avec la sécurité et la confidentialité à l'esprit - parce que l'ignorance peut être une bénédiction",
    },
    header: {
      tagline:
        'Partagez des secrets éphémères avec un chiffrement <aesLink>AES-256</aesLink> <e2eLink>de bout en bout</e2eLink> à connaissance nulle',
    },
    time: {
      minute_one: '{{count}} minute',
      minute_other: '{{count}} minutes',
      hour_one: '{{count}} heure',
      hour_other: '{{count}} heures',
      day_one: '{{count}} jour',
      day_other: '{{count}} jours',
    },
  },
  landing: {
    title: 'Partagez des Secrets en Toute Sécurité',
    subtitle:
      'Envoyez des mots de passe et des informations sensibles avec un chiffrement de bout en bout à connaissance nulle et une suppression automatique',
    steps: {
      encrypt: {
        title: '1. Chiffrer',
        description: "Votre secret est chiffré dans votre navigateur avant d'être stocké",
      },
      share: {
        title: '2. Partager',
        description: 'Envoyez le lien sécurisé à votre destinataire',
      },
      autoDelete: {
        title: '3. Auto-Suppression',
        description: 'Le secret est définitivement supprimé après avoir été consulté',
      },
    },
  },
  create: {
    form: {
      content: {
        label: 'Contenu secret',
        placeholder: 'Saisissez votre contenu secret ici...',
        fileHint: 'ajoutez un fichier en le déposant ou en cliquant ici',
        fileSelected: 'Fichier sélectionné : {{name}} ({{size}} Ko)',
      },
      password: {
        label: 'Mot de passe',
        placeholder: 'Optionnel (mais recommandé)',
      },
      ttl: {
        label: 'Durée de vie',
        placeholder: "Sélectionnez le délai d'expiration",
      },
      burn: {
        label: 'Détruire après lecture',
        description: "Garantit qu'un seul destinataire peut accéder au secret",
      },
      advanced: {
        toggle: 'paramètres avancés',
        ip: {
          label: "Liste d'IP/CIDR autorisées",
          placeholder: '192.168.1.1, 10.0.0.0/24, etc.',
          description:
            "Restreindre l'accès à des adresses IP spécifiques ou des blocs CIDR (séparés par des virgules)",
        },
        readCount: {
          label: 'Nombre de lectures',
          description: 'Nombre maximum de fois que le secret peut être lu',
        },
        webhook: {
          label: 'Webhook',
          placeholder: 'https://example.com/webhook',
          description:
            'URL du webhook à appeler lorsque le secret est lu, détruit ou échoue à être lu (configurable, si défini)',
          read: 'Lecture',
          burn: 'Destruction',
          failureToReadPK: 'Échec (mot de passe ou clé)',
          failureToReadIP: 'Échec (IP ou CIDR)',
          nameLabel: 'Nom',
          namePlaceholder: 'Entrez un nom pour ce webhook',
          nameDescription: 'Un nom pour identifier ce webhook dans les notifications',
        },
      },
    },
    success: {
      title: 'Secret Créé !',
      description: {
        main: "Votre secret a été créé et l'URL a été copiée dans le presse-papiers",
        password: "Partagez l'URL et le mot de passe avec le destinataire souhaité",
      },
      urlCopied: 'URL copiée dans le presse-papiers',
      qrCode: {
        title: "Code QR de l'URL du Secret",
        description: "Téléchargez et partagez le code QR de l'URL du secret",
      },
      createAnother: 'Créer un Autre',
      deleteSecret: 'Supprimer le Secret',
      info: {
        expires: 'Expire dans : {{time}}',
        burnAfterReading: 'Le secret sera supprimé après avoir été consulté',
        passwordProtected: 'Protégé par mot de passe',
        ipRestrictions: 'Restriction(s) IP : {{ips}}',
        readCount: 'Nombre de lectures : {{count}}',
      },
    },
    errors: {
      contentRequired: 'Le contenu est requis',
      readCountWithBurn:
        'Le nombre de lectures ne peut pas être utilisé avec la destruction après lecture',
      tooManyIps: 'Trop de restrictions IP (maximum {{max}})',
      invalidIp: 'Adresse IP ou bloc CIDR invalide : {{ip}}',
      uploadFailed: 'Erreur lors du traitement du contenu téléchargé : {{error}}',
      deleteFailed: 'Erreur lors de la suppression du secret : {{error}}',
      secretNotFound: 'secret non trouvé',
      unexpectedStatus: 'code de statut inattendu {{code}}',
      webhookConfigInvalid:
        'La configuration du webhook est invalide - au moins un webhook est requis',
    },
  },
  view: {
    notFound: {
      title: 'Secret Non Trouvé',
      description: 'Ce secret a peut-être expiré ou a été supprimé.',
      createNew: 'Créer un Nouveau Secret',
    },
    password: {
      title: 'Saisir le Mot de Passe',
      placeholder: 'Saisissez le mot de passe',
      description: "Ce secret est protégé par un mot de passe - demandez-le à l'expéditeur",
      error: 'Mot de passe incorrect',
    },
    content: {
      fileShared: 'Un fichier a été partagé avec vous',
      downloadFile: 'Télécharger le Fichier',
      hideContent: 'Masquer le contenu',
      showContent: 'Afficher le contenu',
      copyToClipboard: 'Copier dans le presse-papiers',
      copiedToClipboard: 'Secret copié dans le presse-papiers',
      clickToReveal: "Cliquez sur l'icône œil ci-dessus pour révéler le secret",
      passwordProtected:
        'Ce secret est protégé par un mot de passe. Cliquez pour saisir le mot de passe.',
      clickToEnterPassword: 'Cliquez pour saisir le mot de passe',
    },
    info: {
      burnedAfterReading:
        'Ce secret a été supprimé après votre consultation et ne sera plus disponible après avoir quitté la page.',
      expiresIn: 'Expire {{time}}',
    },
    errors: {
      notFound: 'non trouvé',
      unexpectedStatus: 'code de statut inattendu {{code}}',
    },
    actions: {
      viewSecret: 'Voir le Secret',
    },
  },
  about: {
    title: 'À Propos',
    intro:
      "crypt.fyi est une plateforme sécurisée, open source et éphémère de partage de secrets qui vous permet de partager des informations sensibles en toute sécurité. Qu'il s'agisse de mots de passe, de clés API ou de messages confidentiels, crypt.fyi garantit que vos données restent privées et disparaissent automatiquement après avoir été consultées.",
    whyCryptFyi: {
      title: 'Pourquoi crypt.fyi ?',
      commonPractices: {
        title: 'Le Problème avec les Pratiques Courantes',
        description:
          'Chaque jour, des informations sensibles comme des mots de passe, des clés API et des données privées sont partagées via des canaux non sécurisés :',
        problems: {
          email: 'Email - peut être intercepté, stocké indéfiniment et transféré sans contrôle',
          slack:
            "Messages Slack/Teams - restent dans l'historique des discussions et les journaux d'entreprise",
          sms: "SMS/Messages texte - stockés sur plusieurs appareils et serveurs d'opérateurs",
          messaging:
            'Messagerie instantanée - manque souvent de chiffrement adéquat et de suppression des données',
        },
      },
      existingSolutions: {
        title: 'Solutions Existantes et Leurs Limites',
        description: "Bien qu'il existe d'autres outils dans ce domaine, chacun a ses limites :",
        limitations: {
          onePassword: '1Password - excellent pour la gestion des mots de passe en équipe, mais',
          onePasswordLink:
            'ne prend pas en charge le partage externe avec des utilisateurs non enregistrés',
          otherTools:
            'PrivateBin/PwPush/OneTimeSecret - fonctionnalité de base similaire, mais interfaces utilisateur dépassées et piles technologiques anciennes, plus certaines',
          otherToolsConfigLink: 'configurations',
          otherToolsSecurityLink: 'fonctionnalités de sécurité',
        },
      },
      approach: {
        title: "L'Approche de crypt.fyi",
        description:
          'crypt.fyi a été construit pour répondre à ces défis tout en adoptant les technologies web modernes. Il combine les principes de sécurité des solutions existantes avec une interface propre et intuitive et une pile technologique moderne. Le résultat est un outil à la fois hautement sécurisé et agréable à utiliser.',
      },
    },
    howItWorks: {
      title: 'Comment Ça Marche',
      steps: {
        encrypt: {
          title: '1. Chiffrer',
          description:
            'Votre secret est chiffré directement dans votre navigateur avant de quitter votre appareil. Seules les personnes ayant le lien spécial, que vous avez explicitement partagé, peuvent le déchiffrer.',
        },
        share: {
          title: '2. Partager',
          description:
            'Partagez le lien sécurisé avec votre destinataire. Le lien contient tout ce qui est nécessaire pour déchiffrer le message, sauf si un mot de passe est spécifié.',
        },
        burn: {
          title: '3. Détruire après lecture',
          description:
            'Une fois consulté, si "détruire après lecture" est coché, le secret est définitivement supprimé de nos serveurs. Sans laisser de traces.',
        },
      },
    },
    security: {
      title: 'Implémentation de la Sécurité',
      encryption: {
        title: 'Chiffrement de Bout en Bout',
        description:
          'Tous les secrets sont chiffrés en utilisant le chiffrement AES-256-GCM dans votre navigateur avant la transmission. La clé de chiffrement ne quitte jamais votre appareil, assurant un véritable chiffrement de bout en bout.',
        features: {
          key: "La clé de chiffrement est dérivée d'une génération aléatoire cryptographiquement sûre",
          derivation: 'La dérivation des clés utilise PBKDF2 avec SHA-256',
          vector: "Chaque secret a un vecteur d'initialisation (IV) unique",
        },
      },
      zeroKnowledge: {
        title: 'Architecture à Connaissance Nulle',
        description:
          'Nos serveurs ne voient jamais vos données non chiffrées. Nous employons une architecture à connaissance nulle où :',
        features: {
          clientSide: 'Tout le chiffrement/déchiffrement se fait côté client',
          storage: 'Les serveurs ne stockent que des données chiffrées',
          keys: "Les clés de chiffrement sont transmises via des fragments d'URL, qui n'atteignent jamais le serveur API backend",
        },
      },
      protection: {
        title: 'Protection des Données',
        description: 'Plusieurs couches de sécurité assurent que vos données restent protégées :',
        features: {
          encryption: 'Chiffrement/déchiffrement côté client',
          tls: 'Chiffrement TLS pour toutes les communications API',
          destruction: 'Destruction automatique du secret après consultation',
          logging: 'Pas de journalisation des données sensibles sur le serveur',
          password: 'Protection par mot de passe optionnelle pour une sécurité supplémentaire',
        },
      },
    },
    openSource: {
      title: 'Open Source',
      description:
        'crypt.fyi est open source et auditable. Vous pouvez examiner notre code, signaler des problèmes et contribuer sur',
      cta: 'Créer un Secret Maintenant',
    },
  },
};
