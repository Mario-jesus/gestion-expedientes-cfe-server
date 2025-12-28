import type { Puesto } from '../../../../domain/entities/Puesto';

/**
 * Puerto de entrada (Input Port) para el caso de uso de desactivar puesto
 */
export interface IDeactivatePuestoUseCase {
  execute(puestoId: string, performedBy?: string): Promise<Puesto>;
}
