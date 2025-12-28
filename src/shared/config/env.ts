import dotenv from 'dotenv';
import type { LoggerConfig, SecurityConfig, FileStorageConfig } from './types';

// Cargar variables de entorno desde .env
// Silenciar mensajes de dotenv en tests y producción
dotenv.config({
  debug: process.env.DOTENV_CONFIG_DEBUG === 'true',
});

/**
 * Construye la URI completa de MongoDB a partir del host y nombre de base de datos
 * Soporta credenciales opcionales desde variables de entorno
 */
function buildMongoUri(host: string, databaseName: string): string {
  // Remover barra final si existe en el host
  let cleanHost = host.replace(/\/$/, '');

  // Si hay credenciales en variables de entorno, agregarlas al host
  const mongoUser = process.env.MONGODB_USER || process.env.MONGO_USER;
  const mongoPassword = process.env.MONGODB_PASSWORD || process.env.MONGO_PASSWORD;
  const mongoAuthSource = process.env.MONGODB_AUTH_SOURCE || process.env.MONGO_AUTH_SOURCE || 'admin';

  if (mongoUser && mongoPassword) {
    // Extraer el protocolo y el resto de la URI
    const protocolMatch = cleanHost.match(/^(mongodb\+?s?:\/\/)/);
    if (protocolMatch && protocolMatch[1]) {
      const protocol = protocolMatch[1];
      const rest = cleanHost.substring(protocol.length);
      // Si ya tiene credenciales en el host, no agregar las de las variables
      if (!rest.includes('@')) {
        cleanHost = `${protocol}${mongoUser}:${mongoPassword}@${rest}`;
        // Agregar authSource si no está en el host
        if (!cleanHost.includes('authSource=')) {
          cleanHost = `${cleanHost}${cleanHost.includes('?') ? '&' : '?'}authSource=${mongoAuthSource}`;
        }
      }
    }
  }

  // Si el host ya tiene query parameters, agregar la DB antes de ellos
  if (cleanHost.includes('?')) {
    const [base, query] = cleanHost.split('?');
    return `${base}/${databaseName}?${query}`;
  }

  // Caso normal: host sin query parameters
  return `${cleanHost}/${databaseName}`;
}

/**
 * Lee y valida las variables de entorno relacionadas con la base de datos
 */
function getDatabaseConfig() {
  const useMongoDB = process.env.USE_MONGODB === 'true';

  // Si no se usa MongoDB, retornar valores por defecto
  if (!useMongoDB) {
    return {
      useMongoDB: false,
      mongoHost: '',
      databaseName: '',
      mongoUri: '',
    };
  }

  // Validar que existan las variables requeridas para MongoDB
  const mongoHost = process.env.MONGODB_HOST || process.env.MONGODB_URI_BASE;
  if (!mongoHost) {
    throw new Error(
      'MONGODB_HOST or MONGODB_URI_BASE is required when USE_MONGODB=true'
    );
  }

  const databaseName = process.env.DATABASE_NAME || 'gestion-expedientes-cfe';

  // Validar que el nombre de la base de datos sea válido
  if (!/^[a-zA-Z0-9_-]+$/.test(databaseName)) {
    throw new Error(
      `DATABASE_NAME contains invalid characters. Only alphanumeric, underscore, and hyphen are allowed. Got: ${databaseName}`
    );
  }

  const mongoUri = buildMongoUri(mongoHost, databaseName);

  return {
    useMongoDB: true,
    mongoHost,
    databaseName,
    mongoUri,
  };
}

/**
 * Lee y valida las variables de entorno del servidor
 */
function getServerConfig() {
  const port = parseInt(process.env.PORT || '3000', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${process.env.PORT}. Must be a number between 1 and 65535.`);
  }

  const nodeEnv = process.env.NODE_ENV || 'development';
  const validEnvs = ['development', 'production', 'test'];
  if (!validEnvs.includes(nodeEnv)) {
    throw new Error(
      `Invalid NODE_ENV: ${nodeEnv}. Must be one of: ${validEnvs.join(', ')}`
    );
  }

  // URL base del servidor (sin barra final)
  const baseUrl = process.env.SERVER_BASE_URL || process.env.BASE_URL || 'http://localhost';
  // Remover barra final si existe
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');

  return {
    port,
    nodeEnv,
    baseUrl: cleanBaseUrl,
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production',
    isTest: nodeEnv === 'test',
  };
}

/**
 * Lee y valida las variables de entorno del logger
 */
function getLoggerConfig() {
  const level = process.env.LOG_LEVEL || 'info';
  const validLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
  if (!validLevels.includes(level)) {
    throw new Error(
      `Invalid LOG_LEVEL: ${level}. Must be one of: ${validLevels.join(', ')}`
    );
  }

  const logToConsole = process.env.LOG_TO_CONSOLE !== 'false';
  const logToFile = process.env.LOG_TO_FILE === 'true';
  const logFilePath = process.env.LOG_FILE_PATH || './logs/app.log';
  const logFileSync = process.env.LOG_FILE_SYNC === 'true';

  // Configuración de Loki (opcional)
  const lokiUrl = process.env.LOKI_URL || process.env.LOKI_HOST;
  let lokiConfig: LoggerConfig['loki'] | undefined;

  if (lokiUrl) {
    lokiConfig = {
      url: lokiUrl,
      labels: process.env.LOKI_LABELS
        ? JSON.parse(process.env.LOKI_LABELS)
        : undefined,
      batching: process.env.LOKI_BATCHING !== 'false',
      interval: process.env.LOKI_INTERVAL
        ? parseInt(process.env.LOKI_INTERVAL, 10)
        : 5,
    };

    // Autenticación básica para Loki (opcional)
    if (process.env.LOKI_BASIC_AUTH_USERNAME && process.env.LOKI_BASIC_AUTH_PASSWORD) {
      lokiConfig.basicAuth = {
        username: process.env.LOKI_BASIC_AUTH_USERNAME,
        password: process.env.LOKI_BASIC_AUTH_PASSWORD,
      };
    }
  }

  return {
    level,
    logToConsole,
    logToFile,
    logFilePath,
    logFileSync,
    ...(lokiConfig && { loki: lokiConfig }),
  };
}

/**
 * Lee y valida las variables de entorno de seguridad (JWT)
 */
function getSecurityConfig() {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.trim().length === 0) {
    throw new Error(
      'JWT_SECRET is required and cannot be empty. Set a strong secret key in your .env file.'
    );
  }

  // Validar que el secret tenga al menos 32 caracteres (recomendación de seguridad)
  if (jwtSecret.length < 32) {
    throw new Error(
      `JWT_SECRET must be at least 32 characters long for security. Current length: ${jwtSecret.length}`
    );
  }

  // Access token expiration (default: 1 hora)
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '1h';

  // Validar formato básico (debe ser número seguido de unidad: s, m, h, d)
  const expiresInPattern = /^(\d+)([smhd])$|^\d+$/;
  if (!expiresInPattern.test(jwtExpiresIn)) {
    throw new Error(
      `Invalid JWT_EXPIRES_IN format: ${jwtExpiresIn}. Must be a number followed by unit (s, m, h, d) or just a number in seconds. Examples: "1h", "3600", "7d"`
    );
  }

  // Refresh token secret (puede ser el mismo que JWT_SECRET o diferente)
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || jwtSecret;

  // Validar que el refresh secret tenga al menos 32 caracteres
  if (jwtRefreshSecret.length < 32) {
    throw new Error(
      `JWT_REFRESH_SECRET must be at least 32 characters long for security. Current length: ${jwtRefreshSecret.length}`
    );
  }

  // Refresh token expiration (default: 7 días)
  const jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d';

  // Validar formato básico
  if (!expiresInPattern.test(jwtRefreshExpiresIn)) {
    throw new Error(
      `Invalid JWT_REFRESH_EXPIRES_IN format: ${jwtRefreshExpiresIn}. Must be a number followed by unit (s, m, h, d) or just a number in seconds. Examples: "7d", "604800"`
    );
  }

  // Configuración de rate limiting (opcional)
  const rateLimitConfig: SecurityConfig['rateLimit'] = {
    login: {
      // Default: 15 minutos (900000 ms), máximo 5 intentos
      windowMs: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS || '900000', 10),
      maxAttempts: parseInt(process.env.RATE_LIMIT_LOGIN_MAX_ATTEMPTS || '5', 10),
    },
    refresh: {
      // Default: 15 minutos (900000 ms), máximo 10 intentos
      windowMs: parseInt(process.env.RATE_LIMIT_REFRESH_WINDOW_MS || '900000', 10),
      maxAttempts: parseInt(process.env.RATE_LIMIT_REFRESH_MAX_ATTEMPTS || '10', 10),
    },
  };

  // Validar que windowMs sea positivo
  if (rateLimitConfig.login.windowMs <= 0) {
    throw new Error(
      `Invalid RATE_LIMIT_LOGIN_WINDOW_MS: ${process.env.RATE_LIMIT_LOGIN_WINDOW_MS}. Must be a positive number.`
    );
  }
  if (rateLimitConfig.refresh.windowMs <= 0) {
    throw new Error(
      `Invalid RATE_LIMIT_REFRESH_WINDOW_MS: ${process.env.RATE_LIMIT_REFRESH_WINDOW_MS}. Must be a positive number.`
    );
  }

  // Validar que maxAttempts sea positivo
  if (rateLimitConfig.login.maxAttempts <= 0) {
    throw new Error(
      `Invalid RATE_LIMIT_LOGIN_MAX_ATTEMPTS: ${process.env.RATE_LIMIT_LOGIN_MAX_ATTEMPTS}. Must be a positive number.`
    );
  }
  if (rateLimitConfig.refresh.maxAttempts <= 0) {
    throw new Error(
      `Invalid RATE_LIMIT_REFRESH_MAX_ATTEMPTS: ${process.env.RATE_LIMIT_REFRESH_MAX_ATTEMPTS}. Must be a positive number.`
    );
  }

  return {
    jwt: {
      secret: jwtSecret,
      expiresIn: jwtExpiresIn,
      refreshSecret: jwtRefreshSecret,
      refreshExpiresIn: jwtRefreshExpiresIn,
    },
    rateLimit: rateLimitConfig,
  };
}

/**
 * Lee y valida las variables de entorno de CORS
 */
function getCorsConfig() {
  // Permitir todos los orígenes (solo para desarrollo)
  const allowAll = process.env.CORS_ALLOW_ALL === 'true';

  // Orígenes permitidos (puede ser uno o múltiples separados por coma)
  const corsOrigin = process.env.CORS_ORIGIN;
  let origins: string[] = [];

  if (allowAll) {
    // Si allowAll es true, origins se ignora (se permiten todos)
    origins = [];
  } else if (corsOrigin) {
    // Parsear múltiples orígenes separados por coma
    origins = corsOrigin
      .split(',')
      .map(origin => origin.trim())
      .filter(origin => origin.length > 0);

    // Validar que los orígenes tengan formato válido
    const urlPattern = /^https?:\/\/.+/;
    for (const origin of origins) {
      if (!urlPattern.test(origin)) {
        throw new Error(
          `Invalid CORS_ORIGIN format: ${origin}. Must be a valid URL (e.g., http://localhost:3000)`
        );
      }
    }
  } else {
    // Si no hay CORS_ORIGIN y no es allowAll, usar valor por defecto según entorno
    const nodeEnv = process.env.NODE_ENV || 'development';
    if (nodeEnv === 'development') {
      // En desarrollo, permitir localhost por defecto
      origins = ['http://localhost:5174'];
    } else {
      // En producción, requerir CORS_ORIGIN explícito
      throw new Error(
        'CORS_ORIGIN or CORS_ALLOW_ALL must be set in production environment'
      );
    }
  }

  // Permitir credenciales (cookies, auth headers)
  const credentials = process.env.CORS_CREDENTIALS !== 'false';

  // Métodos HTTP permitidos
  const methodsEnv = process.env.CORS_METHODS || 'GET,POST,PUT,PATCH,DELETE,OPTIONS';
  const methods = methodsEnv
    .split(',')
    .map(method => method.trim().toUpperCase())
    .filter(method => method.length > 0);

  // Headers permitidos
  const allowedHeadersEnv = process.env.CORS_ALLOWED_HEADERS || 
    'Content-Type,Authorization,X-Requested-With';
  const allowedHeaders = allowedHeadersEnv
    .split(',')
    .map(header => header.trim())
    .filter(header => header.length > 0);

  // Headers expuestos al cliente
  const exposedHeadersEnv = process.env.CORS_EXPOSED_HEADERS || '';
  const exposedHeaders = exposedHeadersEnv
    ? exposedHeadersEnv
        .split(',')
        .map(header => header.trim())
        .filter(header => header.length > 0)
    : [];

  // Tiempo de caché para preflight requests (en segundos)
  const maxAge = parseInt(process.env.CORS_MAX_AGE || '86400', 10); // Default: 24 horas
  if (isNaN(maxAge) || maxAge < 0) {
    throw new Error(`Invalid CORS_MAX_AGE: ${process.env.CORS_MAX_AGE}. Must be a positive number.`);
  }

  return {
    allowAll,
    origins,
    credentials,
    methods,
    allowedHeaders,
    exposedHeaders,
    maxAge,
  };
}

/**
 * Lee y valida las variables de entorno de almacenamiento de archivos
 */
function getFileStorageConfig(): FileStorageConfig {
  // Directorio base para uploads (default: ./uploads)
  const uploadDir = process.env.UPLOAD_DIR || './uploads';

  // Directorio para documentos de colaboradores (default: ./uploads/documents)
  const documentsDir = process.env.DOCUMENTS_DIR || './uploads/documents';

  // Directorio para minutas (default: ./uploads/minutes)
  const minutesDir = process.env.MINUTES_DIR || './uploads/minutes';

  // Tamaño máximo de archivo en bytes (default: 10MB = 10485760 bytes)
  const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10);
  if (isNaN(maxFileSize) || maxFileSize <= 0) {
    throw new Error(
      `Invalid MAX_FILE_SIZE: ${process.env.MAX_FILE_SIZE}. Must be a positive number in bytes.`
    );
  }

  // Tipos MIME permitidos (default: PDF, DOC, DOCX, XLS, XLSX, imágenes)
  const allowedFileTypesEnv = process.env.ALLOWED_FILE_TYPES ||
    'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png,image/jpg';

  const allowedFileTypes = allowedFileTypesEnv
    .split(',')
    .map(type => type.trim())
    .filter(type => type.length > 0);

  // Validar que haya al menos un tipo permitido
  if (allowedFileTypes.length === 0) {
    throw new Error(
      'ALLOWED_FILE_TYPES must contain at least one valid MIME type.'
    );
  }

  return {
    uploadDir,
    documentsDir,
    minutesDir,
    maxFileSize,
    allowedFileTypes,
  };
}

/**
 * Carga y valida toda la configuración de la aplicación
 * @throws Error si alguna variable de entorno requerida es inválida
 */
export function loadConfig() {
  try {
    return {
      database: getDatabaseConfig(),
      server: getServerConfig(),
      logger: getLoggerConfig(),
      cors: getCorsConfig(),
      security: getSecurityConfig(),
      fileStorage: getFileStorageConfig(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Configuration error: ${message}`);
  }
}
