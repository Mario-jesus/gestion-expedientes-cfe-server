import { Types } from 'mongoose';
import { DocumentType } from '@modules/catalogs/domain/entities/DocumentType';
import { IDocumentTypeRepository } from '@modules/catalogs/domain/ports/output/IDocumentTypeRepository';
import { DocumentTypeNotFoundError } from '@modules/catalogs/domain/exceptions/DocumentTypeNotFoundError';
import { DuplicateDocumentTypeError } from '@modules/catalogs/domain/exceptions/DuplicateDocumentTypeError';
import { DocumentKind } from '@modules/catalogs/domain/enums/DocumentKind';
import { DocumentTypeModel, DocumentTypeDocument } from '../schemas/DocumentTypeSchema';
import { ILogger } from '@shared/domain';
import { CollaboratorDocumentModel } from '@modules/documents/infrastructure/adapters/output/database/mongo/schemas/CollaboratorDocumentSchema';

/**
 * Implementación del repositorio de tipos de documento usando MongoDB/Mongoose
 */
export class DocumentTypeRepository implements IDocumentTypeRepository {
  constructor(private readonly logger: ILogger) {}

  /**
   * Convierte un DocumentTypeDocument de Mongoose a una entidad DocumentType del dominio
   */
  private toDomain(document: DocumentTypeDocument): DocumentType {
    return DocumentType.fromPersistence(
      {
        nombre: document.nombre,
        kind: document.kind as DocumentKind,
        descripcion: document.descripcion,
        isActive: document.isActive,
      },
      document._id.toString(),
      document.createdAt,
      document.updatedAt
    );
  }

  /**
   * Convierte una entidad DocumentType del dominio a datos para persistencia
   */
  private toPersistence(documentType: DocumentType) {
    const persistenceData = documentType.toPersistence();
    return {
      nombre: persistenceData.nombre,
      kind: persistenceData.kind,
      ...(persistenceData.descripcion !== undefined && { descripcion: persistenceData.descripcion }),
      isActive: persistenceData.isActive,
    };
  }

  /**
   * Maneja errores de MongoDB y los convierte a excepciones de dominio
   */
  private handleMongoError(error: any): never {
    // Error de duplicado (código 11000) - para nombre + kind
    if (error.code === 11000) {
      const duplicateNombre = error.keyValue?.nombre || 'unknown';
      const duplicateKind = error.keyValue?.kind || 'unknown';
      this.logger.warn('Intento de crear tipo de documento duplicado', {
        nombre: duplicateNombre,
        kind: duplicateKind,
      });
      throw new DuplicateDocumentTypeError(duplicateNombre, duplicateKind as DocumentKind);
    }

    // Error de ObjectId inválido
    if (error.name === 'CastError' && error.path === '_id') {
      this.logger.debug('ObjectId inválido en consulta', {
        invalidId: error.value,
      });
      throw new DocumentTypeNotFoundError(error.value);
    }

    // Log de errores inesperados
    this.logger.error(
      'Error inesperado en DocumentTypeRepository',
      error instanceof Error ? error : new Error(String(error)),
      {
        errorCode: error.code,
        errorName: error.name,
      }
    );

    // Re-lanzar otros errores
    throw error;
  }

  async findById(id: string): Promise<DocumentType | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return null;
      }

      const document = await DocumentTypeModel.findById(id).exec();

      if (!document) {
        return null;
      }

      return this.toDomain(document);
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findByNombreAndKind(nombre: string, kind: DocumentKind): Promise<DocumentType | null> {
    try {
      const document = await DocumentTypeModel.findOne({
        nombre: nombre.trim(),
        kind,
      }).exec();

      if (!document) {
        return null;
      }

      return this.toDomain(document);
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async save(documentType: DocumentType): Promise<DocumentType> {
    if (documentType.id) {
      return this.update(documentType);
    } else {
      return this.create(documentType);
    }
  }

  async create(documentType: DocumentType): Promise<DocumentType> {
    try {
      const persistenceData = this.toPersistence(documentType);

      const document = new DocumentTypeModel(persistenceData);

      if (Types.ObjectId.isValid(documentType.id)) {
        document._id = new Types.ObjectId(documentType.id);
      }

      const savedDocument = await document.save();
      this.logger.info('Tipo de documento creado exitosamente', {
        documentTypeId: savedDocument._id.toString(),
        nombre: documentType.nombre,
        kind: documentType.kind,
      });
      return this.toDomain(savedDocument);
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async update(documentType: DocumentType): Promise<DocumentType> {
    try {
      if (!Types.ObjectId.isValid(documentType.id)) {
        throw new DocumentTypeNotFoundError(documentType.id);
      }

      const persistenceData = this.toPersistence(documentType);

      const document = await DocumentTypeModel.findByIdAndUpdate(
        documentType.id,
        {
          $set: persistenceData,
          $setOnInsert: {
            createdAt: documentType.createdAt || new Date(),
          },
        },
        {
          new: true,
          runValidators: true,
          upsert: false,
        }
      ).exec();

      if (!document) {
        throw new DocumentTypeNotFoundError(documentType.id);
      }

      return this.toDomain(document);
    } catch (error: any) {
      if (error instanceof DocumentTypeNotFoundError || error instanceof DuplicateDocumentTypeError) {
        throw error;
      }
      this.handleMongoError(error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.logger.debug('Intento de eliminar tipo de documento con ID inválido', { documentTypeId: id });
        return false;
      }

      const document = await DocumentTypeModel.findByIdAndUpdate(
        id,
        { $set: { isActive: false } },
        { new: true }
      ).exec();

      if (document) {
        this.logger.info('Tipo de documento eliminado exitosamente (baja lógica)', {
          documentTypeId: id,
          nombre: document.nombre,
        });
        return true;
      } else {
        this.logger.debug('Intento de eliminar tipo de documento inexistente', { documentTypeId: id });
        return false;
      }
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findAll(
    filters?: {
      kind?: DocumentKind;
      isActive?: boolean;
      search?: string;
    },
    limit: number = 20,
    offset: number = 0,
    sortBy: 'nombre' | 'kind' | 'createdAt' = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ documentTypes: DocumentType[]; total: number }> {
    try {
      const query: any = {};

      if (filters?.kind) {
        query.kind = filters.kind;
      }

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
          case 'kind':
            sort.kind = sortOrder === 'asc' ? 1 : -1;
            sort.nombre = sortOrder === 'asc' ? 1 : -1; // Ordenar por nombre como segundo criterio
            break;
          case 'createdAt':
          default:
            sort.createdAt = sortOrder === 'asc' ? 1 : -1;
            break;
        }
      }

      const [documents, total] = await Promise.all([
        DocumentTypeModel.find(query).skip(offset).limit(limit).sort(sort).exec(),
        DocumentTypeModel.countDocuments(query).exec(),
      ]);

      const documentTypes = documents.map((doc) => this.toDomain(doc));

      return { documentTypes, total };
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async existsByNombreAndKind(nombre: string, kind: DocumentKind): Promise<boolean> {
    try {
      const count = await DocumentTypeModel.countDocuments({
        nombre: nombre.trim(),
        kind,
      }).exec();
      return count > 0;
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findByKind(kind: DocumentKind, isActive?: boolean): Promise<DocumentType[]> {
    try {
      const query: any = { kind };
      if (isActive !== undefined) {
        query.isActive = isActive;
      }

      const documents = await DocumentTypeModel.find(query).exec();
      return documents.map((doc) => this.toDomain(doc));
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async countDocumentsByDocumentTypeId(
    documentTypeId: string,
    isActive?: boolean
  ): Promise<number> {
    try {
      const query: any = { documentTypeId };
      if (isActive !== undefined) {
        query.isActive = isActive;
      }
      return await CollaboratorDocumentModel.countDocuments(query).exec();
    } catch (error: any) {
      this.logger.error('Error al contar documentos por tipo de documento', error);
      return 0;
    }
  }
}
