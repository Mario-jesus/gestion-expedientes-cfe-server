/**
 * Mock de LogEntryRepository para tests
 * Implementa ILogEntryRepository usando almacenamiento en memoria
 * 
 * Este mock permite ejecutar tests E2E sin necesidad de MongoDB
 */

import { LogEntry } from '@modules/audit/domain/entities/LogEntry';
import { ILogEntryRepository } from '@modules/audit/domain/ports/output/ILogEntryRepository';
import { LogAction } from '@modules/audit/domain/enums/LogAction';
import { LogEntity } from '@modules/audit/domain/enums/LogEntity';
import { ILogger } from '@shared/domain';

export class InMemoryLogEntryRepository implements ILogEntryRepository {
  private logs: Map<string, LogEntry> = new Map();
  private logsByUserId: Map<string, string[]> = new Map(); // userId -> logIds[]
  private logsByEntity: Map<string, string[]> = new Map(); // entity:entityId -> logIds[]
  private logsByAction: Map<LogAction, string[]> = new Map(); // action -> logIds[]

  constructor(private readonly logger: ILogger) {}

  async findById(id: string): Promise<LogEntry | null> {
    return this.logs.get(id) || null;
  }

  async create(logEntry: LogEntry): Promise<LogEntry> {
    // Guardar log
    this.logs.set(logEntry.id, logEntry);

    // Actualizar índice por userId
    const userLogs = this.logsByUserId.get(logEntry.userId) || [];
    if (!userLogs.includes(logEntry.id)) {
      userLogs.push(logEntry.id);
      this.logsByUserId.set(logEntry.userId, userLogs);
    }

    // Actualizar índice por entity:entityId
    const entityKey = `${logEntry.entity}:${logEntry.entityId}`;
    const entityLogs = this.logsByEntity.get(entityKey) || [];
    if (!entityLogs.includes(logEntry.id)) {
      entityLogs.push(logEntry.id);
      this.logsByEntity.set(entityKey, entityLogs);
    }

    // Actualizar índice por action
    const actionLogs = this.logsByAction.get(logEntry.action) || [];
    if (!actionLogs.includes(logEntry.id)) {
      actionLogs.push(logEntry.id);
      this.logsByAction.set(logEntry.action, actionLogs);
    }

    this.logger.debug('Log de auditoría creado en memoria', {
      logId: logEntry.id,
      userId: logEntry.userId,
      action: logEntry.action,
      entity: logEntry.entity,
      entityId: logEntry.entityId,
    });

    return logEntry;
  }

  async findAll(
    filters?: {
      userId?: string;
      action?: LogAction;
      entity?: LogEntity;
      entityId?: string;
      fechaDesde?: Date;
      fechaHasta?: Date;
    },
    limit: number = 20,
    offset: number = 0
  ): Promise<{ logs: LogEntry[]; total: number }> {
    let filteredLogs = Array.from(this.logs.values());

    // Aplicar filtros
    if (filters?.userId) {
      filteredLogs = filteredLogs.filter(
        (log) => log.userId === filters.userId
      );
    }

    if (filters?.action) {
      filteredLogs = filteredLogs.filter(
        (log) => log.action === filters.action
      );
    }

    if (filters?.entity) {
      filteredLogs = filteredLogs.filter(
        (log) => log.entity === filters.entity
      );
    }

    if (filters?.entityId) {
      filteredLogs = filteredLogs.filter(
        (log) => log.entityId === filters.entityId
      );
    }

    if (filters?.fechaDesde) {
      filteredLogs = filteredLogs.filter(
        (log) => log.createdAt >= filters.fechaDesde!
      );
    }

    if (filters?.fechaHasta) {
      filteredLogs = filteredLogs.filter(
        (log) => log.createdAt <= filters.fechaHasta!
      );
    }

    // Ordenar por fecha (más recientes primero)
    filteredLogs.sort((a, b) => {
      const aDate = a.createdAt.getTime();
      const bDate = b.createdAt.getTime();
      return bDate - aDate;
    });

    const total = filteredLogs.length;

    // Aplicar paginación
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);

    return {
      logs: paginatedLogs,
      total,
    };
  }

  async findByEntity(
    entity: LogEntity,
    entityId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ logs: LogEntry[]; total: number }> {
    const entityKey = `${entity}:${entityId}`;
    const logIds = this.logsByEntity.get(entityKey) || [];
    let logs = logIds
      .map((id) => this.logs.get(id))
      .filter((log): log is LogEntry => log !== undefined);

    // Ordenar por fecha (más recientes primero)
    logs.sort((a, b) => {
      const aDate = a.createdAt.getTime();
      const bDate = b.createdAt.getTime();
      return bDate - aDate;
    });

    const total = logs.length;

    // Aplicar paginación
    const paginatedLogs = logs.slice(offset, offset + limit);

    return {
      logs: paginatedLogs,
      total,
    };
  }

  async findByUserId(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ logs: LogEntry[]; total: number }> {
    const logIds = this.logsByUserId.get(userId) || [];
    let logs = logIds
      .map((id) => this.logs.get(id))
      .filter((log): log is LogEntry => log !== undefined);

    // Ordenar por fecha (más recientes primero)
    logs.sort((a, b) => {
      const aDate = a.createdAt.getTime();
      const bDate = b.createdAt.getTime();
      return bDate - aDate;
    });

    const total = logs.length;

    // Aplicar paginación
    const paginatedLogs = logs.slice(offset, offset + limit);

    return {
      logs: paginatedLogs,
      total,
    };
  }

  async findByAction(
    action: LogAction,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ logs: LogEntry[]; total: number }> {
    const logIds = this.logsByAction.get(action) || [];
    let logs = logIds
      .map((id) => this.logs.get(id))
      .filter((log): log is LogEntry => log !== undefined);

    // Ordenar por fecha (más recientes primero)
    logs.sort((a, b) => {
      const aDate = a.createdAt.getTime();
      const bDate = b.createdAt.getTime();
      return bDate - aDate;
    });

    const total = logs.length;

    // Aplicar paginación
    const paginatedLogs = logs.slice(offset, offset + limit);

    return {
      logs: paginatedLogs,
      total,
    };
  }

  async findByDateRange(
    fechaDesde: Date,
    fechaHasta: Date,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ logs: LogEntry[]; total: number }> {
    let logs = Array.from(this.logs.values());

    // Filtrar por rango de fechas
    logs = logs.filter(
      (log) => log.createdAt >= fechaDesde && log.createdAt <= fechaHasta
    );

    // Ordenar por fecha (más recientes primero)
    logs.sort((a, b) => {
      const aDate = a.createdAt.getTime();
      const bDate = b.createdAt.getTime();
      return bDate - aDate;
    });

    const total = logs.length;

    // Aplicar paginación
    const paginatedLogs = logs.slice(offset, offset + limit);

    return {
      logs: paginatedLogs,
      total,
    };
  }

  /**
   * Limpia todos los logs (útil para tests)
   */
  clear(): void {
    this.logs.clear();
    this.logsByUserId.clear();
    this.logsByEntity.clear();
    this.logsByAction.clear();
  }
}
