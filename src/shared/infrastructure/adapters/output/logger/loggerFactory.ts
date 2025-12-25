import { ILogger } from '../../../../domain/ports/output';
import { config } from '../../../../config';
import { PinoLogger, PinoLoggerConfig } from './PinoLogger';

export interface LoggerFactoryConfig {
  pino?: PinoLoggerConfig | undefined;
}

/**
 * Factory para crear instancias de Logger
 * Siempre usa Pino (logging estructurado)
 */
export function createLogger(loggerConfig?: LoggerFactoryConfig): ILogger {
  return new PinoLogger(loggerConfig?.pino);
}

/**
 * Crea un logger basado en la configuración centralizada
 * Usa el módulo de configuración para obtener todas las opciones
 */
export function createLoggerFromEnv(): ILogger {
  const loggerConfig = config.logger;

  const pinoConfig: PinoLoggerConfig = {
    level: loggerConfig.level,
    environment: config.server.nodeEnv,
  };

  // Configuración de Loki (si está disponible)
  if (loggerConfig.loki && loggerConfig.loki.url) {
    pinoConfig.loki = {
      host: loggerConfig.loki.url,
      labels: loggerConfig.loki.labels,
      batching: loggerConfig.loki.batching,
      interval: loggerConfig.loki.interval,
      basicAuth: loggerConfig.loki.basicAuth,
    };
  }

  // Configuración de fichero
  if (loggerConfig.logToFile) {
    pinoConfig.file = {
      enabled: true,
      path: loggerConfig.logFilePath,
      sync: loggerConfig.logFileSync,
    };
  }

  // Configuración de consola
  // Pasar explícitamente logToConsole al PinoLogger
  pinoConfig.logToConsole = loggerConfig.logToConsole;

  // Si no se debe escribir a consola y no hay otros destinos, forzar archivo
  if (!loggerConfig.logToConsole && !pinoConfig.file && !pinoConfig.loki) {
    pinoConfig.file = {
      enabled: true,
      path: loggerConfig.logFilePath,
      sync: loggerConfig.logFileSync,
    };
  }

  return createLogger({
    pino: pinoConfig,
  });
}
