/**
 * Mock de UserRepository para tests
 * Implementa IUserRepository usando almacenamiento en memoria
 * 
 * Este mock permite ejecutar tests E2E sin necesidad de MongoDB
 */

import { User } from '@modules/users/domain/entities/User';
import { IUserRepository } from '@modules/users/domain/ports/output/IUserRepository';
import { UserNotFoundError } from '@modules/users/domain/exceptions/UserNotFoundError';
import { DuplicateUserError } from '@modules/users/domain/exceptions/DuplicateUserError';
import { ILogger } from '@shared/domain';

export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();
  private usersByUsername: Map<string, string> = new Map(); // username -> userId
  private usersByEmail: Map<string, string> = new Map(); // email -> userId

  constructor(private readonly logger: ILogger) {}

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const userId = this.usersByUsername.get(username.toLowerCase());
    if (!userId) {
      return null;
    }
    return this.users.get(userId) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const userId = this.usersByEmail.get(email.toLowerCase());
    if (!userId) {
      return null;
    }
    return this.users.get(userId) || null;
  }

  async save(user: User): Promise<User> {
    const existing = await this.findById(user.id);
    if (existing) {
      return this.update(user);
    }
    return this.create(user);
  }

  async create(user: User): Promise<User> {
    // Verificar que el username no exista
    const existingByUsername = await this.findByUsername(user.usernameValue);
    if (existingByUsername && existingByUsername.id !== user.id) {
      throw new DuplicateUserError('username', user.usernameValue);
    }

    // Verificar que el email no exista
    const existingByEmail = await this.findByEmail(user.emailValue);
    if (existingByEmail && existingByEmail.id !== user.id) {
      throw new DuplicateUserError('email', user.emailValue);
    }

    // Guardar usuario
    this.users.set(user.id, user);
    this.usersByUsername.set(user.usernameValue.toLowerCase(), user.id);
    this.usersByEmail.set(user.emailValue.toLowerCase(), user.id);

    this.logger.debug('Usuario creado en memoria', {
      userId: user.id,
      username: user.usernameValue,
    });

    return user;
  }

  async update(user: User): Promise<User> {
    const existing = await this.findById(user.id);
    if (!existing) {
      throw new UserNotFoundError(user.id);
    }

    // Verificar que el username no esté en uso por otro usuario
    const existingByUsername = await this.findByUsername(user.usernameValue);
    if (existingByUsername && existingByUsername.id !== user.id) {
      throw new DuplicateUserError('username', user.usernameValue);
    }

    // Verificar que el email no esté en uso por otro usuario
    const existingByEmail = await this.findByEmail(user.emailValue);
    if (existingByEmail && existingByEmail.id !== user.id) {
      throw new DuplicateUserError('email', user.emailValue);
    }

    // Actualizar índices si el username o email cambiaron
    if (existing.usernameValue !== user.usernameValue) {
      this.usersByUsername.delete(existing.usernameValue.toLowerCase());
      this.usersByUsername.set(user.usernameValue.toLowerCase(), user.id);
    }

    if (existing.emailValue !== user.emailValue) {
      this.usersByEmail.delete(existing.emailValue.toLowerCase());
      this.usersByEmail.set(user.emailValue.toLowerCase(), user.id);
    }

    // Actualizar usuario
    this.users.set(user.id, user);

    this.logger.debug('Usuario actualizado en memoria', {
      userId: user.id,
      username: user.usernameValue,
    });

    return user;
  }

  async delete(id: string): Promise<boolean> {
    const user = await this.findById(id);
    if (!user) {
      return false;
    }

    // Marcar como inactivo (baja lógica)
    const inactiveUser = User.fromPersistence(
      {
        username: user.usernameValue,
        email: user.emailValue,
        password: user.passwordValue,
        name: user.nameValue,
        role: user.role,
        isActive: false,
        createdBy: user.createdBy,
      },
      user.id,
      user.createdAt,
      user.updatedAt
    );

    this.users.set(id, inactiveUser);

    this.logger.debug('Usuario eliminado (baja lógica) en memoria', {
      userId: id,
    });

    return true;
  }

  async findAll(
    filters?: {
      role?: string;
      isActive?: boolean;
      search?: string;
    },
    limit: number = 10,
    offset: number = 0
  ): Promise<{ users: User[]; total: number }> {
    let filteredUsers = Array.from(this.users.values());

    // Aplicar filtros
    if (filters?.role) {
      filteredUsers = filteredUsers.filter((u) => u.role === filters.role);
    }

    if (filters?.isActive !== undefined) {
      filteredUsers = filteredUsers.filter((u) => u.isActive === filters.isActive);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredUsers = filteredUsers.filter(
        (u) =>
          u.usernameValue.toLowerCase().includes(searchLower) ||
          u.emailValue.toLowerCase().includes(searchLower) ||
          u.nameValue.toLowerCase().includes(searchLower)
      );
    }

    // Ordenar por fecha de creación (más recientes primero)
    filteredUsers.sort((a, b) => {
      const aDate = a.createdAt?.getTime() || 0;
      const bDate = b.createdAt?.getTime() || 0;
      return bDate - aDate;
    });

    const total = filteredUsers.length;

    // Aplicar paginación
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);

    return {
      users: paginatedUsers,
      total,
    };
  }

  async existsByUsername(username: string): Promise<boolean> {
    const user = await this.findByUsername(username);
    return user !== null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return user !== null;
  }

  /**
   * Limpia todos los usuarios (útil para tests)
   */
  clear(): void {
    this.users.clear();
    this.usersByUsername.clear();
    this.usersByEmail.clear();
  }
}

