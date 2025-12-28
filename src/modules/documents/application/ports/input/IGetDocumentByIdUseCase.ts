import { CollaboratorDocument } from '../../../domain/entities/CollaboratorDocument';

/**
 * Puerto de entrada (Input Port) para el caso de uso de obtener documento por ID
 */
export interface IGetDocumentByIdUseCase {
  /**
   * Obtiene un documento por su ID
   * @param id - ID del documento a buscar
   * @returns El documento encontrado
   * @throws DocumentNotFoundError si el documento no existe
   */
  execute(id: string): Promise<CollaboratorDocument>;
}
