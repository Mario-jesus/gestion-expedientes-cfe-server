import { Types } from 'mongoose';
import { User } from '@modules/users/domain/entities/User';
import { IUserRepository } from '@modules/users/domain/ports/output/IUserRepository';
import { UserNotFoundError } from '@modules/users/domain/exceptions/UserNotFoundError';
import { DuplicateUserError } from '@modules/users/domain/exceptions/DuplicateUserError';
import { UserModel, UserDocument } from '../schemas/UserSchema';
import { ILogger } from '@shared/domain';

/**
 * Implementación del repositorio de usuarios usando MongoDB/Mongoose
 * 
 * Este adaptador convierte entre:
 * - UserDocument (Mongoose) ↔ User (Dominio)
 * - Maneja errores de MongoDB y los convierte a excepciones de dominio
 */
export class UserRepository implements IUserRepository {
  constructor(private readonly logger: ILogger) {}
  /**
   * Convierte un UserDocument de Mongoose a una entidad User del dominio
   */
  private toDomain(document: UserDocument): User {
    return User.fromPersistence(
      {
        username: document.username,
        email: document.email,
        password: document.password,
        name: document.name,
        role: document.role,
        isActive: document.isActive,
        createdBy: document.createdBy,
      },
      document._id.toString(),
      document.createdAt,
      document.updatedAt
    );
  }

  /**
   * Convierte una entidad User del dominio a datos para persistencia
   */
  private toPersistence(user: User) {
    const persistenceData = user.toPersistence();
    return {
      username: persistenceData.username,
      email: persistenceData.email,
      password: persistenceData.password,
      name: persistenceData.name,
      role: persistenceData.role,
      isActive: persistenceData.isActive,
      ...(persistenceData.createdBy && { createdBy: persistenceData.createdBy }),
    };
  }

  /**
   * Maneja errores de MongoDB y los convierte a excepciones de dominio
   */
  private handleMongoError(error: any): never {
    // Error de duplicado (código 11000)
    if (error.code === 11000) {
      const duplicateField = error.keyPattern?.username ? 'username' : 'email';
      const duplicateValue = error.keyValue?.[duplicateField] || 'unknown';
      this.logger.warn('Intento de crear usuario duplicado', {
        field: duplicateField,
        value: duplicateValue,
      });
      throw new DuplicateUserError(duplicateField, duplicateValue);
    }

    // Error de ObjectId inválido
    if (error.name === 'CastError' && error.path === '_id') {
      this.logger.debug('ObjectId inválido en consulta', {
        invalidId: error.value,
      });
      throw new UserNotFoundError(error.value);
    }

    // Log de errores inesperados
    this.logger.error('Error inesperado en UserRepository', error instanceof Error ? error : new Error(String(error)), {
      errorCode: error.code,
      errorName: error.name,
    });

    // Re-lanzar otros errores
    throw error;
  }

  async findById(id: string): Promise<User | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return null;
      }

      const document = await UserModel.findById(id).exec();

      if (!document) {
        return null;
      }

      return this.toDomain(document);
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      const document = await UserModel.findOne({ 
        username: username.toLowerCase().trim() 
      }).exec();

      if (!document) {
        return null;
      }

      return this.toDomain(document);
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const document = await UserModel.findOne({ 
        email: email.toLowerCase().trim() 
      }).exec();

      if (!document) {
        return null;
      }

      return this.toDomain(document);
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async save(user: User): Promise<User> {
    // Si tiene ID, intenta actualizar; si no, crea uno nuevo
    if (user.id) {
      return this.update(user);
    } else {
      return this.create(user);
    }
  }

  async create(user: User): Promise<User> {
    try {
      const persistenceData = this.toPersistence(user);

      // Si el ID es un ObjectId válido, usarlo; de lo contrario, dejar que MongoDB lo genere
      const document = new UserModel(persistenceData);

      // Si el ID de la entidad es un ObjectId válido, usarlo
      if (Types.ObjectId.isValid(user.id)) {
        document._id = new Types.ObjectId(user.id);
      }
      // Si no es válido (es un UUID), MongoDB generará un ObjectId automáticamente

      const savedDocument = await document.save();
      this.logger.info('Usuario creado exitosamente', {
        userId: savedDocument._id.toString(),
        username: user.usernameValue,
        email: user.emailValue,
        role: user.role,
        createdBy: user.createdBy,
      });
      return this.toDomain(savedDocument);
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async update(user: User): Promise<User> {
    try {
      if (!Types.ObjectId.isValid(user.id)) {
        throw new UserNotFoundError(user.id);
      }

      const persistenceData = this.toPersistence(user);

      const document = await UserModel.findByIdAndUpdate(
        user.id,
        {
          $set: persistenceData,
          $setOnInsert: {
            createdAt: user.createdAt || new Date(),
          },
        },
        {
          new: true, // Retorna el documento actualizado
          runValidators: true, // Ejecuta validaciones del schema
          upsert: false, // No crear si no existe
        }
      ).exec();

      if (!document) {
        throw new UserNotFoundError(user.id);
      }

      return this.toDomain(document);
    } catch (error: any) {
      // Si ya es una excepción de dominio, re-lanzarla
      if (error instanceof UserNotFoundError || error instanceof DuplicateUserError) {
        throw error;
      }
      this.handleMongoError(error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.logger.debug('Intento de eliminar usuario con ID inválido', { userId: id });
        return false;
      }

      const result = await UserModel.findByIdAndDelete(id).exec();
      if (result) {
        this.logger.info('Usuario eliminado exitosamente', {
          userId: id,
          username: result.username,
        });
      } else {
        this.logger.debug('Intento de eliminar usuario inexistente', { userId: id });
      }
      return result !== null;
    } catch (error: any) {
      this.handleMongoError(error);
    }
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
    try {
      // Construir query de filtros
      const query: any = {};

      if (filters?.role) {
        query.role = filters.role;
      }

      if (filters?.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      // Búsqueda de texto (usando índice de texto)
      if (filters?.search) {
        query.$text = { $search: filters.search };
      }

      // Ejecutar consulta con paginación
      const [documents, total] = await Promise.all([
        UserModel.find(query)
          .skip(offset)
          .limit(limit)
          .sort(filters?.search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
          .exec(),
        UserModel.countDocuments(query).exec(),
      ]);

      const users = documents.map((doc) => this.toDomain(doc));

      return { users, total };
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async existsByUsername(username: string): Promise<boolean> {
    try {
      const count = await UserModel.countDocuments({ 
        username: username.toLowerCase().trim() 
      }).exec();
      return count > 0;
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async existsByEmail(email: string): Promise<boolean> {
    try {
      const count = await UserModel.countDocuments({ 
        email: email.toLowerCase().trim() 
      }).exec();
      return count > 0;
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }
}
