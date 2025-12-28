/**
 * Puerto de entrada (Input Port) para el caso de uso de eliminar minuta
 */
export interface IDeleteMinuteUseCase {
  /**
   * Elimina una minuta (baja lógica)
   * @param id - ID de la minuta a eliminar
   * @param deletedBy - ID del usuario que está eliminando la minuta
   * @returns true si se eliminó, false si no existía
   * @throws MinuteNotFoundError si la minuta no existe
   */
  execute(id: string, deletedBy?: string): Promise<boolean>;
}
