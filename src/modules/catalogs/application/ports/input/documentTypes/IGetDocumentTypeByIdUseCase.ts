import type { DocumentType } from '../../../../domain/entities/DocumentType';

/**
 * Puerto de entrada (Input Port) para el caso de uso de obtener tipo de documento por ID
 */
export interface IGetDocumentTypeByIdUseCase {
  execute(id: string): Promise<DocumentType>;
}
