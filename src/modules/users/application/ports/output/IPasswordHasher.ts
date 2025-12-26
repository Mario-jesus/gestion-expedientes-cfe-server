/**
 * Interfaz para el servicio de hashing de contraseñas
 * 
 * Output Port (Driven Port) - la capa de aplicación define lo que necesita
 * para hashear y comparar contraseñas sin conocer la implementación específica
 */
export interface IPasswordHasher {
  /**
   * Hashea una contraseña en texto plano
   * @param plainPassword - Contraseña en texto plano
   * @returns Contraseña hasheada (string)
   */
  hash(plainPassword: string): Promise<string>;

  /**
   * Compara una contraseña en texto plano con un hash
   * @param plainPassword - Contraseña en texto plano
   * @param hashedPassword - Contraseña hasheada
   * @returns true si las contraseñas coinciden, false en caso contrario
   */
  compare(plainPassword: string, hashedPassword: string): Promise<boolean>;
}
