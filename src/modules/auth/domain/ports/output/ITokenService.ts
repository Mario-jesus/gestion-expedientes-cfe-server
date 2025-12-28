/**
 * Interfaz para el servicio de tokens JWT
 * 
 * Este es un Output Port (Driven Port) - el dominio define lo que necesita
 * para generar, verificar y decodificar tokens JWT.
 * 
 * La implementación concreta estará en la capa de infraestructura.
 */
export interface ITokenService {
  /**
   * Genera un access token JWT
   * @param payload - Datos a incluir en el token (userId, username, role)
   * @returns Token JWT como string
   */
  generateAccessToken(payload: {
    userId: string;
    username: string;
    role: string;
  }): string;

  /**
   * Genera un refresh token JWT
   * @param payload - Datos a incluir en el token (userId)
   * @returns Refresh token JWT como string
   */
  generateRefreshToken(payload: { userId: string }): string;

  /**
   * Verifica y decodifica un access token
   * @param token - Token JWT a verificar
   * @returns Payload decodificado si el token es válido, null si es inválido
   * @throws InvalidTokenError si el token es inválido
   * @throws TokenExpiredError si el token ha expirado
   */
  verifyAccessToken(token: string): {
    userId: string;
    username: string;
    role: string;
  };

  /**
   * Verifica y decodifica un refresh token
   * @param token - Refresh token JWT a verificar
   * @returns Payload decodificado si el token es válido, null si es inválido
   * @throws InvalidTokenError si el token es inválido
   * @throws TokenExpiredError si el token ha expirado
   */
  verifyRefreshToken(token: string): {
    userId: string;
  };

  /**
   * Decodifica un token sin verificar su firma
   * Útil para obtener información del token sin validarlo
   * @param token - Token JWT a decodificar
   * @returns Payload decodificado o null si no se puede decodificar
   */
  decodeToken(token: string): {
    userId?: string;
    username?: string;
    role?: string;
    exp?: number;
    iat?: number;
  } | null;
}
