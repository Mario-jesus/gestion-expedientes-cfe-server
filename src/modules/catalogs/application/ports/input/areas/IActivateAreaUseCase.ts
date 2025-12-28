import type { Area } from '../../../../domain/entities/Area';

/**
 * Puerto de entrada (Input Port) para el caso de uso de activar área
 */
export interface IActivateAreaUseCase {
  execute(areaId: string, performedBy?: string): Promise<Area>;
}
