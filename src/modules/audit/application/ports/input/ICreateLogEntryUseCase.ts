import { LogEntry } from '../../../domain/entities/LogEntry';
import { CreateLogEntryDTO } from '../../dto/CreateLogEntryDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de crear log de auditoría
 * 
 * Define el contrato que debe implementar el caso de uso
 */
export interface ICreateLogEntryUseCase {
  /**
   * Crea un nuevo log de auditoría
   * @param dto - DTO con los datos del log a crear
   * @returns El log creado
   */
  execute(dto: CreateLogEntryDTO): Promise<LogEntry>;
}
