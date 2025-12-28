import { TipoContrato } from '../../domain/enums/TipoContrato';

/**
 * DTO para crear un nuevo colaborador
 * Representa los datos que vienen del request HTTP
 */
export interface CreateCollaboratorDTO {
  nombre: string;
  apellidos: string;
  rpe: string;
  rtt?: string; // Opcional
  areaId: string;
  adscripcionId: string;
  puestoId: string;
  tipoContrato: TipoContrato;
  rfc: string;
  curp: string;
  imss: string;
  isActive?: boolean; // Default: true
}
