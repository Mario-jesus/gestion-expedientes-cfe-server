/**
 * Tipos para la configuración de la aplicación
 */

export interface DatabaseConfig {
  useMongoDB: boolean;
  mongoHost: string;
  databaseName: string;
  mongoUri: string; // URI completa construida
}

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  baseUrl: string; // URL base del servidor (ej: http://localhost)
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
}

export interface LoggerConfig {
  level: string;
  logToConsole: boolean;
  logToFile: boolean;
  logFilePath: string;
  logFileSync: boolean;
  loki?: {
    url?: string;
    labels?: Record<string, string>;
    batching: boolean;
    interval: number;
    basicAuth?: {
      username: string;
      password: string;
    };
  };
}

export interface CorsConfig {
  allowAll: boolean; // Si true, permite todos los orígenes (solo desarrollo)
  origins: string[]; // Lista de orígenes permitidos (si allowAll es false)
  credentials: boolean; // Permitir credenciales (cookies, auth headers)
  methods: string[]; // Métodos HTTP permitidos
  allowedHeaders: string[]; // Headers permitidos
  exposedHeaders: string[]; // Headers expuestos al cliente
  maxAge: number; // Tiempo de caché para preflight requests (segundos)
}

export interface SecurityConfig {
  jwt: {
    secret: string; // Secret para firmar access tokens
    expiresIn: string; // Tiempo de expiración del access token (ej: "1h", "3600")
    refreshSecret: string; // Secret para firmar refresh tokens (puede ser el mismo que secret)
    refreshExpiresIn: string; // Tiempo de expiración del refresh token (ej: "7d", "604800")
  };
  rateLimit?: {
    login: {
      windowMs: number; // Ventana de tiempo en milisegundos (ej: 900000 = 15 minutos)
      maxAttempts: number; // Máximo número de intentos por ventana (ej: 5)
    };
    refresh: {
      windowMs: number; // Ventana de tiempo en milisegundos (ej: 900000 = 15 minutos)
      maxAttempts: number; // Máximo número de intentos por ventana (ej: 10)
    };
  };
}

export interface FileStorageConfig {
  uploadDir: string; // Directorio base para uploads (ej: ./uploads)
  documentsDir: string; // Directorio para documentos de colaboradores (ej: ./uploads/documents)
  minutesDir: string; // Directorio para minutas (ej: ./uploads/minutes)
  maxFileSize: number; // Tamaño máximo de archivo en bytes (default: 10MB)
  allowedFileTypes: string[]; // Tipos MIME permitidos
}

export interface AppConfig {
  database: DatabaseConfig;
  server: ServerConfig;
  logger: LoggerConfig;
  cors: CorsConfig;
  security: SecurityConfig;
  fileStorage: FileStorageConfig;
}
