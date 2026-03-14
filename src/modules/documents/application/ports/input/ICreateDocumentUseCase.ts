import { CollaboratorDocument } from '../../../domain/entities/CollaboratorDocument';
import { CreateDocumentDTO } from '../../dto/CreateDocumentDTO';
import { UploadedFile } from '../../../domain/ports/output/IFileStorageService';

/**
 * Puerto de entrada (Input Port) para el caso de uso de crear documento
 * 
 * Define el contrato que debe implementar el caso de uso
 */
export interface ICreateDocumentUseCase {
  /**
   * Crea un nuevo documento en el sistema
   * @param dto - DTO con los datos del documento a crear
   * @param file - Archivo a subir (Buffer o UploadedFile)
   * @param uploadedBy - ID del usuario que está subiendo el documento
   * @returns El documento creado
   * @throws CollaboratorNotFoundError si el colaborador no existe
   * @throws InvalidFileTypeError si el tipo de archivo no es permitido
   * @throws FileSizeExceededError si el tamaño del archivo excede el límite
   */
  execute(
    dto: CreateDocumentDTO,
    file: Buffer | UploadedFile,
    uploadedBy: string
  ): Promise<CollaboratorDocument>;
}
