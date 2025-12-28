import type { DocumentType } from '../../../../domain/entities/DocumentType';

/**
 * Puerto de entrada (Input Port) para el caso de uso de activar tipo de documento
 */
export interface IActivateDocumentTypeUseCase {
  execute(documentTypeId: string, performedBy?: string): Promise<DocumentType>;
}
