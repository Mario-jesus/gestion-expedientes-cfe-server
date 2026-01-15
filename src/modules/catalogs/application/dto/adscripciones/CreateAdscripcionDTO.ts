/**
 * DTO para crear una nueva adscripción
 * Representa los datos que vienen del request HTTP
 */
export interface CreateAdscripcionDTO {
  nombre: string;
  adscripcion: string;
  descripcion?: string;
  isActive?: boolean; // Default: true
}
