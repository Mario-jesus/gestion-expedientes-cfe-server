import { asClass, Lifetime, AwilixContainer } from 'awilix';

// Output adapters
import { RefreshTokenRepository } from '../adapters/output/database/mongo/persistence/RefreshTokenRepository';
import { JwtTokenService } from '../adapters/output/token/JwtTokenService';

// Use cases
import { LoginUseCase } from '../../application/use-cases/LoginUseCase';
import { LogoutUseCase } from '../../application/use-cases/LogoutUseCase';
import { GetCurrentUserUseCase } from '../../application/use-cases/GetCurrentUserUseCase';
import { RefreshTokenUseCase } from '../../application/use-cases/RefreshTokenUseCase';

// Input adapters
import { AuthController } from '../adapters/input/http/AuthController';

/**
 * Registra todas las dependencias del módulo auth en el contenedor de DI
 * 
 * Esta función debe ser llamada después de registrar las dependencias compartidas
 * (database, logger, eventBus) y después del módulo users, ya que el módulo auth
 * depende de userRepository y passwordHasher del módulo users.
 * 
 * Orden de registro (importante para resolución de dependencias):
 * 1. Output adapters (repositorios, servicios externos)
 * 2. Casos de uso
 * 3. Controllers
 * 
 * @param container - Contenedor de Awilix donde se registrarán las dependencias
 */
export function registerAuthModule(container: AwilixContainer): void {
  // ============================================
  // OUTPUT ADAPTERS (Implementaciones de output ports)
  // ============================================
  // Estos son adaptadores que implementan interfaces del dominio/aplicación

  // Repositorio de refresh tokens (MongoDB)
  // Dependencias: logger (del container compartido)
  container.register({
    refreshTokenRepository: asClass(RefreshTokenRepository, {
      lifetime: Lifetime.SINGLETON, // Una sola instancia para toda la aplicación
    }),
  });

  // Servicio de tokens JWT
  // Dependencias: logger (del container compartido)
  // Nota: La configuración JWT se lee directamente de config.security.jwt
  container.register({
    tokenService: asClass(JwtTokenService, {
      lifetime: Lifetime.SINGLETON, // Una sola instancia para toda la aplicación
    }),
  });

  // ============================================
  // USE CASES (Casos de uso)
  // ============================================
  // Los casos de uso dependen de repositorios, servicios externos y servicios de aplicación

  // LoginUseCase - Necesita userRepository, passwordHasher, tokenService, refreshTokenRepository, eventBus, logger
  container.register({
    loginUseCase: asClass(LoginUseCase, {
      lifetime: Lifetime.SINGLETON, // Singleton es seguro ya que no mantiene estado
    }),
  });

  // LogoutUseCase - Necesita userRepository, tokenService, refreshTokenRepository, eventBus, logger
  container.register({
    logoutUseCase: asClass(LogoutUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // GetCurrentUserUseCase - Necesita userRepository, logger
  container.register({
    getCurrentUserUseCase: asClass(GetCurrentUserUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // RefreshTokenUseCase - Necesita tokenService, refreshTokenRepository, userRepository, eventBus, logger
  container.register({
    refreshTokenUseCase: asClass(RefreshTokenUseCase, {
      lifetime: Lifetime.SINGLETON,
    }),
  });

  // ============================================
  // INPUT ADAPTERS (Controllers HTTP)
  // ============================================
  // Los controllers dependen de todos los casos de uso

  // Controller HTTP de autenticación
  // Dependencias: todos los casos de uso + logger (del container compartido)
  container.register({
    authController: asClass(AuthController, {
      lifetime: Lifetime.SINGLETON,
    }),
  });
}
