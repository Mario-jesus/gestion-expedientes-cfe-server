import { Minute } from '../../../domain/entities/Minute';
import { CreateMinuteDTO } from '../../dto/CreateMinuteDTO';
import { UploadedFile } from '@modules/documents/domain/ports/output/IFileStorageService';

/**
 * Puerto de entrada (Input Port) para el caso de uso de crear minuta
 * 
 * Define el contrato que debe implementar el caso de uso
 */
export interface ICreateMinuteUseCase {
  /**
   * Crea una nueva minuta en el sistema
   * @param dto - DTO con los datos de la minuta a crear
   * @param file - Archivo a subir (Buffer o UploadedFile)
   * @param uploadedBy - ID del usuario que está subiendo la minuta
   * @returns La minuta creada
   * @throws InvalidFileTypeError si el tipo de archivo no es permitido
   * @throws FileSizeExceededError si el tamaño del archivo excede el límite
   */
  execute(
    dto: CreateMinuteDTO,
    file: Buffer | UploadedFile,
    uploadedBy: string
  ): Promise<Minute>;
}
