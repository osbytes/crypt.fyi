import type { TranslationKeys } from '../types';

export const de: TranslationKeys = {
  common: {
    createSecret: 'Geheimnis erstellen',
    starOnGithub: 'Auf GitHub markieren',
    learnMore: 'Mehr erfahren',
    loading: 'Lädt...',
    create: 'Erstellen',
    delete: 'Löschen',
    copy: 'Kopieren',
    share: 'Teilen',
    download: 'Herunterladen',
    success: 'Erfolg!',
    error: 'Fehler',
    confirm: 'Bestätigen',
    footer: {
      tagline: 'Mit Sicherheit und Privatsphäre im Fokus - weil Unwissenheit ein Segen sein kann',
    },
    header: {
      tagline:
        'Kurzlebiger Geheimnisaustausch mit Zero-Knowledge <aesLink>AES-256</aesLink> <e2eLink>Ende-zu-Ende-Verschlüsselung</e2eLink>',
    },
    time: {
      minute_one: '{{count}} Minute',
      minute_other: '{{count}} Minuten',
      hour_one: '{{count}} Stunde',
      hour_other: '{{count}} Stunden',
      day_one: '{{count}} Tag',
      day_other: '{{count}} Tage',
    },
  },
  landing: {
    title: 'Geheimnisse sicher teilen',
    subtitle:
      'Senden Sie Passwörter und sensible Informationen mit Zero-Knowledge Ende-zu-Ende-Verschlüsselung und automatischer Löschung',
    steps: {
      encrypt: {
        title: '1. Verschlüsseln',
        description: 'Ihr Geheimnis wird in Ihrem Browser verschlüsselt, bevor es gespeichert wird',
      },
      share: {
        title: '2. Teilen',
        description: 'Senden Sie den sicheren Link an Ihren gewünschten Empfänger',
      },
      autoDelete: {
        title: '3. Automatisch löschen',
        description: 'Das Geheimnis wird nach dem Anzeigen permanent gelöscht',
      },
    },
  },
  create: {
    form: {
      content: {
        label: 'Geheimer Inhalt',
        placeholder: 'Geben Sie hier Ihren geheimen Inhalt ein...',
        fileHint: 'Datei per Drag & Drop hinzufügen oder hier klicken',
        fileSelected: 'Datei ausgewählt: {{name}} ({{size}} KB)',
      },
      password: {
        label: 'Passwort',
        placeholder: 'Optional (aber empfohlen)',
      },
      ttl: {
        label: 'Gültigkeitsdauer',
        placeholder: 'Ablaufzeit auswählen',
      },
      burn: {
        label: 'Nach dem Lesen löschen',
        description: 'Garantiert, dass nur ein Empfänger auf das Geheimnis zugreifen kann',
      },
      advanced: {
        toggle: 'Erweiterte Konfiguration',
        ip: {
          label: 'IP/CIDR Positivliste',
          placeholder: '192.168.1.1, 10.0.0.0/24, etc.',
          description:
            'Zugriff auf bestimmte IP-Adressen oder CIDR-Blöcke beschränken (durch Kommas getrennt)',
        },
        readCount: {
          label: 'Lesezähler',
          description: 'Maximale Anzahl der Abrufe des Geheimnisses',
        },
      },
    },
    success: {
      title: 'Geheimnis erstellt!',
      description: {
        main: 'Ihr Geheimnis wurde erstellt und die URL wurde in die Zwischenablage kopiert',
        password: 'Teilen Sie die URL und das Passwort mit dem gewünschten Empfänger',
      },
      urlCopied: 'URL in die Zwischenablage kopiert',
      qrCode: {
        title: 'Geheimnis-URL QR-Code',
        description: 'Laden Sie den QR-Code der Geheimnis-URL herunter und teilen Sie ihn',
      },
      createAnother: 'Weiteres erstellen',
      deleteSecret: 'Geheimnis löschen',
      info: {
        expires: 'Läuft ab in: {{time}}',
        burnAfterReading: 'Geheimnis wird nach dem Anzeigen gelöscht',
        passwordProtected: 'Passwortgeschützt',
        ipRestrictions: 'IP-Beschränkung(en): {{ips}}',
        readCount: 'Lesezähler: {{count}}',
      },
    },
    errors: {
      contentRequired: 'Inhalt ist erforderlich',
      readCountWithBurn: 'Lesezähler kann nicht mit "Nach dem Lesen löschen" kombiniert werden',
      tooManyIps: 'Zu viele IP-Beschränkungen (maximal {{max}})',
      invalidIp: 'Ungültige IP-Adresse oder CIDR-Block: {{ip}}',
      uploadFailed: 'Verarbeitung des Inhalts fehlgeschlagen: {{error}}',
      deleteFailed: 'Löschen des Geheimnisses fehlgeschlagen: {{error}}',
      secretNotFound: 'Geheimnis nicht gefunden',
      unexpectedStatus: 'Unerwarteter Statuscode {{code}}',
    },
  },
  view: {
    notFound: {
      title: 'Geheimnis nicht gefunden',
      description: 'Dieses Geheimnis ist möglicherweise abgelaufen oder wurde gelöscht.',
      createNew: 'Neues Geheimnis erstellen',
    },
    password: {
      title: 'Passwort eingeben',
      placeholder: 'Geben Sie das Passwort ein',
      description: 'Dieses Geheimnis ist mit einem Passwort geschützt - fragen Sie den Absender',
      error: 'Falsches Passwort',
    },
    content: {
      fileShared: 'Eine Datei wurde mit Ihnen geteilt',
      downloadFile: 'Datei herunterladen',
      hideContent: 'Inhalt verbergen',
      showContent: 'Inhalt anzeigen',
      copyToClipboard: 'In die Zwischenablage kopieren',
      copiedToClipboard: 'Geheimnis in die Zwischenablage kopiert',
      clickToReveal: 'Klicken Sie auf das Augensymbol oben, um das Geheimnis anzuzeigen',
      passwordProtected:
        'Dieses Geheimnis ist passwortgeschützt. Klicken Sie, um das Passwort einzugeben.',
      clickToEnterPassword: 'Klicken Sie, um das Passwort einzugeben',
    },
    info: {
      burnedAfterReading:
        'Dieses Geheimnis wurde nach Ihrer Ansicht gelöscht und ist nach Verlassen der Seite nicht mehr verfügbar.',
      expiresIn: 'Läuft ab in {{time}}',
    },
    errors: {
      notFound: 'nicht gefunden',
      unexpectedStatus: 'unerwarteter Statuscode {{code}}',
    },
    actions: {
      viewSecret: 'Geheimnis anzeigen',
    },
  },
  about: {
    title: 'Über uns',
    intro:
      'crypt.fyi ist eine sichere, quelloffene Plattform für kurzlebigen Geheimnisaustausch, die es Ihnen ermöglicht, sensible Informationen sicher zu teilen. Ob Passwörter, API-Schlüssel oder vertrauliche Nachrichten - crypt.fyi stellt sicher, dass Ihre Daten privat bleiben und nach dem Zugriff automatisch verschwinden.',
    whyCryptFyi: {
      title: 'Warum crypt.fyi?',
      commonPractices: {
        title: 'Das Problem mit gängigen Praktiken',
        description:
          'Täglich werden sensible Informationen wie Passwörter, API-Schlüssel und private Daten über unsichere Kanäle geteilt:',
        problems: {
          email:
            'E-Mail - kann abgefangen, unbegrenzt gespeichert und unkontrolliert weitergeleitet werden',
          slack: 'Slack/Teams-Nachrichten - bleiben im Chat-Verlauf und Firmenprotokollen',
          sms: 'SMS/Textnachrichten - auf mehreren Geräten und Betreiberservern gespeichert',
          messaging: 'Instant Messaging - oft ohne angemessene Verschlüsselung und Datenlöschung',
        },
      },
      existingSolutions: {
        title: 'Bestehende Lösungen und ihre Grenzen',
        description:
          'Während es andere Tools in diesem Bereich gibt, hat jedes seine Einschränkungen:',
        limitations: {
          onePassword: '1Password - hervorragend für Team-Passwortverwaltung, aber',
          onePasswordLink: 'unterstützt keine externe Freigabe für Nicht-Benutzer',
          otherTools:
            'PrivateBin/PwPush/OneTimeSecret - ähnliche Kernfunktionalität, aber veraltete Benutzeroberflächen und Technologie-Stacks sowie fehlende',
          otherToolsConfigLink: 'Konfigurierbarkeit',
          otherToolsSecurityLink: 'Sicherheitsfunktionen',
        },
      },
      approach: {
        title: 'Der crypt.fyi-Ansatz',
        description:
          'crypt.fyi wurde entwickelt, um diese Herausforderungen zu bewältigen und dabei moderne Webtechnologien zu nutzen. Es kombiniert die Sicherheitsprinzipien bestehender Lösungen mit einer übersichtlichen, intuitiven Oberfläche und einem modernen Tech-Stack. Das Ergebnis ist ein Tool, das sowohl hochsicher als auch angenehm zu benutzen ist.',
      },
    },
    howItWorks: {
      title: 'Wie es funktioniert',
      steps: {
        encrypt: {
          title: '1. Verschlüsseln',
          description:
            'Ihr Geheimnis wird direkt in Ihrem Browser verschlüsselt, bevor es Ihr Gerät verlässt. Nur Personen mit dem speziellen Link, den Sie explizit geteilt haben, können es entschlüsseln.',
        },
        share: {
          title: '2. Teilen',
          description:
            'Teilen Sie den sicheren Link mit Ihrem gewünschten Empfänger. Der Link enthält alles Notwendige zur Entschlüsselung der Nachricht, sofern kein Passwort festgelegt wurde.',
        },
        burn: {
          title: '3. Nach dem Lesen löschen',
          description:
            'Nach dem Zugriff wird das Geheimnis, falls "Nach dem Lesen löschen" aktiviert ist, permanent von unseren Servern gelöscht. Keine Spuren bleiben zurück.',
        },
      },
    },
    security: {
      title: 'Sicherheitsimplementierung',
      encryption: {
        title: 'Ende-zu-Ende-Verschlüsselung',
        description:
          'Alle Geheimnisse werden vor der Übertragung in Ihrem Browser mit AES-256-GCM-Verschlüsselung verschlüsselt. Der Verschlüsselungsschlüssel verlässt nie Ihr Gerät und gewährleistet so echte Ende-zu-Ende-Verschlüsselung.',
        features: {
          key: 'Verschlüsselungsschlüssel wird aus einer kryptografisch sicheren Zufallsgenerierung abgeleitet',
          derivation: 'Schlüsselableitung verwendet PBKDF2 mit SHA-256',
          vector: 'Jedes Geheimnis hat einen einzigartigen Initialisierungsvektor (IV)',
        },
      },
      zeroKnowledge: {
        title: 'Zero-Knowledge-Architektur',
        description:
          'Unsere Server sehen nie Ihre unverschlüsselten Daten. Wir verwenden eine Zero-Knowledge-Architektur, bei der:',
        features: {
          clientSide: 'Alle Ver- und Entschlüsselung clientseitig erfolgt',
          storage: 'Server nur verschlüsselte Daten speichern',
          keys: 'Verschlüsselungsschlüssel über URL-Fragmente übertragen werden, die nie den Backend-API-Server erreichen',
        },
      },
      protection: {
        title: 'Datenschutz',
        description: 'Mehrere Sicherheitsebenen stellen sicher, dass Ihre Daten geschützt bleiben:',
        features: {
          encryption: 'Clientseitige Ver- und Entschlüsselung',
          tls: 'TLS-Verschlüsselung für alle API-Kommunikation',
          destruction: 'Automatische Geheimniszerstörung nach Zugriff',
          logging: 'Keine serverseitige Protokollierung sensibler Daten',
          password: 'Optionaler Passwortschutz für zusätzliche Sicherheit',
        },
      },
    },
    openSource: {
      title: 'Open Source',
      description:
        'crypt.fyi ist quelloffen und überprüfbar. Sie können unseren Code einsehen, Probleme melden und auf GitHub beitragen',
      cta: 'Jetzt ein Geheimnis erstellen',
    },
  },
};
