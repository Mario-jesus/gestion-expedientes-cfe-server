import { DomainEvent } from '@shared/domain/entities/DomainEvent';
import { User } from '../entities/User';

/**
 * Evento de dominio que se dispara cuando se crea un nuevo usuario
 */
export class UserCreated extends DomainEvent {
  /**
   * Usuario creado
   */
  public readonly user: User;

  /**
   * ID del usuario que realizó la acción (quien creó al usuario)
   * Opcional: puede obtenerse de user.createdBy, pero se incluye explícitamente para claridad
   */
  public readonly performedBy: string | undefined;

  constructor(user: User, performedBy?: string) {
    super();
    this.user = user;
    // Si no se proporciona performedBy, usar user.createdBy si está disponible
    this.performedBy = performedBy ?? user.createdBy;
  }

  getEventName(): string {
    return 'user.created';
  }
}
