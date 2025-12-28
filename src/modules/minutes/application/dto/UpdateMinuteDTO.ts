import { MinuteType } from '../../domain/enums/MinuteType';

/**
 * DTO para actualizar una minuta
 * Representa los datos que vienen del request HTTP
 */
export interface UpdateMinuteDTO {
  titulo?: string;
  tipo?: MinuteType;
  descripcion?: string;
  fecha?: Date | string; // Fecha del evento (puede venir como string ISO)
  isActive?: boolean;
}
