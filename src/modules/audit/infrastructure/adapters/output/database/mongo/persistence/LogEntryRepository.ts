import { Types } from 'mongoose';
import { ILogger } from '@shared/domain';
import { LogEntry } from '@modules/audit/domain/entities/LogEntry';
import { ILogEntryRepository } from '@modules/audit/domain/ports/output/ILogEntryRepository';
import { LogAction } from '@modules/audit/domain/enums/LogAction';
import { LogEntity } from '@modules/audit/domain/enums/LogEntity';
import { LogEntryModel, LogEntryMongo } from '../schemas/LogEntrySchema';

/**
 * Implementación del repositorio de logs de auditoría usando MongoDB/Mongoose
 * 
 * Este adaptador convierte entre:
 * - LogEntryMongo (Mongoose) ↔ LogEntry (Dominio)
 * - Maneja errores de MongoDB y los convierte a excepciones de dominio
 * 
 * Nota: Los logs son inmutables, por lo que solo se pueden crear y leer
 */
export class LogEntryRepository implements ILogEntryRepository {
  constructor(private readonly logger: ILogger) {}

  /**
   * Convierte un LogEntryMongo de Mongoose a una entidad LogEntry del dominio
   */
  private toDomain(logEntry: LogEntryMongo): LogEntry {
    return LogEntry.fromPersistence(
      {
        userId: logEntry.userId,
        action: logEntry.action,
        entity: logEntry.entity,
        entityId: logEntry.entityId,
        metadata: logEntry.metadata || undefined,
      },
      logEntry._id.toString(),
      logEntry.createdAt,
      logEntry.updatedAt
    );
  }

  /**
   * Convierte una entidad LogEntry del dominio a datos para persistencia
   */
  private toPersistence(logEntry: LogEntry) {
    const persistenceData = logEntry.toPersistence();
    return {
      userId: persistenceData.userId,
      action: persistenceData.action,
      entity: persistenceData.entity,
      entityId: persistenceData.entityId,
      ...(persistenceData.metadata !== undefined && { metadata: persistenceData.metadata }),
    };
  }

  /**
   * Maneja errores de MongoDB y los convierte a excepciones de dominio
   */
  private handleMongoError(error: any): never {
    // Error de ObjectId inválido
    if (error.name === 'CastError' && error.path === '_id') {
      this.logger.debug('ObjectId inválido en consulta de log', {
        invalidId: error.value,
      });
      // Los logs no tienen excepción específica de "no encontrado" porque no se espera que se busquen por ID frecuentemente
      // Pero podemos lanzar un error genérico
      throw new Error(`Log entry with invalid ID: ${error.value}`);
    }

    // Log de errores inesperados
    this.logger.error(
      'Error inesperado en LogEntryRepository',
      error instanceof Error ? error : new Error(String(error)),
      {
        errorCode: error.code,
        errorName: error.name,
      }
    );

    // Re-lanzar otros errores
    throw error;
  }

  async create(logEntry: LogEntry): Promise<LogEntry> {
    try {
      const persistenceData = this.toPersistence(logEntry);

      const mongoLogEntry = new LogEntryModel(persistenceData);

      // Si el ID de la entidad es un ObjectId válido, usarlo
      if (Types.ObjectId.isValid(logEntry.id)) {
        mongoLogEntry._id = new Types.ObjectId(logEntry.id);
      }

      const savedLogEntry = await mongoLogEntry.save();

      this.logger.debug('Log de auditoría creado exitosamente', {
        logId: savedLogEntry._id.toString(),
        userId: logEntry.userId,
        action: logEntry.action,
        entity: logEntry.entity,
        entityId: logEntry.entityId,
      });

      return this.toDomain(savedLogEntry);
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findById(id: string): Promise<LogEntry | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return null;
      }

      const logEntry = await LogEntryModel.findById(id).exec();

      if (!logEntry) {
        return null;
      }

      return this.toDomain(logEntry);
    } catch (error: any) {
      this.handleMongoError(error);
    }
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
    try {
      // Construir query de filtros
      const query: any = {};

      if (filters?.userId) {
        query.userId = filters.userId;
      }

      if (filters?.action) {
        query.action = filters.action;
      }

      if (filters?.entity) {
        query.entity = filters.entity;
      }

      if (filters?.entityId) {
        query.entityId = filters.entityId;
      }

      // Filtro por rango de fechas
      if (filters?.fechaDesde || filters?.fechaHasta) {
        query.createdAt = {};
        if (filters.fechaDesde) {
          query.createdAt.$gte = filters.fechaDesde;
        }
        if (filters.fechaHasta) {
          query.createdAt.$lte = filters.fechaHasta;
        }
      }

      // Ordenamiento por defecto: más recientes primero
      const sort: any = { createdAt: -1 };

      // Ejecutar consulta con paginación
      const [mongoLogs, total] = await Promise.all([
        LogEntryModel.find(query)
          .skip(offset)
          .limit(limit)
          .sort(sort)
          .exec(),
        LogEntryModel.countDocuments(query).exec(),
      ]);

      const logs = mongoLogs.map((log) => this.toDomain(log));

      return { logs, total };
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findByEntity(
    entity: LogEntity,
    entityId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ logs: LogEntry[]; total: number }> {
    try {
      const query: any = {
        entity,
        entityId,
      };

      // Ordenar por fecha (más recientes primero)
      const sort: any = { createdAt: -1 };

      // Ejecutar consulta con paginación
      const [mongoLogs, total] = await Promise.all([
        LogEntryModel.find(query)
          .skip(offset)
          .limit(limit)
          .sort(sort)
          .exec(),
        LogEntryModel.countDocuments(query).exec(),
      ]);

      const logs = mongoLogs.map((log) => this.toDomain(log));

      return { logs, total };
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findByUserId(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ logs: LogEntry[]; total: number }> {
    try {
      const query: any = {
        userId,
      };

      // Ordenar por fecha (más recientes primero)
      const sort: any = { createdAt: -1 };

      // Ejecutar consulta con paginación
      const [mongoLogs, total] = await Promise.all([
        LogEntryModel.find(query)
          .skip(offset)
          .limit(limit)
          .sort(sort)
          .exec(),
        LogEntryModel.countDocuments(query).exec(),
      ]);

      const logs = mongoLogs.map((log) => this.toDomain(log));

      return { logs, total };
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findByAction(
    action: LogAction,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ logs: LogEntry[]; total: number }> {
    try {
      const query: any = {
        action,
      };

      // Ordenar por fecha (más recientes primero)
      const sort: any = { createdAt: -1 };

      // Ejecutar consulta con paginación
      const [mongoLogs, total] = await Promise.all([
        LogEntryModel.find(query)
          .skip(offset)
          .limit(limit)
          .sort(sort)
          .exec(),
        LogEntryModel.countDocuments(query).exec(),
      ]);

      const logs = mongoLogs.map((log) => this.toDomain(log));

      return { logs, total };
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findByDateRange(
    fechaDesde: Date,
    fechaHasta: Date,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ logs: LogEntry[]; total: number }> {
    try {
      const query: any = {
        createdAt: {
          $gte: fechaDesde,
          $lte: fechaHasta,
        },
      };

      // Ordenar por fecha (más recientes primero)
      const sort: any = { createdAt: -1 };

      // Ejecutar consulta con paginación
      const [mongoLogs, total] = await Promise.all([
        LogEntryModel.find(query)
          .skip(offset)
          .limit(limit)
          .sort(sort)
          .exec(),
        LogEntryModel.countDocuments(query).exec(),
      ]);

      const logs = mongoLogs.map((log) => this.toDomain(log));

      return { logs, total };
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }
}
