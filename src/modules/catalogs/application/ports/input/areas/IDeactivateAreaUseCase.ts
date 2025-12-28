import type { Area } from '../../../../domain/entities/Area';

/**
 * Puerto de entrada (Input Port) para el caso de uso de desactivar área
 */
export interface IDeactivateAreaUseCase {
  execute(areaId: string, performedBy?: string): Promise<Area>;
}
