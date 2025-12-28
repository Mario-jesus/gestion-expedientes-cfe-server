import { DomainException } from '@shared/domain/exceptions/DomainException';

/**
 * Excepción de dominio que se lanza cuando se intenta crear un colaborador con un RPE que ya existe
 */
export class DuplicateCollaboratorError extends DomainException {
  constructor(rpe: string) {
    super(
      `Ya existe un colaborador con el RPE: ${rpe}`,
      409, // Conflict
      'DUPLICATE_COLLABORATOR',
      'rpe', // Campo que causó el error
      { rpe } // Detalles adicionales
    );
  }
}
