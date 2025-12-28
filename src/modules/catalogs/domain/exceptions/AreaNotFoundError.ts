import { DomainException } from '@shared/domain/exceptions/DomainException';

/**
 * Excepción de dominio que se lanza cuando un área no se encuentra
 */
export class AreaNotFoundError extends DomainException {
  constructor(identifier: string) {
    super(
      `Área no encontrada: ${identifier}`,
      404, // Not Found
      'AREA_NOT_FOUND',
      undefined, // No hay campo específico
      { identifier } // Detalles adicionales
    );
  }
}
