import type { Puesto } from '../../../../domain/entities/Puesto';
import { CreatePuestoDTO } from '../../../dto/puestos/CreatePuestoDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de crear puesto
 */
export interface ICreatePuestoUseCase {
  execute(dto: CreatePuestoDTO, createdBy?: string): Promise<Puesto>;
}
