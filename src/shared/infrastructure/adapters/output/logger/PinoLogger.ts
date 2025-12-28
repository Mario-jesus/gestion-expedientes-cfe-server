import pino, { Logger } from 'pino';
import { ILogger } from '../../../../domain/ports/output';
import { config } from '../../../../config';

export interface PinoLoggerConfig {
  level?: string | undefined;
  environment?: string | undefined;
  loki?: {
    host: string; // LOKI_URL: URL completa de Loki (ej: http://localhost:3100)
    labels?: Record<string, string> | undefined; // Labels estáticas (app, env, service)
    batching?: boolean | undefined; // Agrupa logs (recomendado: true)
    interval?: number | undefined; // Intervalo en segundos para enviar logs (recomendado: 5)
    basicAuth?: {
      username: string;
      password: string;
    } | undefined; // Para Loki protegido (Grafana Cloud, etc.)
  } | undefined;
  file?: {
    enabled?: boolean | undefined; // Habilitar escritura en fichero
    path?: string | undefined; // Ruta del fichero de logs
    sync?: boolean | undefined; // Si true, escritura síncrona (no recomendado en prod)
  } | undefined;
  logToConsole?: boolean | undefined; // Si debe escribir a consola
}

/**
 * Implementación de Logger usando Pino
 * Soporta envío de logs a Loki mediante pino-loki
 */
export class PinoLogger implements ILogger {
  private logger: Logger;
  private streams: Array<{ stream: any }> = [];

  constructor(pinoConfig?: PinoLoggerConfig) {
    const level = pinoConfig?.level || config.logger.level;

    // Configuración base de Pino
    // IMPORTANTE: Mantener la configuración simple para no alterar el JSON que se envía a Loki
    // Usar timestamp por defecto de Pino (número) para que pino-loki lo procese bien
    const pinoOptions: pino.LoggerOptions = {
      level,
      // NO usar formatters personalizados que puedan alterar el formato JSON
      // pino-loki necesita el JSON puro de Pino
      base: {},
      // Serializadores estándar de Pino (para errores, etc.)
      serializers: pino.stdSerializers,
    };

    // Acumular streams (Loki + consola + fichero)
    this.streams = [];

    // Si está configurado Loki, usar pino-loki (stream directo, sin worker)
    if (pinoConfig?.loki) {
      try {
        const pinoLokiModule = require('pino-loki');
        const pinoLoki = pinoLokiModule.pinoLoki || pinoLokiModule.default;

        if (!pinoLoki) {
          throw new Error('pino-loki module not found');
        }

        // Inicializar labels vacío - solo se usarán los del .env
        const lokiLabels: Record<string, string> = {};

        // Agregar labels directamente desde configuración (LOKI_LABELS del .env)
        // Solo se usan los labels configurados explícitamente en .env
        if (pinoConfig.loki.labels) {
          for (const [key, value] of Object.entries(pinoConfig.loki.labels)) {
            const stringValue = value != null ? String(value) : '';
            if (stringValue && key) {
              // Agregar labels tal como vienen del .env, sin normalización
              lokiLabels[key] = stringValue;
            }
          }
        }

        // Debug: log payloads if se habilita DEBUG_LOKI_PAYLOAD
        // Nota: Esta variable de debug no está en el config centralizado porque es solo para desarrollo
        const originalFetch = global.fetch;
        const debugLokiPayload = process.env.DEBUG_LOKI_PAYLOAD === 'true';
        if (debugLokiPayload && originalFetch) {
          // @ts-ignore
          global.fetch = async (url: any, options: any) => {
            try {
              console.log('[DEBUG_LOKI_PAYLOAD] url:', url?.toString?.() || url);
              console.log('[DEBUG_LOKI_PAYLOAD] body:', options?.body);
            } catch (e) {
              console.error('[DEBUG_LOKI_PAYLOAD] failed to log payload', e);
            }
            return originalFetch(url as any, options);
          };
        }

        const transport = pinoLoki({
          host: pinoConfig.loki.host,
          labels: lokiLabels,
          batching: pinoConfig.loki.batching ?? true,
          interval: pinoConfig.loki.interval ?? 5,
          silenceErrors: false,
          basicAuth: pinoConfig.loki.basicAuth,
        });

        this.streams.push({ stream: transport });

        // Log de configuración solo en modo debug/trace
        // No loguear aquí porque el logger aún no está completamente inicializado
        // La configuración se puede verificar en los logs de la aplicación si es necesario
      } catch (error) {
        console.warn('pino-loki not available, using standard logger');
        console.warn('Error details:', error instanceof Error ? error.message : error);
      }
    }

    // Emitir a consola (stdout) si está habilitado
    // Usa pinoConfig.logToConsole del parámetro, o el valor por defecto del config centralizado
    const shouldLogToConsole = pinoConfig?.logToConsole !== undefined 
      ? pinoConfig.logToConsole 
      : config.logger.logToConsole;

    if (shouldLogToConsole) {
      const consoleStream = pino.destination({ sync: false });
      this.streams.push({ stream: consoleStream });
    }

    // Emitir a fichero si está habilitado
    if (pinoConfig?.file?.enabled !== false && pinoConfig?.file?.path) {
      const fileStream = pino.destination({
        dest: pinoConfig.file.path,
        sync: pinoConfig.file.sync ?? false,
        mkdir: true, // crea directorios intermedios para evitar fallos de apertura
      });
      this.streams.push({ stream: fileStream });
    }

    // Construir logger según streams disponibles
    if (this.streams.length === 0) {
      this.logger = pino(pinoOptions);
    } else if (this.streams.length === 1) {
      this.logger = pino(pinoOptions, this.streams[0]!.stream);
    } else {
      this.logger = pino(pinoOptions, pino.multistream(this.streams));
    }
  }

  trace(message: string, meta?: Record<string, unknown>): void {
    // Pino formato estándar: objeto primero, mensaje segundo (opcional)
    if (meta) {
      this.logger.trace(meta, message);
    } else {
      this.logger.trace({ msg: message });
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    // Pino formato estándar: objeto primero, mensaje segundo (opcional)
    if (meta) {
      this.logger.debug(meta, message);
    } else {
      this.logger.debug({ msg: message });
    }
  }

  info(message: string, meta?: Record<string, unknown>): void {
    try {
      // Pino formato estándar: objeto primero, mensaje segundo (opcional)
      // Esto asegura que el JSON se serialice correctamente para Loki
      if (meta) {
        this.logger.info(meta, message);
      } else {
        this.logger.info({ msg: message });
      }
    } catch (error) {
      // Fallback a console si el logger falla
      console.error('Logger error:', error);
      console.log(`[INFO] ${message}`, meta || '');
    }
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    // Pino formato estándar: objeto primero, mensaje segundo (opcional)
    if (meta) {
      this.logger.warn(meta, message);
    } else {
      this.logger.warn({ msg: message });
    }
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    // Pino formato estándar: objeto primero, mensaje segundo
    // Pino serializa automáticamente el error si se pasa como 'err'
    const logData: Record<string, unknown> = { ...meta };

    if (error) {
      // Pino tiene convención especial para errores: campo 'err' con propiedades del error
      // Esto crea campos: err.message, err.stack, err.name, etc.
      logData.err = error;
    }

    // Usar formato estándar de Pino: objeto primero, mensaje segundo
    this.logger.error(logData, message);
  }

  fatal(message: string, error?: Error, meta?: Record<string, unknown>): void {
    // Fatal es el nivel más crítico, similar a error pero indica que la app puede detenerse
    const logData: Record<string, unknown> = { ...meta };

    if (error) {
      logData.err = error;
    }

    // Usar formato estándar de Pino: objeto primero, mensaje segundo
    this.logger.fatal(logData, message);
  }

  /**
   * Obtiene la instancia de Pino subyacente (para casos avanzados)
   */
  getPinoInstance(): Logger {
    return this.logger;
  }

  /**
   * Cierra todos los streams del logger
   * Útil para tests y shutdown graceful
   */
  async close(): Promise<void> {
    // Cerrar todos los streams
    for (const streamWrapper of this.streams) {
      if (streamWrapper.stream && typeof streamWrapper.stream.end === 'function') {
        streamWrapper.stream.end();
      }
      if (streamWrapper.stream && typeof streamWrapper.stream.destroy === 'function') {
        streamWrapper.stream.destroy();
      }
    }
    this.streams = [];
  }
}
