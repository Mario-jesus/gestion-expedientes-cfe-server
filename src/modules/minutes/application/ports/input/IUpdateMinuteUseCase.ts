import { Minute } from '../../../domain/entities/Minute';
import { UpdateMinuteDTO } from '../../dto/UpdateMinuteDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de actualizar minuta
 */
export interface IUpdateMinuteUseCase {
  /**
   * Actualiza una minuta existente
   * @param id - ID de la minuta a actualizar
   * @param dto - DTO con los campos a actualizar
   * @param updatedBy - ID del usuario que está actualizando la minuta
   * @returns La minuta actualizada
   * @throws MinuteNotFoundError si la minuta no existe
   */
  execute(id: string, dto: UpdateMinuteDTO, updatedBy?: string): Promise<Minute>;
}
