import { Types } from 'mongoose';
import { Area } from '@modules/catalogs/domain/entities/Area';
import { IAreaRepository } from '@modules/catalogs/domain/ports/output/IAreaRepository';
import { AreaNotFoundError } from '@modules/catalogs/domain/exceptions/AreaNotFoundError';
import { DuplicateAreaError } from '@modules/catalogs/domain/exceptions/DuplicateAreaError';
import { AreaModel, AreaDocument } from '../schemas/AreaSchema';
import { ILogger } from '@shared/domain';
import { CollaboratorModel } from '@modules/collaborators/infrastructure/adapters/output/database/mongo/schemas/CollaboratorSchema';
import { AdscripcionModel } from '../schemas/AdscripcionSchema';

/**
 * Implementación del repositorio de áreas usando MongoDB/Mongoose
 */
export class AreaRepository implements IAreaRepository {
  constructor(private readonly logger: ILogger) {}

  /**
   * Convierte un AreaDocument de Mongoose a una entidad Area del dominio
   */
  private toDomain(document: AreaDocument): Area {
    return Area.fromPersistence(
      {
        nombre: document.nombre,
        descripcion: document.descripcion,
        isActive: document.isActive,
      },
      document._id.toString(),
      document.createdAt,
      document.updatedAt
    );
  }

  /**
   * Convierte una entidad Area del dominio a datos para persistencia
   */
  private toPersistence(area: Area) {
    const persistenceData = area.toPersistence();
    return {
      nombre: persistenceData.nombre,
      ...(persistenceData.descripcion !== undefined && { descripcion: persistenceData.descripcion }),
      isActive: persistenceData.isActive,
    };
  }

  /**
   * Maneja errores de MongoDB y los convierte a excepciones de dominio
   */
  private handleMongoError(error: any): never {
    // Error de duplicado (código 11000) - para nombre
    if (error.code === 11000) {
      const duplicateField = 'nombre';
      const duplicateValue = error.keyValue?.nombre || 'unknown';
      this.logger.warn('Intento de crear área duplicada', {
        field: duplicateField,
        value: duplicateValue,
      });
      throw new DuplicateAreaError(duplicateValue);
    }

    // Error de ObjectId inválido
    if (error.name === 'CastError' && error.path === '_id') {
      this.logger.debug('ObjectId inválido en consulta', {
        invalidId: error.value,
      });
      throw new AreaNotFoundError(error.value);
    }

    // Log de errores inesperados
    this.logger.error(
      'Error inesperado en AreaRepository',
      error instanceof Error ? error : new Error(String(error)),
      {
        errorCode: error.code,
        errorName: error.name,
      }
    );

    // Re-lanzar otros errores
    throw error;
  }

  async findById(id: string): Promise<Area | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return null;
      }

      const document = await AreaModel.findById(id).exec();

      if (!document) {
        return null;
      }

      return this.toDomain(document);
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findByNombre(nombre: string): Promise<Area | null> {
    try {
      const document = await AreaModel.findOne({
        nombre: nombre.trim(),
      }).exec();

      if (!document) {
        return null;
      }

      return this.toDomain(document);
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async save(area: Area): Promise<Area> {
    if (area.id) {
      return this.update(area);
    } else {
      return this.create(area);
    }
  }

  async create(area: Area): Promise<Area> {
    try {
      const persistenceData = this.toPersistence(area);

      const document = new AreaModel(persistenceData);

      if (Types.ObjectId.isValid(area.id)) {
        document._id = new Types.ObjectId(area.id);
      }

      const savedDocument = await document.save();
      this.logger.info('Área creada exitosamente', {
        areaId: savedDocument._id.toString(),
        nombre: area.nombre,
      });
      return this.toDomain(savedDocument);
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async update(area: Area): Promise<Area> {
    try {
      if (!Types.ObjectId.isValid(area.id)) {
        throw new AreaNotFoundError(area.id);
      }

      const persistenceData = this.toPersistence(area);

      const document = await AreaModel.findByIdAndUpdate(
        area.id,
        {
          $set: persistenceData,
          $setOnInsert: {
            createdAt: area.createdAt || new Date(),
          },
        },
        {
          new: true,
          runValidators: true,
          upsert: false,
        }
      ).exec();

      if (!document) {
        throw new AreaNotFoundError(area.id);
      }

      return this.toDomain(document);
    } catch (error: any) {
      if (error instanceof AreaNotFoundError || error instanceof DuplicateAreaError) {
        throw error;
      }
      this.handleMongoError(error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.logger.debug('Intento de eliminar área con ID inválido', { areaId: id });
        return false;
      }

      const document = await AreaModel.findByIdAndUpdate(
        id,
        { $set: { isActive: false } },
        { new: true }
      ).exec();

      if (document) {
        this.logger.info('Área eliminada exitosamente (baja lógica)', {
          areaId: id,
          nombre: document.nombre,
        });
        return true;
      } else {
        this.logger.debug('Intento de eliminar área inexistente', { areaId: id });
        return false;
      }
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findAll(
    filters?: {
      isActive?: boolean;
      search?: string;
    },
    limit: number = 20,
    offset: number = 0,
    sortBy: 'nombre' | 'createdAt' = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ areas: Area[]; total: number }> {
    try {
      const query: any = {};

      if (filters?.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      if (filters?.search) {
        query.$text = { $search: filters.search };
      }

      const sort: any = {};
      if (filters?.search) {
        sort.score = { $meta: 'textScore' };
      } else {
        switch (sortBy) {
          case 'nombre':
            sort.nombre = sortOrder === 'asc' ? 1 : -1;
            break;
          case 'createdAt':
          default:
            sort.createdAt = sortOrder === 'asc' ? 1 : -1;
            break;
        }
      }

      const [documents, total] = await Promise.all([
        AreaModel.find(query).skip(offset).limit(limit).sort(sort).exec(),
        AreaModel.countDocuments(query).exec(),
      ]);

      const areas = documents.map((doc) => this.toDomain(doc));

      return { areas, total };
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async existsByNombre(nombre: string): Promise<boolean> {
    try {
      const count = await AreaModel.countDocuments({
        nombre: nombre.trim(),
      }).exec();
      return count > 0;
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async countCollaboratorsByAreaId(areaId: string, isActive?: boolean): Promise<number> {
    try {
      const query: any = { areaId };
      if (isActive !== undefined) {
        query.isActive = isActive;
      }
      return await CollaboratorModel.countDocuments(query).exec();
    } catch (error: any) {
      this.logger.error('Error al contar colaboradores por área', error);
      return 0;
    }
  }

  async countActiveAdscripcionesByAreaId(areaId: string): Promise<number> {
    try {
      return await AdscripcionModel.countDocuments({
        areaId,
        isActive: true,
      }).exec();
    } catch (error: any) {
      this.logger.error('Error al contar adscripciones activas por área', error);
      return 0;
    }
  }
}
