import { Types } from 'mongoose';
import { Adscripcion } from '@modules/catalogs/domain/entities/Adscripcion';
import { IAdscripcionRepository } from '@modules/catalogs/domain/ports/output/IAdscripcionRepository';
import { AdscripcionNotFoundError } from '@modules/catalogs/domain/exceptions/AdscripcionNotFoundError';
import { DuplicateAdscripcionError } from '@modules/catalogs/domain/exceptions/DuplicateAdscripcionError';
import { AdscripcionModel, AdscripcionDocument } from '../schemas/AdscripcionSchema';
import { ILogger } from '@shared/domain';
import { CollaboratorModel } from '@modules/collaborators/infrastructure/adapters/output/database/mongo/schemas/CollaboratorSchema';

/**
 * Implementaciรณn del repositorio de adscripciones usando MongoDB/Mongoose
 */
export class AdscripcionRepository implements IAdscripcionRepository {
  constructor(private readonly logger: ILogger) {}

  /**
   * Convierte un AdscripcionDocument de Mongoose a una entidad Adscripcion del dominio
   */
  private toDomain(document: AdscripcionDocument): Adscripcion {
    return Adscripcion.fromPersistence(
      {
        nombre: document.nombre,
        adscripcion: document.adscripcion,
        descripcion: document.descripcion,
        isActive: document.isActive,
      },
      document._id.toString(),
      document.createdAt,
      document.updatedAt
    );
  }

  /**
   * Convierte una entidad Adscripcion del dominio a datos para persistencia
   */
  private toPersistence(adscripcion: Adscripcion) {
    const persistenceData = adscripcion.toPersistence();
    return {
      nombre: persistenceData.nombre,
      adscripcion: persistenceData.adscripcion,
      ...(persistenceData.descripcion !== undefined && { descripcion: persistenceData.descripcion }),
      isActive: persistenceData.isActive,
    };
  }

  /**
   * Maneja errores de MongoDB y los convierte a excepciones de dominio
   */
  private handleMongoError(error: any): never {
    // Error de duplicado (código 11000) - para adscripcion único
    if (error.code === 11000) {
      const duplicateAdscripcion = error.keyValue?.adscripcion || 'unknown';
      this.logger.warn('Intento de crear adscripción duplicada', {
        adscripcion: duplicateAdscripcion,
      });
      throw new DuplicateAdscripcionError(duplicateAdscripcion);
    }

    // Error de ObjectId invรกlido
    if (error.name === 'CastError' && error.path === '_id') {
      this.logger.debug('ObjectId invรกlido en consulta', {
        invalidId: error.value,
      });
      throw new AdscripcionNotFoundError(error.value);
    }

    // Log de errores inesperados
    this.logger.error(
      'Error inesperado en AdscripcionRepository',
      error instanceof Error ? error : new Error(String(error)),
      {
        errorCode: error.code,
        errorName: error.name,
      }
    );

    // Re-lanzar otros errores
    throw error;
  }

  async findById(id: string): Promise<Adscripcion | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return null;
      }

      const document = await AdscripcionModel.findById(id).exec();

      if (!document) {
        return null;
      }

      return this.toDomain(document);
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findByNombre(nombre: string): Promise<Adscripcion | null> {
    try {
      const document = await AdscripcionModel.findOne({
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

  async save(adscripcion: Adscripcion): Promise<Adscripcion> {
    if (adscripcion.id) {
      return this.update(adscripcion);
    } else {
      return this.create(adscripcion);
    }
  }

  async create(adscripcion: Adscripcion): Promise<Adscripcion> {
    try {
      const persistenceData = this.toPersistence(adscripcion);

      const document = new AdscripcionModel(persistenceData);

      if (Types.ObjectId.isValid(adscripcion.id)) {
        document._id = new Types.ObjectId(adscripcion.id);
      }

      const savedDocument = await document.save();
      this.logger.info('Adscripciรณn creada exitosamente', {
        adscripcionId: savedDocument._id.toString(),
        nombre: adscripcion.nombre,
        adscripcion: adscripcion.adscripcion,
      });
      return this.toDomain(savedDocument);
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async update(adscripcion: Adscripcion): Promise<Adscripcion> {
    try {
      if (!Types.ObjectId.isValid(adscripcion.id)) {
        throw new AdscripcionNotFoundError(adscripcion.id);
      }

      const persistenceData = this.toPersistence(adscripcion);

      const document = await AdscripcionModel.findByIdAndUpdate(
        adscripcion.id,
        {
          $set: persistenceData,
          $setOnInsert: {
            createdAt: adscripcion.createdAt || new Date(),
          },
        },
        {
          new: true,
          runValidators: true,
          upsert: false,
        }
      ).exec();

      if (!document) {
        throw new AdscripcionNotFoundError(adscripcion.id);
      }

      return this.toDomain(document);
    } catch (error: any) {
      if (error instanceof AdscripcionNotFoundError || error instanceof DuplicateAdscripcionError) {
        throw error;
      }
      this.handleMongoError(error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.logger.debug('Intento de eliminar adscripciรณn con ID invรกlido', { adscripcionId: id });
        return false;
      }

      const document = await AdscripcionModel.findByIdAndUpdate(
        id,
        { $set: { isActive: false } },
        { new: true }
      ).exec();

      if (document) {
        this.logger.info('Adscripciรณn eliminada exitosamente (baja lรณgica)', {
          adscripcionId: id,
          nombre: document.nombre,
        });
        return true;
      } else {
        this.logger.debug('Intento de eliminar adscripciรณn inexistente', { adscripcionId: id });
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
  ): Promise<{ adscripciones: Adscripcion[]; total: number }> {
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
        AdscripcionModel.find(query).skip(offset).limit(limit).sort(sort).exec(),
        AdscripcionModel.countDocuments(query).exec(),
      ]);

      const adscripciones = documents.map((doc) => this.toDomain(doc));

      return { adscripciones, total };
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findByAdscripcion(adscripcion: string): Promise<Adscripcion | null> {
    try {
      const document = await AdscripcionModel.findOne({
        adscripcion: adscripcion.trim(),
      }).exec();

      if (!document) {
        return null;
      }

      return this.toDomain(document);
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async existsByNombre(nombre: string): Promise<boolean> {
    try {
      const count = await AdscripcionModel.countDocuments({
        nombre: nombre.trim(),
      }).exec();
      return count > 0;
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async existsByAdscripcion(adscripcion: string): Promise<boolean> {
    try {
      const count = await AdscripcionModel.countDocuments({
        adscripcion: adscripcion.trim(),
      }).exec();
      return count > 0;
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async countCollaboratorsByAdscripcionId(
    adscripcionId: string,
    isActive?: boolean
  ): Promise<number> {
    try {
      const query: any = { adscripcionId };
      if (isActive !== undefined) {
        query.isActive = isActive;
      }
      return await CollaboratorModel.countDocuments(query).exec();
    } catch (error: any) {
      this.logger.error('Error al contar colaboradores por adscripciรณn', error);
      return 0;
    }
  }
}
