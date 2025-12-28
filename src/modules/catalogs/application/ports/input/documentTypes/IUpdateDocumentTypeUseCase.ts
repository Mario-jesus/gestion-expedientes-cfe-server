import type { DocumentType } from '../../../../domain/entities/DocumentType';
import type { UpdateDocumentTypeDTO } from '../../../dto/documentTypes/UpdateDocumentTypeDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de actualizar tipo de documento
 */
export interface IUpdateDocumentTypeUseCase {
  execute(documentTypeId: string, dto: UpdateDocumentTypeDTO, performedBy?: string): Promise<DocumentType>;
}
