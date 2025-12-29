import { LogEntry } from '../../../domain/entities/LogEntry';

/**
 * Puerto de entrada (Input Port) para el caso de uso de obtener log por ID
 */
export interface IGetLogEntryByIdUseCase {
  /**
   * Obtiene un log de auditoría por su ID
   * @param id - ID del log
   * @returns El log si existe, null si no existe
   */
  execute(id: string): Promise<LogEntry | null>;
}
