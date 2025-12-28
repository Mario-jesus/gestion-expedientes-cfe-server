import type { Puesto } from '../../../../domain/entities/Puesto';
import type { UpdatePuestoDTO } from '../../../dto/puestos/UpdatePuestoDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de actualizar puesto
 */
export interface IUpdatePuestoUseCase {
  execute(puestoId: string, dto: UpdatePuestoDTO, performedBy?: string): Promise<Puesto>;
}
