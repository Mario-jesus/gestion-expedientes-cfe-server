import { loadConfig } from './env';
import type { AppConfig } from './types';

/**
 * Configuración centralizada de la aplicación
 * 
 * Este objeto contiene toda la configuración validada de la aplicación.
 * Todas las variables de entorno se leen y validan una sola vez al cargar este módulo.
 * 
 * Uso:
 * ```typescript
 * import { config } from '@/shared/config';
 * 
 * const port = config.server.port;
 * const dbUri = config.database.mongoUri;
 * ```
 */
export const config: AppConfig = loadConfig();

// Re-exportar tipos para conveniencia
export type { AppConfig, DatabaseConfig, ServerConfig, LoggerConfig, CorsConfig, SecurityConfig, FileStorageConfig } from './types';
