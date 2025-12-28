/**
 * Mock de DocumentTypeRepository para tests
 * Implementa IDocumentTypeRepository usando almacenamiento en memoria
 * 
 * Este mock permite ejecutar tests E2E sin necesidad de MongoDB
 */

import { DocumentType } from '@modules/catalogs/domain/entities/DocumentType';
import { IDocumentTypeRepository } from '@modules/catalogs/domain/ports/output/IDocumentTypeRepository';
import { DocumentTypeNotFoundError } from '@modules/catalogs/domain/exceptions/DocumentTypeNotFoundError';
import { DuplicateDocumentTypeError } from '@modules/catalogs/domain/exceptions/DuplicateDocumentTypeError';
import { DocumentKind } from '@modules/catalogs/domain/enums/DocumentKind';
import { ILogger } from '@shared/domain';

export class InMemoryDocumentTypeRepository implements IDocumentTypeRepository {
  private documentTypes: Map<string, DocumentType> = new Map();
  private documentTypesByNombreAndKind: Map<string, string> = new Map(); // "nombre|kind" -> documentTypeId

  constructor(private readonly logger: ILogger) {}

  private getKey(nombre: string, kind: DocumentKind): string {
    return `${nombre.trim().toLowerCase()}|${kind}`;
  }

  async findById(id: string): Promise<DocumentType | null> {
    return this.documentTypes.get(id) || null;
  }

  async findByNombreAndKind(nombre: string, kind: DocumentKind): Promise<DocumentType | null> {
    const key = this.getKey(nombre, kind);
    const documentTypeId = this.documentTypesByNombreAndKind.get(key);
    if (!documentTypeId) {
      return null;
    }
    return this.documentTypes.get(documentTypeId) || null;
  }

  async save(documentType: DocumentType): Promise<DocumentType> {
    const existing = await this.findById(documentType.id);
    if (existing) {
      return this.update(documentType);
    }
    return this.create(documentType);
  }

  async create(documentType: DocumentType): Promise<DocumentType> {
    // Verificar que el nombre no exista en el kind
    const existing = await this.findByNombreAndKind(documentType.nombre, documentType.kind);
    if (existing && existing.id !== documentType.id) {
      throw new DuplicateDocumentTypeError(documentType.nombre, documentType.kind);
    }

    // Guardar tipo de documento
    this.documentTypes.set(documentType.id, documentType);
    this.documentTypesByNombreAndKind.set(
      this.getKey(documentType.nombre, documentType.kind),
      documentType.id
    );

    this.logger.debug('Tipo de documento creado en memoria', {
      documentTypeId: documentType.id,
      nombre: documentType.nombre,
      kind: documentType.kind,
    });

    return documentType;
  }

  async update(documentType: DocumentType): Promise<DocumentType> {
    const existing = await this.findById(documentType.id);
    if (!existing) {
      throw new DocumentTypeNotFoundError(documentType.id);
    }

    // Verificar que el nombre no esté en uso por otro tipo de documento en el mismo kind
    const existingByNombre = await this.findByNombreAndKind(
      documentType.nombre,
      documentType.kind
    );
    if (existingByNombre && existingByNombre.id !== documentType.id) {
      throw new DuplicateDocumentTypeError(documentType.nombre, documentType.kind);
    }

    // Actualizar índice si el nombre o kind cambiaron
    const oldKey = this.getKey(existing.nombre, existing.kind);
    const newKey = this.getKey(documentType.nombre, documentType.kind);
    if (oldKey !== newKey) {
      this.documentTypesByNombreAndKind.delete(oldKey);
      this.documentTypesByNombreAndKind.set(newKey, documentType.id);
    }

    // Actualizar tipo de documento
    this.documentTypes.set(documentType.id, documentType);

    this.logger.debug('Tipo de documento actualizado en memoria', {
      documentTypeId: documentType.id,
      nombre: documentType.nombre,
    });

    return documentType;
  }

  async delete(id: string): Promise<boolean> {
    const documentType = await this.findById(id);
    if (!documentType) {
      return false;
    }

    // Marcar como inactivo (baja lógica)
    const inactiveDocumentType = DocumentType.fromPersistence(
      {
        nombre: documentType.nombre,
        kind: documentType.kind,
        descripcion: documentType.descripcion,
        isActive: false,
      },
      documentType.id,
      documentType.createdAt,
      documentType.updatedAt
    );

    this.documentTypes.set(id, inactiveDocumentType);

    this.logger.debug('Tipo de documento eliminado (baja lógica) en memoria', {
      documentTypeId: id,
    });

    return true;
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
    let filteredDocumentTypes = Array.from(this.documentTypes.values());

    // Aplicar filtros
    if (filters?.kind) {
      filteredDocumentTypes = filteredDocumentTypes.filter((dt) => dt.kind === filters.kind);
    }

    if (filters?.isActive !== undefined) {
      filteredDocumentTypes = filteredDocumentTypes.filter(
        (dt) => dt.isActive === filters.isActive
      );
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredDocumentTypes = filteredDocumentTypes.filter((dt) =>
        dt.nombre.toLowerCase().includes(searchLower)
      );
    }

    // Ordenar
    filteredDocumentTypes.sort((a, b) => {
      if (sortBy === 'nombre') {
        const comparison = a.nombre.localeCompare(b.nombre);
        return sortOrder === 'asc' ? comparison : -comparison;
      } else if (sortBy === 'kind') {
        const comparison = a.kind.localeCompare(b.kind);
        if (comparison !== 0) {
          return sortOrder === 'asc' ? comparison : -comparison;
        }
        // Si el kind es igual, ordenar por nombre
        const nombreComparison = a.nombre.localeCompare(b.nombre);
        return sortOrder === 'asc' ? nombreComparison : -nombreComparison;
      } else {
        // createdAt
        const aDate = a.createdAt?.getTime() || 0;
        const bDate = b.createdAt?.getTime() || 0;
        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      }
    });

    const total = filteredDocumentTypes.length;

    // Aplicar paginación
    const paginatedDocumentTypes = filteredDocumentTypes.slice(offset, offset + limit);

    return {
      documentTypes: paginatedDocumentTypes,
      total,
    };
  }

  async existsByNombreAndKind(nombre: string, kind: DocumentKind): Promise<boolean> {
    const documentType = await this.findByNombreAndKind(nombre, kind);
    return documentType !== null;
  }

  async findByKind(kind: DocumentKind, isActive?: boolean): Promise<DocumentType[]> {
    let documentTypes = Array.from(this.documentTypes.values()).filter((dt) => dt.kind === kind);

    if (isActive !== undefined) {
      documentTypes = documentTypes.filter((dt) => dt.isActive === isActive);
    }

    return documentTypes;
  }

  async countDocumentsByDocumentTypeId(
    _documentTypeId: string,
    _isActive?: boolean
  ): Promise<number> {
    // En un mock real, esto debería consultar el repositorio de documentos
    // Por ahora retornamos 0 ya que es solo para tests
    return 0;
  }

  /**
   * Limpia todos los tipos de documento (útil para tests)
   */
  clear(): void {
    this.documentTypes.clear();
    this.documentTypesByNombreAndKind.clear();
  }
}
