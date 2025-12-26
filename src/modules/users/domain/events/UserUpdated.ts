import { DomainEvent } from '@shared/domain/entities/DomainEvent';
import { User } from '../entities/User';

/**
 * Campos que pueden ser actualizados en un usuario
 */
export type UserUpdateFields = 'email' | 'name' | 'role' | 'isActive';

/**
 * Evento de dominio que se dispara cuando se actualiza un usuario
 */
export class UserUpdated extends DomainEvent {
  /**
   * Usuario actualizado
   */
  public readonly user: User;

  /**
   * Campos que se actualizaron
   */
  public readonly updatedFields: UserUpdateFields[];

  /**
   * Valores anteriores de los campos actualizados (para auditoría)
   */
  public readonly previousValues: Partial<{
    email: string;
    name: string;
    role: string;
    isActive: boolean;
  }> | undefined;

  /**
   * ID del usuario que realizó la acción (quien actualizó al usuario)
   * Opcional: puede ser el mismo usuario (actualizando su perfil) o un administrador
   */
  public readonly performedBy: string | undefined;

  constructor(
    user: User,
    updatedFields: UserUpdateFields[],
    previousValues?: Partial<{
      email: string;
      name: string;
      role: string;
      isActive: boolean;
    }>,
    performedBy?: string
  ) {
    super();
    this.user = user;
    this.updatedFields = updatedFields;
    if (previousValues !== undefined) {
      this.previousValues = previousValues;
    }
    this.performedBy = performedBy;
  }

  getEventName(): string {
    return 'user.updated';
  }
}
