import app from './app';
import { resolve } from './shared/infrastructure';
import { config } from './shared/infrastructure/config';
import { ILogger, IDatabase } from './shared/domain';
import { Server } from 'http';

// Resolver dependencias del container
const logger = resolve<ILogger>('logger');
const database = resolve<IDatabase>('database');

let server: Server | undefined;

// Función para cerrar el servidor gracefulmente
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} signal received: closing HTTP server`);

  if (!server) {
    logger.warn('Server not initialized, exiting');
    process.exit(0);
    return;
  }

  return new Promise<void>((resolve) => {
    server!.close(async () => {
      await database.disconnect();
      logger.info('HTTP server closed');
      resolve();
      process.exit(0);
    });
  });
}

// Inicializar servidor y base de datos
async function startServer(): Promise<void> {
  try {
    // Conectar a la base de datos
    await database.connect();
    logger.info('Database connected');

    // Iniciar servidor
    server = app.listen(config.server.port, () => {
      logger.info('Server started', {
        port: config.server.port,
        environment: config.server.nodeEnv,
        healthCheck: `${config.server.baseUrl}:${config.server.port}/health`,
      });
    });

    // Mantener el proceso vivo y manejar errores del servidor
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof config.server.port === 'string' ? `Pipe ${config.server.port}` : `Port ${config.server.port}`;

      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    // Manejo de cierre graceful
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', error as Error);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();

export { server };
