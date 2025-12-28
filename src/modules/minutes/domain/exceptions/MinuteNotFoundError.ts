import { DomainException } from '@shared/domain/exceptions/DomainException';

/**
 * Excepción de dominio que se lanza cuando una minuta no se encuentra
 */
export class MinuteNotFoundError extends DomainException {
  constructor(identifier: string) {
    super(
      `Minuta no encontrada: ${identifier}`,
      404, // Not Found
      'MINUTE_NOT_FOUND',
      undefined, // No hay campo específico
      { identifier } // Detalles adicionales
    );
  }
}
