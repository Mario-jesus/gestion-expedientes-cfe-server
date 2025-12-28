/**
 * Mock de DocumentRepository para tests
 * Implementa IDocumentRepository usando almacenamiento en memoria
 * 
 * Este mock permite ejecutar tests E2E sin necesidad de MongoDB
 */

import { CollaboratorDocument } from '@modules/documents/domain/entities/CollaboratorDocument';
import { IDocumentRepository } from '@modules/documents/domain/ports/output/IDocumentRepository';
import { DocumentNotFoundError } from '@modules/documents/domain/exceptions/DocumentNotFoundError';
import { DocumentKind } from '@modules/catalogs/domain/enums/DocumentKind';
import { ILogger } from '@shared/domain';

export class InMemoryDocumentRepository implements IDocumentRepository {
  private documents: Map<string, CollaboratorDocument> = new Map();
  private documentsByCollaborator: Map<string, string[]> = new Map(); // collaboratorId -> documentIds[]

  constructor(private readonly logger: ILogger) {}

  async findById(id: string): Promise<CollaboratorDocument | null> {
    return this.documents.get(id) || null;
  }

  async save(document: CollaboratorDocument): Promise<CollaboratorDocument> {
    const existing = await this.findById(document.id);
    if (existing) {
      return this.update(document);
    }
    return this.create(document);
  }

  async create(document: CollaboratorDocument): Promise<CollaboratorDocument> {
    // Guardar documento
    this.documents.set(document.id, document);

    // Actualizar índice por colaborador
    const collaboratorDocs = this.documentsByCollaborator.get(document.collaboratorId) || [];
    if (!collaboratorDocs.includes(document.id)) {
      collaboratorDocs.push(document.id);
      this.documentsByCollaborator.set(document.collaboratorId, collaboratorDocs);
    }

    this.logger.debug('Documento creado en memoria', {
      documentId: document.id,
      collaboratorId: document.collaboratorId,
      kind: document.kind,
    });

    return document;
  }

  async update(document: CollaboratorDocument): Promise<CollaboratorDocument> {
    const existing = await this.findById(document.id);
    if (!existing) {
      throw new DocumentNotFoundError(document.id);
    }

    // Actualizar documento
    this.documents.set(document.id, document);

    // Si el collaboratorId cambió (aunque no debería), actualizar índices
    if (existing.collaboratorId !== document.collaboratorId) {
      // Remover del índice anterior
      const oldCollaboratorDocs = this.documentsByCollaborator.get(existing.collaboratorId) || [];
      const filteredOld = oldCollaboratorDocs.filter((id) => id !== document.id);
      this.documentsByCollaborator.set(existing.collaboratorId, filteredOld);

      // Agregar al nuevo índice
      const newCollaboratorDocs = this.documentsByCollaborator.get(document.collaboratorId) || [];
      if (!newCollaboratorDocs.includes(document.id)) {
        newCollaboratorDocs.push(document.id);
        this.documentsByCollaborator.set(document.collaboratorId, newCollaboratorDocs);
      }
    }

    this.logger.debug('Documento actualizado en memoria', {
      documentId: document.id,
      collaboratorId: document.collaboratorId,
    });

    return document;
  }

  async delete(id: string): Promise<boolean> {
    const document = await this.findById(id);
    if (!document) {
      return false;
    }

    // Marcar como inactivo (baja lógica)
    const inactiveDocument = CollaboratorDocument.fromPersistence(
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
        isActive: false,
      },
      document.id,
      document.createdAt,
      document.updatedAt
    );

    this.documents.set(id, inactiveDocument);

    this.logger.debug('Documento eliminado (baja lógica) en memoria', {
      documentId: id,
    });

    return true;
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
    let filteredDocuments = Array.from(this.documents.values());

    // Aplicar filtros
    if (filters?.collaboratorId) {
      filteredDocuments = filteredDocuments.filter(
        (doc) => doc.collaboratorId === filters.collaboratorId
      );
    }

    if (filters?.kind) {
      filteredDocuments = filteredDocuments.filter((doc) => doc.kind === filters.kind);
    }

    if (filters?.isActive !== undefined) {
      filteredDocuments = filteredDocuments.filter((doc) => doc.isActive === filters.isActive);
    }

    if (filters?.documentTypeId) {
      filteredDocuments = filteredDocuments.filter(
        (doc) => doc.documentTypeId === filters.documentTypeId
      );
    }

    // Ordenar por fecha de subida (más recientes primero)
    filteredDocuments.sort((a, b) => {
      const aDate = a.uploadedAt?.getTime() || 0;
      const bDate = b.uploadedAt?.getTime() || 0;
      return bDate - aDate;
    });

    const total = filteredDocuments.length;

    // Aplicar paginación
    const paginatedDocuments = filteredDocuments.slice(offset, offset + limit);

    return {
      documents: paginatedDocuments,
      total,
    };
  }

  async findByCollaboratorId(
    collaboratorId: string,
    filters?: {
      kind?: DocumentKind;
      isActive?: boolean;
    }
  ): Promise<CollaboratorDocument[]> {
    const documentIds = this.documentsByCollaborator.get(collaboratorId) || [];
    let documents = documentIds
      .map((id) => this.documents.get(id))
      .filter((doc): doc is CollaboratorDocument => doc !== undefined);

    // Aplicar filtros adicionales
    if (filters?.kind) {
      documents = documents.filter((doc) => doc.kind === filters.kind);
    }

    if (filters?.isActive !== undefined) {
      documents = documents.filter((doc) => doc.isActive === filters.isActive);
    }

    // Ordenar por fecha de subida (más recientes primero)
    documents.sort((a, b) => {
      const aDate = a.uploadedAt?.getTime() || 0;
      const bDate = b.uploadedAt?.getTime() || 0;
      return bDate - aDate;
    });

    return documents;
  }

  async existsByCollaboratorAndKind(
    collaboratorId: string,
    kind: DocumentKind,
    excludeDocumentId?: string
  ): Promise<boolean> {
    const documents = await this.findByCollaboratorId(collaboratorId, {
      kind,
      isActive: true,
    });

    // Si hay excludeDocumentId, filtrarlo
    if (excludeDocumentId) {
      return documents.some((doc) => doc.id !== excludeDocumentId);
    }

    return documents.length > 0;
  }

  async countByCollaboratorAndKind(
    collaboratorId: string,
    kind: DocumentKind,
    isActive: boolean = true
  ): Promise<number> {
    const documents = await this.findByCollaboratorId(collaboratorId, {
      kind,
      isActive,
    });
    return documents.length;
  }

  /**
   * Limpia todos los documentos (útil para tests)
   */
  clear(): void {
    this.documents.clear();
    this.documentsByCollaborator.clear();
  }
}
