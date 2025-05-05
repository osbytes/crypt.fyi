import type { TranslationKeys } from '../types';

export const de: TranslationKeys = {
  common: {
    createSecret: 'Geheimnis erstellen',
    starOnGithub: 'Auf GitHub markieren',
    features: 'Funktionen',
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
    requestNewLanguage: 'Neue Sprache anfordern oder Übersetzungen korrigieren',
    footer: {
      tagline: 'Mit Sicherheit und Privatsphäre im Fokus - weil Unwissenheit ein Segen sein kann',
    },
    header: {
      tagline:
        'Kurzlebiger Datenaustausch mit Zero-Knowledge <aesLink>ML-KEM</aesLink> <e2eLink>Post-Quanten Ende-zu-Ende-Verschlüsselung</e2eLink>',
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
    title: 'Zero-Knowledge Geheimnis-Sharing',
    subtitle:
      'Sicheres einmaliges Teilen sensibler Informationen mit ML-KEM Post-Quanten Ende-zu-Ende-Verschlüsselung. Ihre Geheimnisse werden in Ihrem Browser verschlüsselt, sind für unsere Server nie zugänglich und werden nach dem Ansehen automatisch gelöscht.',
    features: {
      encryption: {
        title: 'ML-KEM Post-Quanten-Verschlüsselung',
        description:
          'State-of-the-art ML-KEM Post-Quanten-Verschlüsselung stellt sicher, dass Ihre Daten auch gegen zukünftige Quantencomputer-Bedrohungen sicher bleiben. Die gesamte Verschlüsselung erfolgt in Ihrem Browser vor der Übertragung.',
      },
      security: {
        title: 'Erweiterte Sicherheit',
        description:
          'Mehrere Schutzebenen einschließlich strikter Content Security Policy (CSP), Ratenbegrenzung und IP-Beschränkungen. Quantenresistente Verschlüsselung mit automatischer Löschung nach der Ansicht.',
      },
      zeroKnowledge: {
        title: 'Echte Zero-Knowledge-Architektur',
        description:
          'Unsere Server sehen Ihre unverschlüsselten Daten nie. Der Verschlüsselungsschlüssel verlässt Ihr Gerät nie, und die gesamte Entschlüsselung erfolgt in Ihrem Browser. Absolute Privatsphäre durch Ende-zu-Ende-Verschlüsselung.',
      },
      burn: {
        title: 'Einmaliges Geheimnis-Sharing',
        description: 'Geheimnisse werden nach der Ansicht automatisch gelöscht, sodass sie nur einmal zugänglich sind. Perfekt für sensible Informationen, die niemals bestehen bleiben sollten.',
      },
      failedAttempts: {
        title: 'Löschen nach fehlgeschlagenen Versuchen',
        description:
          'Geheimnisse werden nach einer Anzahl fehlgeschlagener Zugriffsversuche automatisch gelöscht für erhöhte Sicherheit',
      },
      expiration: {
        title: 'Auto-Ablauf',
        description:
          'Legen Sie benutzerdefinierte Ablaufzeiten fest, damit Geheimnisse nicht länger als nötig bestehen',
      },
      password: {
        title: 'Passwortschutz',
        description:
          'Fügen Sie eine zusätzliche Sicherheitsebene mit optionalem Passwortschutz hinzu',
      },
      files: {
        title: 'Datei-Sharing',
        description: 'Teilen Sie Dateien sicher mit einfacher Drag-and-Drop-Funktionalität',
      },
      webhooks: {
        title: 'Webhooks',
        description:
          'Erhalten Sie Benachrichtigungen, wenn Ihre Geheimnisse gelesen, gelöscht oder nicht gelesen werden können',
      },
      ipControl: {
        title: 'IP-Beschränkungen',
        description:
          'Steuern Sie den Zugriff durch Einschränkung der IP-Adressen oder CIDR-Bereiche',
      },
      readLimits: {
        title: 'Lesebeschränkungen',
        description:
          'Legen Sie maximale Ansichtszahlen fest, um zu begrenzen, wie oft ein Geheimnis abgerufen werden kann',
      },
      qrCode: {
        title: 'QR-Codes',
        description:
          'Generieren Sie QR-Codes für einfaches Teilen Ihrer geheimen URLs auf Mobilgeräten',
      },
      cli: {
        title: 'CLI-Tool',
        description:
          'Automatisieren Sie das Teilen von Geheimnissen mit unserer Kommandozeilen-Schnittstelle',
      },
      chromeExtension: {
        title: 'Chrome-Erweiterung',
        description:
          'Teilen Sie Geheimnisse direkt aus Ihrem Browser mit unserer Chrome-Erweiterung',
      },
      docker: {
        title: 'Docker-Support',
        description: 'Stellen Sie Ihre eigene Instanz mit unseren offiziellen Docker-Images bereit',
      },
    },
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
        toggle: 'erweiterte Konfiguration',
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
        failedAttempts: {
          label: 'Nach fehlgeschlagenen Versuchen löschen',
          description:
            'Geheimnis automatisch nach einer Anzahl fehlgeschlagener Zugriffsversuche löschen',
        },
        webhook: {
          label: 'Webhook',
          placeholder: 'https://example.com/webhook',
          description:
            'Webhook-URL, die aufgerufen wird, wenn das Geheimnis gelesen, gelöscht oder nicht gelesen werden kann (konfigurierbar, falls gesetzt)',
          read: 'Lesen',
          burn: 'Löschen',
          failureToReadPK: 'Fehler (Passwort oder Schlüssel)',
          failureToReadIP: 'Fehler (IP oder CIDR)',
          nameLabel: 'Name',
          namePlaceholder: 'Geben Sie einen Namen für diesen Webhook ein',
          nameDescription: 'Ein Name zur Identifizierung dieses Webhooks in Benachrichtigungen',
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
        burn: 'Geheimnis wird nach dem Lesen gelöscht',
        passwordProtected: 'Passwortgeschützt',
        ipRestrictions: 'IP-Beschränkung(en): {{ips}}',
        readCount: 'Leseanzahl: {{count}}',
        webhook: 'Webhook konfiguriert für: {{events}} ({{url}})',
        failureCount: 'Geheimnis wird nach {{count}} fehlgeschlagenen Versuchen gelöscht',
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
      webhookConfigInvalid:
        'Webhook-Konfiguration ist ungültig - mindestens ein Webhook-Ereignistyp ist erforderlich',
      fileSizeExceeded: 'Dateigröße überschreitet die maximal zulässige Größe',
      fileReadError: 'Fehler beim Lesen der Datei',
      fileReadAborted: 'Dateilesen wurde abgebrochen',
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
    title: 'Über',
    intro:
      'crypt.fyi ist eine sichere, Open-Source-Plattform mit Zero-Knowledge-Architektur, die es Ihnen ermöglicht, sensible Informationen sicher mit Post-Quanten Ende-zu-Ende-Verschlüsselung zu teilen. Ob Passwörter, API-Schlüssel oder vertrauliche Nachrichten - crypt.fyi stellt sicher, dass Ihre Daten privat bleiben, für unsere Server nie zugänglich sind und nach dem Zugriff automatisch gelöscht werden.',
    whyCryptFyi: {
      title: 'Warum crypt.fyi?',
      commonPractices: {
        title: 'Das Problem mit gängigen Praktiken',
        description:
          'Täglich werden sensible Informationen wie Passwörter, API-Schlüssel und private Daten über unsichere Kanäle im Klartext geteilt:',
        problems: {
          email: 'E-Mail - kann abgefangen, unbegrenzt gespeichert und unkontrolliert weitergeleitet werden',
          slack: 'Slack/Teams-Nachrichten - bleiben im Chatverlauf und Firmenprotokollen',
          sms: 'SMS/Textnachrichten - auf mehreren Geräten und Carrier-Servern gespeichert',
          messaging: 'Instant Messaging - oft ohne angemessene Verschlüsselung und Datenlöschung',
        },
      },
      existingSolutions: {
        title: 'Bestehende Lösungen und ihre Einschränkungen',
        description: 'Während es andere Tools in diesem Bereich gibt, hat jedes seine Einschränkungen:',
        limitations: {
          onePassword: '1Password - ausgezeichnet für Team-Passwortverwaltung, aber',
          onePasswordLink: 'unterstützt keine interne Freigabe für externe Nicht-Benutzer',
          otherTools:
            'PrivateBin/PwPush/OneTimeSecret - ähnliche Kernfunktionalität, aber veraltete Benutzeroberflächen und Technologie-Stacks, und oft fehlt',
          otherToolsConfigLink: 'Zero-Knowledge-Architektur',
          otherToolsSecurityLink: 'Post-Quanten-Verschlüsselung',
        },
      },
      approach: {
        title: 'Der crypt.fyi Ansatz',
        description:
          'crypt.fyi wurde entwickelt, um diese Herausforderungen zu bewältigen und dabei moderne Webtechnologien und Sicherheitsstandards zu nutzen. Wir kombinieren Zero-Knowledge-Architektur mit ML-KEM Post-Quanten-Verschlüsselung und stellen sicher, dass Ihre Daten privat und sicher bleiben. Das Ergebnis ist ein Tool, das sowohl hochsicher als auch benutzerfreundlich ist.',
      },
    },
    howItWorks: {
      title: 'Wie es funktioniert',
      steps: {
        encrypt: {
          title: '1. Verschlüsseln',
          description:
            'Ihr Geheimnis wird in Ihrem Browser mit ML-KEM Post-Quanten-Verschlüsselung verschlüsselt, bevor es Ihr Gerät verlässt. Die Verschlüsselung erfolgt vollständig clientseitig und gewährleistet Zero-Knowledge Ihrer Daten.',
        },
        share: {
          title: '2. Teilen',
          description:
            'Teilen Sie den sicheren Link mit Ihrem Empfänger. Der Link enthält alles, was zum Entschlüsseln der Nachricht benötigt wird, aber unsere Server sehen den unverschlüsselten Inhalt nie.',
        },
        burn: {
          title: '3. Nach dem Lesen löschen',
          description:
            'Nach dem Zugriff wird das Geheimnis, wenn "Nach dem Lesen löschen" aktiviert ist, dauerhaft von unseren Servern gelöscht. Keine Spuren bleiben zurück, was vollständiges Zero-Knowledge Ihrer Daten gewährleistet.',
        },
      },
    },
    security: {
      title: 'Sicherheitsimplementierung',
      encryption: {
        title: 'Zero-Knowledge Post-Quanten-Verschlüsselung',
        description:
          'Alle Geheimnisse werden mit ML-KEM Post-Quanten-Verschlüsselung in Ihrem Browser verschlüsselt, bevor sie übertragen werden. Der Verschlüsselungsschlüssel verlässt Ihr Gerät nie, was echte Zero-Knowledge Ende-zu-Ende-Verschlüsselung gewährleistet.',
        features: {
          key: 'Der Verschlüsselungsschlüssel wird aus einer kryptographisch sicheren Zufallsgenerierung abgeleitet',
          derivation: 'Schlüsselableitung verwendet PBKDF2 mit SHA-256',
          vector: 'Jedes Geheimnis hat einen eindeutigen Initialisierungsvektor (IV)',
        },
      },
      zeroKnowledge: {
        title: 'Echte Zero-Knowledge-Architektur',
        description:
          'Unsere Server sehen nie Ihre unverschlüsselten Daten. Wir verwenden eine Zero-Knowledge-Architektur, bei der:',
        features: {
          clientSide: 'Alle Verschlüsselung/Entschlüsselung erfolgt clientseitig in Ihrem Browser',
          storage: 'Server speichern nur verschlüsselte Daten, die sie nicht entschlüsseln können',
          keys: 'Verschlüsselungsschlüssel werden über URL-Fragmente übertragen, die nie den Backend-API-Server erreichen',
        },
      },
      protection: {
        title: 'Datenschutz',
        description: 'Mehrere Sicherheitsebenen stellen sicher, dass Ihre Daten geschützt bleiben:',
        features: {
          encryption:
            'Alle Verschlüsselung/Entschlüsselung erfolgt in Ihrem Browser mit ML-KEM Post-Quanten-Verschlüsselung',
          tls: 'TLS-Verschlüsselung für alle API-Kommunikation',
          destruction: 'Automatische Geheimnislöschung nach Zugriff',
          logging: 'Keine serverseitige Protokollierung sensibler Daten',
          password: 'Optionale Passwortschutz für zusätzliche Sicherheit',
        },
      },
    },
    openSource: {
      title: 'Open Source',
      description:
        'crypt.fyi ist Open Source und überprüfbar. Sie können unsere Zero-Knowledge-Implementierung, Post-Quanten-Verschlüsselung überprüfen und auf',
    },
  },
  privacy: {
    title: 'Datenschutzerklärung',
    intro:
      'Bei crypt.fyi nehmen wir Ihre Privatsphäre ernst. Diese Datenschutzerklärung erläutert, wie wir mit Ihren Informationen umgehen, wenn Sie unsere Zero-Knowledge, Ende-zu-Ende-verschlüsselte Plattform für den Austausch von Geheimnissen nutzen.',
    doNotCollect: {
      title: 'Informationen, die wir nicht sammeln',
      description:
        'Aufgrund unserer Zero-Knowledge-Architektur sind wir technisch nicht in der Lage, auf Folgendes zuzugreifen:',
      items: {
        secrets: 'Ihre unverschlüsselten Geheimnisse oder Dateien',
        keys: 'Verschlüsselungsschlüssel oder Passwörter',
        urls: 'URL-Fragmente mit Entschlüsselungsinformationen',
        content: 'Den Inhalt Ihrer verschlüsselten Daten',
        recipients: 'Informationen über die Empfänger Ihrer Geheimnisse',
      },
    },
    collect: {
      title: 'Informationen, die wir sammeln',
      description: 'Wir sammeln und speichern nur die minimal erforderlichen Informationen:',
      items: {
        encrypted: 'Verschlüsselte Daten (die wir nicht entschlüsseln können)',
        hashes:
          'Schlüssel-Verifizierungs-Hashes (verwendet zur Überprüfung der Zugriffsrechte ohne die tatsächlichen Schlüssel zu kennen)',
        metadata:
          'Grundlegende Anfrage-Metadaten (IP-Adressen, Zeitstempel) für Ratenbegrenzung und Missbrauchsprävention',
        webhooks:
          'Webhook-URLs, falls angegeben (für Benachrichtigungen über Zugriff und Löschung von Geheimnissen)',
      },
      note: 'Alle gespeicherten Daten werden nach Ablauf oder beim Zugriff automatisch gelöscht (wenn "Nach dem Lesen löschen" aktiviert ist).',
    },
    usage: {
      title: 'Wie wir Informationen verwenden',
      description: 'Wir verwenden die gesammelten Informationen nur für:',
      items: {
        transmission: 'Ermöglichung der sicheren Übertragung Ihrer verschlüsselten Geheimnisse',
        rateLimits: 'Durchsetzung von Ratenbegrenzungen zur Verhinderung von Missbrauch',
        ipControl: 'Implementierung von IP/CIDR-Whitelisting, wenn konfiguriert',
        notifications: 'Senden von Webhook-Benachrichtigungen, wenn aktiviert',
        security: 'Aufrechterhaltung der Systemsicherheit und Verhinderung unbefugter Zugriffe',
      },
    },
    security: {
      title: 'Datenspeicherung und Sicherheit',
      description: 'Unsere Sicherheitsmaßnahmen umfassen:',
      items: {
        encryption:
          'Alle Ver- und Entschlüsselung erfolgt in Ihrem Browser unter Verwendung von ML-KEM Post-Quanten-Verschlüsselung',
        csp: 'Strikte Content Security Policy (CSP) zur Verhinderung von XSS-Angriffen',
        tls: 'TLS-Verschlüsselung für alle API-Kommunikation',
        expiration: 'Automatischer Datenablauf mit konfigurierbarer Lebensdauer (TTL)',
        deletion: 'Sichere Datenlöschung nach Zugriff oder Ablauf',
        storage: 'Keine dauerhafte Speicherung sensibler Informationen',
      },
    },
    thirdParty: {
      title: 'Drittanbieterdienste',
      description: 'Wir teilen keine Informationen mit Dritten, außer in den folgenden Fällen:',
      items: {
        webhooks:
          'Wenn Sie Webhooks aktivieren, senden wir Benachrichtigungen an die von Ihnen angegebenen URLs über Zugriff und Löschung von Geheimnissen',
        infrastructure:
          'Infrastrukturanbieter, die unsere Dienste hosten (die nur verschlüsselte Daten sehen, die sie nicht entschlüsseln können)',
      },
    },
    rights: {
      title: 'Ihre Rechte und Wahlmöglichkeiten',
      description: 'Sie haben die Kontrolle über Ihre Daten:',
      items: {
        expiration: 'Wählen Sie benutzerdefinierte Ablauffristen für Ihre Geheimnisse',
        burn: 'Aktivieren Sie "Nach dem Lesen löschen" für sofortige Löschung nach dem Zugriff',
        password: 'Fügen Sie Passwortschutz für zusätzliche Sicherheit hinzu',
        ip: 'Konfigurieren Sie IP-Beschränkungen zur Zugriffskontrolle',
        readLimits: 'Legen Sie Lesebeschränkungen fest',
      },
    },
    changes: {
      title: 'Änderungen dieser Richtlinie',
      description:
        'Wir können diese Datenschutzerklärung von Zeit zu Zeit aktualisieren. Wir werden die Benutzer über wesentliche Änderungen informieren, indem wir die neue Datenschutzerklärung auf dieser Seite veröffentlichen. Wir empfehlen Ihnen, diese Datenschutzerklärung regelmäßig auf Änderungen zu überprüfen.',
    },
    contact: {
      title: 'Kontakt',
      description:
        'Wenn Sie Fragen zu dieser Datenschutzerklärung haben, können Sie uns über unsere',
    },
  },
};
