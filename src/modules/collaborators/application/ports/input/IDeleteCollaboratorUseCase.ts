/**
 * Puerto de entrada (Input Port) para el caso de uso de eliminar colaborador
 * 
 * Define el contrato que debe implementar el caso de uso
 */
export interface IDeleteCollaboratorUseCase {
  /**
   * Elimina un colaborador del sistema (baja lógica)
   * @param collaboratorId - ID del colaborador a eliminar
   * @param performedBy - ID del usuario que realiza la acción (opcional, para auditoría)
   * @returns true si se eliminó, false si no existía
   * @throws CollaboratorNotFoundError si el colaborador no existe
   */
  execute(collaboratorId: string, performedBy?: string): Promise<boolean>;
}
