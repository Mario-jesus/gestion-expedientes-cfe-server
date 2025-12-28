import { DomainException } from '@shared/domain/exceptions/DomainException';

/**
 * Excepción de dominio que se lanza cuando un documento no se encuentra
 */
export class DocumentNotFoundError extends DomainException {
  constructor(identifier: string) {
    super(
      `Documento no encontrado: ${identifier}`,
      404, // Not Found
      'DOCUMENT_NOT_FOUND',
      undefined, // No hay campo específico
      { identifier } // Detalles adicionales
    );
  }
}
