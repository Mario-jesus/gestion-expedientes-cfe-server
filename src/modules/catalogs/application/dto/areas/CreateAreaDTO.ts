/**
 * DTO para crear un nuevo área
 * Representa los datos que vienen del request HTTP
 */
export interface CreateAreaDTO {
  nombre: string;
  descripcion?: string;
  isActive?: boolean; // Default: true
}
