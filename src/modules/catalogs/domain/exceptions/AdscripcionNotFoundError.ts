import { DomainException } from '@shared/domain/exceptions/DomainException';

/**
 * Excepción de dominio que se lanza cuando una adscripción no se encuentra
 */
export class AdscripcionNotFoundError extends DomainException {
  constructor(identifier: string) {
    super(
      `Adscripción no encontrada: ${identifier}`,
      404, // Not Found
      'ADSCRIPCION_NOT_FOUND',
      undefined, // No hay campo específico
      { identifier } // Detalles adicionales
    );
  }
}
