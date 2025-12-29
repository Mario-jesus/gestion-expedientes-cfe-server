import { asClass, asFunction, Lifetime, AwilixContainer } from 'awilix';

// Output adapters
import { UserRepository } from '../adapters/output/database/mongo/persistence/UserRepository';
import { BcryptPasswordHasher } from '../adapters/output/password/BcryptPasswordHasher';

// Application services
import { UserAuthorizationService } from '../../application/services/UserAuthorizationService';

// Use cases
import { CreateUserUseCase } from '../../application/use-cases/CreateUserUseCase';
import { GetUserByIdUseCase } from '../../application/use-cases/GetUserByIdUseCase';
import { GetUserByUsernameUseCase } from '../../application/use-cases/GetUserByUsernameUseCase';
import { ListUsersUseCase } from '../../application/use-cases/ListUsersUseCase';
import { UpdateUserUseCase } from '../../application/use-cases/UpdateUserUseCase';
import { UpdateMyProfileUseCase } from '../../application/use-cases/UpdateMyProfileUseCase';
import { DeleteUserUseCase } from '../../application/use-cases/DeleteUserUseCase';
import { ActivateUserUseCase } from '../../application/use-cases/ActivateUserUseCase';
import { DeactivateUserUseCase } from '../../application/use-cases/DeactivateUserUseCase';
import { ChangeUserPasswordUseCase } from '../../application/use-cases/ChangeUserPasswordUseCase';

// Input adapters
import { UserController } from '../adapters/input/http/UserController';

/**
 * Registra todas las dependencias del módulo users en el contenedor de DI
 * 
 * Esta función debe ser llamada después de registrar las dependencias compartidas
 * (database, logger, eventBus) ya que el módulo users depende de ellas.
 * 
 * Orden de registro (importante para resolución de dependencias):
 * 1. Output adapters (repositorios, servicios externos)
 * 2. Servicios de aplicación
 * 3. Casos de uso
 * 4. Controllers
 * 
 * @param container - Contenedor de Awilix donde se registrarán las dependencias
 */
export function registerUsersModule(container: AwilixContainer): void {
  // ============================================
  // OUTPUT ADAPTERS (Implementaciones de output ports)
  // ============================================
  // Estos son adaptadores que implementan interfaces del dominio/aplicación

  // Repositorio de usuarios (MongoDB)
  // Dependencias: logger (del container compartido)
  container.register({
    userRepository: asClass(UserRepository, {
      lifetime: Lifetime.SINGLETON, // Una sola instancia para toda la aplicación
    }),
  });

  // Password hasher (bcrypt)
  // Nota: Usamos asFunction porque BcryptPasswordHasher requiere un parámetro primitivo (saltRounds)
  // Awilix no puede inyectar valores primitivos automáticamente, por lo que usamos asFunction
  // para pasar el valor explícitamente. Podríamos obtenerlo de configuración si fuera necesario.
  container.register({
    passwordHasher: asFunction(() => {
      // Valor por defecto: 10 (balance entre seguridad y rendimiento)
      // En el futuro, esto podría obtenerse de configuración:
      // const saltRounds = config.security?.bcryptSaltRounds || 10;
      const saltRounds = 10;
      return new BcryptPasswordHasher(saltRounds);
    }, {
      lifetime: Lifetime.SINGLETON, // Una sola instancia para toda la aplicación
    }),
  });

  // ============================================
  // APPLICATION SERVICES
  // ============================================

  // Servicio de autorización para usuarios
  container.register({
    userAuthorizationService: asClass(UserAuthorizationService, {
      lifetime: Lifetime.SINGLETON, // Singleton porque no tiene estado y es reutilizable
      injectionMode: 'CLASSIC', // Usar inyección clásica (por nombre del parámetro)
    }),
  });

  // ============================================
  // USE CASES (Casos de uso)
  // ============================================
  // Los casos de uso dependen de repositorios, servicios externos y servicios de aplicación

  // GetUserByUsernameUseCase - Solo necesita userRepository
  container.register({
    getUserByUsernameUseCase: asClass(GetUserByUsernameUseCase, {
      lifetime: Lifetime.SINGLETON, // Singleton es seguro ya que no mantiene estado
    }),
  });

  // GetUserByIdUseCase - Necesita userRepository y userAuthorizationService
  container.register({
    getUserByIdUseCase: asClass(GetUserByIdUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // ListUsersUseCase - Solo necesita userRepository
  container.register({
    listUsersUseCase: asClass(ListUsersUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // CreateUserUseCase - Necesita userRepository, passwordHasher, eventBus, userAuthorizationService
  container.register({
    createUserUseCase: asClass(CreateUserUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // UpdateUserUseCase - Necesita userRepository, eventBus, userAuthorizationService
  container.register({
    updateUserUseCase: asClass(UpdateUserUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // UpdateMyProfileUseCase - Necesita userRepository, eventBus (no necesita userAuthorizationService porque siempre es el propio usuario)
  container.register({
    updateMyProfileUseCase: asClass(UpdateMyProfileUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // DeleteUserUseCase - Necesita userRepository, eventBus, userAuthorizationService
  container.register({
    deleteUserUseCase: asClass(DeleteUserUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // ActivateUserUseCase - Necesita userRepository, eventBus, userAuthorizationService
  container.register({
    activateUserUseCase: asClass(ActivateUserUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // DeactivateUserUseCase - Necesita userRepository, eventBus, userAuthorizationService
  container.register({
    deactivateUserUseCase: asClass(DeactivateUserUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // ChangeUserPasswordUseCase - Necesita userRepository, passwordHasher, eventBus, userAuthorizationService
  container.register({
    changeUserPasswordUseCase: asClass(ChangeUserPasswordUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // ============================================
  // INPUT ADAPTERS (Controllers HTTP)
  // ============================================
  // Los controllers dependen de todos los casos de uso

  // Controller HTTP de usuarios
  // Dependencias: todos los casos de uso + logger (del container compartido)
  container.register({
    userController: asClass(UserController, {
      lifetime: Lifetime.SINGLETON,
    }),
  });
}
