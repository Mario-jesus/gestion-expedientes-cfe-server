/**
 * Barrel export para el dominio del módulo documents
 */

// Entidades
export { CollaboratorDocument } from './entities/CollaboratorDocument';
export type { CollaboratorDocumentProps } from './entities/CollaboratorDocument';

// Re-exportar DocumentKind desde catalogs (reutilización)
export { DocumentKind } from '@modules/catalogs/domain/enums/DocumentKind';

// Excepciones
export { DocumentNotFoundError } from './exceptions/DocumentNotFoundError';
export { InvalidFileTypeError } from './exceptions/InvalidFileTypeError';
export { FileSizeExceededError } from './exceptions/FileSizeExceededError';
export { DuplicateDocumentError } from './exceptions/DuplicateDocumentError';

// Eventos
export { DocumentCreated } from './events/DocumentCreated';
export { DocumentUpdated } from './events/DocumentUpdated';
export { DocumentDeleted } from './events/DocumentDeleted';
export { DocumentDownloaded } from './events/DocumentDownloaded';

// Ports
export type { IFileStorageService } from './ports/output/IFileStorageService';
export type { IDocumentRepository } from './ports/output/IDocumentRepository';
