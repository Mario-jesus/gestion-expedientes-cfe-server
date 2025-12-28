/**
 * Puerto de entrada (Input Port) para el caso de uso de obtener URL de descarga
 */
export interface IGetDocumentDownloadUrlUseCase {
  /**
   * Obtiene la URL para descargar/visualizar un documento
   * @param id - ID del documento
   * @param viewedBy - ID del usuario que está visualizando el documento
   * @returns URL completa del archivo
   * @throws DocumentNotFoundError si el documento no existe
   */
  execute(id: string, viewedBy?: string): Promise<{ url: string; fileName: string; fileType: string }>;
}
