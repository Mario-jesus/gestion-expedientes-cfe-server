import { asClass, Lifetime, AwilixContainer } from 'awilix';

// Output adapters
import { DocumentRepository } from '../adapters/output/database/mongo/persistence/DocumentRepository';
import { LocalFileStorageService } from '../adapters/output/storage/LocalFileStorageService';

// Use cases
import { CreateDocumentUseCase } from '../../application/use-cases/CreateDocumentUseCase';
import { GetDocumentByIdUseCase } from '../../application/use-cases/GetDocumentByIdUseCase';
import { ListDocumentsUseCase } from '../../application/use-cases/ListDocumentsUseCase';
import { UpdateDocumentUseCase } from '../../application/use-cases/UpdateDocumentUseCase';
import { DeleteDocumentUseCase } from '../../application/use-cases/DeleteDocumentUseCase';
import { GetDocumentDownloadUrlUseCase } from '../../application/use-cases/GetDocumentDownloadUrlUseCase';

// Input adapters
import { DocumentController } from '../adapters/input/http/DocumentController';

/**
 * Registra todas las dependencias del módulo documents en el contenedor de DI
 * 
 * Esta función debe ser llamada después de registrar las dependencias compartidas
 * (database, logger, eventBus) y después de collaborators (porque necesita ICollaboratorRepository).
 * 
 * Orden de registro (importante para resolución de dependencias):
 * 1. Output adapters (repositorios, servicios de almacenamiento)
 * 2. Casos de uso
 * 3. Controllers
 * 
 * @param container - Contenedor de Awilix donde se registrarán las dependencias
 */
export function registerDocumentsModule(container: AwilixContainer): void {
  // ============================================
  // OUTPUT ADAPTERS (Implementaciones de output ports)
  // ============================================
  // Estos son adaptadores que implementan interfaces del dominio

  // Repositorio de documentos (MongoDB)
  // Dependencias: logger (del container compartido)
  container.register({
    documentRepository: asClass(DocumentRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // Servicio de almacenamiento de archivos (Local)
  // Dependencias: logger (del container compartido)
  container.register({
    fileStorageService: asClass(LocalFileStorageService, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // ============================================
  // USE CASES (Casos de uso)
  // ============================================
  // Los casos de uso dependen de repositorios, servicios y servicios compartidos

  // GetDocumentByIdUseCase - Necesita documentRepository y logger
  container.register({
    getDocumentByIdUseCase: asClass(GetDocumentByIdUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // ListDocumentsUseCase - Necesita documentRepository y logger
  container.register({
    listDocumentsUseCase: asClass(ListDocumentsUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // CreateDocumentUseCase - Necesita documentRepository, fileStorageService, collaboratorRepository, eventBus y logger
  container.register({
    createDocumentUseCase: asClass(CreateDocumentUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // UpdateDocumentUseCase - Necesita documentRepository, eventBus y logger
  container.register({
    updateDocumentUseCase: asClass(UpdateDocumentUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // DeleteDocumentUseCase - Necesita documentRepository, eventBus y logger
  container.register({
    deleteDocumentUseCase: asClass(DeleteDocumentUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // GetDocumentDownloadUrlUseCase - Necesita documentRepository, fileStorageService, eventBus y logger
  container.register({
    getDocumentDownloadUrlUseCase: asClass(GetDocumentDownloadUrlUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // ============================================
  // INPUT ADAPTERS (Controllers HTTP)
  // ============================================
  // Los controllers dependen de todos los casos de uso y logger

  // Controller HTTP de documentos
  // Dependencias: todos los casos de uso + logger (del container compartido)
  container.register({
    documentController: asClass(DocumentController, {
      lifetime: Lifetime.SINGLETON,
    }),
  });
}
