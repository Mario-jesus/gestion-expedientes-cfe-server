import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { resolve, container } from './shared/infrastructure';
import { config } from './shared/config';
import { buildCorsOptions } from './shared/infrastructure/http/cors';
import { ILogger } from './shared/domain';
import { errorHandler, notFoundHandler } from './shared/infrastructure';

// Registrar módulos
import { registerUsersModule } from './modules/users/infrastructure/container';
import { UserController } from './modules/users/infrastructure/adapters/input/http';
import { createUserRoutes } from './modules/users/infrastructure/adapters/input/http';
import { registerAuthModule } from './modules/auth/infrastructure/container';
import { AuthController } from './modules/auth/infrastructure/adapters/input/http';
import { createAuthRoutes } from './modules/auth/infrastructure/adapters/input/http';
import { ITokenService } from './modules/auth/domain/ports/output/ITokenService';
import { TokenVerifierAdapter } from './modules/auth/infrastructure/adapters/output/token/TokenVerifierAdapter';
import { ITokenVerifier } from './shared/infrastructure/http/middleware/types';

// Registrar módulos en el contenedor de DI
// Orden importante: primero users (porque auth depende de userRepository y passwordHasher)
// Esto debe hacerse antes de resolver cualquier dependencia del módulo
registerUsersModule(container);
registerAuthModule(container);

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

logger.debug('Module routes registered');

// Manejo de rutas no encontradas
app.use(notFoundHandler);

// Manejo global de errores
app.use(errorHandler(logger));

export default app;
