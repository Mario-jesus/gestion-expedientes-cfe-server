import { DomainEvent } from '@shared/domain/entities/DomainEvent';

/**
 * Evento de dominio que se dispara cuando se cambia la contraseña de un usuario
 */
export class UserPasswordChanged extends DomainEvent {
  /**
   * ID del usuario cuya contraseña fue cambiada
   */
  public readonly userId: string;

  /**
   * ID del usuario que realizó la acción (quien cambió la contraseña)
   * Opcional: puede ser el mismo usuario o un administrador
   */
  public readonly performedBy: string | undefined;

  constructor(userId: string, performedBy?: string) {
    super();
    this.userId = userId;
    this.performedBy = performedBy;
  }

  getEventName(): string {
    return 'user.password_changed';
  }
}
