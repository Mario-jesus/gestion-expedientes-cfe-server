import { DomainException } from '@shared/domain/exceptions/DomainException';

/**
 * Excepción de dominio que se lanza cuando un puesto no se encuentra
 */
export class PuestoNotFoundError extends DomainException {
  constructor(identifier: string) {
    super(
      `Puesto no encontrado: ${identifier}`,
      404, // Not Found
      'PUESTO_NOT_FOUND',
      undefined, // No hay campo específico
      { identifier } // Detalles adicionales
    );
  }
}
