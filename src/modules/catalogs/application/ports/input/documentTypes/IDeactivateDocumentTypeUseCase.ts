import type { DocumentType } from '../../../../domain/entities/DocumentType';

/**
 * Puerto de entrada (Input Port) para el caso de uso de desactivar tipo de documento
 */
export interface IDeactivateDocumentTypeUseCase {
  execute(documentTypeId: string, performedBy?: string): Promise<DocumentType>;
}
