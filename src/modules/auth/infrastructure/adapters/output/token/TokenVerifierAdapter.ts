import { ITokenService } from '@modules/auth/domain/ports/output/ITokenService';
import { InvalidTokenError as AuthInvalidTokenError, TokenExpiredError as AuthTokenExpiredError } from '@modules/auth/domain/exceptions';
import { ITokenVerifier, TokenExpiredError, InvalidTokenError } from '@shared/infrastructure/http/middleware/types';

/**
 * Adaptador que convierte ITokenService en ITokenVerifier
 * 
 * Este adaptador permite usar ITokenService con el middleware authenticate
 * de shared, convirtiendo las excepciones de dominio de auth a las excepciones
 * genéricas de shared.
 * 
 * Esto mantiene la separación de responsabilidades:
 * - shared no depende de módulos
 * - auth puede usar sus propias excepciones de dominio
 * - El adaptador hace la conversión entre ambos mundos
 */
export class TokenVerifierAdapter implements ITokenVerifier {
  constructor(private readonly tokenService: ITokenService) {}

  verifyAccessToken(token: string): {
    userId: string;
    username: string;
    role: string;
  } {
    try {
      return this.tokenService.verifyAccessToken(token);
    } catch (error) {
      // Convertir excepciones de dominio de auth a excepciones genéricas de shared
      if (error instanceof AuthTokenExpiredError) {
        throw new TokenExpiredError(error.message);
      }
      if (error instanceof AuthInvalidTokenError) {
        throw new InvalidTokenError(error.message);
      }
      // Re-lanzar otros errores sin modificar
      throw error;
    }
  }
}
