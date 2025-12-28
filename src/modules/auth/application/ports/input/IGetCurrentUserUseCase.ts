/**
 * Puerto de entrada (Input Port) para el caso de uso de obtener usuario actual
 * 
 * Define el contrato que debe implementar el caso de uso
 */
export interface IGetCurrentUserUseCase {
  /**
   * Obtiene el usuario actual basado en el token JWT
   * @param userId - ID del usuario extraído del token
   * @returns Datos públicos del usuario
   * @throws UserNotFoundError si el usuario no existe
   * @throws UserInactiveError si el usuario está inactivo
   */
  execute(userId: string): Promise<{
    id: string;
    username: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
}
