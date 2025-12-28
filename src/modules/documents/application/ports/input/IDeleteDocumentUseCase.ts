/**
 * Puerto de entrada (Input Port) para el caso de uso de eliminar documento
 */
export interface IDeleteDocumentUseCase {
  /**
   * Elimina un documento (baja lógica)
   * @param id - ID del documento a eliminar
   * @param deletedBy - ID del usuario que está eliminando el documento
   * @returns true si se eliminó, false si no existía
   * @throws DocumentNotFoundError si el documento no existe
   */
  execute(id: string, deletedBy?: string): Promise<boolean>;
}
