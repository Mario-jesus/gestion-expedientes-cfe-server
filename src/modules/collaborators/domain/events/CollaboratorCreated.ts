import { DomainEvent } from '@shared/domain/entities/DomainEvent';
import { Collaborator } from '../entities/Collaborator';

/**
 * Evento de dominio que se dispara cuando se crea un nuevo colaborador
 */
export class CollaboratorCreated extends DomainEvent {
  /**
   * Colaborador creado
   */
  public readonly collaborator: Collaborator;

  /**
   * ID del usuario que realizó la acción (quien creó al colaborador)
   */
  public readonly performedBy: string | undefined;

  constructor(collaborator: Collaborator, performedBy?: string) {
    super();
    this.collaborator = collaborator;
    // Si no se proporciona performedBy, usar collaborator.createdBy si está disponible
    this.performedBy = performedBy ?? collaborator.createdBy;
  }

  getEventName(): string {
    return 'collaborator.created';
  }
}
