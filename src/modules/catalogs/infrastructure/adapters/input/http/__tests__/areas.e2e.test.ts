/**
 * Tests E2E para endpoints de áreas
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
import { IAreaRepository } from '@modules/catalogs/domain/ports/output/IAreaRepository';
import { IEventBus, ILogger } from '@shared/domain';
import { User } from '@modules/users/domain';
import { UserRole } from '@modules/users/domain/enums/UserRole';
import { Area } from '@modules/catalogs/domain';
import { createTestApp } from '@/__tests__/helpers/createTestApp';
import { InMemoryUserRepository } from '@/__tests__/mocks/InMemoryUserRepository';
import { InMemoryRefreshTokenRepository } from '@/__tests__/mocks/InMemoryRefreshTokenRepository';
import { InMemoryAreaRepository } from '@/__tests__/mocks/InMemoryAreaRepository';
import { asFunction } from 'awilix';
import { registerUsersModule } from '@modules/users/infrastructure/container';
import { registerAuthModule } from '@modules/auth/infrastructure/container';
import { registerCatalogsModule } from '@modules/catalogs/infrastructure/container';

describe('Areas E2E Tests', () => {
  let app: ReturnType<typeof createTestApp>;
  let adminUser: User;
  let regularUser: User;
  let userRepository: IUserRepository;
  let areaRepository: IAreaRepository;
  let passwordHasher: IPasswordHasher;
  let database: IDatabase;
  let adminToken: string;
  let regularToken: string;

  beforeAll(async () => {
    // Limpiar container para empezar limpio
    clearContainer();

    // Registrar dependencias compartidas (database, logger, eventBus)
    registerSharedDependencies();

    // Conectar base de datos (InMemoryDatabase)
    database = container.resolve<IDatabase>('database');
    await database.connect();

    // Obtener logger antes de crear el app
    const logger = container.resolve<ILogger>('logger');

    // Registrar módulos primero
    registerUsersModule(container);
    registerAuthModule(container);
    registerCatalogsModule(container);

    // Registrar mocks de repositorios que sobrescriben los registros de los módulos
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
      areaRepository: asFunction(() => new InMemoryAreaRepository(logger), {
        lifetime: 'SINGLETON',
      }),
    });

    // Crear la aplicación Express para tests
    app = createTestApp(true);

    // Resolver dependencias
    userRepository = container.resolve<IUserRepository>('userRepository');
    areaRepository = container.resolve<IAreaRepository>('areaRepository');
    passwordHasher = container.resolve<IPasswordHasher>('passwordHasher');

    // Crear usuario administrador de prueba
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

    // Crear usuario regular de prueba
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

    // Obtener tokens de autenticación
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
    // Limpiar base de datos de prueba
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

    // Limpiar EventBus
    try {
      const eventBus = container.resolve<IEventBus>('eventBus');
      if (eventBus && typeof (eventBus as any).removeAllListeners === 'function') {
        (eventBus as any).removeAllListeners();
      }
    } catch (error) {
      // Ignorar errores
    }

    // Cerrar logger streams
    try {
      const logger = container.resolve<ILogger>('logger');
      if (logger && typeof (logger as any).close === 'function') {
        await (logger as any).close();
      }
    } catch (error) {
      // Ignorar errores
    }

    // Limpiar container
    clearContainer();
  }, 30000);

  describe('POST /api/catalogs/areas', () => {
    it('debe crear un área cuando es admin', async () => {
      const response = await request(app)
        .post('/api/catalogs/areas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Área de Prueba',
          descripcion: 'Descripción del área de prueba',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.nombre).toBe('Área de Prueba');
      expect(response.body.descripcion).toBe('Descripción del área de prueba');
      expect(response.body.isActive).toBe(true);
    });

    it('debe retornar 403 cuando un usuario regular intenta crear un área', async () => {
      const response = await request(app)
        .post('/api/catalogs/areas')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          nombre: 'Área No Autorizada',
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('debe retornar 401 sin token', async () => {
      const response = await request(app)
        .post('/api/catalogs/areas')
        .send({
          nombre: 'Área Sin Token',
        });

      expect(response.status).toBe(401);
    });

    it('debe retornar error si el nombre ya existe', async () => {
      // Crear primera área
      await request(app)
        .post('/api/catalogs/areas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Área Duplicada',
        });

      // Intentar crear otra con el mismo nombre
      const response = await request(app)
        .post('/api/catalogs/areas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Área Duplicada',
        });

      expect([400, 409].includes(response.status)).toBe(true);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/catalogs/areas', () => {
    beforeEach(async () => {
      // Limpiar áreas antes de cada test
      const repo = container.resolve<IAreaRepository>('areaRepository') as InMemoryAreaRepository;
      repo.clear();

      // Crear algunas áreas de prueba
      const area1 = Area.create({
        nombre: 'Área 1',
        descripcion: 'Primera área',
        isActive: true,
      });
      await areaRepository.create(area1);

      const area2 = Area.create({
        nombre: 'Área 2',
        descripcion: 'Segunda área',
        isActive: true,
      });
      await areaRepository.create(area2);

      const area3 = Area.create({
        nombre: 'Área Inactiva',
        descripcion: 'Área inactiva',
        isActive: false,
      });
      await areaRepository.create(area3);
    });

    it('debe listar áreas cuando está autenticado', async () => {
      const response = await request(app)
        .get('/api/catalogs/areas')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination.total).toBeGreaterThan(0);
    });

    it('debe filtrar áreas por isActive', async () => {
      const response = await request(app)
        .get('/api/catalogs/areas?isActive=true')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((a: any) => a.isActive === true)).toBe(true);
    });

    it('debe buscar áreas por texto', async () => {
      const response = await request(app)
        .get('/api/catalogs/areas?search=Área 1')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.some((a: any) => a.nombre.includes('Área 1'))).toBe(true);
    });

    it('debe paginar resultados', async () => {
      const response = await request(app)
        .get('/api/catalogs/areas?limit=1&offset=0')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.offset).toBe(0);
    });

    it('debe retornar 401 sin token', async () => {
      const response = await request(app).get('/api/catalogs/areas');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/catalogs/areas/:id', () => {
    let testArea: Area;

    beforeEach(async () => {
      const repo = container.resolve<IAreaRepository>('areaRepository') as InMemoryAreaRepository;
      repo.clear();

      testArea = Area.create({
        nombre: 'Área de Prueba',
        descripcion: 'Descripción de prueba',
        isActive: true,
      });
      await areaRepository.create(testArea);
    });

    it('debe obtener un área por ID cuando está autenticado', async () => {
      const response = await request(app)
        .get(`/api/catalogs/areas/${testArea.id}`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testArea.id);
      expect(response.body.nombre).toBe('Área de Prueba');
    });

    it('debe retornar 404 si el área no existe', async () => {
      const response = await request(app)
        .get('/api/catalogs/areas/000000000000000000000000')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('debe retornar 401 sin token', async () => {
      const response = await request(app).get(`/api/catalogs/areas/${testArea.id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/catalogs/areas/:id', () => {
    let testArea: Area;

    beforeEach(async () => {
      const repo = container.resolve<IAreaRepository>('areaRepository') as InMemoryAreaRepository;
      repo.clear();

      testArea = Area.create({
        nombre: 'Área Original',
        descripcion: 'Descripción original',
        isActive: true,
      });
      await areaRepository.create(testArea);
    });

    it('debe actualizar un área cuando es admin', async () => {
      const response = await request(app)
        .put(`/api/catalogs/areas/${testArea.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Área Actualizada',
          descripcion: 'Nueva descripción',
        });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testArea.id);
      expect(response.body.nombre).toBe('Área Actualizada');
      expect(response.body.descripcion).toBe('Nueva descripción');
    });

    it('debe retornar 403 cuando un usuario regular intenta actualizar', async () => {
      const response = await request(app)
        .put(`/api/catalogs/areas/${testArea.id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          nombre: 'Área Actualizada',
        });

      expect(response.status).toBe(403);
    });

    it('debe retornar 404 si el área no existe', async () => {
      const response = await request(app)
        .put('/api/catalogs/areas/000000000000000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Área Inexistente',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/catalogs/areas/:id', () => {
    let testArea: Area;

    beforeEach(async () => {
      const repo = container.resolve<IAreaRepository>('areaRepository') as InMemoryAreaRepository;
      repo.clear();

      testArea = Area.create({
        nombre: 'Área a Eliminar',
        descripcion: 'Esta área será eliminada',
        isActive: true,
      });
      await areaRepository.create(testArea);
    });

    it('debe eliminar un área (baja lógica) cuando es admin', async () => {
      const response = await request(app)
        .delete(`/api/catalogs/areas/${testArea.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      // Verificar que el área está inactiva
      const deletedArea = await areaRepository.findById(testArea.id);
      expect(deletedArea).not.toBeNull();
      expect(deletedArea?.isActive).toBe(false);
    });

    it('debe retornar 403 cuando un usuario regular intenta eliminar', async () => {
      const response = await request(app)
        .delete(`/api/catalogs/areas/${testArea.id}`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/catalogs/areas/:id/activate', () => {
    let testArea: Area;

    beforeEach(async () => {
      const repo = container.resolve<IAreaRepository>('areaRepository') as InMemoryAreaRepository;
      repo.clear();

      testArea = Area.create({
        nombre: 'Área Inactiva',
        descripcion: 'Área que será activada',
        isActive: false,
      });
      await areaRepository.create(testArea);
    });

    it('debe activar un área cuando es admin', async () => {
      const response = await request(app)
        .post(`/api/catalogs/areas/${testArea.id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testArea.id);
      expect(response.body.isActive).toBe(true);
    });

    it('debe retornar 403 cuando un usuario regular intenta activar', async () => {
      const response = await request(app)
        .post(`/api/catalogs/areas/${testArea.id}/activate`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/catalogs/areas/:id/deactivate', () => {
    let testArea: Area;

    beforeEach(async () => {
      const repo = container.resolve<IAreaRepository>('areaRepository') as InMemoryAreaRepository;
      repo.clear();

      testArea = Area.create({
        nombre: 'Área Activa',
        descripcion: 'Área que será desactivada',
        isActive: true,
      });
      await areaRepository.create(testArea);
    });

    it('debe desactivar un área cuando es admin', async () => {
      const response = await request(app)
        .post(`/api/catalogs/areas/${testArea.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testArea.id);
      expect(response.body.isActive).toBe(false);
    });

    it('debe retornar 403 cuando un usuario regular intenta desactivar', async () => {
      const response = await request(app)
        .post(`/api/catalogs/areas/${testArea.id}/deactivate`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });
  });
});
