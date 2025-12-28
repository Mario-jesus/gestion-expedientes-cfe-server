import { DomainException } from '@shared/domain/exceptions/DomainException';

/**
 * Excepción de dominio que se lanza cuando un token ha expirado
 */
export class TokenExpiredError extends DomainException {
  constructor(message: string = 'Token expirado') {
    super(
      message,
      401, // Unauthorized
      'TOKEN_EXPIRED'
    );
  }
}
