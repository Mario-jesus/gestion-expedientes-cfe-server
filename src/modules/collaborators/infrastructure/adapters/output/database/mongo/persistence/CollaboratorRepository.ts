import { Types } from 'mongoose';
import { Collaborator } from '@modules/collaborators/domain/entities/Collaborator';
import { ICollaboratorRepository } from '@modules/collaborators/domain/ports/output/ICollaboratorRepository';
import { CollaboratorNotFoundError } from '@modules/collaborators/domain/exceptions/CollaboratorNotFoundError';
import { DuplicateCollaboratorError } from '@modules/collaborators/domain/exceptions/DuplicateCollaboratorError';
import { CollaboratorModel, CollaboratorDocument } from '../schemas/CollaboratorSchema';
import { ILogger } from '@shared/domain';

/**
 * Implementación del repositorio de colaboradores usando MongoDB/Mongoose
 * 
 * Este adaptador convierte entre:
 * - CollaboratorDocument (Mongoose) ↔ Collaborator (Dominio)
 * - Maneja errores de MongoDB y los convierte a excepciones de dominio
 */
export class CollaboratorRepository implements ICollaboratorRepository {
  constructor(private readonly logger: ILogger) {}

  /**
   * Convierte un CollaboratorDocument de Mongoose a una entidad Collaborator del dominio
   */
  private toDomain(document: CollaboratorDocument): Collaborator {
    return Collaborator.fromPersistence(
      {
        nombre: document.nombre,
        apellidos: document.apellidos,
        rpe: document.rpe,
        rtt: document.rtt,
        areaId: document.areaId,
        adscripcionId: document.adscripcionId,
        puestoId: document.puestoId,
        tipoContrato: document.tipoContrato,
        rfc: document.rfc,
        curp: document.curp,
        imss: document.imss,
        isActive: document.isActive,
        createdBy: document.createdBy,
      },
      document._id.toString(),
      document.createdAt,
      document.updatedAt
    );
  }

  /**
   * Convierte una entidad Collaborator del dominio a datos para persistencia
   */
  private toPersistence(collaborator: Collaborator) {
    const persistenceData = collaborator.toPersistence();
    return {
      nombre: persistenceData.nombre,
      apellidos: persistenceData.apellidos,
      rpe: persistenceData.rpe,
      ...(persistenceData.rtt !== undefined && { rtt: persistenceData.rtt }),
      areaId: persistenceData.areaId,
      adscripcionId: persistenceData.adscripcionId,
      puestoId: persistenceData.puestoId,
      tipoContrato: persistenceData.tipoContrato,
      rfc: persistenceData.rfc,
      curp: persistenceData.curp,
      imss: persistenceData.imss,
      isActive: persistenceData.isActive,
      ...(persistenceData.createdBy && { createdBy: persistenceData.createdBy }),
    };
  }

  /**
   * Maneja errores de MongoDB y los convierte a excepciones de dominio
   */
  private handleMongoError(error: any): never {
    // Error de duplicado (código 11000) - para RPE
    if (error.code === 11000) {
      const duplicateField = 'rpe';
      const duplicateValue = error.keyValue?.rpe || 'unknown';
      this.logger.warn('Intento de crear colaborador duplicado', {
        field: duplicateField,
        value: duplicateValue,
      });
      throw new DuplicateCollaboratorError(duplicateValue);
    }

    // Error de ObjectId inválido
    if (error.name === 'CastError' && error.path === '_id') {
      this.logger.debug('ObjectId inválido en consulta', {
        invalidId: error.value,
      });
      throw new CollaboratorNotFoundError(error.value);
    }

    // Log de errores inesperados
    this.logger.error(
      'Error inesperado en CollaboratorRepository',
      error instanceof Error ? error : new Error(String(error)),
      {
        errorCode: error.code,
        errorName: error.name,
      }
    );

    // Re-lanzar otros errores
    throw error;
  }

  async findById(id: string): Promise<Collaborator | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return null;
      }

      const document = await CollaboratorModel.findById(id).exec();

      if (!document) {
        return null;
      }

      return this.toDomain(document);
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findByRPE(rpe: string): Promise<Collaborator | null> {
    try {
      const document = await CollaboratorModel.findOne({
        rpe: rpe.toUpperCase().trim(),
      }).exec();

      if (!document) {
        return null;
      }

      return this.toDomain(document);
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async save(collaborator: Collaborator): Promise<Collaborator> {
    // Si tiene ID, intenta actualizar; si no, crea uno nuevo
    if (collaborator.id) {
      return this.update(collaborator);
    } else {
      return this.create(collaborator);
    }
  }

  async create(collaborator: Collaborator): Promise<Collaborator> {
    try {
      const persistenceData = this.toPersistence(collaborator);

      const document = new CollaboratorModel(persistenceData);

      // Si el ID de la entidad es un ObjectId válido, usarlo
      if (Types.ObjectId.isValid(collaborator.id)) {
        document._id = new Types.ObjectId(collaborator.id);
      }

      const savedDocument = await document.save();
      this.logger.info('Colaborador creado exitosamente', {
        collaboratorId: savedDocument._id.toString(),
        rpe: collaborator.rpeValue,
        nombre: collaborator.nombreCompleto,
        createdBy: collaborator.createdBy,
      });
      return this.toDomain(savedDocument);
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async update(collaborator: Collaborator): Promise<Collaborator> {
    try {
      if (!Types.ObjectId.isValid(collaborator.id)) {
        throw new CollaboratorNotFoundError(collaborator.id);
      }

      const persistenceData = this.toPersistence(collaborator);

      const document = await CollaboratorModel.findByIdAndUpdate(
        collaborator.id,
        {
          $set: persistenceData,
          $setOnInsert: {
            createdAt: collaborator.createdAt || new Date(),
          },
        },
        {
          new: true, // Retorna el documento actualizado
          runValidators: true, // Ejecuta validaciones del schema
          upsert: false, // No crear si no existe
        }
      ).exec();

      if (!document) {
        throw new CollaboratorNotFoundError(collaborator.id);
      }

      return this.toDomain(document);
    } catch (error: any) {
      // Si ya es una excepción de dominio, re-lanzarla
      if (error instanceof CollaboratorNotFoundError || error instanceof DuplicateCollaboratorError) {
        throw error;
      }
      this.handleMongoError(error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.logger.debug('Intento de eliminar colaborador con ID inválido', { collaboratorId: id });
        return false;
      }

      // Baja lógica: marcar como inactivo en lugar de eliminar físicamente
      const document = await CollaboratorModel.findByIdAndUpdate(
        id,
        { $set: { isActive: false } },
        { new: true }
      ).exec();

      if (document) {
        this.logger.info('Colaborador eliminado exitosamente (baja lógica)', {
          collaboratorId: id,
          rpe: document.rpe,
        });
        return true;
      } else {
        this.logger.debug('Intento de eliminar colaborador inexistente', { collaboratorId: id });
        return false;
      }
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findAll(
    filters?: {
      areaId?: string;
      adscripcionId?: string;
      puestoId?: string;
      tipoContrato?: string;
      isActive?: boolean;
      search?: string;
      estadoExpediente?: 'completo' | 'incompleto' | 'sin_documentos';
    },
    limit: number = 20,
    offset: number = 0,
    sortBy: 'nombre' | 'rpe' | 'createdAt' = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ collaborators: Collaborator[]; total: number }> {
    try {
      // Construir query de filtros
      const query: any = {};

      if (filters?.areaId) {
        query.areaId = filters.areaId;
      }

      if (filters?.adscripcionId) {
        query.adscripcionId = filters.adscripcionId;
      }

      if (filters?.puestoId) {
        query.puestoId = filters.puestoId;
      }

      if (filters?.tipoContrato) {
        query.tipoContrato = filters.tipoContrato;
      }

      if (filters?.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      // Búsqueda de texto (usando índice de texto)
      if (filters?.search) {
        query.$text = { $search: filters.search };
      }

      // Nota: El filtro por estadoExpediente se maneja en ListCollaboratorsUseCase
      // para evitar dependencia circular. Este repositorio no filtra por estadoExpediente.
      // Si se pasa este filtro, se ignora aquí y se procesa en el caso de uso.

      // Construir objeto de ordenamiento
      const sort: any = {};
      if (filters?.search) {
        // Si hay búsqueda de texto, ordenar por relevancia primero
        sort.score = { $meta: 'textScore' };
      } else {
        // Ordenamiento normal
        switch (sortBy) {
          case 'nombre':
            sort.nombre = sortOrder === 'asc' ? 1 : -1;
            sort.apellidos = sortOrder === 'asc' ? 1 : -1;
            break;
          case 'rpe':
            sort.rpe = sortOrder === 'asc' ? 1 : -1;
            break;
          case 'createdAt':
          default:
            sort.createdAt = sortOrder === 'asc' ? 1 : -1;
            break;
        }
      }

      // Ejecutar consulta con paginación
      const [documents, total] = await Promise.all([
        CollaboratorModel.find(query).skip(offset).limit(limit).sort(sort).exec(),
        CollaboratorModel.countDocuments(query).exec(),
      ]);

      const collaborators = documents.map((doc) => this.toDomain(doc));

      return { collaborators, total };
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async existsByRPE(rpe: string): Promise<boolean> {
    try {
      const count = await CollaboratorModel.countDocuments({
        rpe: rpe.toUpperCase().trim(),
      }).exec();
      return count > 0;
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findByAreaId(areaId: string, isActive?: boolean): Promise<Collaborator[]> {
    try {
      const query: any = { areaId };
      if (isActive !== undefined) {
        query.isActive = isActive;
      }

      const documents = await CollaboratorModel.find(query).exec();
      return documents.map((doc) => this.toDomain(doc));
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findByAdscripcionId(
    adscripcionId: string,
    isActive?: boolean
  ): Promise<Collaborator[]> {
    try {
      const query: any = { adscripcionId };
      if (isActive !== undefined) {
        query.isActive = isActive;
      }

      const documents = await CollaboratorModel.find(query).exec();
      return documents.map((doc) => this.toDomain(doc));
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findByPuestoId(puestoId: string, isActive?: boolean): Promise<Collaborator[]> {
    try {
      const query: any = { puestoId };
      if (isActive !== undefined) {
        query.isActive = isActive;
      }

      const documents = await CollaboratorModel.find(query).exec();
      return documents.map((doc) => this.toDomain(doc));
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }
}
