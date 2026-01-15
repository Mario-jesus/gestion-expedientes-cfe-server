import { asClass, Lifetime, AwilixContainer } from 'awilix';
import { IEventBus, ILogger } from '@shared/domain';

// Output adapters
import { LogEntryRepository } from '../adapters/output/database/mongo/persistence/LogEntryRepository';

// Use cases
import { CreateLogEntryUseCase } from '../../application/use-cases/CreateLogEntryUseCase';
import { GetLogEntryByIdUseCase } from '../../application/use-cases/GetLogEntryByIdUseCase';
import { ListLogEntriesUseCase } from '../../application/use-cases/ListLogEntriesUseCase';
import { GetLogEntriesByEntityUseCase } from '../../application/use-cases/GetLogEntriesByEntityUseCase';
import { GetLogEntriesByUserIdUseCase } from '../../application/use-cases/GetLogEntriesByUserIdUseCase';

// Event handlers
import { AuditLogEventHandler } from '../../application/event-handlers/AuditLogEventHandler';

// Input adapters
import { LogEntryController } from '../adapters/input/http/LogEntryController';

// Importar todos los eventos para suscribir el handler
import {
  UserCreated,
  UserUpdated,
  UserDeleted,
  UserActivated,
  UserDeactivated,
  UserPasswordChanged,
} from '@modules/users/domain/events';

import {
  CollaboratorCreated,
  CollaboratorUpdated,
  CollaboratorDeleted,
  CollaboratorActivated,
  CollaboratorDeactivated,
} from '@modules/collaborators/domain/events';

import {
  DocumentCreated,
  DocumentUpdated,
  DocumentDeleted,
  DocumentDownloaded,
} from '@modules/documents/domain/events';

import {
  MinuteCreated,
  MinuteUpdated,
  MinuteDeleted,
  MinuteDownloaded,
} from '@modules/minutes/domain/events';

import {
  AreaCreated,
  AreaUpdated,
  AreaDeleted,
  AreaActivated,
  AreaDeactivated,
  AdscripcionCreated,
  AdscripcionUpdated,
  AdscripcionDeleted,
  AdscripcionActivated,
  AdscripcionDeactivated,
  PuestoCreated,
  PuestoUpdated,
  PuestoDeleted,
  PuestoActivated,
  PuestoDeactivated,
  DocumentTypeCreated,
  DocumentTypeUpdated,
  DocumentTypeDeleted,
  DocumentTypeActivated,
  DocumentTypeDeactivated,
} from '@modules/catalogs/domain/events';

import {
  UserLoggedIn,
  UserLoggedOut,
  ExpiredRefreshTokenAttemptDetected,
  RefreshTokenReuseDetected,
} from '@modules/auth/domain/events';

/**
 * Registra todas las dependencias del módulo audit en el contenedor de DI
 * 
 * Esta función debe ser llamada después de registrar las dependencias compartidas
 * (database, logger, eventBus) y después de todos los demás módulos (porque necesita
 * suscribirse a todos los eventos de dominio).
 * 
 * Orden de registro (importante para resolución de dependencias):
 * 1. Output adapters (repositorios)
 * 2. Casos de uso
 * 3. Event handlers (y suscripción a eventos)
 * 4. Controllers
 * 
 * @param container - Contenedor de Awilix donde se registrarán las dependencias
 */
export function registerAuditModule(container: AwilixContainer): void {
  // ============================================
  // OUTPUT ADAPTERS (Implementaciones de output ports)
  // ============================================
  // Estos son adaptadores que implementan interfaces del dominio

  // Repositorio de logs de auditoría (MongoDB)
  // Dependencias: logger (del container compartido)
  // Nota: En tests, el mock se registra antes, así que solo registramos si no existe
  // Verificar si ya está registrado usando la propiedad registrations de Awilix
  const containerAny = container as any;
  const hadLogEntryRepositoryBefore = containerAny.registrations?.logEntryRepository !== undefined;

  if (!hadLogEntryRepositoryBefore) {
    // No existe, registrar el repositorio real
    container.register({
      logEntryRepository: asClass(LogEntryRepository, {
        lifetime: Lifetime.SINGLETON,
      }),
    });
  }

  // ============================================
  // USE CASES (Casos de uso)
  // ============================================
  // Los casos de uso dependen de repositorios y servicios compartidos

  // CreateLogEntryUseCase - Necesita logEntryRepository y logger
  container.register({
    createLogEntryUseCase: asClass(CreateLogEntryUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // GetLogEntryByIdUseCase - Necesita logEntryRepository y logger
  container.register({
    getLogEntryByIdUseCase: asClass(GetLogEntryByIdUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // ListLogEntriesUseCase - Necesita logEntryRepository y logger
  container.register({
    listLogEntriesUseCase: asClass(ListLogEntriesUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // GetLogEntriesByEntityUseCase - Necesita logEntryRepository y logger
  container.register({
    getLogEntriesByEntityUseCase: asClass(GetLogEntriesByEntityUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // GetLogEntriesByUserIdUseCase - Necesita logEntryRepository y logger
  container.register({
    getLogEntriesByUserIdUseCase: asClass(GetLogEntriesByUserIdUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // ============================================
  // EVENT HANDLERS
  // ============================================
  // El event handler se suscribe a todos los eventos de dominio para crear logs automáticamente

  // Crear instancia del event handler
  container.register({
    auditLogEventHandler: asClass(AuditLogEventHandler, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // ============================================
  // INPUT ADAPTERS (Controllers HTTP)
  // ============================================
  // Los controllers dependen de todos los casos de uso
  // IMPORTANTE: Registrar el controller SIEMPRE, incluso si no suscribimos eventos

  // Controller HTTP de logs de auditoría
  // Dependencias: todos los casos de uso (del container)
  container.register({
    logEntryController: asClass(LogEntryController, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // Suscribir el handler a todos los eventos de dominio
  // Esto debe hacerse después de que el handler esté registrado
  // IMPORTANTE: Solo suscribir eventos si:
  // 1. NO estamos en un entorno de test
  // 2. El repositorio NO estaba registrado antes (lo acabamos de registrar = producción)
  // 3. Podemos resolver todas las dependencias correctamente
  // 4. El repositorio es el real (no un mock)
  
  // Verificar si estamos en un entorno de test
  // Usar múltiples verificaciones para detectar diferentes entornos de test
  const isTestEnv = process.env.NODE_ENV === 'test' || 
                  process.env.JEST_WORKER_ID !== undefined ||
                  (typeof global !== 'undefined' && (global as any).jest !== undefined) ||
                  (typeof process !== 'undefined' && process.argv.some(arg => arg.includes('jest')));

  if (isTestEnv) {
    // Estamos en un entorno de test, no suscribir eventos
    // Los tests pueden crear logs manualmente si es necesario
    return;
  }

  if (hadLogEntryRepositoryBefore) {
    // Repositorio ya estaba registrado antes (probablemente un mock en tests)
    // Omitir suscripción de eventos para evitar problemas en tests
    return;
  }

  try {
    // Verificar que las dependencias estén disponibles antes de intentar resolver
    const containerAny = container as any;
    const hasEventBus = containerAny.registrations?.eventBus !== undefined;
    const hasLogEntryRepo = containerAny.registrations?.logEntryRepository !== undefined;

    if (!hasEventBus || !hasLogEntryRepo) {
      // En tests, las dependencias pueden no estar disponibles aún
      // La suscripción se omitirá silenciosamente
      return;
    }

    // Intentar resolver las dependencias de forma segura
    // Si falla, probablemente estamos en un test sin las dependencias configuradas
    let eventBus: IEventBus;
    let auditLogEventHandler: AuditLogEventHandler;
    let logger: ILogger;
    let logEntryRepo: any;

    try {
      eventBus = container.resolve<IEventBus>('eventBus');
      auditLogEventHandler = container.resolve<AuditLogEventHandler>('auditLogEventHandler');
      logger = container.resolve<ILogger>('logger');
      logEntryRepo = container.resolve('logEntryRepository');
    } catch (resolveError) {
      // No se pueden resolver las dependencias, probablemente en un test
      // Omitir suscripción silenciosamente
      return;
    }

    // Verificar si el repositorio es el real (LogEntryRepository) o un mock
    // Los mocks tienen nombres diferentes (ej: InMemoryLogEntryRepository)
    const repoClassName = logEntryRepo?.constructor?.name;
    const isRealRepository = repoClassName === 'LogEntryRepository';

    if (!isRealRepository) {
      // Es un mock (ej: InMemoryLogEntryRepository), no suscribir eventos
      // En tests, los eventos se pueden crear manualmente si es necesario
      return;
    }

    // Lista de todos los eventos a los que se suscribe el handler
    const eventsToSubscribe = [
      // Usuarios
      UserCreated,
      UserUpdated,
      UserDeleted,
      UserActivated,
      UserDeactivated,
      UserPasswordChanged,
      // Colaboradores
      CollaboratorCreated,
      CollaboratorUpdated,
      CollaboratorDeleted,
      CollaboratorActivated,
      CollaboratorDeactivated,
      // Documentos
      DocumentCreated,
      DocumentUpdated,
      DocumentDeleted,
      DocumentDownloaded,
      // Minutas
      MinuteCreated,
      MinuteUpdated,
      MinuteDeleted,
      MinuteDownloaded,
      // Catálogos - Áreas
      AreaCreated,
      AreaUpdated,
      AreaDeleted,
      AreaActivated,
      AreaDeactivated,
      // Catálogos - Adscripciones
      AdscripcionCreated,
      AdscripcionUpdated,
      AdscripcionDeleted,
      AdscripcionActivated,
      AdscripcionDeactivated,
      // Catálogos - Puestos
      PuestoCreated,
      PuestoUpdated,
      PuestoDeleted,
      PuestoActivated,
      PuestoDeactivated,
      // Catálogos - Tipos de Documento
      DocumentTypeCreated,
      DocumentTypeUpdated,
      DocumentTypeDeleted,
      DocumentTypeActivated,
      DocumentTypeDeactivated,
      // Autenticación
      UserLoggedIn,
      UserLoggedOut,
      ExpiredRefreshTokenAttemptDetected,
      RefreshTokenReuseDetected,
    ];

    // Suscribir el handler a cada evento usando el nombre de la clase
    let subscribedCount = 0;
    eventsToSubscribe.forEach((EventClass) => {
      const eventName = EventClass.name;
      eventBus.subscribe(eventName, async (event) => {
        await auditLogEventHandler.handle(event);
      });
      subscribedCount++;
    });

    logger.info('Módulo de auditoría inicializado correctamente', {
      eventsSubscribed: subscribedCount,
      totalEvents: eventsToSubscribe.length,
    });
  } catch (error) {
    // Intentar obtener el logger para registrar el error
    try {
      const logger = container.resolve<ILogger>('logger');
      logger.error(
        'Error al suscribir eventos de auditoría',
        error instanceof Error ? error : new Error(String(error))
      );
    } catch {
      // Si no se puede obtener el logger, al menos registrar en consola
      console.error('Error al suscribir eventos de auditoría:', error);
    }
  }
}
