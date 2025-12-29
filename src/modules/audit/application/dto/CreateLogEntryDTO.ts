import { LogAction } from '../../domain/enums/LogAction';
import { LogEntity } from '../../domain/enums/LogEntity';

/**
 * DTO para crear un log de auditoría
 * Normalmente se crea automáticamente desde eventos de dominio,
 * pero también puede crearse manualmente si es necesario
 */
export interface CreateLogEntryDTO {
  userId: string;
  action: LogAction;
  entity: LogEntity;
  entityId: string;
  metadata?: Record<string, unknown>; // Opcional: información adicional
}
