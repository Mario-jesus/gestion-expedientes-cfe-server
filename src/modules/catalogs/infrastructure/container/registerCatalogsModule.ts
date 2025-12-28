import { asClass, Lifetime, AwilixContainer } from 'awilix';

// Output adapters
import { AreaRepository } from '../adapters/output/database/mongo/persistence/AreaRepository';
import { AdscripcionRepository } from '../adapters/output/database/mongo/persistence/AdscripcionRepository';
import { PuestoRepository } from '../adapters/output/database/mongo/persistence/PuestoRepository';
import { DocumentTypeRepository } from '../adapters/output/database/mongo/persistence/DocumentTypeRepository';

// Use cases - Areas
import { GetAreaByIdUseCase } from '../../application/use-cases/areas/GetAreaByIdUseCase';
import { ListAreasUseCase } from '../../application/use-cases/areas/ListAreasUseCase';
import { CreateAreaUseCase } from '../../application/use-cases/areas/CreateAreaUseCase';
import { UpdateAreaUseCase } from '../../application/use-cases/areas/UpdateAreaUseCase';
import { DeleteAreaUseCase } from '../../application/use-cases/areas/DeleteAreaUseCase';
import { ActivateAreaUseCase } from '../../application/use-cases/areas/ActivateAreaUseCase';
import { DeactivateAreaUseCase } from '../../application/use-cases/areas/DeactivateAreaUseCase';

// Use cases - Adscripciones
import { GetAdscripcionByIdUseCase } from '../../application/use-cases/adscripciones/GetAdscripcionByIdUseCase';
import { ListAdscripcionesUseCase } from '../../application/use-cases/adscripciones/ListAdscripcionesUseCase';
import { CreateAdscripcionUseCase } from '../../application/use-cases/adscripciones/CreateAdscripcionUseCase';
import { UpdateAdscripcionUseCase } from '../../application/use-cases/adscripciones/UpdateAdscripcionUseCase';
import { DeleteAdscripcionUseCase } from '../../application/use-cases/adscripciones/DeleteAdscripcionUseCase';
import { ActivateAdscripcionUseCase } from '../../application/use-cases/adscripciones/ActivateAdscripcionUseCase';
import { DeactivateAdscripcionUseCase } from '../../application/use-cases/adscripciones/DeactivateAdscripcionUseCase';

// Use cases - Puestos
import { GetPuestoByIdUseCase } from '../../application/use-cases/puestos/GetPuestoByIdUseCase';
import { ListPuestosUseCase } from '../../application/use-cases/puestos/ListPuestosUseCase';
import { CreatePuestoUseCase } from '../../application/use-cases/puestos/CreatePuestoUseCase';
import { UpdatePuestoUseCase } from '../../application/use-cases/puestos/UpdatePuestoUseCase';
import { DeletePuestoUseCase } from '../../application/use-cases/puestos/DeletePuestoUseCase';
import { ActivatePuestoUseCase } from '../../application/use-cases/puestos/ActivatePuestoUseCase';
import { DeactivatePuestoUseCase } from '../../application/use-cases/puestos/DeactivatePuestoUseCase';

// Use cases - DocumentTypes
import { GetDocumentTypeByIdUseCase } from '../../application/use-cases/documentTypes/GetDocumentTypeByIdUseCase';
import { ListDocumentTypesUseCase } from '../../application/use-cases/documentTypes/ListDocumentTypesUseCase';
import { CreateDocumentTypeUseCase } from '../../application/use-cases/documentTypes/CreateDocumentTypeUseCase';
import { UpdateDocumentTypeUseCase } from '../../application/use-cases/documentTypes/UpdateDocumentTypeUseCase';
import { DeleteDocumentTypeUseCase } from '../../application/use-cases/documentTypes/DeleteDocumentTypeUseCase';
import { ActivateDocumentTypeUseCase } from '../../application/use-cases/documentTypes/ActivateDocumentTypeUseCase';
import { DeactivateDocumentTypeUseCase } from '../../application/use-cases/documentTypes/DeactivateDocumentTypeUseCase';

// Input adapters
import { AreaController } from '../adapters/input/http/AreaController';
import { AdscripcionController } from '../adapters/input/http/AdscripcionController';
import { PuestoController } from '../adapters/input/http/PuestoController';
import { DocumentTypeController } from '../adapters/input/http/DocumentTypeController';

/**
 * Registra todas las dependencias del módulo catalogs en el contenedor de DI
 * 
 * Esta función debe ser llamada después de registrar las dependencias compartidas
 * (database, logger, eventBus) ya que el módulo catalogs depende de ellas.
 * 
 * Orden de registro (importante para resolución de dependencias):
 * 1. Output adapters (repositorios)
 * 2. Casos de uso
 * 3. Controllers
 * 
 * @param container - Contenedor de Awilix donde se registrarán las dependencias
 */
export function registerCatalogsModule(container: AwilixContainer): void {
  // ============================================
  // OUTPUT ADAPTERS (Implementaciones de output ports)
  // ============================================
  // Estos son adaptadores que implementan interfaces del dominio

  // Repositorio de áreas (MongoDB)
  // Dependencias: logger (del container compartido)
  container.register({
    areaRepository: asClass(AreaRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // Repositorio de adscripciones (MongoDB)
  // Dependencias: logger (del container compartido)
  container.register({
    adscripcionRepository: asClass(AdscripcionRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // Repositorio de puestos (MongoDB)
  // Dependencias: logger (del container compartido)
  container.register({
    puestoRepository: asClass(PuestoRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // Repositorio de tipos de documento (MongoDB)
  // Dependencias: logger (del container compartido)
  container.register({
    documentTypeRepository: asClass(DocumentTypeRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // ============================================
  // USE CASES - AREAS
  // ============================================

  container.register({
    getAreaByIdUseCase: asClass(GetAreaByIdUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  container.register({
    listAreasUseCase: asClass(ListAreasUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  container.register({
    createAreaUseCase: asClass(CreateAreaUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  container.register({
    updateAreaUseCase: asClass(UpdateAreaUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  container.register({
    deleteAreaUseCase: asClass(DeleteAreaUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  container.register({
    activateAreaUseCase: asClass(ActivateAreaUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  container.register({
    deactivateAreaUseCase: asClass(DeactivateAreaUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // ============================================
  // USE CASES - ADSCRIPCIONES
  // ============================================

  container.register({
    getAdscripcionByIdUseCase: asClass(GetAdscripcionByIdUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  container.register({
    listAdscripcionesUseCase: asClass(ListAdscripcionesUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  container.register({
    createAdscripcionUseCase: asClass(CreateAdscripcionUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  container.register({
    updateAdscripcionUseCase: asClass(UpdateAdscripcionUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  container.register({
    deleteAdscripcionUseCase: asClass(DeleteAdscripcionUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  container.register({
    activateAdscripcionUseCase: asClass(ActivateAdscripcionUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  container.register({
    deactivateAdscripcionUseCase: asClass(DeactivateAdscripcionUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // ============================================
  // USE CASES - PUESTOS
  // ============================================

  container.register({
    getPuestoByIdUseCase: asClass(GetPuestoByIdUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  container.register({
    listPuestosUseCase: asClass(ListPuestosUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  container.register({
    createPuestoUseCase: asClass(CreatePuestoUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  container.register({
    updatePuestoUseCase: asClass(UpdatePuestoUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  container.register({
    deletePuestoUseCase: asClass(DeletePuestoUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  container.register({
    activatePuestoUseCase: asClass(ActivatePuestoUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  container.register({
    deactivatePuestoUseCase: asClass(DeactivatePuestoUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // ============================================
  // USE CASES - DOCUMENT TYPES
  // ============================================

  container.register({
    getDocumentTypeByIdUseCase: asClass(GetDocumentTypeByIdUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  container.register({
    listDocumentTypesUseCase: asClass(ListDocumentTypesUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  container.register({
    createDocumentTypeUseCase: asClass(CreateDocumentTypeUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  container.register({
    updateDocumentTypeUseCase: asClass(UpdateDocumentTypeUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  container.register({
    deleteDocumentTypeUseCase: asClass(DeleteDocumentTypeUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  container.register({
    activateDocumentTypeUseCase: asClass(ActivateDocumentTypeUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  container.register({
    deactivateDocumentTypeUseCase: asClass(DeactivateDocumentTypeUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // ============================================
  // INPUT ADAPTERS (Controllers HTTP)
  // ============================================
  // Los controllers dependen de todos los casos de uso y logger

  // Controller HTTP de áreas
  container.register({
    areaController: asClass(AreaController, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // Controller HTTP de adscripciones
  container.register({
    adscripcionController: asClass(AdscripcionController, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // Controller HTTP de puestos
  container.register({
    puestoController: asClass(PuestoController, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // Controller HTTP de tipos de documento
  container.register({
    documentTypeController: asClass(DocumentTypeController, {
      lifetime: Lifetime.SINGLETON,
    }),
  });
}
