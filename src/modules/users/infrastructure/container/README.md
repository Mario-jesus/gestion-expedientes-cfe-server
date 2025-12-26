# Registro de Dependencias del Módulo Users

Este directorio contiene la configuración de inyección de dependencias (DI) para el módulo users.

## Función de Registro

`registerUsersModule(container)` registra todas las dependencias del módulo users en el contenedor principal de Awilix.

## Uso

```typescript
import { container } from '@/shared/infrastructure';
import { registerUsersModule } from '@/modules/users/infrastructure/container';

// Registrar el módulo users
registerUsersModule(container);
```

## Dependencias Registradas

### Output Adapters
- `userRepository` - `UserRepository` (Singleton)
- `passwordHasher` - `BcryptPasswordHasher` (Singleton)

### Application Services
- `userAuthorizationService` - `UserAuthorizationService` (Singleton)

### Use Cases
- `getUserByUsernameUseCase` - `GetUserByUsernameUseCase` (Singleton)
- `getUserByIdUseCase` - `GetUserByIdUseCase` (Singleton)
- `listUsersUseCase` - `ListUsersUseCase` (Singleton)
- `createUserUseCase` - `CreateUserUseCase` (Singleton)
- `updateUserUseCase` - `UpdateUserUseCase` (Singleton)
- `deleteUserUseCase` - `DeleteUserUseCase` (Singleton)
- `activateUserUseCase` - `ActivateUserUseCase` (Singleton)
- `deactivateUserUseCase` - `DeactivateUserUseCase` (Singleton)
- `changeUserPasswordUseCase` - `ChangeUserPasswordUseCase` (Singleton)

### Input Adapters
- `userController` - `UserController` (Singleton)

## Dependencias Compartidas Requeridas

El módulo users depende de las siguientes dependencias compartidas que deben estar registradas previamente:

- `eventBus` - `IEventBus` (del contenedor compartido)

## Resolver Dependencias

Después de registrar el módulo, puedes resolver cualquier dependencia:

```typescript
import { resolve } from '@/shared/infrastructure';

const userController = resolve<UserController>('userController');
const createUserUseCase = resolve<ICreateUserUseCase>('createUserUseCase');
```
