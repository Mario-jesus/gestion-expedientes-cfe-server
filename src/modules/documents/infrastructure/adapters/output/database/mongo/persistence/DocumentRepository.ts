import { Types } from 'mongoose';
import { ILogger } from '@shared/domain';
import { CollaboratorDocument } from '@modules/documents/domain/entities/CollaboratorDocument';
import { IDocumentRepository } from '@modules/documents/domain/ports/output/IDocumentRepository';
import { DocumentNotFoundError } from '@modules/documents/domain/exceptions/DocumentNotFoundError';
import { DocumentKind } from '@modules/catalogs/domain/enums/DocumentKind';
import { CollaboratorDocumentModel, CollaboratorDocumentMongo } from '../schemas/CollaboratorDocumentSchema';

/**
 * Implementación del repositorio de documentos usando MongoDB/Mongoose
 * 
 * Este adaptador convierte entre:
 * - CollaboratorDocumentMongo (Mongoose) ↔ CollaboratorDocument (Dominio)
 * - Maneja errores de MongoDB y los convierte a excepciones de dominio
 */
export class DocumentRepository implements IDocumentRepository {
  constructor(private readonly logger: ILogger) {}

  /**
   * Convierte un CollaboratorDocumentMongo de Mongoose a una entidad CollaboratorDocument del dominio
   */
  private toDomain(document: CollaboratorDocumentMongo): CollaboratorDocument {
    return CollaboratorDocument.fromPersistence(
      {
        collaboratorId: document.collaboratorId,
        kind: document.kind,
        periodo: document.periodo,
        descripcion: document.descripcion,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        fileSize: document.fileSize,
        fileType: document.fileType,
        uploadedBy: document.uploadedBy,
        uploadedAt: document.uploadedAt,
        documentTypeId: document.documentTypeId,
        isActive: document.isActive,
      },
      document._id.toString(),
      document.createdAt,
      document.updatedAt
    );
  }

  /**
   * Convierte una entidad CollaboratorDocument del dominio a datos para persistencia
   */
  private toPersistence(document: CollaboratorDocument) {
    const persistenceData = document.toPersistence();
    return {
      collaboratorId: persistenceData.collaboratorId,
      kind: persistenceData.kind,
      ...(persistenceData.periodo !== undefined && { periodo: persistenceData.periodo }),
      ...(persistenceData.descripcion !== undefined && { descripcion: persistenceData.descripcion }),
      fileName: persistenceData.fileName,
      fileUrl: persistenceData.fileUrl,
      fileSize: persistenceData.fileSize,
      fileType: persistenceData.fileType,
      uploadedBy: persistenceData.uploadedBy,
      uploadedAt: persistenceData.uploadedAt,
      ...(persistenceData.documentTypeId !== undefined && { documentTypeId: persistenceData.documentTypeId }),
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
      throw new DocumentNotFoundError(error.value);
    }

    // Log de errores inesperados
    this.logger.error(
      'Error inesperado en DocumentRepository',
      error instanceof Error ? error : new Error(String(error)),
      {
        errorCode: error.code,
        errorName: error.name,
      }
    );

    // Re-lanzar otros errores
    throw error;
  }

  async findById(id: string): Promise<CollaboratorDocument | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return null;
      }

      const document = await CollaboratorDocumentModel.findById(id).exec();

      if (!document) {
        return null;
      }

      return this.toDomain(document);
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async save(document: CollaboratorDocument): Promise<CollaboratorDocument> {
    // Si tiene ID, intenta actualizar; si no, crea uno nuevo
    if (document.id) {
      return this.update(document);
    } else {
      return this.create(document);
    }
  }

  async create(document: CollaboratorDocument): Promise<CollaboratorDocument> {
    try {
      const persistenceData = this.toPersistence(document);

      const mongoDocument = new CollaboratorDocumentModel(persistenceData);

      // Si el ID de la entidad es un ObjectId válido, usarlo
      if (Types.ObjectId.isValid(document.id)) {
        mongoDocument._id = new Types.ObjectId(document.id);
      }

      const savedDocument = await mongoDocument.save();
      this.logger.info('Documento creado exitosamente', {
        documentId: savedDocument._id.toString(),
        collaboratorId: document.collaboratorId,
        kind: document.kind,
        fileName: document.fileName,
      });
      return this.toDomain(savedDocument);
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async update(document: CollaboratorDocument): Promise<CollaboratorDocument> {
    try {
      if (!Types.ObjectId.isValid(document.id)) {
        throw new DocumentNotFoundError(document.id);
      }

      const persistenceData = this.toPersistence(document);

      const updatedDocument = await CollaboratorDocumentModel.findByIdAndUpdate(
        document.id,
        {
          $set: persistenceData,
          $setOnInsert: {
            createdAt: document.createdAt || new Date(),
          },
        },
        {
          new: true, // Retorna el documento actualizado
          runValidators: true, // Ejecuta validaciones del schema
          upsert: false, // No crear si no existe
        }
      ).exec();

      if (!updatedDocument) {
        throw new DocumentNotFoundError(document.id);
      }

      return this.toDomain(updatedDocument);
    } catch (error: any) {
      // Si ya es una excepción de dominio, re-lanzarla
      if (error instanceof DocumentNotFoundError) {
        throw error;
      }
      this.handleMongoError(error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.logger.debug('Intento de eliminar documento con ID inválido', { documentId: id });
        return false;
      }

      // Baja lógica: marcar como inactivo en lugar de eliminar físicamente
      const document = await CollaboratorDocumentModel.findByIdAndUpdate(
        id,
        { $set: { isActive: false } },
        { new: true }
      ).exec();

      if (document) {
        this.logger.info('Documento eliminado exitosamente (baja lógica)', {
          documentId: id,
          collaboratorId: document.collaboratorId,
          kind: document.kind,
        });
        return true;
      } else {
        this.logger.debug('Intento de eliminar documento inexistente', { documentId: id });
        return false;
      }
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findAll(
    filters?: {
      collaboratorId?: string;
      kind?: DocumentKind;
      isActive?: boolean;
      documentTypeId?: string;
    },
    limit: number = 20,
    offset: number = 0
  ): Promise<{ documents: CollaboratorDocument[]; total: number }> {
    try {
      // Construir query de filtros
      const query: any = {};

      if (filters?.collaboratorId) {
        query.collaboratorId = filters.collaboratorId;
      }

      if (filters?.kind) {
        query.kind = filters.kind;
      }

      if (filters?.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      if (filters?.documentTypeId) {
        query.documentTypeId = filters.documentTypeId;
      }

      // Ordenamiento por defecto: más recientes primero
      const sort: any = { uploadedAt: -1 };

      // Ejecutar consulta con paginación
      const [mongoDocuments, total] = await Promise.all([
        CollaboratorDocumentModel.find(query)
          .skip(offset)
          .limit(limit)
          .sort(sort)
          .exec(),
        CollaboratorDocumentModel.countDocuments(query).exec(),
      ]);

      const documents = mongoDocuments.map((doc) => this.toDomain(doc));

      return { documents, total };
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findByCollaboratorId(
    collaboratorId: string,
    filters?: {
      kind?: DocumentKind;
      isActive?: boolean;
    }
  ): Promise<CollaboratorDocument[]> {
    try {
      const query: any = { collaboratorId };

      if (filters?.kind) {
        query.kind = filters.kind;
      }

      if (filters?.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      // Ordenar por fecha de subida (más recientes primero)
      const documents = await CollaboratorDocumentModel.find(query)
        .sort({ uploadedAt: -1 })
        .exec();

      return documents.map((doc) => this.toDomain(doc));
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async existsByCollaboratorAndKind(
    collaboratorId: string,
    kind: DocumentKind,
    excludeDocumentId?: string
  ): Promise<boolean> {
    try {
      const query: any = {
        collaboratorId,
        kind,
        isActive: true, // Solo contar documentos activos
      };

      // Excluir un documento específico (útil para updates)
      if (excludeDocumentId && Types.ObjectId.isValid(excludeDocumentId)) {
        query._id = { $ne: new Types.ObjectId(excludeDocumentId) };
      }

      const count = await CollaboratorDocumentModel.countDocuments(query).exec();
      return count > 0;
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async countByCollaboratorAndKind(
    collaboratorId: string,
    kind: DocumentKind,
    isActive: boolean = true
  ): Promise<number> {
    try {
      const count = await CollaboratorDocumentModel.countDocuments({
        collaboratorId,
        kind,
        isActive,
      }).exec();
      return count;
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }
}
