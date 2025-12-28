/**
 * DTO para actualizar una adscripción existente
 * Todos los campos son opcionales (actualización parcial)
 */
export interface UpdateAdscripcionDTO {
  nombre?: string;
  areaId?: string;
  descripcion?: string;
  isActive?: boolean;
}
