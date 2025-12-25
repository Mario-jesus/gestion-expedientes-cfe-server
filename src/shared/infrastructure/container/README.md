# Container de Inyección de Dependencias (Awilix)

Este módulo gestiona la inyección de dependencias usando Awilix.

## Uso Básico

### Resolver dependencias compartidas

```typescript
import { resolve } from '@/shared/infrastructure';

// Resolver dependencias compartidas
const database = resolve<IDatabase>('database');
const logger = resolve<ILogger>('logger');
const eventBus = resolve<IEventBus>('eventBus');

// Usar las dependencias
await database.connect();
logger.info('Application started');
```

### Registrar dependencias de módulos

Cada módulo puede registrar sus propias dependencias:

```typescript
import { register, asClass, asFunction } from '@/shared/infrastructure';
import { MyRepository } from '@/modules/my-module/infrastructure/repositories/MyRepository';
import { MyUseCase } from '@/modules/my-module/application/use-cases/MyUseCase';

// Registrar repositorio
register('myRepository', asClass(MyRepository, { lifetime: Lifetime.SINGLETON }));

// Registrar use case (con dependencias)
register('myUseCase', asClass(MyUseCase, { lifetime: Lifetime.SCOPED }));
```

### Usar dependencias en clases

```typescript
import { resolve } from '@/shared/infrastructure';
import { ILogger } from '@/shared/domain';

export class MyService {
  private logger: ILogger;

  constructor() {
    // Resolver dependencias en el constructor
    this.logger = resolve<ILogger>('logger');
  }

  doSomething() {
    this.logger.info('Doing something');
  }
}
```

### Usar inyección automática (con decoradores - opcional)

Si instalas `awilix-express` o usas decoradores:

```typescript
import { inject } from 'awilix';

export class MyService {
  constructor(
    @inject('logger') private logger: ILogger,
    @inject('database') private database: IDatabase
  ) {}
}
```

## Dependencias Registradas

### Compartidas (automáticas)

- `database` - Instancia de `InMemoryDatabase` (SINGLETON)
- `logger` - Instancia de `PinoLogger` creada desde variables de entorno (SINGLETON)
- `eventBus` - Instancia de `InMemoryEventBus` (SINGLETON)

## Lifetime (Ciclo de Vida)

- **SINGLETON**: Una sola instancia para toda la aplicación
- **SCOPED**: Una instancia por request/scope
- **TRANSIENT**: Nueva instancia cada vez que se resuelve

## Testing

Para testing, puedes limpiar el container:

```typescript
import { clearContainer, registerSharedDependencies } from '@/shared/infrastructure';

beforeEach(() => {
  clearContainer();
  registerSharedDependencies();
  // Registrar mocks
});
```
