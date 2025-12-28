import { RefreshToken } from '../../entities/RefreshToken';

/**
 * Interfaz del repositorio de refresh tokens
 * Define el contrato para persistir y recuperar refresh tokens
 * 
 * Este es un Output Port (Driven Port) - el dominio define lo que necesita
 * para gestionar refresh tokens en persistencia.
 */
export interface IRefreshTokenRepository {
  /**
   * Busca un refresh token por su ID
   * @param id - ID del token
   * @returns RefreshToken si existe, null si no existe
   */
  findById(id: string): Promise<RefreshToken | null>;

  /**
   * Busca un refresh token por el valor del token (string JWT)
   * @param token - Valor del token JWT
   * @returns RefreshToken si existe, null si no existe
   */
  findByToken(token: string): Promise<RefreshToken | null>;

  /**
   * Busca todos los refresh tokens de un usuario
   * @param userId - ID del usuario
   * @returns Lista de refresh tokens del usuario
   */
  findByUserId(userId: string): Promise<RefreshToken[]>;

  /**
   * Busca todos los refresh tokens activos (no revocados y no expirados) de un usuario
   * @param userId - ID del usuario
   * @returns Lista de refresh tokens activos del usuario
   */
  findActiveByUserId(userId: string): Promise<RefreshToken[]>;

  /**
   * Guarda un refresh token (crea o actualiza)
   * @param refreshToken - Token a guardar
   * @returns El token guardado
   */
  save(refreshToken: RefreshToken): Promise<RefreshToken>;

  /**
   * Crea un nuevo refresh token
   * @param refreshToken - Token a crear
   * @returns El token creado
   */
  create(refreshToken: RefreshToken): Promise<RefreshToken>;

  /**
   * Actualiza un refresh token existente
   * @param refreshToken - Token con los cambios
   * @returns El token actualizado
   */
  update(refreshToken: RefreshToken): Promise<RefreshToken>;

  /**
   * Elimina un refresh token
   * @param id - ID del token a eliminar
   * @returns true si se eliminó, false si no existía
   */
  delete(id: string): Promise<boolean>;

  /**
   * Elimina un refresh token por su valor (string JWT)
   * @param token - Valor del token JWT a eliminar
   * @returns true si se eliminó, false si no existía
   */
  deleteByToken(token: string): Promise<boolean>;

  /**
   * Revoca todos los refresh tokens de un usuario
   * Útil cuando el usuario hace logout o se detecta actividad sospechosa
   * @param userId - ID del usuario
   * @returns Número de tokens revocados
   */
  revokeAllByUserId(userId: string): Promise<number>;

  /**
   * Elimina todos los refresh tokens expirados
   * Útil para limpieza periódica de la base de datos
   * @returns Número de tokens eliminados
   */
  deleteExpired(): Promise<number>;

  /**
   * Verifica si existe un refresh token con el valor dado
   * @param token - Valor del token JWT
   * @returns true si existe, false si no existe
   */
  existsByToken(token: string): Promise<boolean>;
}
