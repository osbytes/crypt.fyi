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
      tagline: 'Mit Sicherheit und Privatsphäre im Fokus, weil Unwissenheit ein Segen sein kann',
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
      'Im Browser verschlüsseln. Einmal teilen. Für immer weg. Post-Quanten Ende-zu-Ende-Verschlüsselung — unsere Server sehen Ihre Geheimnisse nie.',
    pillars: {
      title: 'Für Vertrauen gebaut',
      zeroKnowledge: {
        title: 'Echtes Zero-Knowledge',
        description:
          'Verschlüsselungsschlüssel verlassen Ihr Gerät nie. Die Entschlüsselung erfolgt nur im Browser des Empfängers — der Server sieht niemals Klartext.',
      },
      ephemeral: {
        title: 'Standardmäßig flüchtig',
        description:
          'Löschen nach dem Lesen, individuelle TTLs und Leselimits, damit sensible Daten nicht länger als nötig bestehen.',
      },
      defense: {
        title: 'Mehrschichtiger Schutz',
        description:
          'ML-KEM Post-Quanten-Verschlüsselung, strikte CSP, Ratenbegrenzung und optionale IP-Allow-Lists — Schutz in Schichten, nicht als einzelne Checkbox.',
      },
      open: {
        title: 'Offen und prüfbar',
        description:
          'Vollständig Open Source und für Self-Hosting ausgelegt. Code prüfen, eigene Instanz betreiben oder mitwirken.',
      },
    },
    alsoIncludes: {
      label: 'Außerdem',
      password: 'Passwortschutz',
      files: 'Datei-Sharing',
      webhooks: 'Webhooks',
      qrCode: 'QR-Codes',
      ipControl: 'IP-Allow-Lists',
      readLimits: 'Leselimits',
    },
    selfHost: {
      title: 'Eigene Instanz betreiben',
      description:
        'Denselben Zero-Knowledge-Stack auf Ihrer Infrastruktur bereitstellen — mit einem Klick auf Railway oder per Docker Compose überall.',
      deployOnRailway: 'Auf Railway bereitstellen',
      dockerCompose: 'Docker Compose',
    },
    ecosystem: {
      cli: 'CLI',
      chromeExtension: 'Chrome-Erweiterung',
      github: 'GitHub',
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
        fileHint: 'Datei per Drag-and-Drop oder Klick hinzufügen (max. {{max}})',
        fileSelected: 'Datei ausgewählt: {{name}} ({{size}} KB)',
        dropFile: 'Datei hier ablegen',
        invalidFileType: 'Ungültiger Dateityp',
      },
      uploadProgress: 'Upload-Fortschritt',
      password: {
        label: 'Passwort',
        placeholder: 'Optional (aber empfohlen)',
        placeholderRequired: 'Passwort eingeben (mindestens {{min}} Zeichen)',
      },
      ttl: {
        label: 'Gültigkeitsdauer',
        placeholder: 'Ablaufzeit auswählen',
      },
      burn: {
        label: 'Nach dem Lesen löschen',
        description:
          'Garantiert, dass das Geheimnis nur einmal gelesen werden kann — von der ersten Person, die den Link öffnet',
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
        main: 'Ihr Geheimnis wurde erstellt. Wählen Sie unten eine Freigabeoption aus.',
        password: 'Senden Sie das Passwort über einen separaten Kanal.',
        separateKey:
          'Senden Sie für eine getrennte Übermittlung die URL ohne Schlüssel und den Entschlüsselungsschlüssel über verschiedene Kanäle.',
      },
      combinedUrl: 'Komplette URL (mit Schlüssel)',
      keylessUrl: 'URL ohne Schlüssel',
      decryptionKey: 'Entschlüsselungsschlüssel',
      urlCopied: 'URL in die Zwischenablage kopiert',
      keyCopied: 'Entschlüsselungsschlüssel in die Zwischenablage kopiert',
      secretDeleted: 'Geheimnis gelöscht',
      qrDownloaded: 'QR-Code heruntergeladen',
      qrDownloadFailed: 'QR-Code konnte nicht heruntergeladen werden: {{error}}',
      qrCode: {
        title: 'Geheimnis-URL QR-Code',
        description: 'Laden Sie den QR-Code der Geheimnis-URL herunter und teilen Sie ihn',
      },
      actions: {
        showUrl: 'Geheimnis-URL anzeigen',
        hideUrl: 'Geheimnis-URL ausblenden',
        showKey: 'Entschlüsselungsschlüssel anzeigen',
        hideKey: 'Entschlüsselungsschlüssel ausblenden',
        shareUrl: 'Geheimnis-URL teilen',
        shareKey: 'Entschlüsselungsschlüssel teilen',
        copyUrl: 'Geheimnis-URL kopieren',
        copyKey: 'Entschlüsselungsschlüssel kopieren',
        showQr: 'QR-Code der kompletten URL anzeigen',
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
      passwordMinLength: 'Passwort muss mindestens {{min}} Zeichen lang sein',
      passwordTooSimple: 'Passwort ist zu einfach',
      readCountWithBurn: 'Lesezähler kann nicht mit "Nach dem Lesen löschen" kombiniert werden',
      tooManyIps: 'Zu viele IP-Beschränkungen (maximal {{max}})',
      invalidIp: 'Ungültige IP-Adresse oder CIDR-Block: {{ip}}',
      uploadFailed: 'Verarbeitung des Inhalts fehlgeschlagen: {{error}}',
      deleteFailed: 'Löschen des Geheimnisses fehlgeschlagen: {{error}}',
      secretNotFound: 'Geheimnis nicht gefunden',
      unexpectedStatus: 'Unerwarteter Statuscode {{code}}',
      webhookConfigInvalid:
        'Webhook-Konfiguration ist ungültig - mindestens ein Webhook-Ereignistyp ist erforderlich',
      fileSizeExceeded: 'Datei ist zu groß. Maximale Größe ist {{max}}.',
      payloadTooLarge:
        'Dieses Geheimnis ist zu groß für diesen Server. Versuche eine kleinere Datei.',
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
    invalidLink: {
      title: 'Dieser Link ist ungültig',
      description:
        'Der Link ist unvollständig oder wurde bei der Übertragung verändert, sodass das Geheimnis nicht entschlüsselt werden kann. Bitten Sie den Absender, den vollständigen Link erneut zu senden.',
      createNew: 'Neues Geheimnis erstellen',
    },
    connectionError: {
      title: 'Server nicht erreichbar',
      description:
        'Das Geheimnis existiert möglicherweise noch. Überprüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
      tryAgain: 'Erneut versuchen',
    },
    rateLimit: {
      title: 'Zu viele Anfragen',
      description:
        'Sie haben zu viele Anfragen gestellt. Warten Sie einen Moment und versuchen Sie es erneut.',
      tryAgain: 'Erneut versuchen',
    },
    password: {
      title: 'Passwort eingeben',
      label: 'Passwort',
      placeholder: 'Geben Sie das Passwort ein',
      description: 'Dieses Geheimnis ist mit einem Passwort geschützt - fragen Sie den Absender',
      error: 'Falscher Entschlüsselungsschlüssel oder falsches Passwort',
      required: 'Geben Sie ein Passwort ein.',
      show: 'Passwort anzeigen',
      hide: 'Passwort ausblenden',
    },
    key: {
      title: 'Entschlüsselungsschlüssel eingeben',
      label: 'Entschlüsselungsschlüssel',
      placeholder: 'Vom Absender erhaltenen Schlüssel eingeben',
      description:
        'Bitten Sie den Absender über einen separaten Kanal um den Entschlüsselungsschlüssel. Der Schlüssel wird nur in diesem Browser verwendet.',
      required: 'Geben Sie einen Entschlüsselungsschlüssel ein.',
      error:
        'Dieser Entschlüsselungsschlüssel konnte das Geheimnis nicht öffnen. Prüfen Sie den Schlüssel und versuchen Sie es erneut.',
      show: 'Entschlüsselungsschlüssel anzeigen',
      hide: 'Entschlüsselungsschlüssel ausblenden',
      change: 'Anderen Schlüssel eingeben',
      submit: 'Geheimnis entsperren',
    },
    credentials: {
      title: 'Geheimnis entsperren',
      description:
        'Geben Sie den vom Absender erhaltenen Entschlüsselungsschlüssel und das Passwort ein. Beides wird nur in diesem Browser verwendet.',
      submit: 'Geheimnis entsperren',
    },
    legacyKey: {
      warning:
        'Dieser Link wurde mit einem veralteten Client erstellt, der den Entschlüsselungsschlüssel in der Abfragezeichenfolge speichert. Bitten Sie den Absender um ein Upgrade, damit zukünftige Links den Schlüssel aus Serverprotokollen fernhalten.',
    },
    content: {
      fileShared: 'Eine Datei wurde mit Ihnen geteilt',
      downloadFile: 'Datei herunterladen',
      downloadComplete: 'Download abgeschlossen',
      stillAvailable:
        'Dieses Geheimnis bleibt verfügbar, bis es abläuft oder sein Leselimit erreicht ist.',
      streamedDescription:
        'Diese Datei wird in deinem Browser entschlüsselt und direkt auf die Festplatte geschrieben. Wähle einen Speicherort.',
      downloadProgress: 'Download-Fortschritt',
      hideContent: 'Inhalt verbergen',
      showContent: 'Inhalt anzeigen',
      copyToClipboard: 'In die Zwischenablage kopieren',
      copiedToClipboard: 'Geheimnis in die Zwischenablage kopiert',
      clickToReveal: 'Klicken Sie auf das Augensymbol oben, um das Geheimnis anzuzeigen',
      passwordProtected:
        'Dieses Geheimnis ist passwortgeschützt. Klicken Sie, um das Passwort einzugeben.',
      ariaLabel: 'Geheimer Inhalt',
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
    what: {
      description:
        'crypt.fyi ist ein Zero-Knowledge-Weg, sensible Informationen — Passwörter, API-Schlüssel, Dateien — per Link zu teilen. Die Verschlüsselung erfolgt in Ihrem Browser, unsere Server sehen nie den Klartext, und Geheimnisse können nach dem Lesen verschwinden.',
      traditionalTitle: 'Warum nicht einfach per E-Mail oder SMS?',
      traditionalDescription:
        'E-Mail, SMS, Slack und Chat behalten Kopien: in Postfächern, Nachrichtenverläufen, Anbieter-Logs und auf jedem synchronisierten Gerät. Sobald Sie ein Passwort in diese Kanäle einfügen, verlieren Sie die Kontrolle darüber, wer es später finden kann. crypt.fyi ist für eine bewusste, einmalige Übergabe — Link teilen, optional Passwort oder IP-Allow-List setzen, und das Geheimnis verschwinden lassen, wenn es erledigt ist.',
    },
    letter: {
      title: 'Eine Notiz vom Autor',
      p1: 'Ich habe crypt.fyi gebaut, weil die Tools, nach denen ich bereits griff, immer wieder zu kurz kamen, wenn ich etwas Sensibles teilen musste — besonders mit jemandem außerhalb meines Passwort-Managers — mit Kontrollen, die zu meiner tatsächlichen Arbeit passten.',
      p2: 'Bestehende Lösungen vermissten oft die UX-Details, die im Alltag zählen: umfangreiche Einschränkungen wie IP-Allow-Lists, Leselimits, Löschen nach fehlgeschlagenen Versuchen und Webhooks; ein CLI und eine Browser-Erweiterung; gespeicherte und vorgefüllte Konfiguration. Technisch lagen manche auch hinter modernen Verschlüsselungsstandards zurück, oder ihnen fehlte echte atomare Read-and-Burn-Logik, sodass ein Geheimnis nicht per Race Condition mehrfach gelesen werden konnte.',
      p3: 'Also habe ich etwas Neues gebaut: Open Source, self-hostbar und klar in den Kryptografie- und Kontrollentscheidungen, die ich für mich selbst wollte.',
      signOff: '— Dillon',
    },
    openSource: {
      description:
        'crypt.fyi ist Open Source und prüfbar. Sie können die Implementierung einsehen, selbst hosten oder mitwirken auf',
    },
    technical: {
      prompt: 'Mehr technische Details?',
      specLink: 'Zur Protokollspezifikation',
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
