import { DomainException } from '@shared/domain/exceptions/DomainException';

/**
 * Excepción de dominio que se lanza cuando un colaborador no se encuentra
 */
export class CollaboratorNotFoundError extends DomainException {
  constructor(identifier: string) {
    super(
      `Colaborador no encontrado: ${identifier}`,
      404, // Not Found
      'COLLABORATOR_NOT_FOUND',
      undefined, // No hay campo específico
      { identifier } // Detalles adicionales
    );
  }
}
