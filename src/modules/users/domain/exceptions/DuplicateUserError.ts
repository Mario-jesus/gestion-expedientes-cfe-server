import { DomainException } from '@shared/domain/exceptions/DomainException';

/**
 * Excepción de dominio que se lanza cuando se intenta crear un usuario
 * con un username o email que ya existe
 */
export class DuplicateUserError extends DomainException {
  constructor(field: 'username' | 'email', value: string) {
    super(
      `El ${field} '${value}' ya está en uso`,
      409, // Conflict
      'DUPLICATE_USER',
      field, // Campo que causó el conflicto
      { value } // Valor duplicado
    );
  }
}
