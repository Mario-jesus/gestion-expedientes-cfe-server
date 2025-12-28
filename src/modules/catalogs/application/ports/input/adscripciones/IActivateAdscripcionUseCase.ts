import type { Adscripcion } from '../../../../domain/entities/Adscripcion';

/**
 * Puerto de entrada (Input Port) para el caso de uso de activar adscripción
 */
export interface IActivateAdscripcionUseCase {
  execute(adscripcionId: string, performedBy?: string): Promise<Adscripcion>;
}
