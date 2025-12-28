/**
 * Mock de RefreshTokenRepository para tests
 * Implementa IRefreshTokenRepository usando almacenamiento en memoria
 * 
 * Este mock permite ejecutar tests E2E sin necesidad de MongoDB
 */

import { RefreshToken } from '@modules/auth/domain/entities/RefreshToken';
import { IRefreshTokenRepository } from '@modules/auth/domain/ports/output/IRefreshTokenRepository';
import { ILogger } from '@shared/domain';

export class InMemoryRefreshTokenRepository implements IRefreshTokenRepository {
  private tokens: Map<string, RefreshToken> = new Map(); // token -> RefreshToken
  private tokensById: Map<string, string> = new Map(); // id -> token
  private tokensByUserId: Map<string, Set<string>> = new Map(); // userId -> Set<token>

  constructor(private readonly logger: ILogger) {}

  async findById(id: string): Promise<RefreshToken | null> {
    const token = this.tokensById.get(id);
    if (!token) {
      return null;
    }
    return this.tokens.get(token) || null;
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    return this.tokens.get(token) || null;
  }

  async findByUserId(userId: string): Promise<RefreshToken[]> {
    const tokenSet = this.tokensByUserId.get(userId);
    if (!tokenSet || tokenSet.size === 0) {
      return [];
    }

    const tokens: RefreshToken[] = [];
    for (const token of tokenSet) {
      const refreshToken = this.tokens.get(token);
      if (refreshToken) {
        tokens.push(refreshToken);
      }
    }

    return tokens;
  }

  async findActiveByUserId(userId: string): Promise<RefreshToken[]> {
    const allTokens = await this.findByUserId(userId);
    return allTokens.filter((token) => token.isValid());
  }

  async save(refreshToken: RefreshToken): Promise<RefreshToken> {
    const existing = await this.findById(refreshToken.id);
    if (existing) {
      return this.update(refreshToken);
    }
    return this.create(refreshToken);
  }

  async create(refreshToken: RefreshToken): Promise<RefreshToken> {
    const token = refreshToken.token;

    // Guardar token
    this.tokens.set(token, refreshToken);
    this.tokensById.set(refreshToken.id, token);

    // Actualizar índice por userId
    if (!this.tokensByUserId.has(refreshToken.userId)) {
      this.tokensByUserId.set(refreshToken.userId, new Set());
    }
    this.tokensByUserId.get(refreshToken.userId)!.add(token);

    this.logger.debug('Refresh token creado en memoria', {
      tokenId: refreshToken.id,
      userId: refreshToken.userId,
      expiresAt: refreshToken.expiresAt.toISOString(),
    });

    return refreshToken;
  }

  async update(refreshToken: RefreshToken): Promise<RefreshToken> {
    const existing = await this.findById(refreshToken.id);
    if (!existing) {
      throw new Error(`Refresh token with id ${refreshToken.id} not found`);
    }

    const token = refreshToken.token;
    const oldToken = existing.token;

    // Si el token cambió, actualizar índices
    if (oldToken !== token) {
      // Remover del índice por userId con el token viejo
      const tokenSet = this.tokensByUserId.get(refreshToken.userId);
      if (tokenSet) {
        tokenSet.delete(oldToken);
        tokenSet.add(token);
      }
      // Remover el token viejo
      this.tokens.delete(oldToken);
      // Actualizar índice por ID
      this.tokensById.set(refreshToken.id, token);
    }

    // Guardar token actualizado
    this.tokens.set(token, refreshToken);

    this.logger.debug('Refresh token actualizado en memoria', {
      tokenId: refreshToken.id,
      userId: refreshToken.userId,
    });

    return refreshToken;
  }

  async delete(id: string): Promise<boolean> {
    const refreshToken = await this.findById(id);
    if (!refreshToken) {
      return false;
    }

    const token = refreshToken.token;

    // Remover del índice por userId
    const tokenSet = this.tokensByUserId.get(refreshToken.userId);
    if (tokenSet) {
      tokenSet.delete(token);
      if (tokenSet.size === 0) {
        this.tokensByUserId.delete(refreshToken.userId);
      }
    }

    // Remover índices
    this.tokens.delete(token);
    this.tokensById.delete(id);

    this.logger.debug('Refresh token eliminado en memoria', {
      tokenId: id,
      userId: refreshToken.userId,
    });

    return true;
  }

  async deleteByToken(token: string): Promise<boolean> {
    const refreshToken = await this.findByToken(token);
    if (!refreshToken) {
      return false;
    }

    return this.delete(refreshToken.id);
  }

  async existsByToken(token: string): Promise<boolean> {
    return this.tokens.has(token);
  }

  async revokeAllByUserId(userId: string): Promise<number> {
    const tokenSet = this.tokensByUserId.get(userId);
    if (!tokenSet || tokenSet.size === 0) {
      return 0;
    }

    let revokedCount = 0;

    // Revocar todos los tokens del usuario
    for (const token of tokenSet) {
      const refreshToken = this.tokens.get(token);
      if (refreshToken && !refreshToken.isRevoked) {
        const revokedToken = RefreshToken.fromPersistence(
          {
            token: refreshToken.token,
            userId: refreshToken.userId,
            expiresAt: refreshToken.expiresAt,
            isRevoked: true,
          },
          refreshToken.id,
          refreshToken.createdAt || new Date(),
          refreshToken.updatedAt || new Date()
        );
        this.tokens.set(token, revokedToken);
        revokedCount++;
      }
    }

    this.logger.debug('Todos los refresh tokens revocados en memoria', {
      userId,
      count: revokedCount,
    });

    return revokedCount;
  }

  async deleteExpired(): Promise<number> {
    let deletedCount = 0;

    // Encontrar tokens expirados
    const expiredTokens: string[] = [];
    for (const [token, refreshToken] of this.tokens.entries()) {
      if (refreshToken.isExpired()) {
        expiredTokens.push(token);
      }
    }

    // Eliminar tokens expirados
    for (const token of expiredTokens) {
      const refreshToken = this.tokens.get(token);
      if (refreshToken) {
        // Remover del índice por userId
        const tokenSet = this.tokensByUserId.get(refreshToken.userId);
        if (tokenSet) {
          tokenSet.delete(token);
          if (tokenSet.size === 0) {
            this.tokensByUserId.delete(refreshToken.userId);
          }
        }

        // Eliminar token
        this.tokens.delete(token);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.logger.debug('Tokens expirados eliminados en memoria', {
        count: deletedCount,
      });
    }

    return deletedCount;
  }

  /**
   * Limpia todos los tokens (útil para tests)
   */
  clear(): void {
    this.tokens.clear();
    this.tokensById.clear();
    this.tokensByUserId.clear();
  }
}
