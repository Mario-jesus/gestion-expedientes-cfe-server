import { IDatabase } from '../../../domain/IDatabase';
import { ILogger } from '../../../domain/ILogger';
import { connectMongoose, disconnectMongoose, getConnection, isConnected as mongooseIsConnected } from './mongoose';

/**
 * Implementación de IDatabase usando MongoDB/Mongoose
 * Proporciona una capa de abstracción sobre Mongoose
 */
export class MongoDBDatabase implements IDatabase {
  private logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  /**
   * Conecta a MongoDB
   */
  async connect(): Promise<void> {
    await connectMongoose(this.logger);
  }

  /**
   * Desconecta de MongoDB
   */
  async disconnect(): Promise<void> {
    await disconnectMongoose(this.logger);
  }

  /**
   * Verifica si está conectado
   */
  isConnected(): boolean {
    return mongooseIsConnected();
  }

  /**
   * Limpia la base de datos (útil para testing)
   * ⚠️ CUIDADO: Esto elimina TODA la base de datos
   */
  async clearDatabase(): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Database is not connected');
    }

    const connection = getConnection();
    const db = connection.db;
    if (!db) {
      throw new Error('Database instance is not available');
    }
    await db.dropDatabase();
    this.logger.info('MongoDB database cleared');
  }

  /**
   * Obtiene la conexión de Mongoose directamente
   * Útil para repositorios que necesitan acceso a Mongoose
   */
  getConnection() {
    return getConnection();
  }
}
