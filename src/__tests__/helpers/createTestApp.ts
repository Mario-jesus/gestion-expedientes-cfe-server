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
import { registerCollaboratorsModule } from '@modules/collaborators/infrastructure/container';
import { registerCatalogsModule } from '@modules/catalogs/infrastructure/container';
import { registerDocumentsModule } from '@modules/documents/infrastructure/container';
import { registerMinutesModule } from '@modules/minutes/infrastructure/container';
import { registerAuditModule } from '@modules/audit/infrastructure/container';
import { UserController } from '@modules/users/infrastructure/adapters/input/http';
import { createUserRoutes } from '@modules/users/infrastructure/adapters/input/http';
import { AuthController } from '@modules/auth/infrastructure/adapters/input/http';
import { createAuthRoutes } from '@modules/auth/infrastructure/adapters/input/http';
import { CollaboratorController } from '@modules/collaborators/infrastructure/adapters/input/http';
import { createCollaboratorRoutes } from '@modules/collaborators/infrastructure/adapters/input/http';
import { AreaController, AdscripcionController, PuestoController, DocumentTypeController, createCatalogRoutes } from '@modules/catalogs/infrastructure/adapters/input/http';
import { DocumentController } from '@modules/documents/infrastructure/adapters/input/http';
import { createDocumentRoutes } from '@modules/documents/infrastructure/adapters/input/http';
import { MinuteController } from '@modules/minutes/infrastructure/adapters/input/http';
import { createMinuteRoutes } from '@modules/minutes/infrastructure/adapters/input/http';
import { LogEntryController } from '@modules/audit/infrastructure/adapters/input/http';
import { createAuditRoutes } from '@modules/audit/infrastructure/adapters/input/http';
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
    registerCollaboratorsModule(container);
    registerCatalogsModule(container);
    registerDocumentsModule(container);
    registerMinutesModule(container);
    // Nota: registerAuditModule se registra después de afterRegisterModules
    // porque resuelve dependencias inmediatamente al suscribir eventos
  }

  // Ejecutar función opcional después de registrar módulos pero antes de registrar audit
  // Esto permite sobrescribir los registros de los módulos con mocks
  if (afterRegisterModules) {
    afterRegisterModules(container);
  }

  // Registrar módulo audit DESPUÉS de afterRegisterModules para que los mocks estén disponibles
  // porque registerAuditModule resuelve dependencias inmediatamente al suscribir eventos
  // Si el mock ya está registrado, registerAuditModule no lo sobrescribirá
  // IMPORTANTE: Si el repositorio no estaba registrado antes, registerAuditModule no intentará
  // suscribir eventos para evitar que el repositorio real intente conectarse a MongoDB
  // NOTA: El módulo audit SIEMPRE debe registrarse porque UserController ahora depende de él
  // (getLogEntriesByUserIdUseCase). Si skipModuleRegistration es true, aún necesitamos registrar
  // audit para que UserController pueda resolverse, pero no suscribiremos eventos si no hay repositorio.
  registerAuditModule(container);

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

  // Rutas del módulo collaborators (solo si el módulo está registrado)
  try {
    const collaboratorController = resolve<CollaboratorController>('collaboratorController');
    const collaboratorRoutes = createCollaboratorRoutes(collaboratorController, tokenVerifier, logger);
    app.use('/api/collaborators', collaboratorRoutes);
  } catch (error) {
    // El módulo collaborators no está registrado, omitir sus rutas
  }

  // Rutas del módulo documents (solo si el módulo está registrado)
  try {
    const documentController = resolve<DocumentController>('documentController');
    const documentRoutes = createDocumentRoutes(documentController, tokenVerifier, logger);
    app.use('/api/documents', documentRoutes);
  } catch (error) {
    // El módulo documents no está registrado, omitir sus rutas
  }

  // Rutas del módulo minutes (solo si el módulo está registrado)
  try {
    const minuteController = resolve<MinuteController>('minuteController');
    const minuteRoutes = createMinuteRoutes(minuteController, tokenVerifier, logger);
    app.use('/api/minutes', minuteRoutes);
  } catch (error) {
    // El módulo minutes no está registrado, omitir sus rutas
  }

  // Rutas del módulo catalogs (solo si el módulo está registrado)
  try {
    const areaController = resolve<AreaController>('areaController');
    const adscripcionController = resolve<AdscripcionController>('adscripcionController');
    const puestoController = resolve<PuestoController>('puestoController');
    const documentTypeController = resolve<DocumentTypeController>('documentTypeController');
    const catalogRoutes = createCatalogRoutes(
      areaController,
      adscripcionController,
      puestoController,
      documentTypeController,
      tokenVerifier,
      logger
    );
    app.use('/api/catalogs', catalogRoutes);
  } catch (error) {
    // El módulo catalogs no está registrado, omitir sus rutas
    // Esto permite que los tests de otros módulos funcionen sin necesidad de registrar catalogs
  }

  // Rutas del módulo audit (solo si el módulo está registrado)
  try {
    const logEntryController = resolve<LogEntryController>('logEntryController');
    const auditRoutes = createAuditRoutes(logEntryController, tokenVerifier, logger);
    app.use('/api/audit', auditRoutes);
  } catch (error) {
    // El módulo audit no está registrado, omitir sus rutas
  }

  // Manejo de rutas no encontradas
  app.use(notFoundHandler);

  // Manejo global de errores
  app.use(errorHandler(logger));

  return app;
}
