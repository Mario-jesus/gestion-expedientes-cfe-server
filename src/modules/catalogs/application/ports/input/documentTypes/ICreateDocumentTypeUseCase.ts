import type { DocumentType } from '../../../../domain/entities/DocumentType';
import { CreateDocumentTypeDTO } from '../../../dto/documentTypes/CreateDocumentTypeDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de crear tipo de documento
 */
export interface ICreateDocumentTypeUseCase {
  execute(dto: CreateDocumentTypeDTO, createdBy?: string): Promise<DocumentType>;
}
