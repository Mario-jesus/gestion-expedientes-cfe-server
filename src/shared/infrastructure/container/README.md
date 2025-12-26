# Container de Inyección de Dependencias (Awilix)

Este módulo gestiona la inyección de dependencias usando Awilix.

## Arquitectura Modular

El contenedor sigue un patrón modular donde:

- **Contenedor Principal**: En `shared/infrastructure/container/container.ts`
  - Registra dependencias compartidas (database, logger, eventBus)
  - Exporta el container para que los módulos lo usen

- **Registro por Módulo**: Cada módulo tiene su propia función de registro
  - Ubicación: `modules/{modulo}/infrastructure/container/registerModule.ts`
  - Función: `register{Modulo}Module(container: AwilixContainer)`
  - Registra todas las dependencias específicas del módulo

## Uso

### 1. Registrar Dependencias Compartidas

Las dependencias compartidas se registran automáticamente al importar el módulo:

```typescript
import { container, registerSharedDependencies } from '@/shared/infrastructure';

// Se registran automáticamente, o puedes llamarlo explícitamente:
registerSharedDependencies();
```

### 2. Registrar Módulos

Cada módulo debe registrar sus dependencias llamando a su función de registro:

```typescript
import { container } from '@/shared/infrastructure';
import { registerUsersModule } from '@/modules/users/infrastructure/container';

// Registrar módulo users
registerUsersModule(container);

// Registrar otros módulos
// registerAuthModule(container);
// registerCollaboratorsModule(container);
```

### 3. Resolver Dependencias

```typescript
import { resolve } from '@/shared/infrastructure';

// Resolver dependencias compartidas
const logger = resolve<ILogger>('logger');
const eventBus = resolve<IEventBus>('eventBus');

// Resolver dependencias de módulos
const userController = resolve<UserController>('userController');
const createUserUseCase = resolve<ICreateUserUseCase>('createUserUseCase');
```

## Estructura de un Módulo

Cada módulo debe tener:

```
modules/{modulo}/infrastructure/container/
├── register{Modulo}Module.ts  # Función que registra todas las dependencias
└── index.ts                   # Barrel export
```

### Ejemplo de registro de módulo

```typescript
// modules/users/infrastructure/container/registerUsersModule.ts
import { asClass, Lifetime, AwilixContainer } from 'awilix';
import { UserRepository } from '../adapters/output/...';
import { CreateUserUseCase } from '../../application/use-cases/...';

export function registerUsersModule(container: AwilixContainer): void {
  // 1. Output adapters (repositorios, servicios externos)
  container.register({
    userRepository: asClass(UserRepository, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // 2. Servicios de aplicación
  container.register({
    userAuthorizationService: asClass(UserAuthorizationService, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // 3. Casos de uso
  container.register({
    createUserUseCase: asClass(CreateUserUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // 4. Controllers
  container.register({
    userController: asClass(UserController, {
      lifetime: Lifetime.SINGLETON,
    }),
  });
}
```

## Orden de Registro

El orden de registro es importante porque Awilix resuelve dependencias por nombre:

1. **Dependencias compartidas** (database, logger, eventBus)
2. **Output adapters** del módulo (repositorios, servicios externos)
3. **Servicios de aplicación** (que dependen de repositorios)
4. **Casos de uso** (que dependen de repositorios, servicios y eventBus)
5. **Controllers** (que dependen de casos de uso)

## Lifetime (Ciclo de Vida)

- **SINGLETON**: Una sola instancia para toda la aplicación (repositorios, servicios, controllers)
- **SCOPED**: Una instancia por request/scope (útil para request-scoped dependencies)
- **TRANSIENT**: Nueva instancia cada vez que se resuelve (poco común)

## Inyección de Dependencias

Awilix usa **inyección por nombre de parámetro** (CLASSIC mode):

- El nombre del parámetro del constructor debe coincidir con el nombre de registro
- Ejemplo: Si el constructor tiene `userRepository: IUserRepository`, debe estar registrado como `userRepository`

## Testing

Para testing, puedes limpiar el container:

```typescript
import { container, registerSharedDependencies } from '@/shared/infrastructure';
import { registerUsersModule } from '@/modules/users/infrastructure/container';

beforeEach(() => {
  container.dispose(); // Limpiar container
  registerSharedDependencies(); // Registrar dependencias compartidas
  registerUsersModule(container); // Registrar módulo
  
  // Opcional: Registrar mocks
  container.register({
    userRepository: asValue(mockUserRepository),
  });
});
```

## Dependencias Registradas

### Compartidas (automáticas)

- `database` - Instancia de `InMemoryDatabase` o `MongoDBDatabase` (SINGLETON)
- `logger` - Instancia de `PinoLogger` (SINGLETON)
- `eventBus` - Instancia de `InMemoryEventBus` (SINGLETON)

### Por Módulo

Cada módulo registra sus propias dependencias. Ver la documentación de cada módulo para detalles.
