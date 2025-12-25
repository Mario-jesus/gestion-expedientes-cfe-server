import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { resolve } from './shared/infrastructure';
import { config } from './shared/config';
import { buildCorsOptions } from './shared/infrastructure/http/cors';
import { ILogger } from './shared/domain';
import { errorHandler, notFoundHandler } from './shared/infrastructure';

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

// Manejo de rutas no encontradas
app.use(notFoundHandler);

// Manejo global de errores
app.use(errorHandler(logger));

export default app;
