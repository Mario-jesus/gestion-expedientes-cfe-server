import { DomainEvent } from '@shared/domain/entities/DomainEvent';

/**
 * Evento de dominio que se dispara cuando se elimina un usuario
 * 
 * Este evento se dispara cuando un usuario es eliminado permanentemente del sistema
 * (baja física). Para desactivación temporal, se usa UserDeactivated
 */
export class UserDeleted extends DomainEvent {
  /**
   * ID del usuario que fue eliminado
   */
  public readonly userId: string;

  /**
   * ID del usuario que realizó la acción (quien eliminó al usuario)
   * Opcional: normalmente será un administrador
   */
  public readonly performedBy: string | undefined;

  constructor(userId: string, performedBy?: string) {
    super();
    this.userId = userId;
    this.performedBy = performedBy;
  }

  getEventName(): string {
    return 'user.deleted';
  }
}
