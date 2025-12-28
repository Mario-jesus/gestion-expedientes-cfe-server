import { DomainException } from '@shared/domain/exceptions/DomainException';

/**
 * Excepción de dominio que se lanza cuando el tamaño del archivo excede el límite permitido
 */
export class FileSizeExceededError extends DomainException {
  constructor(fileSize: number, maxFileSize: number) {
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    const maxFileSizeMB = (maxFileSize / (1024 * 1024)).toFixed(2);

    super(
      `El tamaño del archivo (${fileSizeMB} MB) excede el límite permitido (${maxFileSizeMB} MB)`,
      400, // Bad Request
      'FILE_SIZE_EXCEEDED',
      'file', // Campo específico
      { fileSize, maxFileSize, fileSizeMB, maxFileSizeMB } // Detalles adicionales
    );
  }
}
