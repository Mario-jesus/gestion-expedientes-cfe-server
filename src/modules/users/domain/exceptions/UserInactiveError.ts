import { DomainException } from '@shared/domain/exceptions/DomainException';

/**
 * Excepción de dominio que se lanza cuando se intenta realizar una acción
 * con un usuario inactivo
 */
export class UserInactiveError extends DomainException {
  constructor(userId: string) {
    super(
      `El usuario ${userId} está inactivo`,
      403, // Forbidden
      'USER_INACTIVE',
      undefined,
      { userId }
    );
  }
}
