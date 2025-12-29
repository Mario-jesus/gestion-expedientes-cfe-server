import { LogEntry } from '../../../domain/entities/LogEntry';
import { ListLogEntriesFiltersDTO } from '../../dto/ListLogEntriesFiltersDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de listar logs
 */
export interface IListLogEntriesUseCase {
  /**
   * Lista logs de auditoría con filtros y paginación
   * @param dto - DTO con filtros y parámetros de paginación
   * @returns Lista de logs y total de resultados
   */
  execute(dto: ListLogEntriesFiltersDTO): Promise<{ logs: LogEntry[]; total: number }>;
}
