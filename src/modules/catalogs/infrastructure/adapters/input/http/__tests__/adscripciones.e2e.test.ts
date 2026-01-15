/**
 * Tests E2E para endpoints de adscripciones
 * 
 * Estos tests verifican que los endpoints HTTP funcionan correctamente
 * desde el punto de vista del usuario final.
 */

import request from 'supertest';
import { container, clearContainer, registerSharedDependencies } from '@shared/infrastructure';
import { IDatabase } from '@shared/domain/ports/output/IDatabase';
import { IUserRepository } from '@modules/users/domain/ports/output/IUserRepository';
import { IPasswordHasher } from '@modules/users/application/ports/output/IPasswordHasher';
import { IAdscripcionRepository } from '@modules/catalogs/domain/ports/output/IAdscripcionRepository';
import { IEventBus, ILogger } from '@shared/domain';
import { User } from '@modules/users/domain';
import { UserRole } from '@modules/users/domain/enums/UserRole';
import { Adscripcion } from '@modules/catalogs/domain';
import { createTestApp } from '@/__tests__/helpers/createTestApp';
import { InMemoryUserRepository } from '@/__tests__/mocks/InMemoryUserRepository';
import { InMemoryRefreshTokenRepository } from '@/__tests__/mocks/InMemoryRefreshTokenRepository';
import { InMemoryAdscripcionRepository } from '@/__tests__/mocks/InMemoryAdscripcionRepository';
import { asFunction } from 'awilix';
import { registerUsersModule } from '@modules/users/infrastructure/container';
import { registerAuthModule } from '@modules/auth/infrastructure/container';
import { registerCatalogsModule } from '@modules/catalogs/infrastructure/container';

describe('Adscripciones E2E Tests', () => {
  let app: ReturnType<typeof createTestApp>;
  let adminUser: User;
  let regularUser: User;
  let userRepository: IUserRepository;
  let adscripcionRepository: IAdscripcionRepository;
  let passwordHasher: IPasswordHasher;
  let database: IDatabase;
  let adminToken: string;
  let regularToken: string;

  beforeAll(async () => {
    clearContainer();
    registerSharedDependencies();

    database = container.resolve<IDatabase>('database');
    await database.connect();

    const logger = container.resolve<ILogger>('logger');

    registerUsersModule(container);
    registerAuthModule(container);
    registerCatalogsModule(container);

    container.register({
      userRepository: asFunction(() => new InMemoryUserRepository(logger), {
        lifetime: 'SINGLETON',
      }),
    });

    container.register({
      refreshTokenRepository: asFunction(() => new InMemoryRefreshTokenRepository(logger), {
        lifetime: 'SINGLETON',
      }),
    });

    container.register({
      adscripcionRepository: asFunction(() => new InMemoryAdscripcionRepository(logger), {
        lifetime: 'SINGLETON',
      }),
    });

    app = createTestApp(true);

    userRepository = container.resolve<IUserRepository>('userRepository');
    adscripcionRepository = container.resolve<IAdscripcionRepository>('adscripcionRepository');
    passwordHasher = container.resolve<IPasswordHasher>('passwordHasher');

    const adminHashedPassword = await passwordHasher.hash('admin123');
    adminUser = User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: adminHashedPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
      isActive: true,
    });
    await userRepository.create(adminUser);

    const regularHashedPassword = await passwordHasher.hash('user123');
    regularUser = User.create({
      username: 'user',
      email: 'user@example.com',
      password: regularHashedPassword,
      name: 'Regular User',
      role: UserRole.OPERATOR,
      isActive: true,
    });
    await userRepository.create(regularUser);

    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123',
      });
    adminToken = adminLoginResponse.body.token;

    const regularLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'user',
        password: 'user123',
      });
    regularToken = regularLoginResponse.body.token;
  }, 30000);

  afterAll(async () => {
    try {
      if (database && database.isConnected()) {
        if ('clearDatabase' in database) {
          await (database as any).clearDatabase();
        }
        await database.disconnect();
      }
    } catch (error) {
      console.warn('Error al limpiar base de datos:', error);
    }

    try {
      const eventBus = container.resolve<IEventBus>('eventBus');
      if (eventBus && typeof (eventBus as any).removeAllListeners === 'function') {
        (eventBus as any).removeAllListeners();
      }
    } catch (error) {
      // Ignorar errores
    }

    try {
      const logger = container.resolve<ILogger>('logger');
      if (logger && typeof (logger as any).close === 'function') {
        await (logger as any).close();
      }
    } catch (error) {
      // Ignorar errores
    }

    clearContainer();
  }, 30000);

  describe('POST /api/catalogs/adscripciones', () => {
    it('debe crear una adscripción cuando es admin', async () => {
      const response = await request(app)
        .post('/api/catalogs/adscripciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Adscripción de Prueba',
          adscripcion: 'Central Hidroeléctrica Manuel Moreno Torres',
          descripcion: 'Descripción de prueba',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.nombre).toBe('Adscripción de Prueba');
      expect(response.body.adscripcion).toBe('Central Hidroeléctrica Manuel Moreno Torres');
    });

    it('debe retornar 403 cuando un usuario regular intenta crear', async () => {
      const response = await request(app)
        .post('/api/catalogs/adscripciones')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          nombre: 'Adscripción No Autorizada',
          adscripcion: 'Texto de adscripción',
        });

      expect(response.status).toBe(403);
    });

    it('debe permitir crear adscripciones con el mismo nombre pero diferentes adscripcion', async () => {
      // Crear primera adscripción
      const firstResponse = await request(app)
        .post('/api/catalogs/adscripciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Zona Ríos',
          adscripcion: 'Primera adscripción',
        });

      expect(firstResponse.status).toBe(201);

      // Crear otra con el mismo nombre pero diferente adscripcion (debe permitirse)
      const secondResponse = await request(app)
        .post('/api/catalogs/adscripciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Zona Ríos',
          adscripcion: 'Segunda adscripción',
        });

      expect(secondResponse.status).toBe(201);
      expect(secondResponse.body.nombre).toBe('Zona Ríos');
      expect(secondResponse.body.adscripcion).toBe('Segunda adscripción');
    });

    it('debe retornar error si el valor de adscripcion ya existe', async () => {
      // Crear primera adscripción
      await request(app)
        .post('/api/catalogs/adscripciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Adscripción 1',
          adscripcion: 'Valor único de adscripción',
        });

      // Intentar crear otra con el mismo valor de adscripcion (debe fallar)
      const response = await request(app)
        .post('/api/catalogs/adscripciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Adscripción 2',
          adscripcion: 'Valor único de adscripción',
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/catalogs/adscripciones', () => {
    beforeEach(async () => {
      const repo = container.resolve<IAdscripcionRepository>('adscripcionRepository') as InMemoryAdscripcionRepository;
      repo.clear();

      const adscripcion1 = Adscripcion.create({
        nombre: 'Adscripción 1',
        adscripcion: 'Central Hidroeléctrica 1',
        descripcion: 'Primera adscripción',
        isActive: true,
      });
      await adscripcionRepository.create(adscripcion1);

      const adscripcion2 = Adscripcion.create({
        nombre: 'Adscripción 2',
        adscripcion: 'Central Hidroeléctrica 2',
        descripcion: 'Segunda adscripción',
        isActive: true,
      });
      await adscripcionRepository.create(adscripcion2);
    });

    it('debe listar adscripciones cuando está autenticado', async () => {
      const response = await request(app)
        .get('/api/catalogs/adscripciones')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('debe filtrar adscripciones por isActive', async () => {
      const response = await request(app)
        .get('/api/catalogs/adscripciones?isActive=true')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((a: any) => a.isActive === true)).toBe(true);
    });
  });

  describe('GET /api/catalogs/adscripciones/:id', () => {
    let testAdscripcion: Adscripcion;

    beforeEach(async () => {
      const repo = container.resolve<IAdscripcionRepository>('adscripcionRepository') as InMemoryAdscripcionRepository;
      repo.clear();

      testAdscripcion = Adscripcion.create({
        nombre: 'Adscripción de Prueba',
        adscripcion: 'Central de Prueba',
        descripcion: 'Descripción de prueba',
        isActive: true,
      });
      await adscripcionRepository.create(testAdscripcion);
    });

    it('debe obtener una adscripción por ID cuando está autenticado', async () => {
      const response = await request(app)
        .get(`/api/catalogs/adscripciones/${testAdscripcion.id}`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testAdscripcion.id);
      expect(response.body.nombre).toBe('Adscripción de Prueba');
    });

    it('debe retornar 404 si la adscripción no existe', async () => {
      const response = await request(app)
        .get('/api/catalogs/adscripciones/000000000000000000000000')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/catalogs/adscripciones/:id', () => {
    let testAdscripcion: Adscripcion;

    beforeEach(async () => {
      const repo = container.resolve<IAdscripcionRepository>('adscripcionRepository') as InMemoryAdscripcionRepository;
      repo.clear();

      testAdscripcion = Adscripcion.create({
        nombre: 'Adscripción Original',
        adscripcion: 'Central de Prueba',
        descripcion: 'Descripción original',
        isActive: true,
      });
      await adscripcionRepository.create(testAdscripcion);
    });

    it('debe actualizar una adscripción cuando es admin', async () => {
      const response = await request(app)
        .put(`/api/catalogs/adscripciones/${testAdscripcion.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Adscripción Actualizada',
          adscripcion: 'Central Hidroeléctrica Manuel Moreno Torres',
          descripcion: 'Nueva descripción',
        });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testAdscripcion.id);
      expect(response.body.nombre).toBe('Adscripción Actualizada');
    });

    it('debe retornar 403 cuando un usuario regular intenta actualizar', async () => {
      const response = await request(app)
        .put(`/api/catalogs/adscripciones/${testAdscripcion.id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          nombre: 'Adscripción Actualizada',
          adscripcion: 'Central Hidroeléctrica Manuel Moreno Torres',
        });

      expect(response.status).toBe(403);
    });

    it('debe retornar error si se intenta actualizar con un valor de adscripcion que ya existe en otra adscripción', async () => {
      // Crear otra adscripción con un valor único
      const otraAdscripcion = Adscripcion.create({
        nombre: 'Otra Adscripción',
        adscripcion: 'Valor único de otra adscripción',
        descripcion: 'Otra descripción',
        isActive: true,
      });
      await adscripcionRepository.create(otraAdscripcion);

      // Intentar actualizar testAdscripcion con el valor de adscripcion que ya existe en otraAdscripcion
      const response = await request(app)
        .put(`/api/catalogs/adscripciones/${testAdscripcion.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Nombre Actualizado',
          adscripcion: 'Valor único de otra adscripción', // Este valor ya existe
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
    });

    it('debe permitir actualizar con el mismo nombre si solo cambia otro campo', async () => {
      // Crear otra adscripción con el mismo nombre pero diferente adscripcion
      const otraAdscripcion = Adscripcion.create({
        nombre: 'Adscripción Original', // Mismo nombre
        adscripcion: 'Otra Central',
        descripcion: 'Otra descripción',
        isActive: true,
      });
      await adscripcionRepository.create(otraAdscripcion);

      // Actualizar testAdscripcion manteniendo el mismo nombre pero cambiando descripción
      const response = await request(app)
        .put(`/api/catalogs/adscripciones/${testAdscripcion.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Adscripción Original', // Mismo nombre, debe permitirse
          adscripcion: 'Central de Prueba', // Mismo adscripcion (sin cambio)
          descripcion: 'Nueva descripción actualizada',
        });

      expect(response.status).toBe(200);
      expect(response.body.nombre).toBe('Adscripción Original');
      expect(response.body.descripcion).toBe('Nueva descripción actualizada');
    });
  });

  describe('DELETE /api/catalogs/adscripciones/:id', () => {
    let testAdscripcion: Adscripcion;

    beforeEach(async () => {
      const repo = container.resolve<IAdscripcionRepository>('adscripcionRepository') as InMemoryAdscripcionRepository;
      repo.clear();

      testAdscripcion = Adscripcion.create({
        nombre: 'Adscripción a Eliminar',
        adscripcion: 'Central de Prueba',
        descripcion: 'Esta adscripción será eliminada',
        isActive: true,
      });
      await adscripcionRepository.create(testAdscripcion);
    });

    it('debe eliminar una adscripción (baja lógica) cuando es admin', async () => {
      const response = await request(app)
        .delete(`/api/catalogs/adscripciones/${testAdscripcion.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      const deletedAdscripcion = await adscripcionRepository.findById(testAdscripcion.id);
      expect(deletedAdscripcion).not.toBeNull();
      expect(deletedAdscripcion?.isActive).toBe(false);
    });
  });

  describe('POST /api/catalogs/adscripciones/:id/activate', () => {
    let testAdscripcion: Adscripcion;

    beforeEach(async () => {
      const repo = container.resolve<IAdscripcionRepository>('adscripcionRepository') as InMemoryAdscripcionRepository;
      repo.clear();

      testAdscripcion = Adscripcion.create({
        nombre: 'Adscripción Inactiva',
        adscripcion: 'Central de Prueba',
        descripcion: 'Adscripción que será activada',
        isActive: false,
      });
      await adscripcionRepository.create(testAdscripcion);
    });

    it('debe activar una adscripción cuando es admin', async () => {
      const response = await request(app)
        .post(`/api/catalogs/adscripciones/${testAdscripcion.id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testAdscripcion.id);
      expect(response.body.isActive).toBe(true);
    });
  });

  describe('POST /api/catalogs/adscripciones/:id/deactivate', () => {
    let testAdscripcion: Adscripcion;

    beforeEach(async () => {
      const repo = container.resolve<IAdscripcionRepository>('adscripcionRepository') as InMemoryAdscripcionRepository;
      repo.clear();

      testAdscripcion = Adscripcion.create({
        nombre: 'Adscripción Activa',
        adscripcion: 'Central de Prueba',
        descripcion: 'Adscripción que será desactivada',
        isActive: true,
      });
      await adscripcionRepository.create(testAdscripcion);
    });

    it('debe desactivar una adscripción cuando es admin', async () => {
      const response = await request(app)
        .post(`/api/catalogs/adscripciones/${testAdscripcion.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testAdscripcion.id);
      expect(response.body.isActive).toBe(false);
    });
  });
});
