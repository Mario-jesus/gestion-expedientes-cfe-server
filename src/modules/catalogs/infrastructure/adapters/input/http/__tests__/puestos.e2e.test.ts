/**
 * Tests E2E para endpoints de puestos
 * 
 * Estos tests verifican que los endpoints HTTP funcionan correctamente
 * desde el punto de vista del usuario final.
 */

import request from 'supertest';
import { container, clearContainer, registerSharedDependencies } from '@shared/infrastructure';
import { IDatabase } from '@shared/domain/ports/output/IDatabase';
import { IUserRepository } from '@modules/users/domain/ports/output/IUserRepository';
import { IPasswordHasher } from '@modules/users/application/ports/output/IPasswordHasher';
import { IPuestoRepository } from '@modules/catalogs/domain/ports/output/IPuestoRepository';
import { IEventBus, ILogger } from '@shared/domain';
import { User } from '@modules/users/domain';
import { UserRole } from '@modules/users/domain/enums/UserRole';
import { Puesto } from '@modules/catalogs/domain';
import { createTestApp } from '@/__tests__/helpers/createTestApp';
import { InMemoryUserRepository } from '@/__tests__/mocks/InMemoryUserRepository';
import { InMemoryRefreshTokenRepository } from '@/__tests__/mocks/InMemoryRefreshTokenRepository';
import { InMemoryPuestoRepository } from '@/__tests__/mocks/InMemoryPuestoRepository';
import { asFunction } from 'awilix';
import { registerUsersModule } from '@modules/users/infrastructure/container';
import { registerAuthModule } from '@modules/auth/infrastructure/container';
import { registerCatalogsModule } from '@modules/catalogs/infrastructure/container';

describe('Puestos E2E Tests', () => {
  let app: ReturnType<typeof createTestApp>;
  let adminUser: User;
  let regularUser: User;
  let userRepository: IUserRepository;
  let puestoRepository: IPuestoRepository;
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
      puestoRepository: asFunction(() => new InMemoryPuestoRepository(logger), {
        lifetime: 'SINGLETON',
      }),
    });

    app = createTestApp(true);

    userRepository = container.resolve<IUserRepository>('userRepository');
    puestoRepository = container.resolve<IPuestoRepository>('puestoRepository');
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

  describe('POST /api/catalogs/puestos', () => {
    it('debe crear un puesto cuando es admin', async () => {
      const response = await request(app)
        .post('/api/catalogs/puestos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Puesto de Prueba',
          descripcion: 'Descripción del puesto de prueba',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.nombre).toBe('Puesto de Prueba');
      expect(response.body.isActive).toBe(true);
    });

    it('debe retornar 403 cuando un usuario regular intenta crear', async () => {
      const response = await request(app)
        .post('/api/catalogs/puestos')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          nombre: 'Puesto No Autorizado',
        });

      expect(response.status).toBe(403);
    });

    it('debe retornar error si el nombre ya existe', async () => {
      await request(app)
        .post('/api/catalogs/puestos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Puesto Duplicado',
        });

      const response = await request(app)
        .post('/api/catalogs/puestos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Puesto Duplicado',
        });

      expect([400, 409].includes(response.status)).toBe(true);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/catalogs/puestos', () => {
    beforeEach(async () => {
      const repo = container.resolve<IPuestoRepository>('puestoRepository') as InMemoryPuestoRepository;
      repo.clear();

      const puesto1 = Puesto.create({
        nombre: 'Puesto 1',
        descripcion: 'Primer puesto',
        isActive: true,
      });
      await puestoRepository.create(puesto1);

      const puesto2 = Puesto.create({
        nombre: 'Puesto 2',
        descripcion: 'Segundo puesto',
        isActive: true,
      });
      await puestoRepository.create(puesto2);
    });

    it('debe listar puestos cuando está autenticado', async () => {
      const response = await request(app)
        .get('/api/catalogs/puestos')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('debe filtrar puestos por isActive', async () => {
      const response = await request(app)
        .get('/api/catalogs/puestos?isActive=true')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((p: any) => p.isActive === true)).toBe(true);
    });
  });

  describe('GET /api/catalogs/puestos/:id', () => {
    let testPuesto: Puesto;

    beforeEach(async () => {
      const repo = container.resolve<IPuestoRepository>('puestoRepository') as InMemoryPuestoRepository;
      repo.clear();

      testPuesto = Puesto.create({
        nombre: 'Puesto de Prueba',
        descripcion: 'Descripción de prueba',
        isActive: true,
      });
      await puestoRepository.create(testPuesto);
    });

    it('debe obtener un puesto por ID cuando está autenticado', async () => {
      const response = await request(app)
        .get(`/api/catalogs/puestos/${testPuesto.id}`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testPuesto.id);
      expect(response.body.nombre).toBe('Puesto de Prueba');
    });
  });

  describe('PUT /api/catalogs/puestos/:id', () => {
    let testPuesto: Puesto;

    beforeEach(async () => {
      const repo = container.resolve<IPuestoRepository>('puestoRepository') as InMemoryPuestoRepository;
      repo.clear();

      testPuesto = Puesto.create({
        nombre: 'Puesto Original',
        descripcion: 'Descripción original',
        isActive: true,
      });
      await puestoRepository.create(testPuesto);
    });

    it('debe actualizar un puesto cuando es admin', async () => {
      const response = await request(app)
        .put(`/api/catalogs/puestos/${testPuesto.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Puesto Actualizado',
          descripcion: 'Nueva descripción',
        });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testPuesto.id);
      expect(response.body.nombre).toBe('Puesto Actualizado');
    });
  });

  describe('DELETE /api/catalogs/puestos/:id', () => {
    let testPuesto: Puesto;

    beforeEach(async () => {
      const repo = container.resolve<IPuestoRepository>('puestoRepository') as InMemoryPuestoRepository;
      repo.clear();

      testPuesto = Puesto.create({
        nombre: 'Puesto a Eliminar',
        descripcion: 'Este puesto será eliminado',
        isActive: true,
      });
      await puestoRepository.create(testPuesto);
    });

    it('debe eliminar un puesto (baja lógica) cuando es admin', async () => {
      const response = await request(app)
        .delete(`/api/catalogs/puestos/${testPuesto.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      const deletedPuesto = await puestoRepository.findById(testPuesto.id);
      expect(deletedPuesto).not.toBeNull();
      expect(deletedPuesto?.isActive).toBe(false);
    });
  });

  describe('POST /api/catalogs/puestos/:id/activate', () => {
    let testPuesto: Puesto;

    beforeEach(async () => {
      const repo = container.resolve<IPuestoRepository>('puestoRepository') as InMemoryPuestoRepository;
      repo.clear();

      testPuesto = Puesto.create({
        nombre: 'Puesto Inactivo',
        descripcion: 'Puesto que será activado',
        isActive: false,
      });
      await puestoRepository.create(testPuesto);
    });

    it('debe activar un puesto cuando es admin', async () => {
      const response = await request(app)
        .post(`/api/catalogs/puestos/${testPuesto.id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testPuesto.id);
      expect(response.body.isActive).toBe(true);
    });
  });

  describe('POST /api/catalogs/puestos/:id/deactivate', () => {
    let testPuesto: Puesto;

    beforeEach(async () => {
      const repo = container.resolve<IPuestoRepository>('puestoRepository') as InMemoryPuestoRepository;
      repo.clear();

      testPuesto = Puesto.create({
        nombre: 'Puesto Activo',
        descripcion: 'Puesto que será desactivado',
        isActive: true,
      });
      await puestoRepository.create(testPuesto);
    });

    it('debe desactivar un puesto cuando es admin', async () => {
      const response = await request(app)
        .post(`/api/catalogs/puestos/${testPuesto.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testPuesto.id);
      expect(response.body.isActive).toBe(false);
    });
  });
});
