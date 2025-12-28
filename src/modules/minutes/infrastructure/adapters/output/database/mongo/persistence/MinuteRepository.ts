import { Types } from 'mongoose';
import { ILogger } from '@shared/domain';
import { Minute } from '@modules/minutes/domain/entities/Minute';
import { IMinuteRepository } from '@modules/minutes/domain/ports/output/IMinuteRepository';
import { MinuteNotFoundError } from '@modules/minutes/domain/exceptions/MinuteNotFoundError';
import { MinuteType } from '@modules/minutes/domain/enums/MinuteType';
import { MinuteModel, MinuteMongo } from '../schemas/MinuteSchema';

/**
 * Implementación del repositorio de minutas usando MongoDB/Mongoose
 * 
 * Este adaptador convierte entre:
 * - MinuteMongo (Mongoose) ↔ Minute (Dominio)
 * - Maneja errores de MongoDB y los convierte a excepciones de dominio
 */
export class MinuteRepository implements IMinuteRepository {
  constructor(private readonly logger: ILogger) {}

  /**
   * Convierte un MinuteMongo de Mongoose a una entidad Minute del dominio
   */
  private toDomain(minute: MinuteMongo): Minute {
    return Minute.fromPersistence(
      {
        titulo: minute.titulo,
        tipo: minute.tipo,
        descripcion: minute.descripcion,
        fecha: minute.fecha,
        fileName: minute.fileName,
        fileUrl: minute.fileUrl,
        fileSize: minute.fileSize,
        fileType: minute.fileType,
        uploadedBy: minute.uploadedBy,
        uploadedAt: minute.uploadedAt,
        isActive: minute.isActive,
      },
      minute._id.toString(),
      minute.createdAt,
      minute.updatedAt
    );
  }

  /**
   * Convierte una entidad Minute del dominio a datos para persistencia
   */
  private toPersistence(minute: Minute) {
    const persistenceData = minute.toPersistence();
    return {
      titulo: persistenceData.titulo,
      tipo: persistenceData.tipo,
      ...(persistenceData.descripcion !== undefined && { descripcion: persistenceData.descripcion }),
      fecha: persistenceData.fecha,
      fileName: persistenceData.fileName,
      fileUrl: persistenceData.fileUrl,
      fileSize: persistenceData.fileSize,
      fileType: persistenceData.fileType,
      uploadedBy: persistenceData.uploadedBy,
      uploadedAt: persistenceData.uploadedAt,
      isActive: persistenceData.isActive,
    };
  }

  /**
   * Maneja errores de MongoDB y los convierte a excepciones de dominio
   */
  private handleMongoError(error: any): never {
    // Error de ObjectId inválido
    if (error.name === 'CastError' && error.path === '_id') {
      this.logger.debug('ObjectId inválido en consulta', {
        invalidId: error.value,
      });
      throw new MinuteNotFoundError(error.value);
    }

    // Log de errores inesperados
    this.logger.error(
      'Error inesperado en MinuteRepository',
      error instanceof Error ? error : new Error(String(error)),
      {
        errorCode: error.code,
        errorName: error.name,
      }
    );

    // Re-lanzar otros errores
    throw error;
  }

  async findById(id: string): Promise<Minute | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return null;
      }

      const minute = await MinuteModel.findById(id).exec();

      if (!minute) {
        return null;
      }

      return this.toDomain(minute);
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async save(minute: Minute): Promise<Minute> {
    // Si tiene ID, intenta actualizar; si no, crea uno nuevo
    if (minute.id) {
      return this.update(minute);
    } else {
      return this.create(minute);
    }
  }

  async create(minute: Minute): Promise<Minute> {
    try {
      const persistenceData = this.toPersistence(minute);

      const mongoMinute = new MinuteModel(persistenceData);

      // Si el ID de la entidad es un ObjectId válido, usarlo
      if (Types.ObjectId.isValid(minute.id)) {
        mongoMinute._id = new Types.ObjectId(minute.id);
      }

      const savedMinute = await mongoMinute.save();
      this.logger.info('Minuta creada exitosamente', {
        minuteId: savedMinute._id.toString(),
        titulo: minute.titulo,
        tipo: minute.tipo,
        fileName: minute.fileName,
      });
      return this.toDomain(savedMinute);
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async update(minute: Minute): Promise<Minute> {
    try {
      if (!Types.ObjectId.isValid(minute.id)) {
        throw new MinuteNotFoundError(minute.id);
      }

      const persistenceData = this.toPersistence(minute);

      const updatedMinute = await MinuteModel.findByIdAndUpdate(
        minute.id,
        {
          $set: persistenceData,
          $setOnInsert: {
            createdAt: minute.createdAt || new Date(),
          },
        },
        {
          new: true, // Retorna el documento actualizado
          runValidators: true, // Ejecuta validaciones del schema
          upsert: false, // No crear si no existe
        }
      ).exec();

      if (!updatedMinute) {
        throw new MinuteNotFoundError(minute.id);
      }

      return this.toDomain(updatedMinute);
    } catch (error: any) {
      // Si ya es una excepción de dominio, re-lanzarla
      if (error instanceof MinuteNotFoundError) {
        throw error;
      }
      this.handleMongoError(error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.logger.debug('Intento de eliminar minuta con ID inválido', { minuteId: id });
        return false;
      }

      // Baja lógica: marcar como inactiva en lugar de eliminar físicamente
      const minute = await MinuteModel.findByIdAndUpdate(
        id,
        { $set: { isActive: false } },
        { new: true }
      ).exec();

      if (minute) {
        this.logger.info('Minuta eliminada exitosamente (baja lógica)', {
          minuteId: id,
          titulo: minute.titulo,
          tipo: minute.tipo,
        });
        return true;
      } else {
        this.logger.debug('Intento de eliminar minuta inexistente', { minuteId: id });
        return false;
      }
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findAll(
    filters?: {
      tipo?: MinuteType;
      isActive?: boolean;
      fechaDesde?: Date;
      fechaHasta?: Date;
      search?: string;
    },
    limit: number = 20,
    offset: number = 0
  ): Promise<{ minutes: Minute[]; total: number }> {
    try {
      // Construir query de filtros
      const query: any = {};

      if (filters?.tipo) {
        query.tipo = filters.tipo;
      }

      if (filters?.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      // Filtro por rango de fechas (fecha del evento)
      if (filters?.fechaDesde || filters?.fechaHasta) {
        query.fecha = {};
        if (filters.fechaDesde) {
          query.fecha.$gte = filters.fechaDesde;
        }
        if (filters.fechaHasta) {
          query.fecha.$lte = filters.fechaHasta;
        }
      }

      // Búsqueda de texto (título o descripción)
      if (filters?.search && filters.search.trim().length > 0) {
        query.$text = { $search: filters.search.trim() };
      }

      // Ordenamiento por defecto: más recientes primero (por fecha de creación)
      const sort: any = { createdAt: -1 };

      // Si hay búsqueda de texto, ordenar por relevancia primero
      if (filters?.search && filters.search.trim().length > 0) {
        sort.score = { $meta: 'textScore' };
      }

      // Ejecutar consulta con paginación
      const [mongoMinutes, total] = await Promise.all([
        MinuteModel.find(query)
          .skip(offset)
          .limit(limit)
          .sort(sort)
          .exec(),
        MinuteModel.countDocuments(query).exec(),
      ]);

      const minutes = mongoMinutes.map((minute) => this.toDomain(minute));

      return { minutes, total };
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findByType(
    tipo: MinuteType,
    isActive: boolean = true
  ): Promise<Minute[]> {
    try {
      const query: any = { tipo, isActive };

      // Ordenar por fecha del evento (más recientes primero)
      const minutes = await MinuteModel.find(query)
        .sort({ fecha: -1 })
        .exec();

      return minutes.map((minute) => this.toDomain(minute));
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findByDateRange(
    fechaDesde: Date,
    fechaHasta: Date,
    isActive: boolean = true
  ): Promise<Minute[]> {
    try {
      const query: any = {
        fecha: {
          $gte: fechaDesde,
          $lte: fechaHasta,
        },
        isActive,
      };

      // Ordenar por fecha del evento (más recientes primero)
      const minutes = await MinuteModel.find(query)
        .sort({ fecha: -1 })
        .exec();

      return minutes.map((minute) => this.toDomain(minute));
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async searchByText(
    search: string,
    isActive: boolean = true
  ): Promise<Minute[]> {
    try {
      const query: any = {
        $text: { $search: search.trim() },
        isActive,
      };

      // Ordenar por relevancia de búsqueda y luego por fecha
      const minutes = await MinuteModel.find(query)
        .sort({ score: { $meta: 'textScore' }, fecha: -1 })
        .exec();

      return minutes.map((minute) => this.toDomain(minute));
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }
}
