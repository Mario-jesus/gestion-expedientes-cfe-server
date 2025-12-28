import type { Area } from '../../../../domain/entities/Area';

/**
 * Puerto de entrada (Input Port) para el caso de uso de obtener área por ID
 */
export interface IGetAreaByIdUseCase {
  execute(id: string): Promise<Area>;
}
