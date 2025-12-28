import { DomainException } from '@shared/domain/exceptions/DomainException';
import { DocumentKind } from '../enums/DocumentKind';

/**
 * Excepción de dominio que se lanza cuando se intenta crear un tipo de documento
 * con un nombre que ya existe en el kind especificado
 */
export class DuplicateDocumentTypeError extends DomainException {
  constructor(nombre: string, kind: DocumentKind) {
    super(
      `Ya existe un tipo de documento con el nombre '${nombre}' en el kind '${kind}'`,
      409, // Conflict
      'DUPLICATE_DOCUMENT_TYPE',
      'nombre', // Campo que causó el error
      { nombre, kind } // Detalles adicionales
    );
  }
}
