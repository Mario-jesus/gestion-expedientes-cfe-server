import { DomainException } from '@shared/domain/exceptions/DomainException';

/**
 * Excepción de dominio que se lanza cuando un usuario no se encuentra
 */
export class UserNotFoundError extends DomainException {
  constructor(identifier: string) {
    super(
      `Usuario no encontrado: ${identifier}`,
      404, // Not Found
      'USER_NOT_FOUND',
      undefined, // No hay campo específico
      { identifier } // Detalles adicionales
    );
  }
}
