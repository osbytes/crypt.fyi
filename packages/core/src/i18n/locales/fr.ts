import type { TranslationKeys } from '../types';

export const fr: TranslationKeys = {
  common: {
    createSecret: 'Créer un Secret',
    starOnGithub: 'Star sur GitHub',
    features: 'Fonctionnalités',
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
    requestNewLanguage: 'Demander nouvelle langue ou corriger traductions',
    footer: {
      tagline:
        "Construit avec la sécurité et la confidentialité à l'esprit - parce que l'ignorance peut être une bénédiction",
    },
    header: {
      tagline:
        'Partagez des données éphémères avec un chiffrement <aesLink>AES-256</aesLink> <e2eLink>de bout en bout</e2eLink> à connaissance nulle',
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
    title: 'Partagez des Données Sensibles en Toute Sécurité',
    subtitle:
      'Partage de données sécurisé et privé pour les mots de passe, clés API, fichiers et plus avec un chiffrement de bout en bout à connaissance nulle et une suppression automatique',
    features: {
      encryption: {
        title: 'Chiffrement de Bout en Bout',
        description:
          "Sécurisez vos données avec le chiffrement AES-256-GCM avant qu'elles ne quittent votre navigateur",
      },
      security: {
        title: 'Sécurité Renforcée',
        description:
          'Politique de sécurité du contenu (CSP) stricte et limites de débit pour atténuer les attaques XSS et par force brute',
      },
      zeroKnowledge: {
        title: 'Connaissance Nulle',
        description:
          'Nos serveurs ne voient jamais vos données non chiffrées - seuls vous et votre destinataire y ont accès',
      },
      burn: {
        title: 'Destruction Après Lecture',
        description:
          'Détruisez automatiquement les secrets après leur consultation pour une sécurité maximale',
      },
      expiration: {
        title: 'Auto-Expiration',
        description:
          "Définissez des délais d'expiration personnalisés pour que les secrets ne persistent pas plus longtemps que nécessaire",
      },
      password: {
        title: 'Protection par Mot de Passe',
        description:
          'Ajoutez une couche de sécurité supplémentaire avec une protection optionnelle par mot de passe',
      },
      files: {
        title: 'Partage de Fichiers',
        description:
          'Partagez des fichiers en toute sécurité avec une fonctionnalité simple de glisser-déposer',
      },
      webhooks: {
        title: 'Webhooks',
        description:
          'Soyez notifié lorsque vos secrets sont consultés, détruits ou échouent à être lus',
      },
      ipControl: {
        title: 'Restrictions IP',
        description:
          "Contrôlez l'accès en limitant quelles adresses IP ou plages CIDR peuvent voir vos secrets",
      },
      readLimits: {
        title: 'Limites de Lecture',
        description:
          "Définissez le nombre maximum de consultations pour restreindre l'accès à vos secrets",
      },
      qrCode: {
        title: 'Codes QR',
        description: 'Générez des codes QR pour un partage facile de vos URLs secrètes sur mobile',
      },
      cli: {
        title: 'Outil CLI',
        description: 'Automatisez le partage de secrets avec notre interface en ligne de commande',
      },
      chromeExtension: {
        title: 'Extension Chrome',
        description:
          'Partagez des secrets directement depuis votre navigateur avec notre extension Chrome',
      },
      docker: {
        title: 'Support Docker',
        description: 'Déployez votre propre instance en utilisant nos images Docker officielles',
      },
    },
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
        burnAfterReading: 'Le secret sera supprimé après sa consultation',
        passwordProtected: 'Protégé par mot de passe',
        ipRestrictions: 'Restriction(s) IP : {{ips}}',
        readCount: 'Nombre de lectures : {{count}}',
        webhook: 'Webhook configuré pour : {{events}} ({{url}})',
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
      "crypt.fyi est une plateforme sécurisée, open source et éphémère de partage de données qui vous permet de partager des informations sensibles en toute sécurité. Qu'il s'agisse de mots de passe, de clés API ou de messages confidentiels, crypt.fyi garantit que vos données restent privées et disparaissent automatiquement après avoir été consultées.",
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
  privacy: {
    title: 'Politique de Confidentialité',
    intro:
      'Chez crypt.fyi, nous prenons votre confidentialité au sérieux. Cette Politique de Confidentialité explique comment nous gérons vos informations lorsque vous utilisez notre plateforme de partage de secrets à connaissance nulle et chiffrement de bout en bout.',
    doNotCollect: {
      title: 'Informations que Nous ne Collectons pas',
      description:
        "En raison de notre architecture à connaissance nulle, nous sommes techniquement incapables d'accéder à :",
      items: {
        secrets: 'Vos secrets ou fichiers non chiffrés',
        keys: 'Clés de chiffrement ou mots de passe',
        urls: "Fragments d'URL contenant des informations de déchiffrement",
        content: 'Le contenu de vos données chiffrées',
        recipients: 'Informations sur les destinataires de vos secrets',
      },
    },
    collect: {
      title: 'Informations que Nous Collectons',
      description: 'Nous collectons et stockons uniquement les informations minimales requises :',
      items: {
        encrypted: 'Données chiffrées (que nous ne pouvons pas déchiffrer)',
        hashes:
          "Hachages de vérification des clés (utilisés pour vérifier les droits d'accès sans connaître les clés réelles)",
        metadata:
          'Métadonnées de base des requêtes (adresses IP, horodatages) pour la limitation des taux et la prévention des abus',
        webhooks:
          "URLs de webhook si fournies (pour les notifications d'accès et de suppression des secrets)",
      },
      note: "Toutes les données stockées sont automatiquement supprimées après expiration ou lors de l'accès (si la destruction après lecture est activée).",
    },
    usage: {
      title: 'Comment Nous Utilisons les Informations',
      description: 'Nous utilisons les informations collectées uniquement pour :',
      items: {
        transmission: 'Faciliter la transmission sécurisée de vos secrets chiffrés',
        rateLimits: 'Appliquer des limites de taux pour prévenir les abus',
        ipControl: 'Mettre en œuvre la liste blanche IP/CIDR lorsque configurée',
        notifications: "Envoyer des notifications webhook lorsqu'activées",
        security: 'Maintenir la sécurité du système et prévenir les accès non autorisés',
      },
    },
    security: {
      title: 'Stockage et Sécurité des Données',
      description: 'Nos mesures de sécurité incluent :',
      items: {
        encryption:
          'Tout le chiffrement/déchiffrement se fait dans votre navigateur en utilisant AES-256-GCM',
        csp: 'Politique de sécurité du contenu (CSP) stricte pour prévenir les attaques XSS',
        tls: 'Chiffrement TLS pour toutes les communications API',
        expiration: 'Expiration automatique des données avec durée de vie configurable (TTL)',
        deletion: 'Suppression sécurisée des données après accès ou expiration',
        storage: "Pas de stockage persistant d'informations sensibles",
      },
    },
    thirdParty: {
      title: 'Services Tiers',
      description:
        'Nous ne partageons aucune information avec des tiers sauf dans les cas suivants :',
      items: {
        webhooks:
          "Lorsque vous activez les webhooks, nous envoyons des notifications aux URLs que vous fournissez concernant l'accès et la suppression des secrets",
        infrastructure:
          "Fournisseurs d'infrastructure qui hébergent nos services (qui ne voient que des données chiffrées qu'ils ne peuvent pas déchiffrer)",
      },
    },
    rights: {
      title: 'Vos Droits et Choix',
      description: 'Vous avez le contrôle sur vos données :',
      items: {
        expiration: "Choisir des délais d'expiration personnalisés pour vos secrets",
        burn: "Activer la destruction après lecture pour une suppression immédiate après l'accès",
        password: 'Ajouter une protection par mot de passe pour une sécurité supplémentaire',
        ip: "Configurer des restrictions IP pour contrôler l'accès",
        readLimits: 'Définir des limites de lecture',
      },
    },
    changes: {
      title: 'Modifications de cette Politique',
      description:
        'Nous pouvons mettre à jour cette Politique de Confidentialité de temps en temps. Nous informerons les utilisateurs de tout changement important en publiant la nouvelle Politique de Confidentialité sur cette page. Nous vous conseillons de consulter régulièrement cette Politique de Confidentialité pour tout changement.',
    },
    contact: {
      title: 'Nous Contacter',
      description:
        'Si vous avez des questions concernant cette Politique de Confidentialité, vous pouvez nous contacter via notre',
    },
  },
};
