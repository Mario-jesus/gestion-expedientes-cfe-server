import { IDatabase } from '../../domain/IDatabase';

/**
 * Implementación completamente en memoria de base de datos
 * Usa Map para almacenar colecciones
 * Para desarrollo y testing
 */
export class InMemoryDatabase implements IDatabase {
  private isConnectedFlag = false;
  private collections: Map<string, Map<string, any>> = new Map();

  async connect(): Promise<void> {
    this.isConnectedFlag = true;
    this.collections.clear();
    console.log('Connected to In-Memory Database');
  }

  async disconnect(): Promise<void> {
    this.isConnectedFlag = false;
    this.collections.clear();
    console.log('Disconnected from In-Memory Database');
  }

  isConnected(): boolean {
    return this.isConnectedFlag;
  }

  async clearDatabase(): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Database is not connected');
    }
    this.collections.clear();
    console.log('Database cleared');
  }

  /**
   * Obtiene o crea una colección
   */
  getCollection<T>(name: string): Map<string, T> {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Map());
    }
    return this.collections.get(name)! as Map<string, T>;
  }

  /**
   * Elimina una colección específica
   */
  dropCollection(name: string): void {
    this.collections.delete(name);
  }

  /**
   * Obtiene todas las colecciones
   */
  getCollections(): string[] {
    return Array.from(this.collections.keys());
  }
}
