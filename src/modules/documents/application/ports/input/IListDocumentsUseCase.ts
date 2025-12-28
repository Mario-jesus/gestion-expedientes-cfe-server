import { CollaboratorDocument } from '../../../domain/entities/CollaboratorDocument';
import { ListDocumentsFiltersDTO } from '../../dto/ListDocumentsFiltersDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de listar documentos
 */
export interface IListDocumentsUseCase {
  /**
   * Lista documentos con filtros y paginación
   * @param dto - DTO con filtros y parámetros de paginación
   * @returns Lista de documentos y total de resultados
   */
  execute(dto: ListDocumentsFiltersDTO): Promise<{ documents: CollaboratorDocument[]; total: number }>;
}
