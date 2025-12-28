import type { Area } from '../../../../domain/entities/Area';
import type { UpdateAreaDTO } from '../../../dto/areas/UpdateAreaDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de actualizar área
 */
export interface IUpdateAreaUseCase {
  execute(areaId: string, dto: UpdateAreaDTO, performedBy?: string): Promise<Area>;
}
