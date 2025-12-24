/**
 * Interfaz para la conexión de base de datos
 * Define el contrato para persistir datos
 */
export interface IDatabase {
  /**
   * Conecta a la base de datos
   */
  connect(): Promise<void>;

  /**
   * Desconecta de la base de datos
   */
  disconnect(): Promise<void>;

  /**
   * Verifica si está conectado
   */
  isConnected(): boolean;

  /**
   * Limpia la base de datos (útil para testing)
   */
  clearDatabase?(): Promise<void>;
}
