/**
 * Barrel export para infraestructura compartida
 */

// Configuración centralizada
export { config } from '../config';
export type { AppConfig, DatabaseConfig, ServerConfig, LoggerConfig, CorsConfig } from '../config';

// Database
export * from './adapters/output/database';

// Logger
export { PinoLogger, type PinoLoggerConfig } from './adapters/output/logger/PinoLogger';
export { createLogger, createLoggerFromEnv, type LoggerFactoryConfig } from './adapters/output/logger/loggerFactory';

// Event Bus
export { InMemoryEventBus } from './adapters/output/bus/InMemoryEventBus';

// HTTP Middlewares
export { errorHandler } from './http/errorHandler';
export { notFoundHandler } from './http/notFoundHandler';
export { buildCorsOptions } from './http/cors';

// Container (DI)
export * from './container';
