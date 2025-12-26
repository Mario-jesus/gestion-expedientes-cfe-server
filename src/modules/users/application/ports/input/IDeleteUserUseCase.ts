/**
 * Puerto de entrada (Input Port) para el caso de uso de eliminar usuario
 * 
 * Define el contrato que debe implementar el caso de uso
 */
export interface IDeleteUserUseCase {
  /**
   * Elimina un usuario del sistema (baja física)
   * @param userId - ID del usuario a eliminar
   * @param performedBy - ID del usuario que realiza la acción (para autorización y auditoría)
   * @returns true si se eliminó, false si no existía
   * @throws ForbiddenError si el usuario no tiene permisos o intenta eliminarse a sí mismo
   * @throws UserNotFoundError si el usuario no existe
   */
  execute(userId: string, performedBy?: string): Promise<boolean>;
}
