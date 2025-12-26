import { DomainEvent } from '@shared/domain/entities/DomainEvent';

/**
 * Evento de dominio que se dispara cuando se activa un usuario
 */
export class UserActivated extends DomainEvent {
  /**
   * ID del usuario que fue activado
   */
  public readonly userId: string;

  /**
   * ID del usuario que realizó la acción (quien activó al usuario)
   * Opcional: puede ser el mismo usuario o un administrador
   */
  public readonly performedBy: string | undefined;

  constructor(userId: string, performedBy?: string) {
    super();
    this.userId = userId;
    this.performedBy = performedBy;
  }

  getEventName(): string {
    return 'user.activated';
  }
}
