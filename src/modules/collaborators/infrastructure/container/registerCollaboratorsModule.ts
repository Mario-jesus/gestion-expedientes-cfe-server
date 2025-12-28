import { asClass, Lifetime, AwilixContainer } from 'awilix';

// Output adapters
import { CollaboratorRepository } from '../adapters/output/database/mongo/persistence/CollaboratorRepository';

// Use cases
import { CreateCollaboratorUseCase } from '../../application/use-cases/CreateCollaboratorUseCase';
import { GetCollaboratorByIdUseCase } from '../../application/use-cases/GetCollaboratorByIdUseCase';
import { ListCollaboratorsUseCase } from '../../application/use-cases/ListCollaboratorsUseCase';
import { UpdateCollaboratorUseCase } from '../../application/use-cases/UpdateCollaboratorUseCase';
import { DeleteCollaboratorUseCase } from '../../application/use-cases/DeleteCollaboratorUseCase';
import { ActivateCollaboratorUseCase } from '../../application/use-cases/ActivateCollaboratorUseCase';
import { DeactivateCollaboratorUseCase } from '../../application/use-cases/DeactivateCollaboratorUseCase';

// Input adapters
import { CollaboratorController } from '../adapters/input/http/CollaboratorController';

/**
 * Registra todas las dependencias del módulo collaborators en el contenedor de DI
 * 
 * Esta función debe ser llamada después de registrar las dependencias compartidas
 * (database, logger, eventBus) ya que el módulo collaborators depende de ellas.
 * 
 * Orden de registro (importante para resolución de dependencias):
 * 1. Output adapters (repositorios)
 * 2. Casos de uso
 * 3. Controllers
 * 
 * @param container - Contenedor de Awilix donde se registrarán las dependencias
 */
export function registerCollaboratorsModule(container: AwilixContainer): void {
  // ============================================
  // OUTPUT ADAPTERS (Implementaciones de output ports)
  // ============================================
  // Estos son adaptadores que implementan interfaces del dominio

  // Repositorio de colaboradores (MongoDB)
  // Dependencias: logger (del container compartido)
  container.register({
    collaboratorRepository: asClass(CollaboratorRepository, {
      lifetime: Lifetime.SINGLETON, // Una sola instancia para toda la aplicación
    }),
  });

  // ============================================
  // USE CASES (Casos de uso)
  // ============================================
  // Los casos de uso dependen de repositorios y servicios compartidos (eventBus, logger)

  // GetCollaboratorByIdUseCase - Necesita collaboratorRepository y logger
  container.register({
    getCollaboratorByIdUseCase: asClass(GetCollaboratorByIdUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // ListCollaboratorsUseCase - Necesita collaboratorRepository, documentRepository y logger
  // Nota: documentRepository viene del módulo documents (debe registrarse después)
  container.register({
    listCollaboratorsUseCase: asClass(ListCollaboratorsUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // CreateCollaboratorUseCase - Necesita collaboratorRepository, eventBus y logger
  container.register({
    createCollaboratorUseCase: asClass(CreateCollaboratorUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // UpdateCollaboratorUseCase - Necesita collaboratorRepository, eventBus y logger
  container.register({
    updateCollaboratorUseCase: asClass(UpdateCollaboratorUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // DeleteCollaboratorUseCase - Necesita collaboratorRepository, eventBus y logger
  container.register({
    deleteCollaboratorUseCase: asClass(DeleteCollaboratorUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // ActivateCollaboratorUseCase - Necesita collaboratorRepository, eventBus y logger
  container.register({
    activateCollaboratorUseCase: asClass(ActivateCollaboratorUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // DeactivateCollaboratorUseCase - Necesita collaboratorRepository, eventBus y logger
  container.register({
    deactivateCollaboratorUseCase: asClass(DeactivateCollaboratorUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // ============================================
  // INPUT ADAPTERS (Controllers HTTP)
  // ============================================
  // Los controllers dependen de todos los casos de uso y logger

  // Controller HTTP de colaboradores
  // Dependencias: todos los casos de uso + logger (del container compartido)
  container.register({
    collaboratorController: asClass(CollaboratorController, {
      lifetime: Lifetime.SINGLETON,
    }),
  });
}
