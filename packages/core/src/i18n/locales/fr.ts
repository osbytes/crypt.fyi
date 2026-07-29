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
      tagline: 'Conçu avec la sécurité et la confidentialité au cœur',
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
    title: 'Partage de Secrets Zero-Knowledge',
    subtitle:
      'Chiffrez dans votre navigateur. Partagez une fois. Disparu pour toujours. Chiffrement post-quantique de bout en bout — nos serveurs ne voient jamais vos secrets.',
    pillars: {
      title: 'Conçu pour la confiance',
      zeroKnowledge: {
        title: 'Vrai zero-knowledge',
        description:
          'Les clés de chiffrement ne quittent jamais votre appareil. Le déchiffrement a lieu uniquement dans le navigateur du destinataire — le serveur ne voit jamais le texte en clair.',
      },
      ephemeral: {
        title: 'Éphémère par défaut',
        description:
          'Destruction après lecture, TTL personnalisés et limites de lecture pour que les données sensibles ne persistent pas plus que nécessaire.',
      },
      defense: {
        title: 'Défense en profondeur',
        description:
          'Chiffrement post-quantique ML-KEM, CSP stricte, limitation de débit et listes IP optionnelles — une protection en couches, pas une simple case à cocher.',
      },
      open: {
        title: 'Ouvert et auditable',
        description:
          "Entièrement open source et conçu pour l'auto-hébergement. Inspectez le code, hébergez votre instance ou contribuez.",
      },
    },
    alsoIncludes: {
      label: 'Inclut aussi',
      password: 'protection par mot de passe',
      files: 'partage de fichiers',
      webhooks: 'webhooks',
      qrCode: 'codes QR',
      ipControl: 'listes IP',
      readLimits: 'limites de lecture',
    },
    selfHost: {
      title: 'Hébergez votre propre instance',
      description:
        'Déployez le même stack zero-knowledge sur votre infrastructure — un clic sur Railway, ou Docker Compose partout.',
      deployOnRailway: 'Déployer sur Railway',
      dockerCompose: 'Docker Compose',
    },
    ecosystem: {
      cli: 'CLI',
      chromeExtension: 'Extension Chrome',
      github: 'GitHub',
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
        fileHint: 'ajoutez un fichier en le déposant ou en cliquant ici (max 1 Mo)',
        fileSelected: 'Fichier sélectionné : {{name}} ({{size}} Ko)',
        dropFile: 'Déposez le fichier ici',
        invalidFileType: 'Type de fichier invalide',
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
        description:
          "Garantit que le secret ne peut être lu qu'une seule fois — par la première personne qui ouvre le lien",
      },
      advanced: {
        toggle: 'configuration avancée',
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
        failedAttempts: {
          label: 'Supprimer après tentatives échouées',
          description:
            "Supprimer automatiquement le secret après un certain nombre de tentatives d'accès échouées",
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
        main: "Votre secret a été créé. Partagez l'URL ci-dessous avec le destinataire prévu.",
        password: 'Envoyez le mot de passe par un canal séparé.',
        separateKey: "Envoyez la clé de déchiffrement par un canal différent de celui de l'URL.",
      },
      secretUrl: 'URL du secret',
      decryptionKey: 'Clé de déchiffrement',
      urlCopied: 'URL copiée dans le presse-papiers',
      keyCopied: 'Clé de déchiffrement copiée dans le presse-papiers',
      secretDeleted: 'Secret supprimé',
      qrDownloaded: 'Code QR téléchargé',
      qrDownloadFailed: 'Échec du téléchargement du code QR : {{error}}',
      qrCode: {
        title: "Code QR de l'URL du Secret",
        description:
          "Ce code QR contient uniquement l'URL du secret. Envoyez la clé de déchiffrement séparément.",
      },
      actions: {
        showUrl: "Afficher l'URL du secret",
        hideUrl: "Masquer l'URL du secret",
        showKey: 'Afficher la clé de déchiffrement',
        hideKey: 'Masquer la clé de déchiffrement',
        shareUrl: "Partager l'URL du secret",
        copyUrl: "Copier l'URL du secret",
        copyKey: 'Copier la clé de déchiffrement',
        showQr: 'Afficher le code QR sans clé',
      },
      createAnother: 'Créer un Autre',
      deleteSecret: 'Supprimer le Secret',
      info: {
        expires: 'Expire dans: {{time}}',
        burn: 'Le secret sera supprimé après sa lecture',
        passwordProtected: 'Protégé par mot de passe',
        ipRestrictions: 'Restriction(s) IP: {{ips}}',
        readCount: 'Nombre de lectures: {{count}}',
        webhook: 'Webhook configuré pour: {{events}} ({{url}})',
        failureCount: 'Le secret sera supprimé après {{count}} tentatives échouées',
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
        "La configuration du webhook est invalide - au moins un type d'événement webhook est requis",
      fileSizeExceeded: 'Le fichier est trop volumineux. La taille maximale est {{max}}.',
      fileReadError: 'Échec de la lecture du fichier',
      fileReadAborted: 'La lecture du fichier a été interrompue',
      createFailed: 'Impossible de créer le secret. Veuillez réessayer.',
    },
  },
  view: {
    notFound: {
      title: 'Secret Non Trouvé',
      description: 'Ce secret a peut-être expiré ou a été supprimé.',
      createNew: 'Créer un Nouveau Secret',
    },
    invalidLink: {
      title: 'Ce lien est invalide',
      description:
        "Le lien est incomplet ou a été modifié pendant le transfert, le secret ne peut donc pas être déchiffré. Demandez à l'expéditeur de partager à nouveau le lien complet.",
      createNew: 'Créer un Nouveau Secret',
    },
    connectionError: {
      title: 'Impossible de joindre le serveur',
      description: 'Le secret existe peut-être encore. Vérifiez votre connexion et réessayez.',
      tryAgain: 'Réessayer',
    },
    password: {
      title: 'Saisir le Mot de Passe',
      placeholder: 'Saisissez le mot de passe',
      description: "Ce secret est protégé par un mot de passe - demandez-le à l'expéditeur",
      error: 'Clé de déchiffrement ou mot de passe incorrect',
    },
    key: {
      title: 'Saisir la clé de déchiffrement',
      label: 'Clé de déchiffrement',
      placeholder: "Saisissez la clé fournie par l'expéditeur",
      description:
        "Demandez la clé de déchiffrement à l'expéditeur par un canal séparé. La clé est utilisée uniquement dans ce navigateur.",
      required: 'Saisissez une clé de déchiffrement.',
      error:
        'Cette clé de déchiffrement ne permet pas de déverrouiller le secret. Vérifiez-la et réessayez.',
      show: 'Afficher la clé de déchiffrement',
      hide: 'Masquer la clé de déchiffrement',
      change: 'Saisir une autre clé',
      submit: 'Déverrouiller le secret',
    },
    legacyKey: {
      warning:
        "Ce lien obsolète plaçait la clé de déchiffrement dans la chaîne de requête, où elle a pu atteindre les journaux du serveur. Elle a maintenant été supprimée de l'historique du navigateur.",
      learnMore: 'En savoir plus sur le format de lien plus sûr',
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
      ariaLabel: 'Contenu secret',
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
    title: 'À propos',
    what: {
      description:
        'crypt.fyi est un moyen zero-knowledge de partager des informations sensibles — mots de passe, clés API, fichiers — via un lien. Le chiffrement a lieu dans votre navigateur, nos serveurs ne voient jamais le texte en clair, et les secrets peuvent disparaître après lecture.',
      traditionalTitle: 'Pourquoi ne pas simplement envoyer un e-mail ou un SMS ?',
      traditionalDescription:
        "Les e-mails, SMS, Slack et chats conservent des copies : dans les boîtes de réception, l'historique des messages, les journaux des opérateurs et sur chaque appareil synchronisé. Une fois qu'un mot de passe est collé dans ces canaux, vous perdez le contrôle sur qui peut le retrouver plus tard. crypt.fyi est conçu pour une transmission délibérée, à usage unique — partagez le lien, ajoutez éventuellement un mot de passe ou une liste d'IP, et laissez le secret disparaître une fois le besoin passé.",
    },
    letter: {
      title: "Une note de l'auteur",
      p1: "J'ai créé crypt.fyi parce que les outils auxquels je faisais déjà appel se montraient insuffisants quand je devais partager quelque chose de sensible — surtout avec quelqu'un hors de mon gestionnaire de mots de passe — avec des contrôles adaptés à ma façon réelle de travailler.",
      p2: "Les solutions existantes manquaient souvent des détails d'UX qui comptent au quotidien : des restrictions riches comme les listes d'IP, les limites de lecture, la destruction après tentatives échouées et les webhooks ; une CLI et une extension navigateur ; une configuration sauvegardée et préremplie. Techniquement, certaines étaient aussi en retard sur les standards modernes de chiffrement, ou manquaient d'un vrai read-and-burn atomique pour qu'un secret ne puisse pas être lu plusieurs fois à cause d'une condition de course.",
      p3: "J'ai donc construit quelque chose de nouveau : open source, auto-hébergeable, et opiniâtre sur la cryptographie et les contrôles que je voulais pour moi-même.",
      signOff: '— Dillon',
    },
    openSource: {
      description:
        "crypt.fyi est open source et auditable. Vous pouvez examiner l'implémentation, l'héberger vous-même ou contribuer sur",
    },
    technical: {
      prompt: 'Envie d’aller plus loin techniquement ?',
      specLink: 'Lire la spécification du protocole',
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
          'Tout le chiffrement/déchiffrement se fait dans votre navigateur en utilisant ML-KEM post-quantique',
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
