/**
 * Barrel export para adaptadores de entrada HTTP del módulo documents
 */
export { DocumentController } from './DocumentController';
export { createDocumentRoutes } from './routes';
export { singleFileUpload, createFileUploadMiddleware } from './middleware/fileUpload';
