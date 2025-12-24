/**
 * Interfaz para el servicio de logging
 * Compatible con logging estructurado (Pino, Loki)
 * 
 * El parámetro `meta` se usa para logging estructurado donde cada campo
 * se convierte en un campo indexable en Loki/Grafana
 */
export interface ILogger {
  /**
   * Log de trace (más detallado que debug)
   * @param message Mensaje principal del log
   * @param meta Metadata estructurada (campos adicionales para Loki)
   */
  trace(message: string, meta?: Record<string, unknown>): void;

  /**
   * Log de debug
   * @param message Mensaje principal del log
   * @param meta Metadata estructurada (campos adicionales para Loki)
   */
  debug(message: string, meta?: Record<string, unknown>): void;

  /**
   * Log de información
   * @param message Mensaje principal del log
   * @param meta Metadata estructurada (campos adicionales para Loki)
   */
  info(message: string, meta?: Record<string, unknown>): void;

  /**
   * Log de advertencia
   * @param message Mensaje principal del log
   * @param meta Metadata estructurada (campos adicionales para Loki)
   */
  warn(message: string, meta?: Record<string, unknown>): void;

  /**
   * Log de error
   * @param message Mensaje principal del log
   * @param error Error opcional (se serializa en meta.err)
   * @param meta Metadata estructurada adicional (campos adicionales para Loki)
   */
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;

  /**
   * Log de fatal (error crítico que puede causar que la aplicación se detenga)
   * @param message Mensaje principal del log
   * @param error Error opcional (se serializa en meta.err)
   * @param meta Metadata estructurada adicional (campos adicionales para Loki)
   */
  fatal(message: string, error?: Error, meta?: Record<string, unknown>): void;
}
