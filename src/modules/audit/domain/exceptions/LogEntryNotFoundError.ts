/**
 * Excepción de dominio que se lanza cuando un log de auditoría no se encuentra
 */
export class LogEntryNotFoundError extends Error {
  constructor(public readonly logId: string) {
    super(`Log de auditoría con ID ${logId} no encontrado`);
    this.name = 'LogEntryNotFoundError';
    Object.setPrototypeOf(this, LogEntryNotFoundError.prototype);
  }
}
