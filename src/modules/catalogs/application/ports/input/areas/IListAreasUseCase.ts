import type { Area } from '../../../../domain/entities/Area';
import type { ListAreasDTO } from '../../../dto/areas/ListAreasDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de listar áreas
 */
export interface IListAreasUseCase {
  execute(dto: ListAreasDTO): Promise<{ areas: Area[]; total: number }>;
}
