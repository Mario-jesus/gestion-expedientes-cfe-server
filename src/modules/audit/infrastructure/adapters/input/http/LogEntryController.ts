import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@shared/infrastructure';
import { LogAction } from '@modules/audit/domain/enums/LogAction';
import { LogEntity } from '@modules/audit/domain/enums/LogEntity';
import {
  IGetLogEntryByIdUseCase,
  IListLogEntriesUseCase,
  IGetLogEntriesByEntityUseCase,
  IGetLogEntriesByUserIdUseCase,
} from '@modules/audit/application/ports/input';
import { ListLogEntriesFiltersDTO } from '@modules/audit/application/dto';

/**
 * Controller HTTP para la gestión de logs de auditoría
 * 
 * Este controller actúa como adaptador de entrada (Input Adapter) que convierte
 * requests HTTP en llamadas a casos de uso de la capa de aplicación.
 * 
 * Responsabilidades:
 * - Recibir requests HTTP
 * - Validar y mapear datos del request a DTOs
 * - Llamar a los casos de uso correspondientes
 * - Formatear respuestas HTTP
 * - Manejar errores (delegados al errorHandler de Express)
 * 
 * Nota: Los logs son inmutables, solo se pueden leer (no crear, actualizar ni eliminar desde HTTP)
 */
export class LogEntryController {
  constructor(
    private readonly getLogEntryByIdUseCase: IGetLogEntryByIdUseCase,
    private readonly listLogEntriesUseCase: IListLogEntriesUseCase,
    private readonly getLogEntriesByEntityUseCase: IGetLogEntriesByEntityUseCase,
    private readonly getLogEntriesByUserIdUseCase: IGetLogEntriesByUserIdUseCase
  ) {}

  /**
   * GET /audit/:id
   * Obtiene un log de auditoría por su ID
   * Requiere autenticación
   */
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      const logEntry = await this.getLogEntryByIdUseCase.execute(id);

      if (!logEntry) {
        res.status(404).json({
          error: `Log entry with ID ${id} not found`,
          code: 'LOG_ENTRY_NOT_FOUND',
        });
        return;
      }

      res.status(200).json(logEntry.toPublicJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /audit
   * Lista logs de auditoría con filtros y paginación
   * Requiere autenticación
   * 
   * Query params:
   * - userId?: string
   * - action?: LogAction
   * - entity?: LogEntity
   * - entityId?: string
   * - fechaDesde?: string (ISO date)
   * - fechaHasta?: string (ISO date)
   * - limit?: number (default: 20)
   * - offset?: number (default: 0)
   * - sortBy?: 'createdAt' | 'action' | 'entity' (default: createdAt)
   * - sortOrder?: 'asc' | 'desc' (default: desc)
   */
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
      const sortBy = req.query.sortBy as 'createdAt' | 'action' | 'entity' | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      // Validar action si está presente
      let action: LogAction | undefined;
      if (req.query.action) {
        const actionStr = req.query.action as string;
        if (Object.values(LogAction).includes(actionStr as LogAction)) {
          action = actionStr as LogAction;
        } else {
          res.status(400).json({
            error: `action debe ser uno de: ${Object.values(LogAction).join(', ')}`,
            code: 'INVALID_ACTION',
            field: 'action',
          });
          return;
        }
      }

      // Validar entity si está presente
      let entity: LogEntity | undefined;
      if (req.query.entity) {
        const entityStr = req.query.entity as string;
        if (Object.values(LogEntity).includes(entityStr as LogEntity)) {
          entity = entityStr as LogEntity;
        } else {
          res.status(400).json({
            error: `entity debe ser uno de: ${Object.values(LogEntity).join(', ')}`,
            code: 'INVALID_ENTITY',
            field: 'entity',
          });
          return;
        }
      }

      // Convertir fechas si están presentes
      let fechaDesde: Date | string | undefined;
      if (req.query.fechaDesde) {
        const fechaDesdeStr = req.query.fechaDesde as string;
        const fechaDesdeDate = new Date(fechaDesdeStr);
        if (isNaN(fechaDesdeDate.getTime())) {
          res.status(400).json({
            error: 'fechaDesde debe ser una fecha válida (ISO string)',
            code: 'INVALID_FECHA_DESDE',
            field: 'fechaDesde',
          });
          return;
        }
        fechaDesde = fechaDesdeDate;
      }

      let fechaHasta: Date | string | undefined;
      if (req.query.fechaHasta) {
        const fechaHastaStr = req.query.fechaHasta as string;
        const fechaHastaDate = new Date(fechaHastaStr);
        if (isNaN(fechaHastaDate.getTime())) {
          res.status(400).json({
            error: 'fechaHasta debe ser una fecha válida (ISO string)',
            code: 'INVALID_FECHA_HASTA',
            field: 'fechaHasta',
          });
          return;
        }
        fechaHasta = fechaHastaDate;
      }

      const dto: ListLogEntriesFiltersDTO = {
        ...(req.query.userId && { userId: req.query.userId as string }),
        ...(action && { action }),
        ...(entity && { entity }),
        ...(req.query.entityId && { entityId: req.query.entityId as string }),
        ...(fechaDesde && { fechaDesde }),
        ...(fechaHasta && { fechaHasta }),
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
      };

      const result = await this.listLogEntriesUseCase.execute(dto);

      res.status(200).json({
        data: result.logs.map((log) => log.toPublicJSON()),
        pagination: {
          total: result.total,
          limit: dto.limit ?? 20,
          offset: dto.offset ?? 0,
          totalPages: Math.ceil(result.total / (dto.limit ?? 20)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /audit/entity/:entity/:entityId
   * Obtiene todos los logs de una entidad específica
   * Requiere autenticación
   * 
   * Query params:
   * - limit?: number (default: 20)
   * - offset?: number (default: 0)
   */
  async getByEntity(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const entityParam = req.params.entity as string;
      const entityId = req.params.entityId as string;

      // Validar entity
      if (!Object.values(LogEntity).includes(entityParam as LogEntity)) {
        res.status(400).json({
          error: `entity debe ser uno de: ${Object.values(LogEntity).join(', ')}`,
          code: 'INVALID_ENTITY',
          field: 'entity',
        });
        return;
      }

      const entity = entityParam as LogEntity;

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

      const result = await this.getLogEntriesByEntityUseCase.execute(entity, entityId, limit, offset);

      res.status(200).json({
        data: result.logs.map((log) => log.toPublicJSON()),
        pagination: {
          total: result.total,
          limit: limit ?? 20,
          offset: offset ?? 0,
          totalPages: Math.ceil(result.total / (limit ?? 20)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /audit/user/:userId
   * Obtiene todos los logs de un usuario específico
   * Requiere autenticación
   * 
   * Query params:
   * - limit?: number (default: 20)
   * - offset?: number (default: 0)
   */
  async getByUserId(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId as string;

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

      const result = await this.getLogEntriesByUserIdUseCase.execute(userId, limit, offset);

      res.status(200).json({
        data: result.logs.map((log) => log.toPublicJSON()),
        pagination: {
          total: result.total,
          limit: limit ?? 20,
          offset: offset ?? 0,
          totalPages: Math.ceil(result.total / (limit ?? 20)),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
