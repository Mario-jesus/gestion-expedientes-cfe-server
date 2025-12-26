import { DomainEvent } from '@shared/domain/entities/DomainEvent';

/**
 * Evento de dominio que se dispara cuando se desactiva un usuario
 */
export class UserDeactivated extends DomainEvent {
  /**
   * ID del usuario que fue desactivado
   */
  public readonly userId: string;

  /**
   * ID del usuario que realizó la acción (quien desactivó al usuario)
   * Opcional: normalmente será un administrador
   */
  public readonly performedBy: string | undefined;

  constructor(userId: string, performedBy?: string) {
    super();
    this.userId = userId;
    this.performedBy = performedBy;
  }

  getEventName(): string {
    return 'user.deactivated';
  }
}
