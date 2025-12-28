import { MinuteType } from '../../domain/enums/MinuteType';

/**
 * DTO para filtrar minutas en listados
 */
export interface ListMinutesFiltersDTO {
  tipo?: MinuteType;
  isActive?: boolean;
  fechaDesde?: Date | string; // Puede venir como string ISO
  fechaHasta?: Date | string; // Puede venir como string ISO
  search?: string; // Búsqueda por título o descripción
  limit?: number; // Default: 20
  offset?: number; // Default: 0
  sortBy?: 'createdAt' | 'fecha' | 'titulo' | 'uploadedAt'; // Default: createdAt
  sortOrder?: 'asc' | 'desc'; // Default: desc
}
