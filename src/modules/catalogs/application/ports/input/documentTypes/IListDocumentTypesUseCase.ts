import type { DocumentType } from '../../../../domain/entities/DocumentType';
import type { ListDocumentTypesDTO } from '../../../dto/documentTypes/ListDocumentTypesDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de listar tipos de documento
 */
export interface IListDocumentTypesUseCase {
  execute(dto: ListDocumentTypesDTO): Promise<{ documentTypes: DocumentType[]; total: number }>;
}
