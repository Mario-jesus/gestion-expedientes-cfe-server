import { Minute } from '../../../domain/entities/Minute';
import { ListMinutesFiltersDTO } from '../../dto/ListMinutesFiltersDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de listar minutas
 */
export interface IListMinutesUseCase {
  /**
   * Lista minutas con filtros y paginación
   * @param dto - DTO con filtros y parámetros de paginación
   * @returns Lista de minutas y total de resultados
   */
  execute(dto: ListMinutesFiltersDTO): Promise<{ minutes: Minute[]; total: number }>;
}
