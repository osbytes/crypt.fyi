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
        'Construido con seguridad y privacidad en mente - porque la ignorancia puede ser una bendición',
    },
    header: {
      tagline:
        'Compartir datos efímeros con cifrado <aesLink>ML-KEM</aesLink> <e2eLink>post-cuántico de extremo a extremo</e2eLink> de conocimiento cero',
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
      'Comparte información sensible de forma segura con cifrado post-cuántico ML-KEM de extremo a extremo. Tus secretos se cifran en tu navegador, nunca accesibles para nuestros servidores, y se eliminan automáticamente después de ser vistos.',
    features: {
      encryption: {
        title: 'Cifrado Post-Cuántico ML-KEM',
        description:
          'El cifrado post-cuántico ML-KEM de última generación garantiza que tus datos permanezcan seguros incluso contra futuras amenazas de computación cuántica. Todo el cifrado ocurre en tu navegador antes de la transmisión.',
      },
      security: {
        title: 'Seguridad Mejorada',
        description:
          'Múltiples capas de protección incluyendo Política de Seguridad de Contenido (CSP) estricta, limitación de velocidad y restricciones IP. Cifrado resistente a cuánticos con eliminación automática después de la visualización.',
      },
      zeroKnowledge: {
        title: 'Arquitectura de Conocimiento Cero Verdadera',
        description:
          'Nuestros servidores nunca ven tus datos sin cifrar. La clave de cifrado nunca sale de tu dispositivo, y todo el descifrado ocurre en tu navegador. Privacidad total a través de cifrado de extremo a extremo.',
      },
      burn: {
        title: 'Compartir Secretos de Un Solo Uso',
        description:
          'Los secretos se eliminan automáticamente después de ser vistos, garantizando que solo puedan ser accedidos una vez. Perfecto para compartir información sensible que nunca debe persistir.',
      },
      failedAttempts: {
        title: 'Destruir Después de Intentos Fallidos',
        description:
          'Destruye automáticamente los secretos después de varios intentos fallidos de acceso para mayor seguridad',
      },
      expiration: {
        title: 'Auto-Expiración',
        description:
          'Establece tiempos de expiración personalizados para asegurar que los secretos no persistan más de lo necesario',
      },
      password: {
        title: 'Protección con Contraseña',
        description: 'Añade una capa extra de seguridad con protección opcional por contraseña',
      },
      files: {
        title: 'Compartir Archivos',
        description:
          'Comparte archivos de forma segura con funcionalidad simple de arrastrar y soltar',
      },
      webhooks: {
        title: 'Webhooks',
        description:
          'Recibe notificaciones cuando tus secretos son accedidos, destruidos o fallan al ser leídos',
      },
      ipControl: {
        title: 'Restricciones IP',
        description:
          'Controla el acceso limitando qué direcciones IP o rangos CIDR pueden ver tus secretos',
      },
      readLimits: {
        title: 'Límites de Lectura',
        description:
          'Establece conteos máximos de vistas para restringir cuántas veces se puede acceder a un secreto',
      },
      qrCode: {
        title: 'Códigos QR',
        description: 'Genera códigos QR para compartir fácilmente tus URLs secretas en móviles',
      },
      cli: {
        title: 'Herramienta CLI',
        description: 'Automatiza el compartir secretos con nuestra interfaz de línea de comandos',
      },
      chromeExtension: {
        title: 'Extensión de Chrome',
        description:
          'Comparte secretos directamente desde tu navegador con nuestra extensión de Chrome',
      },
      docker: {
        title: 'Soporte Docker',
        description: 'Despliega tu propia instancia usando nuestras imágenes Docker oficiales',
      },
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
        fileHint: 'agrega un archivo arrastrándolo o haciendo clic aquí',
        fileSelected: 'Archivo seleccionado: {{name}} ({{size}} KB)',
      },
      password: {
        label: 'Contraseña',
        placeholder: 'Opcional (pero recomendado)',
      },
      ttl: {
        label: 'Tiempo de vida',
        placeholder: 'Selecciona el tiempo de expiración',
      },
      burn: {
        label: 'Destruir después de leer',
        description: 'Garantiza que solo un destinatario pueda acceder al secreto',
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
        main: 'Tu secreto ha sido creado y la URL ha sido copiada al portapapeles',
        password: 'Comparte la URL y la contraseña con el destinatario deseado',
      },
      urlCopied: 'URL copiada al portapapeles',
      qrCode: {
        title: 'Código QR de la URL del Secreto',
        description: 'Descarga y comparte el código QR de la URL del secreto',
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
      readCountWithBurn: 'El contador de lecturas no se puede usar con destruir después de leer',
      tooManyIps: 'Demasiadas restricciones de IP (máximo {{max}})',
      invalidIp: 'Dirección IP o bloque CIDR inválido: {{ip}}',
      uploadFailed: 'Error al procesar el contenido cargado: {{error}}',
      deleteFailed: 'Error al eliminar el secreto: {{error}}',
      secretNotFound: 'secreto no encontrado',
      unexpectedStatus: 'código de estado inesperado {{code}}',
      webhookConfigInvalid:
        'La configuración del webhook no es válida: se requiere al menos un tipo de evento de webhook',
      fileSizeExceeded: 'El tamaño del archivo excede el tamaño máximo permitido',
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
    password: {
      title: 'Ingresar Contraseña',
      placeholder: 'Ingresa la contraseña',
      description: 'Este secreto está protegido con una contraseña - solicítala al remitente',
      error: 'Contraseña incorrecta',
    },
    content: {
      fileShared: 'Se ha compartido un archivo contigo',
      downloadFile: 'Descargar Archivo',
      hideContent: 'Ocultar contenido',
      showContent: 'Mostrar contenido',
      copyToClipboard: 'Copiar al portapapeles',
      copiedToClipboard: 'Secreto copiado al portapapeles',
      clickToReveal: 'Haz clic en el ícono del ojo arriba para revelar el secreto',
      passwordProtected:
        'Este secreto está protegido con contraseña. Haz clic para ingresar la contraseña.',
      clickToEnterPassword: 'Haz clic para ingresar la contraseña',
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
    intro:
      'crypt.fyi es una plataforma segura, de código abierto y de conocimiento cero que te permite compartir información sensible de forma segura con cifrado post-cuántico de extremo a extremo. Ya sean contraseñas, claves API o mensajes confidenciales, crypt.fyi garantiza que tus datos permanezcan privados, nunca accesibles para nuestros servidores, y desaparezcan automáticamente después de ser accedidos.',
    whyCryptFyi: {
      title: '¿Por qué crypt.fyi?',
      commonPractices: {
        title: 'El Problema con las Prácticas Comunes',
        description:
          'Cada día, información sensible como contraseñas, claves API y datos privados se comparten a través de canales inseguros en texto plano:',
        problems: {
          email:
            'Correo electrónico - puede ser interceptado, almacenado indefinidamente y reenviado sin control',
          slack:
            'Mensajes de Slack/Teams - permanecen en el historial de chat y registros de la empresa',
          sms: 'Mensajes SMS/Texto - almacenados en múltiples dispositivos y servidores de operadores',
          messaging:
            'Mensajería instantánea - a menudo carece de cifrado adecuado y eliminación de datos',
        },
      },
      existingSolutions: {
        title: 'Soluciones Existentes y Sus Limitaciones',
        description:
          'Si bien hay otras herramientas en este espacio, cada una tiene sus limitaciones:',
        limitations: {
          onePassword: '1Password - excelente para gestión de contraseñas en equipo, pero',
          onePasswordLink: 'no admite compartir internamente con usuarios externos',
          otherTools:
            'PrivateBin/PwPush/OneTimeSecret - funcionalidad básica similar, pero interfaces de usuario y stacks tecnológicos obsoletos, y a menudo carecen de',
          otherToolsConfigLink: 'arquitectura de conocimiento cero',
          otherToolsSecurityLink: 'cifrado post-cuántico',
        },
      },
      approach: {
        title: 'El Enfoque de crypt.fyi',
        description:
          'crypt.fyi fue construido para abordar estos desafíos mientras adopta tecnologías web modernas y estándares de seguridad. Combinamos arquitectura de conocimiento cero con cifrado post-cuántico ML-KEM, garantizando que tus datos permanezcan privados y seguros. El resultado es una herramienta que es tanto altamente segura como agradable de usar.',
      },
    },
    howItWorks: {
      title: 'Cómo Funciona',
      steps: {
        encrypt: {
          title: '1. Cifrar',
          description:
            'Tu secreto se cifra en tu navegador usando cifrado post-cuántico ML-KEM antes de salir de tu dispositivo. El cifrado ocurre completamente del lado del cliente, garantizando conocimiento cero de tus datos.',
        },
        share: {
          title: '2. Compartir',
          description:
            'Comparte el enlace seguro con tu destinatario. El enlace contiene todo lo necesario para descifrar el mensaje, pero nuestros servidores nunca ven el contenido sin cifrar.',
        },
        burn: {
          title: '3. Destruir después de leer',
          description:
            'Una vez accedido, si "destruir después de leer" está marcado, el secreto se elimina permanentemente de nuestros servidores. Sin dejar rastros, manteniendo conocimiento cero completo de tus datos.',
        },
      },
    },
    security: {
      title: 'Implementación de Seguridad',
      encryption: {
        title: 'Cifrado Post-Cuántico de Conocimiento Cero',
        description:
          'Todos los secretos se cifran usando cifrado post-cuántico ML-KEM en tu navegador antes de la transmisión. La clave de cifrado nunca sale de tu dispositivo, garantizando cifrado de extremo a extremo de conocimiento cero verdadero.',
        features: {
          key: 'La clave de cifrado se deriva de una generación aleatoria criptográficamente segura',
          derivation: 'La derivación de clave usa PBKDF2 con SHA-256',
          vector: 'Cada secreto tiene un vector de inicialización (IV) único',
        },
      },
      zeroKnowledge: {
        title: 'Arquitectura de Conocimiento Cero Verdadera',
        description:
          'Nuestros servidores nunca ven tus datos sin cifrar. Empleamos una arquitectura de conocimiento cero donde:',
        features: {
          clientSide: 'Todo el cifrado/descifrado ocurre del lado del cliente en tu navegador',
          storage: 'Los servidores solo almacenan datos cifrados que no pueden descifrar',
          keys: 'Las claves de cifrado se transmiten a través de fragmentos de URL, que nunca llegan al servidor API backend',
        },
      },
      protection: {
        title: 'Protección de Datos',
        description: 'Múltiples capas de seguridad aseguran que tus datos permanezcan protegidos:',
        features: {
          encryption:
            'Todo el cifrado/descifrado ocurre en tu navegador usando cifrado post-cuántico ML-KEM',
          tls: 'Cifrado TLS para todas las comunicaciones API',
          destruction: 'Destrucción automática de secretos después del acceso',
          logging: 'Sin registro del lado del servidor de datos sensibles',
          password: 'Protección opcional con contraseña para seguridad adicional',
        },
      },
    },
    openSource: {
      title: 'Código Abierto',
      description:
        'crypt.fyi es de código abierto y auditable. Puedes revisar nuestra implementación de conocimiento cero, cifrado post-cuántico, y contribuir en',
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
