import { DomainException } from '@shared/domain/exceptions/DomainException';

/**
 * Excepción de dominio que se lanza cuando se intenta eliminar un tipo de documento
 * que tiene documentos asociados
 */
export class DocumentTypeInUseError extends DomainException {
  constructor(documentTypeId: string) {
    super(
      'No se puede eliminar el tipo de documento porque tiene documentos asociados',
      400, // Bad Request
      'DOCUMENT_TYPE_IN_USE',
      undefined, // No hay campo específico
      { documentTypeId } // Detalles adicionales
    );
  }
}
