import { DomainException } from '@shared/domain/exceptions/DomainException';

/**
 * Excepción de dominio que se lanza cuando el tipo de archivo no es permitido
 */
export class InvalidFileTypeError extends DomainException {
  constructor(fileType: string, allowedTypes: string[]) {
    super(
      `Tipo de archivo no permitido: ${fileType}. Tipos permitidos: ${allowedTypes.join(', ')}`,
      400, // Bad Request
      'INVALID_FILE_TYPE',
      'file', // Campo específico
      { fileType, allowedTypes } // Detalles adicionales
    );
  }
}
