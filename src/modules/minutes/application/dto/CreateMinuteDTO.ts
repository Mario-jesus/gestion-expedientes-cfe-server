import { MinuteType } from '../../domain/enums/MinuteType';

/**
 * DTO para crear una nueva minuta
 * Representa los datos que vienen del request HTTP (multipart/form-data)
 */
export interface CreateMinuteDTO {
  titulo: string;
  tipo: MinuteType;
  descripcion?: string; // Opcional
  fecha: Date | string; // Fecha del evento (puede venir como string ISO)
  // El archivo se maneja por separado en el controller
}
