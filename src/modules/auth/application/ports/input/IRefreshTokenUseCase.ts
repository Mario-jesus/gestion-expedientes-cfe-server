import { RefreshTokenDTO } from '../../dto/RefreshTokenDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de refrescar token
 * 
 * Define el contrato que debe implementar el caso de uso
 */
export interface IRefreshTokenUseCase {
  /**
   * Refresca un access token usando un refresh token válido
   * Implementa rotación de tokens: invalida el refresh token usado y genera uno nuevo
   * @param dto - DTO con el refresh token
   * @param ipAddress - IP del cliente (opcional, para auditoría)
   * @param userAgent - User-Agent del cliente (opcional, para auditoría)
   * @returns Nuevo access token, nuevo refresh token y tiempo de expiración
   * @throws InvalidTokenError si el refresh token es inválido o ya fue usado (reutilización detectada)
   * @throws ExpiredRefreshTokenAttemptError si se detecta intento de usar token expirado (todos los tokens del usuario serán revocados)
   */
  execute(
    dto: RefreshTokenDTO,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    token: string;
    refreshToken: string;
    expiresIn: number;
  }>;
}
