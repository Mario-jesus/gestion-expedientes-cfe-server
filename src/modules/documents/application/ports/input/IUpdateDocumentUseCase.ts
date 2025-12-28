import { CollaboratorDocument } from '../../../domain/entities/CollaboratorDocument';
import { UpdateDocumentDTO } from '../../dto/UpdateDocumentDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de actualizar documento
 */
export interface IUpdateDocumentUseCase {
  /**
   * Actualiza un documento existente
   * @param id - ID del documento a actualizar
   * @param dto - DTO con los campos a actualizar
   * @param updatedBy - ID del usuario que está actualizando el documento
   * @returns El documento actualizado
   * @throws DocumentNotFoundError si el documento no existe
   */
  execute(id: string, dto: UpdateDocumentDTO, updatedBy?: string): Promise<CollaboratorDocument>;
}
