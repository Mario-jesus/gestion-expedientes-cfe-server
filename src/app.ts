import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { resolve, container } from './shared/infrastructure';
import { config } from './shared/config';
import { buildCorsOptions } from './shared/infrastructure/http/cors';
import { ILogger } from './shared/domain';
import { errorHandler, notFoundHandler } from './shared/infrastructure';
import { swaggerSpec } from './shared/infrastructure/http/swagger';

// Registrar módulos
import { registerUsersModule } from './modules/users/infrastructure/container';
import { UserController } from './modules/users/infrastructure/adapters/input/http';
import { createUserRoutes } from './modules/users/infrastructure/adapters/input/http';
import { registerAuthModule } from './modules/auth/infrastructure/container';
import { AuthController } from './modules/auth/infrastructure/adapters/input/http';
import { createAuthRoutes } from './modules/auth/infrastructure/adapters/input/http';
import { registerCollaboratorsModule } from './modules/collaborators/infrastructure/container';
import { CollaboratorController } from './modules/collaborators/infrastructure/adapters/input/http';
import { createCollaboratorRoutes } from './modules/collaborators/infrastructure/adapters/input/http';
import { registerCatalogsModule } from './modules/catalogs/infrastructure/container';
import { AreaController, AdscripcionController, PuestoController, DocumentTypeController, createCatalogRoutes } from './modules/catalogs/infrastructure/adapters/input/http';
import { registerDocumentsModule } from './modules/documents/infrastructure/container';
import { DocumentController } from './modules/documents/infrastructure/adapters/input/http';
import { createDocumentRoutes } from './modules/documents/infrastructure/adapters/input/http';
import { registerMinutesModule } from './modules/minutes/infrastructure/container';
import { MinuteController } from './modules/minutes/infrastructure/adapters/input/http';
import { createMinuteRoutes } from './modules/minutes/infrastructure/adapters/input/http';
import { registerAuditModule } from './modules/audit/infrastructure/container';
import { LogEntryController } from './modules/audit/infrastructure/adapters/input/http';
import { createAuditRoutes } from './modules/audit/infrastructure/adapters/input/http';
import { ITokenService } from './modules/auth/domain/ports/output/ITokenService';
import { TokenVerifierAdapter } from './modules/auth/infrastructure/adapters/output/token/TokenVerifierAdapter';
import { ITokenVerifier } from './shared/infrastructure/http/middleware/types';

// Registrar módulos en el contenedor de DI
// Orden importante:
// 1. users (porque auth depende de userRepository y passwordHasher)
// 2. auth (depende de users)
// 3. collaborators (registra collaboratorRepository - debe ir antes de catalogs porque catalogs importa CollaboratorModel)
// 4. documents (registra documentRepository y fileStorageService - ListCollaboratorsUseCase necesita documentRepository)
// 5. minutes (depende de fileStorageService de documents)
// 6. catalogs (depende de collaborators para contar colaboradores)
// 
// Nota: documents se registra después de collaborators porque:
// - CreateDocumentUseCase necesita collaboratorRepository (de collaborators)
// - ListCollaboratorsUseCase necesita documentRepository (de documents)
// Nota: minutes se registra después de documents porque:
// - CreateMinuteUseCase necesita fileStorageService (de documents)
// Nota: audit se registra después de todos los módulos porque:
// - AuditLogEventHandler necesita suscribirse a todos los eventos de dominio
// Como las dependencias se resuelven lazy en Awilix, este orden funciona correctamente
// Esto debe hacerse antes de resolver cualquier dependencia del módulo
registerUsersModule(container);
registerAuthModule(container);
registerCollaboratorsModule(container);
registerDocumentsModule(container);
registerMinutesModule(container);
registerCatalogsModule(container);
registerAuditModule(container);

// Resolver logger del container
const logger = resolve<ILogger>('logger');

logger.info('Initializing Express application');

const app: Application = express();

// Middlewares básicos
// CORS configurado desde el módulo de configuración centralizado
const corsOptions = buildCorsOptions(config.cors);
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

logger.debug('Express middlewares configured');

// Ruta de health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Ruta raíz
app.get('/', (_req: Request, res: Response) => {
  res.json({ 
    message: 'API Gestión de Expedientes CFE',
    version: '1.0.0'
  });
});

// Servir archivos estáticos desde el directorio de uploads
// Esta ruta permite acceder a los archivos subidos mediante URLs como /uploads/documents/file.pdf
const uploadsDir = path.resolve(config.fileStorage.uploadDir);
app.use('/uploads', express.static(uploadsDir, {
  // Opciones de seguridad para servir archivos estáticos
  dotfiles: 'deny', // No servir archivos ocultos (que empiezan con .)
  index: false, // No servir index.html si existe
  // Headers de seguridad
  setHeaders: (res: Response, filePath: string) => {
    // Determinar Content-Disposition según el tipo de archivo
    // Para archivos visualizables (PDFs, imágenes), usar 'inline' para mostrar en el navegador
    // Para otros archivos, usar 'attachment' para forzar descarga
    const ext = path.extname(filePath).toLowerCase();
    const viewableExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'];

    if (viewableExtensions.includes(ext)) {
      // Permitir visualización en el navegador
      res.setHeader('Content-Disposition', 'inline');
    } else {
      // Forzar descarga para otros tipos de archivo
      res.setHeader('Content-Disposition', 'attachment');
    }

    // No cachear archivos por seguridad
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  },
}));

logger.debug('Static file serving configured', {
  uploadsDir,
  staticPath: '/uploads',
});

// ============================================
// SWAGGER/OPENAPI DOCUMENTATION
// ============================================
// Documentación interactiva de la API disponible en /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }', // Ocultar barra superior de Swagger
  customSiteTitle: 'API Gestión de Expedientes CFE - Documentación',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true, // Mantener el token JWT después de recargar
    displayRequestDuration: true, // Mostrar tiempo de respuesta
    filter: true, // Habilitar filtro de búsqueda
    showExtensions: true,
    showCommonExtensions: true,
  },
}));

// Endpoint JSON de la especificación OpenAPI
app.get('/api-docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

logger.debug('Swagger documentation configured', {
  swaggerUi: '/api-docs',
  openApiSpec: '/api-docs.json',
});

// ============================================
// RUTAS DE MÓDULOS
// ============================================

// Rutas del módulo auth
const authController = resolve<AuthController>('authController');
const tokenService = resolve<ITokenService>('tokenService');
// Crear adaptador para convertir ITokenService a ITokenVerifier (para shared)
const tokenVerifier: ITokenVerifier = new TokenVerifierAdapter(tokenService);
const authRoutes = createAuthRoutes(authController, tokenVerifier, logger);
app.use('/api/auth', authRoutes);

// Rutas del módulo users
const userController = resolve<UserController>('userController');
const userRoutes = createUserRoutes(userController, tokenVerifier, logger);
app.use('/api/users', userRoutes);

// Rutas del módulo collaborators
const collaboratorController = resolve<CollaboratorController>('collaboratorController');
const collaboratorRoutes = createCollaboratorRoutes(collaboratorController, tokenVerifier, logger);
app.use('/api/collaborators', collaboratorRoutes);

// Rutas del módulo catalogs
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

// Rutas del módulo documents
const documentController = resolve<DocumentController>('documentController');
const documentRoutes = createDocumentRoutes(documentController, tokenVerifier, logger);
app.use('/api/documents', documentRoutes);

// Rutas del módulo minutes
const minuteController = resolve<MinuteController>('minuteController');
const minuteRoutes = createMinuteRoutes(minuteController, tokenVerifier, logger);
app.use('/api/minutes', minuteRoutes);

// Rutas del módulo audit
const logEntryController = resolve<LogEntryController>('logEntryController');
const auditRoutes = createAuditRoutes(logEntryController, tokenVerifier, logger);
app.use('/api/audit', auditRoutes);

logger.debug('Module routes registered');

// Manejo de rutas no encontradas
app.use(notFoundHandler);

// Manejo global de errores
app.use(errorHandler(logger));

export default app;
