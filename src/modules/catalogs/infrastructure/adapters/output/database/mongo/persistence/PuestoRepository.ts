import { Types } from 'mongoose';
import { Puesto } from '@modules/catalogs/domain/entities/Puesto';
import { IPuestoRepository } from '@modules/catalogs/domain/ports/output/IPuestoRepository';
import { PuestoNotFoundError } from '@modules/catalogs/domain/exceptions/PuestoNotFoundError';
import { DuplicatePuestoError } from '@modules/catalogs/domain/exceptions/DuplicatePuestoError';
import { PuestoModel, PuestoDocument } from '../schemas/PuestoSchema';
import { ILogger } from '@shared/domain';
import { CollaboratorModel } from '@modules/collaborators/infrastructure/adapters/output/database/mongo/schemas/CollaboratorSchema';

/**
 * Implementación del repositorio de puestos usando MongoDB/Mongoose
 */
export class PuestoRepository implements IPuestoRepository {
  constructor(private readonly logger: ILogger) {}

  /**
   * Convierte un PuestoDocument de Mongoose a una entidad Puesto del dominio
   */
  private toDomain(document: PuestoDocument): Puesto {
    return Puesto.fromPersistence(
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
   * Convierte una entidad Puesto del dominio a datos para persistencia
   */
  private toPersistence(puesto: Puesto) {
    const persistenceData = puesto.toPersistence();
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
      this.logger.warn('Intento de crear puesto duplicado', {
        field: duplicateField,
        value: duplicateValue,
      });
      throw new DuplicatePuestoError(duplicateValue);
    }

    // Error de ObjectId inválido
    if (error.name === 'CastError' && error.path === '_id') {
      this.logger.debug('ObjectId inválido en consulta', {
        invalidId: error.value,
      });
      throw new PuestoNotFoundError(error.value);
    }

    // Log de errores inesperados
    this.logger.error(
      'Error inesperado en PuestoRepository',
      error instanceof Error ? error : new Error(String(error)),
      {
        errorCode: error.code,
        errorName: error.name,
      }
    );

    // Re-lanzar otros errores
    throw error;
  }

  async findById(id: string): Promise<Puesto | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return null;
      }

      const document = await PuestoModel.findById(id).exec();

      if (!document) {
        return null;
      }

      return this.toDomain(document);
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findByNombre(nombre: string): Promise<Puesto | null> {
    try {
      const document = await PuestoModel.findOne({
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

  async save(puesto: Puesto): Promise<Puesto> {
    if (puesto.id) {
      return this.update(puesto);
    } else {
      return this.create(puesto);
    }
  }

  async create(puesto: Puesto): Promise<Puesto> {
    try {
      const persistenceData = this.toPersistence(puesto);

      const document = new PuestoModel(persistenceData);

      if (Types.ObjectId.isValid(puesto.id)) {
        document._id = new Types.ObjectId(puesto.id);
      }

      const savedDocument = await document.save();
      this.logger.info('Puesto creado exitosamente', {
        puestoId: savedDocument._id.toString(),
        nombre: puesto.nombre,
      });
      return this.toDomain(savedDocument);
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async update(puesto: Puesto): Promise<Puesto> {
    try {
      if (!Types.ObjectId.isValid(puesto.id)) {
        throw new PuestoNotFoundError(puesto.id);
      }

      const persistenceData = this.toPersistence(puesto);

      const document = await PuestoModel.findByIdAndUpdate(
        puesto.id,
        {
          $set: persistenceData,
          $setOnInsert: {
            createdAt: puesto.createdAt || new Date(),
          },
        },
        {
          new: true,
          runValidators: true,
          upsert: false,
        }
      ).exec();

      if (!document) {
        throw new PuestoNotFoundError(puesto.id);
      }

      return this.toDomain(document);
    } catch (error: any) {
      if (error instanceof PuestoNotFoundError || error instanceof DuplicatePuestoError) {
        throw error;
      }
      this.handleMongoError(error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.logger.debug('Intento de eliminar puesto con ID inválido', { puestoId: id });
        return false;
      }

      const document = await PuestoModel.findByIdAndUpdate(
        id,
        { $set: { isActive: false } },
        { new: true }
      ).exec();

      if (document) {
        this.logger.info('Puesto eliminado exitosamente (baja lógica)', {
          puestoId: id,
          nombre: document.nombre,
        });
        return true;
      } else {
        this.logger.debug('Intento de eliminar puesto inexistente', { puestoId: id });
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
  ): Promise<{ puestos: Puesto[]; total: number }> {
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
        PuestoModel.find(query).skip(offset).limit(limit).sort(sort).exec(),
        PuestoModel.countDocuments(query).exec(),
      ]);

      const puestos = documents.map((doc) => this.toDomain(doc));

      return { puestos, total };
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async existsByNombre(nombre: string): Promise<boolean> {
    try {
      const count = await PuestoModel.countDocuments({
        nombre: nombre.trim(),
      }).exec();
      return count > 0;
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async countCollaboratorsByPuestoId(puestoId: string, isActive?: boolean): Promise<number> {
    try {
      const query: any = { puestoId };
      if (isActive !== undefined) {
        query.isActive = isActive;
      }
      return await CollaboratorModel.countDocuments(query).exec();
    } catch (error: any) {
      this.logger.error('Error al contar colaboradores por puesto', error);
      return 0;
    }
  }
}
