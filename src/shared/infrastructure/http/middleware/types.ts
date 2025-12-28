/**
 * Tipos e interfaces para middlewares HTTP compartidos
 * Estos tipos son genéricos y no dependen de ningún módulo específico
 */

/**
 * Payload del token de acceso después de verificación
 */
export interface AccessTokenPayload {
  userId: string;
  username: string;
  role: string;
}

/**
 * Errores que puede lanzar el verificador de tokens
 */
export class TokenExpiredError extends Error {
  constructor(message: string = 'Token expirado') {
    super(message);
    this.name = 'TokenExpiredError';
  }
}

export class InvalidTokenError extends Error {
  constructor(message: string = 'Token inválido') {
    super(message);
    this.name = 'InvalidTokenError';
  }
}

/**
 * Interfaz mínima para un verificador de tokens
 * Permite que cualquier servicio que pueda verificar tokens sea usado
 * sin depender de implementaciones específicas de módulos
 */
export interface ITokenVerifier {
  /**
   * Verifica y decodifica un access token
   * @param token - Token JWT a verificar
   * @returns Payload decodificado si el token es válido
   * @throws TokenExpiredError si el token ha expirado
   * @throws InvalidTokenError si el token es inválido
   */
  verifyAccessToken(token: string): AccessTokenPayload;
}
