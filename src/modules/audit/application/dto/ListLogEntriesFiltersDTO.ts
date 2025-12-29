import { LogAction } from '../../domain/enums/LogAction';
import { LogEntity } from '../../domain/enums/LogEntity';

/**
 * DTO para filtrar logs de auditoría en listados
 */
export interface ListLogEntriesFiltersDTO {
  userId?: string;
  action?: LogAction;
  entity?: LogEntity;
  entityId?: string;
  fechaDesde?: Date | string; // Puede venir como string ISO
  fechaHasta?: Date | string; // Puede venir como string ISO
  limit?: number; // Default: 20
  offset?: number; // Default: 0
  sortBy?: 'createdAt' | 'action' | 'entity'; // Default: createdAt
  sortOrder?: 'asc' | 'desc'; // Default: desc
}
