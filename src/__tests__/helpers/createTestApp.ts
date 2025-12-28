/**
 * Helper para crear una instancia de la aplicación Express para tests
 * 
 * Esta función crea el app sin ejecutar el código de nivel superior de app.ts
 * que registra módulos y resuelve dependencias.
 */

import express, { Application } from 'express';
import cors from 'cors';
import { resolve, container } from '@shared/infrastructure';
import type { AwilixContainer } from 'awilix';
import { config } from '@shared/config';
import { buildCorsOptions } from '@shared/infrastructure/http/cors';
import { ILogger } from '@shared/domain';
import { errorHandler, notFoundHandler } from '@shared/infrastructure';
import { registerUsersModule } from '@modules/users/infrastructure/container';
import { registerAuthModule } from '@modules/auth/infrastructure/container';
import { UserController } from '@modules/users/infrastructure/adapters/input/http';
import { createUserRoutes } from '@modules/users/infrastructure/adapters/input/http';
import { AuthController } from '@modules/auth/infrastructure/adapters/input/http';
import { createAuthRoutes } from '@modules/auth/infrastructure/adapters/input/http';
import { ITokenService } from '@modules/auth/domain/ports/output/ITokenService';
import { TokenVerifierAdapter } from '@modules/auth/infrastructure/adapters/output/token/TokenVerifierAdapter';
import { ITokenVerifier } from '@shared/infrastructure/http/middleware/types';

/**
 * Crea una instancia de la aplicación Express para tests
 * 
 * IMPORTANTE: Asegúrate de que el container esté limpio y las dependencias
 * compartidas estén registradas antes de llamar a esta función.
 * 
 * @param skipModuleRegistration - Si es true, no registra los módulos (útil cuando ya están registrados)
 * @param afterRegisterModules - Función opcional que se ejecuta después de registrar los módulos
 *                                pero antes de resolver dependencias. Útil para registrar mocks
 *                                de repositorios que sobrescriban los registros de los módulos.
 */
export function createTestApp(
  skipModuleRegistration: boolean = false,
  afterRegisterModules?: (container: AwilixContainer) => void
): Application {
  // Registrar módulos en el contenedor de DI (a menos que se indique lo contrario)
  // Orden importante: primero users (porque auth depende de userRepository y passwordHasher)
  if (!skipModuleRegistration) {
    registerUsersModule(container);
    registerAuthModule(container);
  }

  // Ejecutar función opcional después de registrar módulos pero antes de resolver dependencias
  // Esto permite sobrescribir los registros de los módulos con mocks
  if (afterRegisterModules) {
    afterRegisterModules(container);
  }

  // Resolver logger del container
  const logger = resolve<ILogger>('logger');

  const app: Application = express();

  // Middlewares básicos
  const corsOptions = buildCorsOptions(config.cors);
  app.use(cors(corsOptions));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Ruta de health check
  app.get('/health', (_req, res) => {
    res.json({ 
      status: 'OK', 
      message: 'Server is running',
      timestamp: new Date().toISOString()
    });
  });

  // Ruta raíz
  app.get('/', (_req, res) => {
    res.json({ 
      message: 'API Gestión de Expedientes CFE',
      version: '1.0.0'
    });
  });

  // ============================================
  // RUTAS DE MÓDULOS
  // ============================================

  // Rutas del módulo auth
  const authController = resolve<AuthController>('authController');
  const tokenService = resolve<ITokenService>('tokenService');
  const tokenVerifier: ITokenVerifier = new TokenVerifierAdapter(tokenService);
  const authRoutes = createAuthRoutes(authController, tokenVerifier, logger);
  app.use('/api/auth', authRoutes);

  // Rutas del módulo users
  const userController = resolve<UserController>('userController');
  const userRoutes = createUserRoutes(userController, tokenVerifier, logger);
  app.use('/api/users', userRoutes);

  // Manejo de rutas no encontradas
  app.use(notFoundHandler);

  // Manejo global de errores
  app.use(errorHandler(logger));

  return app;
}
