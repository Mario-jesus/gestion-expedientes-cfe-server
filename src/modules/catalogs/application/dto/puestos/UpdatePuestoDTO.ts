/**
 * DTO para actualizar un puesto existente
 * Todos los campos son opcionales (actualización parcial)
 */
export interface UpdatePuestoDTO {
  nombre?: string;
  descripcion?: string;
  isActive?: boolean;
}
