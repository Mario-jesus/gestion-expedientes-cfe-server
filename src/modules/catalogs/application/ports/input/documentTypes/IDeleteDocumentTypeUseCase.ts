/**
 * Puerto de entrada (Input Port) para el caso de uso de eliminar tipo de documento
 */
export interface IDeleteDocumentTypeUseCase {
  execute(documentTypeId: string, performedBy?: string): Promise<boolean>;
}
