import type { Puesto } from '../../../../domain/entities/Puesto';

/**
 * Puerto de entrada (Input Port) para el caso de uso de activar puesto
 */
export interface IActivatePuestoUseCase {
  execute(puestoId: string, performedBy?: string): Promise<Puesto>;
}
