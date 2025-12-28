import { Types } from 'mongoose';
import { RefreshToken } from '@modules/auth/domain/entities/RefreshToken';
import { IRefreshTokenRepository } from '@modules/auth/domain/ports/output/IRefreshTokenRepository';
import { RefreshTokenModel, RefreshTokenDocument } from '../schemas/RefreshTokenSchema';
import { ILogger } from '@shared/domain';

/**
 * Implementación del repositorio de refresh tokens usando MongoDB/Mongoose
 * 
 * Este adaptador convierte entre:
 * - RefreshTokenDocument (Mongoose) ↔ RefreshToken (Dominio)
 * - Maneja errores de MongoDB y los convierte a excepciones de dominio
 */
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly logger: ILogger) {}

  /**
   * Convierte un RefreshTokenDocument de Mongoose a una entidad RefreshToken del dominio
   */
  private toDomain(document: RefreshTokenDocument): RefreshToken {
    return RefreshToken.fromPersistence(
      {
        token: document.token,
        userId: document.userId,
        expiresAt: document.expiresAt,
        isRevoked: document.isRevoked,
      },
      document._id.toString(),
      document.createdAt,
      document.updatedAt
    );
  }

  /**
   * Convierte una entidad RefreshToken del dominio a datos para persistencia
   */
  private toPersistence(refreshToken: RefreshToken) {
    const persistenceData = refreshToken.toPersistence();
    return {
      token: persistenceData.token,
      userId: persistenceData.userId,
      expiresAt: persistenceData.expiresAt,
      isRevoked: persistenceData.isRevoked,
    };
  }

  /**
   * Maneja errores de MongoDB y los convierte a excepciones de dominio
   */
  private handleMongoError(error: any): never {
    // Error de ObjectId inválido
    if (error.name === 'CastError' && error.path === '_id') {
      this.logger.debug('ObjectId inválido en consulta de refresh token', {
        invalidId: error.value,
      });
      // No lanzar excepción, retornar null en findById
      throw error;
    }

    // Log de errores inesperados
    this.logger.error(
      'Error inesperado en RefreshTokenRepository',
      error instanceof Error ? error : new Error(String(error)),
      {
        errorCode: error.code,
        errorName: error.name,
      }
    );

    // Re-lanzar otros errores
    throw error;
  }

  async findById(id: string): Promise<RefreshToken | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return null;
      }

      const document = await RefreshTokenModel.findById(id).exec();

      if (!document) {
        return null;
      }

      return this.toDomain(document);
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    try {
      const document = await RefreshTokenModel.findOne({ token }).exec();

      if (!document) {
        return null;
      }

      return this.toDomain(document);
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findByUserId(userId: string): Promise<RefreshToken[]> {
    try {
      const documents = await RefreshTokenModel.find({ userId }).exec();

      return documents.map((doc) => this.toDomain(doc));
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async findActiveByUserId(userId: string): Promise<RefreshToken[]> {
    try {
      const now = new Date();
      const documents = await RefreshTokenModel.find({
        userId,
        isRevoked: false,
        expiresAt: { $gt: now }, // expiresAt mayor que ahora (no expirado)
      }).exec();

      return documents.map((doc) => this.toDomain(doc));
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async save(refreshToken: RefreshToken): Promise<RefreshToken> {
    // Si tiene ID, intenta actualizar; si no, crea uno nuevo
    if (refreshToken.id && Types.ObjectId.isValid(refreshToken.id)) {
      return this.update(refreshToken);
    } else {
      return this.create(refreshToken);
    }
  }

  async create(refreshToken: RefreshToken): Promise<RefreshToken> {
    try {
      const persistenceData = this.toPersistence(refreshToken);

      const document = new RefreshTokenModel(persistenceData);

      // Si el ID de la entidad es un ObjectId válido, usarlo
      if (Types.ObjectId.isValid(refreshToken.id)) {
        document._id = new Types.ObjectId(refreshToken.id);
      }
      // Si no es válido (es un UUID), MongoDB generará un ObjectId automáticamente

      const savedDocument = await document.save();

      this.logger.debug('Refresh token creado exitosamente', {
        refreshTokenId: savedDocument._id.toString(),
        userId: refreshToken.userId,
        expiresAt: refreshToken.expiresAt.toISOString(),
      });

      return this.toDomain(savedDocument);
    } catch (error: any) {
      // Error de duplicado (token ya existe)
      if (error.code === 11000) {
        this.logger.warn('Intento de crear refresh token duplicado', {
          userId: refreshToken.userId,
        });
        // Si el token ya existe, intentar obtenerlo
        const existing = await this.findByToken(refreshToken.token);
        if (existing) {
          return existing;
        }
      }
      this.handleMongoError(error);
    }
  }

  async update(refreshToken: RefreshToken): Promise<RefreshToken> {
    try {
      if (!Types.ObjectId.isValid(refreshToken.id)) {
        throw new Error(`Invalid refresh token ID: ${refreshToken.id}`);
      }

      const persistenceData = this.toPersistence(refreshToken);

      const document = await RefreshTokenModel.findByIdAndUpdate(
        refreshToken.id,
        {
          $set: persistenceData,
          $setOnInsert: {
            createdAt: refreshToken.createdAt || new Date(),
          },
        },
        {
          new: true, // Retorna el documento actualizado
          runValidators: true, // Ejecuta validaciones del schema
          upsert: false, // No crear si no existe
        }
      ).exec();

      if (!document) {
        throw new Error(`Refresh token not found: ${refreshToken.id}`);
      }

      this.logger.debug('Refresh token actualizado exitosamente', {
        refreshTokenId: refreshToken.id,
        userId: refreshToken.userId,
        isRevoked: refreshToken.isRevoked,
      });

      return this.toDomain(document);
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        this.logger.debug('Intento de eliminar refresh token con ID inválido', {
          refreshTokenId: id,
        });
        return false;
      }

      const result = await RefreshTokenModel.findByIdAndDelete(id).exec();

      if (result) {
        this.logger.debug('Refresh token eliminado exitosamente', {
          refreshTokenId: id,
          userId: result.userId,
        });
      } else {
        this.logger.debug('Intento de eliminar refresh token inexistente', {
          refreshTokenId: id,
        });
      }

      return result !== null;
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async deleteByToken(token: string): Promise<boolean> {
    try {
      const result = await RefreshTokenModel.findOneAndDelete({ token }).exec();

      if (result) {
        this.logger.debug('Refresh token eliminado por token exitosamente', {
          refreshTokenId: result._id.toString(),
          userId: result.userId,
        });
      } else {
        this.logger.debug('Intento de eliminar refresh token inexistente por token', {
          hasToken: true,
        });
      }

      return result !== null;
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async revokeAllByUserId(userId: string): Promise<number> {
    try {
      const now = new Date();
      const result = await RefreshTokenModel.updateMany(
        {
          userId,
          isRevoked: false, // Solo revocar los que no están revocados
          expiresAt: { $gt: now }, // Solo los que no han expirado
        },
        {
          $set: { isRevoked: true },
        }
      ).exec();

      this.logger.info('Tokens revocados para usuario', {
        userId,
        revokedCount: result.modifiedCount,
        totalMatched: result.matchedCount,
      });

      return result.modifiedCount;
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async deleteExpired(): Promise<number> {
    try {
      const now = new Date();
      const result = await RefreshTokenModel.deleteMany({
        expiresAt: { $lt: now }, // expiresAt menor que ahora (expirado)
      }).exec();

      this.logger.debug('Tokens expirados eliminados', {
        deletedCount: result.deletedCount,
      });

      return result.deletedCount;
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }

  async existsByToken(token: string): Promise<boolean> {
    try {
      const count = await RefreshTokenModel.countDocuments({ token }).exec();
      return count > 0;
    } catch (error: any) {
      this.handleMongoError(error);
    }
  }
}
