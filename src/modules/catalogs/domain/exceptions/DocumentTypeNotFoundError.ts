import { DomainException } from '@shared/domain/exceptions/DomainException';

/**
 * Excepción de dominio que se lanza cuando un tipo de documento no se encuentra
 */
export class DocumentTypeNotFoundError extends DomainException {
  constructor(identifier: string) {
    super(
      `Tipo de documento no encontrado: ${identifier}`,
      404, // Not Found
      'DOCUMENT_TYPE_NOT_FOUND',
      undefined, // No hay campo específico
      { identifier } // Detalles adicionales
    );
  }
}
