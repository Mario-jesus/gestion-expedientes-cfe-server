import { createContainer, asClass, asFunction, InjectionMode, Lifetime } from 'awilix';
import { InMemoryDatabase } from '../database/InMemoryDatabase';
import { MongoDBDatabase } from '../database/mongo/MongoDBDatabase';
import { InMemoryEventBus } from '../bus/InMemoryEventBus';
import { createLoggerFromEnv } from '../logger/loggerFactory';
import { config } from '../config';

/**
 * Container de Awilix para inyección de dependencias
 * Registra todas las dependencias compartidas del sistema
 */
export const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

/**
 * Registra las dependencias compartidas (infraestructura base)
 */
export function registerSharedDependencies(): void {
  const useMongoDB = config.database.useMongoDB;

  // Database - elegir según variable de entorno
  if (useMongoDB) {
    container.register({
      database: asFunction(
        ({ logger }: { logger: any }) => {
          return new MongoDBDatabase(logger);
        },
        { lifetime: Lifetime.SINGLETON }
      ),
    });
  } else {
    container.register({
      database: asClass(InMemoryDatabase, { lifetime: Lifetime.SINGLETON }),
    });
  }

  // Logger
  container.register({
    logger: asFunction(() => createLoggerFromEnv(), { lifetime: Lifetime.SINGLETON }),
  });

  // Event Bus (con logger inyectado)
  container.register({
    eventBus: asFunction(
      ({ logger }: { logger: any }) => {
        const eventBus = new InMemoryEventBus(logger);
        return eventBus;
      },
      { lifetime: Lifetime.SINGLETON }
    ),
  });
}

/**
 * Resuelve una dependencia del container
 */
export function resolve<T>(name: string): T {
  return container.resolve<T>(name);
}

/**
 * Registra una dependencia en el container
 * Útil para que los módulos registren sus propias dependencias
 */
export function register(name: string, registration: any): void {
  container.register(name, registration);
}

/**
 * Limpia el container (útil para testing)
 */
export function clearContainer(): void {
  container.dispose();
}

// Registrar dependencias compartidas al cargar el módulo
registerSharedDependencies();

// Exportar tipos para TypeScript
export type Container = typeof container;
