import { Minute } from '../../../domain/entities/Minute';

/**
 * Puerto de entrada (Input Port) para el caso de uso de obtener minuta por ID
 */
export interface IGetMinuteByIdUseCase {
  /**
   * Obtiene una minuta por su ID
   * @param id - ID de la minuta a buscar
   * @returns La minuta encontrada
   * @throws MinuteNotFoundError si la minuta no existe
   */
  execute(id: string): Promise<Minute>;
}
