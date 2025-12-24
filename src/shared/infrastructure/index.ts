/**
 * Barrel export para infraestructura compartida
 */

// Configuración centralizada
export { config } from './config';
export type { AppConfig, DatabaseConfig, ServerConfig, LoggerConfig, CorsConfig } from './config';

// Database
export * from './database';

// Logger
export { PinoLogger, type PinoLoggerConfig } from './logger/PinoLogger';
export { createLogger, createLoggerFromEnv, type LoggerFactoryConfig } from './logger/loggerFactory';

// Event Bus
export { InMemoryEventBus } from './bus/InMemoryEventBus';

// HTTP Middlewares
export { errorHandler } from './http/errorHandler';
export { notFoundHandler } from './http/notFoundHandler';
export { buildCorsOptions } from './http/cors';

// Container (DI)
export * from './container';
