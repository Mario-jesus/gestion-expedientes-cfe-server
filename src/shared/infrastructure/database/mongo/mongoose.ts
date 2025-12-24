import mongoose, { Connection } from 'mongoose';
import { ILogger } from '../../../domain/ILogger';
import { config } from '../../config';

// IMPORTANTE: Importar todos los modelos ANTES de cualquier otra cosa
// Esto asegura que los modelos estén registrados cuando se use la conexión
// Los modelos se registran automáticamente al importar los archivos que los definen
import './models';

let connection: Connection | null = null;

/**
 * Opciones de conexión de Mongoose
 */
const mongooseOptions = {
  // Mongoose 6+ ya no necesita estas opciones, pero las dejamos por compatibilidad
};

/**
 * Conecta a MongoDB usando Mongoose
 * @param logger Logger opcional para registrar eventos de conexión
 * @returns La conexión de Mongoose
 */
export async function connectMongoose(logger?: ILogger): Promise<Connection> {
  // Si ya hay una conexión activa, retornarla
  if (connection && connection.readyState === 1) {
    return connection;
  }

  if (!config.database.useMongoDB) {
    throw new Error('MongoDB is not enabled. Set USE_MONGODB=true to use MongoDB.');
  }

  const uri = config.database.mongoUri;
  if (!uri) {
    throw new Error('MongoDB URI is not configured. Check MONGODB_HOST and DATABASE_NAME environment variables.');
  }

  try {
    await mongoose.connect(uri, mongooseOptions);

    connection = mongoose.connection;

    // Event listeners
    connection.on('error', (error) => {
      logger?.error('MongoDB connection error', error);
    });

    connection.on('disconnected', () => {
      logger?.warn('MongoDB disconnected');
    });

    connection.on('reconnected', () => {
      logger?.info('MongoDB reconnected');
    });

    logger?.info('MongoDB connected', {
      host: connection.host,
      name: connection.name,
      readyState: connection.readyState,
    });

    return connection;
  } catch (error) {
    logger?.error('Failed to connect to MongoDB', error as Error);
    throw error;
  }
}

/**
 * Desconecta de MongoDB
 * @param logger Logger opcional para registrar eventos
 */
export async function disconnectMongoose(logger?: ILogger): Promise<void> {
  if (connection) {
    try {
      await mongoose.disconnect();
      connection = null;
      logger?.info('MongoDB disconnected');
    } catch (error) {
      logger?.error('Error disconnecting from MongoDB', error as Error);
      throw error;
    }
  }
}

/**
 * Obtiene la conexión actual de Mongoose
 * @throws Error si no hay conexión activa
 * @returns La conexión de Mongoose
 */
export function getConnection(): Connection {
  if (!connection || connection.readyState !== 1) {
    throw new Error('MongoDB is not connected. Call connectMongoose() first.');
  }
  return connection;
}

/**
 * Verifica si hay una conexión activa
 */
export function isConnected(): boolean {
  return connection !== null && connection.readyState === 1;
}
