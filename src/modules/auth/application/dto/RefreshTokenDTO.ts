/**
 * DTO para refrescar un token
 * Representa los datos que vienen del request HTTP
 */
export interface RefreshTokenDTO {
  refreshToken: string; // Refresh token JWT
}
