/**
 * Puerto de entrada (Input Port) para el caso de uso de logout
 * 
 * Define el contrato que debe implementar el caso de uso
 */
export interface ILogoutUseCase {
  /**
   * Cierra sesión de un usuario
   * @param userId - ID del usuario que cierra sesión
   * @param refreshToken - Refresh token a revocar (opcional)
   * @param revokeAllTokens - Si se deben revocar todos los tokens del usuario (default: false)
   * @returns void
   */
  execute(
    userId: string,
    refreshToken?: string,
    revokeAllTokens?: boolean
  ): Promise<void>;
}
