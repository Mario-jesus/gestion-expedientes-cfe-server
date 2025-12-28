/**
 * Barrel export para la capa de aplicación del módulo documents
 */

// DTOs
export type { CreateDocumentDTO } from './dto/CreateDocumentDTO';
export type { UpdateDocumentDTO } from './dto/UpdateDocumentDTO';
export type { ListDocumentsFiltersDTO } from './dto/ListDocumentsFiltersDTO';

// Ports (interfaces de casos de uso)
export type { ICreateDocumentUseCase } from './ports/input/ICreateDocumentUseCase';
export type { IGetDocumentByIdUseCase } from './ports/input/IGetDocumentByIdUseCase';
export type { IListDocumentsUseCase } from './ports/input/IListDocumentsUseCase';
export type { IUpdateDocumentUseCase } from './ports/input/IUpdateDocumentUseCase';
export type { IDeleteDocumentUseCase } from './ports/input/IDeleteDocumentUseCase';
export type { IGetDocumentDownloadUrlUseCase } from './ports/input/IGetDocumentDownloadUrlUseCase';

// Use Cases
export { CreateDocumentUseCase } from './use-cases/CreateDocumentUseCase';
export { GetDocumentByIdUseCase } from './use-cases/GetDocumentByIdUseCase';
export { ListDocumentsUseCase } from './use-cases/ListDocumentsUseCase';
export { UpdateDocumentUseCase } from './use-cases/UpdateDocumentUseCase';
export { DeleteDocumentUseCase } from './use-cases/DeleteDocumentUseCase';
export { GetDocumentDownloadUrlUseCase } from './use-cases/GetDocumentDownloadUrlUseCase';
