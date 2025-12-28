import { DomainException } from '@shared/domain/exceptions/DomainException';

/**
 * Excepción de dominio que se lanza cuando se intenta crear un documento duplicado
 * (por ejemplo, cuando ya existe una batería para un colaborador)
 */
export class DuplicateDocumentError extends DomainException {
  constructor(collaboratorId: string, kind: string, details?: Record<string, unknown>) {
    super(
      `Ya existe un documento de tipo "${kind}" para el colaborador ${collaboratorId}`,
      409, // Conflict
      'DUPLICATE_DOCUMENT',
      'kind', // Campo específico
      { collaboratorId, kind, ...details } // Detalles adicionales
    );
  }
}
