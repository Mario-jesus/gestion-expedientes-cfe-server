/**
 * DTO para actualizar un área existente
 * Todos los campos son opcionales (actualización parcial)
 */
export interface UpdateAreaDTO {
  nombre?: string;
  descripcion?: string;
  isActive?: boolean;
}
