import type { TranslationKeys } from '../types';

export const es: TranslationKeys = {
  common: {
    createSecret: 'Crear Secreto',
    starOnGithub: 'Estrella en GitHub',
    features: 'Características',
    learnMore: 'Más Información',
    loading: 'Cargando...',
    create: 'Crear',
    delete: 'Eliminar',
    copy: 'Copiar',
    share: 'Compartir',
    download: 'Descargar',
    success: '¡Éxito!',
    error: 'Error',
    confirm: 'Confirmar',
    requestNewLanguage: 'Solicitar nuevo o corregir traducciones',
    footer: {
      tagline:
        'Construido con seguridad y privacidad en mente, porque la ignorancia puede ser una bendición',
    },
    time: {
      minute_one: '{{count}} minuto',
      minute_other: '{{count}} minutos',
      hour_one: '{{count}} hora',
      hour_other: '{{count}} horas',
      day_one: '{{count}} día',
      day_other: '{{count}} días',
    },
  },
  landing: {
    title: 'Compartir Secretos de Conocimiento Cero',
    subtitle:
      'Cifra en tu navegador. Comparte una vez. Desaparece para siempre. Cifrado post-cuántico de extremo a extremo — nuestros servidores nunca ven tus secretos.',
    pillars: {
      title: 'Diseñado para la confianza',
      zeroKnowledge: {
        title: 'Verdadero conocimiento cero',
        description:
          'Las claves de cifrado nunca salen de tu dispositivo. El descifrado ocurre solo en el navegador del destinatario — el servidor nunca ve texto plano.',
      },
      ephemeral: {
        title: 'Efímero por defecto',
        description:
          'Destrucción tras la lectura, TTL personalizados y límites de lectura para que los datos sensibles no permanezcan más de lo necesario.',
      },
      defense: {
        title: 'Defensa en profundidad',
        description:
          'Cifrado post-cuántico ML-KEM, CSP estricta, limitación de velocidad y listas de IP opcionales — protección en capas, no una sola casilla.',
      },
      open: {
        title: 'Abierto y auditable',
        description:
          'Totalmente de código abierto y pensado para autoalojamiento. Revisa el código, ejecuta tu propia instancia o contribuye.',
      },
    },
    alsoIncludes: {
      label: 'También incluye',
      password: 'protección con contraseña',
      files: 'compartir archivos',
      webhooks: 'webhooks',
      qrCode: 'códigos QR',
      ipControl: 'listas de IP',
      readLimits: 'límites de lectura',
    },
    selfHost: {
      title: 'Ejecuta tu propia instancia',
      description:
        'Despliega el mismo stack de conocimiento cero en tu infraestructura — un clic en Railway, o Docker Compose en cualquier lugar.',
      deployOnRailway: 'Desplegar en Railway',
      dockerCompose: 'Docker Compose',
    },
    ecosystem: {
      cli: 'CLI',
      chromeExtension: 'Extensión de Chrome',
      github: 'GitHub',
    },
    steps: {
      encrypt: {
        title: '1. Cifrar',
        description: 'Tu secreto se cifra en tu navegador antes de ser almacenado',
      },
      share: {
        title: '2. Compartir',
        description: 'Envía el enlace seguro a tu destinatario',
      },
      autoDelete: {
        title: '3. Auto-Eliminación',
        description: 'El secreto se elimina permanentemente después de ser visto',
      },
    },
  },
  create: {
    form: {
      content: {
        label: 'Contenido secreto',
        placeholder: 'Ingresa tu contenido secreto aquí...',
        fileHint: 'añade un archivo arrastrándolo o haciendo clic aquí (máx. {{max}})',
        fileSelected: 'Archivo seleccionado: {{name}} ({{size}} KB)',
        dropFile: 'Suelta el archivo aquí',
        invalidFileType: 'Tipo de archivo no válido',
      },
      uploadProgress: 'Progreso de subida',
      password: {
        label: 'Contraseña',
        placeholder: 'Opcional (pero recomendado)',
        placeholderRequired: 'Ingresa una contraseña (mínimo {{min}} caracteres)',
      },
      ttl: {
        label: 'Tiempo de vida',
        placeholder: 'Selecciona el tiempo de expiración',
      },
      burn: {
        label: 'Destruir después de leer',
        description:
          'Garantiza que el secreto solo se pueda leer una vez — por la primera persona que abra el enlace',
      },
      advanced: {
        toggle: 'configuración avanzada',
        ip: {
          label: 'Lista de permitidos IP/CIDR',
          placeholder: '192.168.1.1, 10.0.0.0/24, etc.',
          description:
            'Restringir el acceso a direcciones IP específicas o bloques CIDR (separados por comas)',
        },
        readCount: {
          label: 'Contador de lecturas',
          description: 'Número máximo de veces que se puede leer el secreto',
        },
        failedAttempts: {
          label: 'Eliminar después de intentos fallidos',
          description:
            'Eliminar automáticamente el secreto después de varios intentos fallidos de acceso',
        },
        webhook: {
          label: 'Webhook',
          placeholder: 'https://example.com/webhook',
          description:
            'URL del webhook a llamar cuando el secreto es leído, destruido o falla al leer (configurable, si se establece)',
          read: 'Lectura',
          burn: 'Destrucción',
          failureToReadPK: 'Fallo (contraseña o clave)',
          failureToReadIP: 'Fallo (IP o CIDR)',
          nameLabel: 'Nombre',
          namePlaceholder: 'Ingrese un nombre para este webhook',
          nameDescription: 'Un nombre para identificar este webhook en las notificaciones',
        },
      },
    },
    success: {
      title: '¡Secreto Creado!',
      description: {
        main: 'Tu secreto ha sido creado. Elige una opción para compartirlo.',
        password: 'Envía la contraseña por un canal separado.',
        separateKey:
          'Para enviarlos por separado, comparte la URL sin clave y la clave de descifrado por canales diferentes.',
      },
      combinedUrl: 'URL completa (incluye la clave)',
      keylessUrl: 'URL sin clave',
      decryptionKey: 'Clave de descifrado',
      urlCopied: 'URL copiada al portapapeles',
      keyCopied: 'Clave de descifrado copiada al portapapeles',
      secretDeleted: 'Secreto eliminado',
      qrDownloaded: 'Código QR descargado',
      qrDownloadFailed: 'Error al descargar el código QR: {{error}}',
      qrCode: {
        title: 'Código QR de la URL del Secreto',
        description: 'Descarga y comparte el código QR de la URL del secreto',
      },
      actions: {
        showUrl: 'Mostrar la URL del secreto',
        hideUrl: 'Ocultar la URL del secreto',
        showKey: 'Mostrar la clave de descifrado',
        hideKey: 'Ocultar la clave de descifrado',
        shareUrl: 'Compartir la URL del secreto',
        shareKey: 'Compartir la clave de descifrado',
        copyUrl: 'Copiar la URL del secreto',
        copyKey: 'Copiar la clave de descifrado',
        showQr: 'Mostrar el código QR de la URL completa',
      },
      createAnother: 'Crear Otro',
      deleteSecret: 'Eliminar Secreto',
      info: {
        expires: 'Expira en: {{time}}',
        burn: 'El secreto se eliminará después de ser visto',
        passwordProtected: 'Protegido con contraseña',
        ipRestrictions: 'Restricción(es) de IP: {{ips}}',
        readCount: 'Número de lecturas: {{count}}',
        webhook: 'Webhook configurado para: {{events}} ({{url}})',
        failureCount: 'El secreto se eliminará después de {{count}} intentos fallidos',
      },
    },
    errors: {
      contentRequired: 'El contenido es requerido',
      passwordMinLength: 'La contraseña debe tener al menos {{min}} caracteres',
      passwordTooSimple: 'La contraseña es demasiado simple',
      readCountWithBurn: 'El contador de lecturas no se puede usar con destruir después de leer',
      tooManyIps: 'Demasiadas restricciones de IP (máximo {{max}})',
      invalidIp: 'Dirección IP o bloque CIDR inválido: {{ip}}',
      uploadFailed: 'Error al procesar el contenido cargado: {{error}}',
      deleteFailed: 'Error al eliminar el secreto: {{error}}',
      secretNotFound: 'secreto no encontrado',
      unexpectedStatus: 'código de estado inesperado {{code}}',
      webhookConfigInvalid:
        'La configuración del webhook no es válida: se requiere al menos un tipo de evento de webhook',
      fileSizeExceeded: 'El archivo es demasiado grande. El tamaño máximo es {{max}}.',
      payloadTooLarge:
        'Este secreto es demasiado grande para este servidor. Prueba con un archivo más pequeño.',
      fileReadError: 'Error al leer el archivo',
      fileReadAborted: 'La lectura del archivo fue interrumpida',
    },
  },
  view: {
    notFound: {
      title: 'Secreto No Encontrado',
      description: 'Este secreto puede haber expirado o sido eliminado.',
      createNew: 'Crear Nuevo Secreto',
    },
    invalidLink: {
      title: 'Este enlace no es válido',
      description:
        'El enlace está incompleto o fue alterado durante el envío, por lo que el secreto no se puede descifrar. Pide al remitente que comparta de nuevo el enlace completo.',
      createNew: 'Crear Nuevo Secreto',
    },
    connectionError: {
      title: 'No se pudo conectar con el servidor',
      description: 'El secreto puede seguir existiendo. Revisa tu conexión e inténtalo de nuevo.',
      tryAgain: 'Intentar de nuevo',
    },
    rateLimit: {
      title: 'Demasiadas solicitudes',
      description: 'Has realizado demasiadas solicitudes. Espera un momento e inténtalo de nuevo.',
      tryAgain: 'Intentar de nuevo',
    },
    password: {
      title: 'Ingresar Contraseña',
      label: 'Contraseña',
      placeholder: 'Ingresa la contraseña',
      description: 'Este secreto está protegido con una contraseña - solicítala al remitente',
      error: 'La clave de descifrado o la contraseña es incorrecta',
      required: 'Ingresa una contraseña.',
      show: 'Mostrar la contraseña',
      hide: 'Ocultar la contraseña',
    },
    key: {
      title: 'Ingresa la clave de descifrado',
      label: 'Clave de descifrado',
      placeholder: 'Ingresa la clave proporcionada por el remitente',
      description:
        'Pide al remitente la clave de descifrado por un canal separado. La clave se usa solo en este navegador.',
      required: 'Ingresa una clave de descifrado.',
      error:
        'Esa clave de descifrado no pudo desbloquear el secreto. Comprueba la clave e inténtalo de nuevo.',
      show: 'Mostrar la clave de descifrado',
      hide: 'Ocultar la clave de descifrado',
      change: 'Ingresar otra clave',
      submit: 'Desbloquear secreto',
    },
    credentials: {
      title: 'Desbloquear secreto',
      description:
        'Ingresa la clave de descifrado y la contraseña proporcionadas por el remitente. Ambas se usan solo en este navegador.',
      submit: 'Desbloquear secreto',
    },
    legacyKey: {
      warning:
        'Este enlace se creó con un cliente desactualizado que pone la clave de descifrado en la cadena de consulta. Pide al remitente que actualice para que los enlaces futuros mantengan la clave fuera de los registros del servidor.',
    },
    content: {
      fileShared: 'Se ha compartido un archivo contigo',
      downloadFile: 'Descargar Archivo',
      downloadComplete: 'Descarga completada',
      stillAvailable:
        'Este secreto sigue disponible hasta que caduque o alcance su límite de lecturas.',
      streamedDescription:
        'Este archivo se descifra en tu navegador y se escribe directamente en el disco. Elige dónde guardarlo.',
      downloadProgress: 'Progreso de descarga',
      hideContent: 'Ocultar contenido',
      showContent: 'Mostrar contenido',
      copyToClipboard: 'Copiar al portapapeles',
      copiedToClipboard: 'Secreto copiado al portapapeles',
      clickToReveal: 'Haz clic en el ícono del ojo arriba para revelar el secreto',
      passwordProtected:
        'Este secreto está protegido con contraseña. Haz clic para ingresar la contraseña.',
      ariaLabel: 'Contenido secreto',
    },
    info: {
      burnedAfterReading:
        'Este secreto fue eliminado después de tu visualización y ya no estará disponible al salir de la página.',
      expiresIn: 'Expira {{time}}',
    },
    errors: {
      notFound: 'no encontrado',
      unexpectedStatus: 'código de estado inesperado {{code}}',
    },
    actions: {
      viewSecret: 'Ver Secreto',
    },
  },
  about: {
    title: 'Acerca de',
    what: {
      description:
        'crypt.fyi es una forma de conocimiento cero de compartir información sensible — contraseñas, claves API, archivos — con un enlace. El cifrado ocurre en tu navegador, nuestros servidores nunca ven el texto plano, y los secretos pueden desaparecer después de ser leídos.',
      traditionalTitle: '¿Por qué no enviarlo por correo o mensaje?',
      traditionalDescription:
        'El correo, SMS, Slack y el chat conservan copias: en bandejas de entrada, historiales, registros de operadores y en cada dispositivo sincronizado. Una vez pegas una contraseña en esos canales, pierdes el control sobre quién puede encontrarla después. crypt.fyi es para una entrega deliberada y de un solo uso — comparte el enlace, opcionalmente añade una contraseña o lista de IP, y deja que el secreto desaparezca cuando termine.',
    },
    letter: {
      title: 'Una nota del autor',
      p1: 'Construí crypt.fyi porque las herramientas a las que ya recurría se quedaban cortas cuando necesitaba compartir algo sensible — especialmente con alguien fuera de mi gestor de contraseñas — con controles que encajaran con cómo trabajo de verdad.',
      p2: 'Los incumbentes a menudo carecían de los detalles de UX que importan día a día: restricciones amplias como listas de IP, límites de lectura, destrucción tras intentos fallidos y webhooks; una CLI y extensión de navegador; configuración guardada y rellenada de antemano. Técnicamente, algunos también iban por detrás en estándares modernos de cifrado, o carecían de un verdadero read-and-burn atómico para que un secreto no pudiera leerse varias veces por una condición de carrera.',
      p3: 'Así que construí algo nuevo: de código abierto, autoalojable y con opiniones claras sobre la criptografía y los controles que yo mismo quería.',
      signOff: '— Dillon',
    },
    openSource: {
      description:
        'crypt.fyi es de código abierto y auditable. Puedes revisar la implementación, autoalojarlo o contribuir en',
    },
    technical: {
      prompt: '¿Quieres ir más a fondo?',
      specLink: 'Lee la especificación del protocolo',
    },
  },
  privacy: {
    title: 'Política de Privacidad',
    intro:
      'En crypt.fyi, nos tomamos en serio tu privacidad. Esta Política de Privacidad explica cómo manejamos tu información cuando utilizas nuestra plataforma de intercambio de secretos con conocimiento cero y cifrado de extremo a extremo.',
    doNotCollect: {
      title: 'Información que No Recopilamos',
      description:
        'Debido a nuestra arquitectura de conocimiento cero, somos técnicamente incapaces de acceder a:',
      items: {
        secrets: 'Tus secretos o archivos sin cifrar',
        keys: 'Claves de cifrado o contraseñas',
        urls: 'Fragmentos de URL que contienen información de descifrado',
        content: 'El contenido de tus datos cifrados',
        recipients: 'Información sobre los destinatarios de tus secretos',
      },
    },
    collect: {
      title: 'Información que Recopilamos',
      description: 'Solo recopilamos y almacenamos la información mínima necesaria:',
      items: {
        encrypted: 'Datos cifrados (que no podemos descifrar)',
        hashes:
          'Hashes de verificación de claves (utilizados para verificar derechos de acceso sin conocer las claves reales)',
        metadata:
          'Metadatos básicos de solicitudes (direcciones IP, marcas de tiempo) para límites de tasa y prevención de abusos',
        webhooks:
          'URLs de webhook si se proporcionan (para notificaciones de acceso y eliminación de secretos)',
      },
      note: 'Todos los datos almacenados se eliminan automáticamente después de su vencimiento o al acceder (si está activada la destrucción después de lectura).',
    },
    usage: {
      title: 'Cómo Utilizamos la Información',
      description: 'Utilizamos la información recopilada únicamente para:',
      items: {
        transmission: 'Facilitar la transmisión segura de tus secretos cifrados',
        rateLimits: 'Aplicar límites de tasa para prevenir abusos',
        ipControl: 'Implementar lista blanca de IP/CIDR cuando está configurada',
        notifications: 'Enviar notificaciones webhook cuando están activadas',
        security: 'Mantener la seguridad del sistema y prevenir accesos no autorizados',
      },
    },
    security: {
      title: 'Almacenamiento y Seguridad de Datos',
      description: 'Nuestras medidas de seguridad incluyen:',
      items: {
        encryption: 'Todo el cifrado/descifrado ocurre en tu navegador usando ML-KEM post-cuántico',
        csp: 'Política de Seguridad de Contenido (CSP) estricta para prevenir ataques XSS',
        tls: 'Cifrado TLS para todas las comunicaciones API',
        expiration: 'Vencimiento automático de datos con tiempo de vida configurable (TTL)',
        deletion: 'Eliminación segura de datos después del acceso o vencimiento',
        storage: 'Sin almacenamiento persistente de información sensible',
      },
    },
    thirdParty: {
      title: 'Servicios de Terceros',
      description: 'No compartimos información con terceros excepto en los siguientes casos:',
      items: {
        webhooks:
          'Cuando activas los webhooks, enviamos notificaciones a las URLs que proporcionas sobre el acceso y eliminación de secretos',
        infrastructure:
          'Proveedores de infraestructura que alojan nuestros servicios (que solo ven datos cifrados que no pueden descifrar)',
      },
    },
    rights: {
      title: 'Tus Derechos y Opciones',
      description: 'Tienes control sobre tus datos:',
      items: {
        expiration: 'Elegir tiempos de vencimiento personalizados para tus secretos',
        burn: 'Activar destrucción después de lectura para eliminación inmediata después del acceso',
        password: 'Agregar protección con contraseña para seguridad adicional',
        ip: 'Configurar restricciones de IP para controlar el acceso',
        readLimits: 'Establecer límites de lectura',
      },
    },
    changes: {
      title: 'Cambios en esta Política',
      description:
        'Podemos actualizar esta Política de Privacidad de vez en cuando. Informaremos a los usuarios sobre cambios significativos publicando la nueva Política de Privacidad en esta página. Te recomendamos revisar periódicamente esta Política de Privacidad para cualquier cambio.',
    },
    contact: {
      title: 'Contáctanos',
      description:
        'Si tienes preguntas sobre esta Política de Privacidad, puedes contactarnos a través de nuestra',
    },
  },
};
