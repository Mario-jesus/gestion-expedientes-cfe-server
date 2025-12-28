import { DomainException } from '@shared/domain/exceptions/DomainException';

/**
 * Excepción de dominio que se lanza cuando un token es inválido o malformado
 */
export class InvalidTokenError extends DomainException {
  constructor(message: string = 'Token inválido o malformado') {
    super(
      message,
      401, // Unauthorized
      'INVALID_TOKEN'
    );
  }
}
