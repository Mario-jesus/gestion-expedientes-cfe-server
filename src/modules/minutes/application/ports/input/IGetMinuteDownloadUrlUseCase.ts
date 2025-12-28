/**
 * Puerto de entrada (Input Port) para el caso de uso de obtener URL de descarga
 */
export interface IGetMinuteDownloadUrlUseCase {
  /**
   * Obtiene la URL de descarga/visualización de una minuta
   * @param id - ID de la minuta
   * @param viewedBy - ID del usuario que está visualizando la minuta
   * @returns URL completa del archivo, nombre del archivo y tipo MIME
   * @throws MinuteNotFoundError si la minuta no existe
   */
  execute(
    id: string,
    viewedBy?: string
  ): Promise<{ url: string; fileName: string; fileType: string }>;
}
