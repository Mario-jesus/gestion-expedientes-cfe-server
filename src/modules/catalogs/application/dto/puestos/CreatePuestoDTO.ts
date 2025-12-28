/**
 * DTO para crear un nuevo puesto
 * Representa los datos que vienen del request HTTP
 */
export interface CreatePuestoDTO {
  nombre: string;
  descripcion?: string;
  isActive?: boolean; // Default: true
}
