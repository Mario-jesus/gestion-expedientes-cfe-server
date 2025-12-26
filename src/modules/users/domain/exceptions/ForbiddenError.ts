import { DomainException } from '@shared/domain/exceptions/DomainException';

/**
 * Excepción de dominio que se lanza cuando un usuario autenticado
 * no tiene permisos para realizar una acción específica (403 Forbidden)
 * 
 * Diferencia con UnauthorizedError (401):
 * - 403 Forbidden: Usuario autenticado pero sin permisos para el recurso
 * - 401 Unauthorized: Usuario no autenticado o token inválido/expirado
 */
export class ForbiddenError extends DomainException {
  constructor(message: string = 'No tienes permisos para realizar esta acción', details?: Record<string, unknown>) {
    super(
      message,
      403, // Forbidden
      'FORBIDDEN',
      undefined,
      details
    );
  }
}
