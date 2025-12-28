import { DomainEvent } from '@shared/domain/entities/DomainEvent';
import { Collaborator } from '../entities/Collaborator';

/**
 * Evento de dominio que se dispara cuando se desactiva un colaborador
 */
export class CollaboratorDeactivated extends DomainEvent {
  /**
   * Colaborador desactivado
   */
  public readonly collaborator: Collaborator;

  /**
   * ID del usuario que realizó la acción
   */
  public readonly performedBy: string | undefined;

  constructor(collaborator: Collaborator, performedBy?: string) {
    super();
    this.collaborator = collaborator;
    this.performedBy = performedBy;
  }

  getEventName(): string {
    return 'collaborator.deactivated';
  }
}
