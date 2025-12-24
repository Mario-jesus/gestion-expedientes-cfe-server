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

export interface AppConfig {
  database: DatabaseConfig;
  server: ServerConfig;
  logger: LoggerConfig;
  cors: CorsConfig;
}
