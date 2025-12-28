/**
 * Tests E2E para endpoints de autenticación
 * 
 * Estos tests verifican que los endpoints HTTP funcionan correctamente
 * desde el punto de vista del usuario final.
 * 
 * IMPORTANTE: Estos tests NO modifican la base de datos de producción.
 * Usan una base de datos en memoria (InMemoryDatabase) o una base de datos
 * de prueba separada.
 */

import request from 'supertest';
import { container, clearContainer, registerSharedDependencies } from '@shared/infrastructure';
import { IDatabase } from '@shared/domain/ports/output/IDatabase';
import { IUserRepository } from '@modules/users/domain/ports/output/IUserRepository';
import { IPasswordHasher } from '@modules/users/application/ports/output/IPasswordHasher';
import { IEventBus, ILogger } from '@shared/domain';
import { User } from '@modules/users/domain';
import { UserRole } from '@modules/users/domain/enums/UserRole';
import { createTestApp } from '@/__tests__/helpers/createTestApp';
import { InMemoryUserRepository } from '@/__tests__/mocks/InMemoryUserRepository';
import { InMemoryRefreshTokenRepository } from '@/__tests__/mocks/InMemoryRefreshTokenRepository';
import { asFunction } from 'awilix';
import { registerUsersModule } from '@modules/users/infrastructure/container';
import { registerAuthModule } from '@modules/auth/infrastructure/container';

describe('Auth E2E Tests', () => {
  let app: ReturnType<typeof createTestApp>;
  let testUser: User;
  let userRepository: IUserRepository;
  let passwordHasher: IPasswordHasher;
  let database: IDatabase;

  beforeAll(async () => {
    // Limpiar container para empezar limpio
    clearContainer();

    // Registrar dependencias compartidas (database, logger, eventBus)
    registerSharedDependencies();

    // Conectar base de datos (InMemoryDatabase)
    database = container.resolve<IDatabase>('database');
    await database.connect();

    // Obtener logger antes de crear el app
    const logger = container.resolve('logger');

    // Registrar módulos primero
    registerUsersModule(container);
    registerAuthModule(container);

    // Registrar mocks de repositorios que sobrescriben los registros de los módulos
    // Usamos asFunction porque necesitamos inyectar el logger
    container.register({
      userRepository: asFunction(() => new InMemoryUserRepository(logger), {
        lifetime: 'SINGLETON',
      }),
    });

    // Reemplazar RefreshTokenRepository con mock
    container.register({
      refreshTokenRepository: asFunction(() => new InMemoryRefreshTokenRepository(logger), {
        lifetime: 'SINGLETON',
      }),
    });

    // Crear la aplicación Express para tests (sin registrar módulos de nuevo)
    app = createTestApp(true);

    // Resolver dependencias (ahora usarán los mocks)
    userRepository = container.resolve<IUserRepository>('userRepository');
    passwordHasher = container.resolve<IPasswordHasher>('passwordHasher');

    // Crear usuario de prueba
    const hashedPassword = await passwordHasher.hash('password123');
    testUser = User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      role: UserRole.ADMIN,
      isActive: true,
    });

    await userRepository.create(testUser);
  }, 30000); // Timeout de 30 segundos para beforeAll

  afterAll(async () => {
    // Limpiar base de datos de prueba
    try {
      if (database && database.isConnected()) {
        if ('clearDatabase' in database) {
          await (database as any).clearDatabase();
        }
        await database.disconnect();
      }
    } catch (error) {
      // Ignorar errores al limpiar
      console.warn('Error al limpiar base de datos:', error);
    }

    // Limpiar EventBus (remover todos los listeners para que Jest pueda salir)
    try {
      const eventBus = container.resolve<IEventBus>('eventBus');
      if (eventBus && typeof (eventBus as any).removeAllListeners === 'function') {
        (eventBus as any).removeAllListeners();
      }
    } catch (error) {
      // Ignorar errores si el eventBus no está disponible
    }

    // Cerrar logger streams (especialmente pino-loki que mantiene handles abiertos)
    try {
      const logger = container.resolve<ILogger>('logger');
      if (logger && typeof (logger as any).close === 'function') {
        await (logger as any).close();
      }
    } catch (error) {
      // Ignorar errores si el logger no está disponible
    }

    // Limpiar container
    clearContainer();
  }, 30000);

  describe('POST /api/auth/login', () => {
    it('debe retornar token cuando las credenciales son válidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.token).toBeTruthy();
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.refreshToken).toBeTruthy();
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('debe retornar 401 con credenciales inválidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Credenciales inválidas');
    });

    it('debe retornar 401 con usuario inexistente', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('debe retornar 400 si faltan campos requeridos', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          // password faltante
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;

    beforeAll(async () => {
      // Obtener token de autenticación
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        });

      authToken = loginResponse.body.token;
    });

    it('debe retornar información del usuario autenticado', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.role).toBe('admin');
    });

    it('debe retornar 401 sin token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('debe retornar 401 con token inválido', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      // Obtener refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        });

      refreshToken = loginResponse.body.refreshToken;
    });

    it('debe retornar nuevo token y refresh token', async () => {
      // Guardar el token original para comparar
      const originalRefreshToken = refreshToken;

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: originalRefreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresIn');

      // El nuevo refresh token debe ser diferente (rotación)
      expect(response.body.refreshToken).toBeTruthy();
      expect(response.body.refreshToken).not.toBe(originalRefreshToken);
      expect(response.body.refreshToken.length).toBeGreaterThan(0);

      // Verificar que el token original ya no funciona (fue revocado)
      const reuseResponse = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: originalRefreshToken,
        });

      expect(reuseResponse.status).toBe(401);
    });

    it('debe retornar 401 con refresh token inválido', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid_refresh_token',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/logout', () => {
    let authToken: string;
    let refreshToken: string;

    beforeAll(async () => {
      // Obtener tokens
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        });

      authToken = loginResponse.body.token;
      refreshToken = loginResponse.body.refreshToken;
    });

    it('debe cerrar sesión exitosamente', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          refreshToken: refreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('debe retornar 401 sin token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken: refreshToken,
        });

      expect(response.status).toBe(401);
    });
  });
});
