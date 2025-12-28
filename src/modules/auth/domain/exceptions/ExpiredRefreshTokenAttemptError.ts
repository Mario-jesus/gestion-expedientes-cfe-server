import { DomainException } from '@shared/domain/exceptions/DomainException';

/**
 * Excepción de dominio que se lanza cuando se detecta un intento de usar
 * un refresh token expirado.
 * 
 * Esta situación puede indicar que:
 * - El token fue robado y alguien está intentando usarlo después de que expiró
 * - Hay actividad sospechosa que requiere invalidar todos los tokens del usuario
 * 
 * Por seguridad, cuando se detecta esto, se deben revocar todos los tokens
 * del usuario para prevenir acceso no autorizado.
 */
export class ExpiredRefreshTokenAttemptError extends DomainException {
  constructor(userId?: string, refreshTokenId?: string) {
    super(
      'Se detectó un intento de usar un refresh token expirado. Por seguridad, todos los tokens del usuario han sido revocados.',
      401, // Unauthorized
      'EXPIRED_REFRESH_TOKEN_ATTEMPT',
      undefined,
      {
        userId,
        refreshTokenId,
        reason: 'Expired refresh token attempt detected - potential security breach',
        action: 'All user tokens have been revoked for security',
      }
    );
  }
}
