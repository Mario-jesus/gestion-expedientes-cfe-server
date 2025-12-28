import type { Area } from '../../../../domain/entities/Area';
import { CreateAreaDTO } from '../../../dto/areas/CreateAreaDTO';

/**
 * Puerto de entrada (Input Port) para el caso de uso de crear área
 */
export interface ICreateAreaUseCase {
  execute(dto: CreateAreaDTO, createdBy?: string): Promise<Area>;
}
