import { TipoContrato } from '../../domain/enums/TipoContrato';

/**
 * DTO para actualizar un colaborador existente
 * Todos los campos son opcionales (actualización parcial)
 */
export interface UpdateCollaboratorDTO {
  nombre?: string;
  apellidos?: string;
  rtt?: string;
  areaId?: string;
  adscripcionId?: string;
  puestoId?: string;
  tipoContrato?: TipoContrato;
  rfc?: string;
  curp?: string;
  imss?: string;
  isActive?: boolean;
}
