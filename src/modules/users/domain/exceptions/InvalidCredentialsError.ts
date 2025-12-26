import { DomainException } from '@shared/domain/exceptions/DomainException';

/**
 * Excepción de dominio que se lanza cuando las credenciales son inválidas
 */
export class InvalidCredentialsError extends DomainException {
  constructor() {
    super(
      'Credenciales inválidas',
      401, // Unauthorized
      'INVALID_CREDENTIALS'
    );
  }
}
