/**
 * DTO para actualizar una adscripción existente
 * Todos los campos son opcionales (actualización parcial)
 */
export interface UpdateAdscripcionDTO {
  nombre?: string;
  adscripcion?: string;
  descripcion?: string;
  isActive?: boolean;
}
