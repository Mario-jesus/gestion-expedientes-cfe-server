import * as bcrypt from 'bcrypt';
import { IPasswordHasher } from '@modules/users/application/ports/output/IPasswordHasher';

/**
 * Implementación de IPasswordHasher usando bcrypt
 * 
 * Este adaptador proporciona funcionalidad para hashear y comparar contraseñas
 * usando la librería bcrypt, que es un algoritmo de hashing seguro y ampliamente usado.
 * 
 * Configuración:
 * - Salt rounds: 10 (balance entre seguridad y rendimiento)
 *   - Puede ajustarse según necesidades de seguridad
 *   - Mayor número = más seguro pero más lento
 */
export class BcryptPasswordHasher implements IPasswordHasher {
  private readonly saltRounds: number;

  /**
   * @param saltRounds - Número de rondas de salt para bcrypt (default: 10)
   */
  constructor(saltRounds: number = 10) {
    if (saltRounds < 1 || saltRounds > 20) {
      throw new Error('Salt rounds debe estar entre 1 y 20');
    }
    this.saltRounds = saltRounds;
  }

  /**
   * Hashea una contraseña en texto plano usando bcrypt
   * @param plainPassword - Contraseña en texto plano
   * @returns Contraseña hasheada (string con formato bcrypt)
   * @throws Error si la contraseña está vacía o si ocurre un error al hashear
   */
  async hash(plainPassword: string): Promise<string> {
    if (!plainPassword || plainPassword.trim().length === 0) {
      throw new Error('La contraseña no puede estar vacía');
    }

    try {
      const hashedPassword = await bcrypt.hash(plainPassword, this.saltRounds);
      return hashedPassword;
    } catch (error) {
      throw new Error(`Error al hashear la contraseña: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Compara una contraseña en texto plano con un hash usando bcrypt
   * @param plainPassword - Contraseña en texto plano
   * @param hashedPassword - Contraseña hasheada (formato bcrypt)
   * @returns true si las contraseñas coinciden, false en caso contrario
   * @throws Error si alguno de los parámetros está vacío o si ocurre un error al comparar
   */
  async compare(plainPassword: string, hashedPassword: string): Promise<boolean> {
    if (!plainPassword || plainPassword.trim().length === 0) {
      throw new Error('La contraseña no puede estar vacía');
    }

    if (!hashedPassword || hashedPassword.trim().length === 0) {
      throw new Error('El hash de contraseña no puede estar vacío');
    }

    try {
      const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
      return isMatch;
    } catch (error) {
      throw new Error(`Error al comparar la contraseña: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
}
