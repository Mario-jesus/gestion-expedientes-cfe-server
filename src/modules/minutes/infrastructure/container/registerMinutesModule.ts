import { asClass, Lifetime, AwilixContainer } from 'awilix';

// Output adapters
import { MinuteRepository } from '../adapters/output/database/mongo/persistence/MinuteRepository';

// Use cases
import { CreateMinuteUseCase } from '../../application/use-cases/CreateMinuteUseCase';
import { GetMinuteByIdUseCase } from '../../application/use-cases/GetMinuteByIdUseCase';
import { ListMinutesUseCase } from '../../application/use-cases/ListMinutesUseCase';
import { UpdateMinuteUseCase } from '../../application/use-cases/UpdateMinuteUseCase';
import { DeleteMinuteUseCase } from '../../application/use-cases/DeleteMinuteUseCase';
import { GetMinuteDownloadUrlUseCase } from '../../application/use-cases/GetMinuteDownloadUrlUseCase';

// Input adapters
import { MinuteController } from '../adapters/input/http/MinuteController';

/**
 * Registra todas las dependencias del módulo minutes en el contenedor de DI
 * 
 * Esta función debe ser llamada después de registrar las dependencias compartidas
 * (database, logger, eventBus) y después de documents (porque necesita fileStorageService).
 * 
 * Orden de registro (importante para resolución de dependencias):
 * 1. Output adapters (repositorios)
 * 2. Casos de uso
 * 3. Controllers
 * 
 * Nota: fileStorageService se reutiliza del módulo documents (ya registrado)
 * 
 * @param container - Contenedor de Awilix donde se registrarán las dependencias
 */
export function registerMinutesModule(container: AwilixContainer): void {
  // ============================================
  // OUTPUT ADAPTERS (Implementaciones de output ports)
  // ============================================
  // Estos son adaptadores que implementan interfaces del dominio

  // Repositorio de minutas (MongoDB)
  // Dependencias: logger (del container compartido)
  container.register({
    minuteRepository: asClass(MinuteRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // Nota: fileStorageService se reutiliza del módulo documents
  // No es necesario registrarlo aquí, ya está disponible en el container

  // ============================================
  // USE CASES (Casos de uso)
  // ============================================
  // Los casos de uso dependen de repositorios, servicios y servicios compartidos

  // GetMinuteByIdUseCase - Necesita minuteRepository y logger
  container.register({
    getMinuteByIdUseCase: asClass(GetMinuteByIdUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // ListMinutesUseCase - Necesita minuteRepository y logger
  container.register({
    listMinutesUseCase: asClass(ListMinutesUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // CreateMinuteUseCase - Necesita minuteRepository, fileStorageService, eventBus y logger
  container.register({
    createMinuteUseCase: asClass(CreateMinuteUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // UpdateMinuteUseCase - Necesita minuteRepository, eventBus y logger
  container.register({
    updateMinuteUseCase: asClass(UpdateMinuteUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // DeleteMinuteUseCase - Necesita minuteRepository, eventBus y logger
  container.register({
    deleteMinuteUseCase: asClass(DeleteMinuteUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // GetMinuteDownloadUrlUseCase - Necesita minuteRepository, fileStorageService, eventBus y logger
  container.register({
    getMinuteDownloadUrlUseCase: asClass(GetMinuteDownloadUrlUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // ============================================
  // INPUT ADAPTERS (Controllers HTTP)
  // ============================================
  // Los controllers dependen de todos los casos de uso y logger

  // Controller HTTP de minutas
  // Dependencias: todos los casos de uso + logger (del container compartido)
  container.register({
    minuteController: asClass(MinuteController, {
      lifetime: Lifetime.SINGLETON,
    }),
  });
}
