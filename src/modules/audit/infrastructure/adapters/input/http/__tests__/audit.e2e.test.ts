/**
 * Tests E2E para endpoints de auditoría
 * 
 * Estos tests verifican que los endpoints HTTP funcionan correctamente
 * desde el punto de vista del usuario final.
 * 
 * IMPORTANTE: Estos tests NO modifican la base de datos de producción.
 * Usan una base de datos en memoria (InMemoryDatabase) y mocks de repositorios.
 */

import request from 'supertest';
import { container, clearContainer, registerSharedDependencies } from '@shared/infrastructure';
import { IDatabase } from '@shared/domain/ports/output/IDatabase';
import { IUserRepository } from '@modules/users/domain/ports/output/IUserRepository';
import { IPasswordHasher } from '@modules/users/application/ports/output/IPasswordHasher';
import { ILogEntryRepository } from '@modules/audit/domain/ports/output/ILogEntryRepository';
import { IEventBus, ILogger } from '@shared/domain';
import { User } from '@modules/users/domain';
import { UserRole } from '@modules/users/domain/enums/UserRole';
import { LogAction } from '@modules/audit/domain/enums/LogAction';
import { LogEntity } from '@modules/audit/domain/enums/LogEntity';
import { LogEntry } from '@modules/audit/domain/entities/LogEntry';
import { createTestApp } from '@/__tests__/helpers/createTestApp';
import {
  InMemoryUserRepository,
  InMemoryRefreshTokenRepository,
  InMemoryLogEntryRepository,
} from '@/__tests__/mocks';
import { asFunction } from 'awilix';

describe('Audit E2E Tests', () => {
  let app: ReturnType<typeof createTestApp>;
  let adminUser: User;
  let regularUser: User;
  let userRepository: IUserRepository;
  let logEntryRepository: ILogEntryRepository;
  let passwordHasher: IPasswordHasher;
  let database: IDatabase;
  let adminToken: string;

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

    // Crear la aplicación Express para tests
    // Usar afterRegisterModules para registrar mocks que sobrescriben los registros de los módulos
    // IMPORTANTE: registerAuditModule resuelve dependencias inmediatamente al suscribir eventos,
    // por lo que el mock debe estar disponible antes de que se registre el módulo
    app = createTestApp(false, (container) => {
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
        logEntryRepository: asFunction(() => new InMemoryLogEntryRepository(logger), {
          lifetime: 'SINGLETON',
        }),
      });
    });

    // Resolver dependencias (ahora usarán los mocks)
    userRepository = container.resolve<IUserRepository>('userRepository');
    logEntryRepository = container.resolve<ILogEntryRepository>('logEntryRepository');
    passwordHasher = container.resolve<IPasswordHasher>('passwordHasher');

    // Crear usuarios de prueba
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

    // Obtener token de autenticación
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123',
      });

    adminToken = adminLoginResponse.body.token;

    // Crear algunos logs de prueba
    const log1 = LogEntry.create({
      userId: adminUser.id,
      action: LogAction.CREATE,
      entity: LogEntity.USER,
      entityId: regularUser.id,
      metadata: { username: regularUser.usernameValue },
    });
    await logEntryRepository.create(log1);

    const log2 = LogEntry.create({
      userId: regularUser.id,
      action: LogAction.LOGIN,
      entity: LogEntity.USER,
      entityId: regularUser.id,
      metadata: { ipAddress: '127.0.0.1' },
    });
    await logEntryRepository.create(log2);

    const log3 = LogEntry.create({
      userId: adminUser.id,
      action: LogAction.UPDATE,
      entity: LogEntity.USER,
      entityId: regularUser.id,
      metadata: { updatedFields: ['name'] },
    });
    await logEntryRepository.create(log3);
  });

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

    // Cerrar logger streams
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

  describe('GET /api/audit', () => {
    it('debe listar logs con autenticación', async () => {
      const response = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('offset');
      expect(response.body.pagination).toHaveProperty('totalPages');
    });

    it('debe requerir autenticación', async () => {
      await request(app)
        .get('/api/audit')
        .expect(401);
    });

    it('debe filtrar logs por userId', async () => {
      const response = await request(app)
        .get(`/api/audit?userId=${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((log: any) => {
        expect(log.userId).toBe(adminUser.id);
      });
    });

    it('debe filtrar logs por action', async () => {
      const response = await request(app)
        .get(`/api/audit?action=${LogAction.CREATE}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((log: any) => {
        expect(log.action).toBe(LogAction.CREATE);
      });
    });

    it('debe filtrar logs por entity', async () => {
      const response = await request(app)
        .get(`/api/audit?entity=${LogEntity.USER}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((log: any) => {
        expect(log.entity).toBe(LogEntity.USER);
      });
    });

    it('debe filtrar logs por entityId', async () => {
      const response = await request(app)
        .get(`/api/audit?entityId=${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((log: any) => {
        expect(log.entityId).toBe(regularUser.id);
      });
    });

    it('debe filtrar logs por rango de fechas', async () => {
      const fechaDesde = new Date();
      fechaDesde.setDate(fechaDesde.getDate() - 1);
      const fechaHasta = new Date();
      fechaHasta.setDate(fechaHasta.getDate() + 1);

      const response = await request(app)
        .get(
          `/api/audit?fechaDesde=${fechaDesde.toISOString()}&fechaHasta=${fechaHasta.toISOString()}`
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('debe validar action inválido', async () => {
      await request(app)
        .get('/api/audit?action=invalid_action')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('debe validar entity inválido', async () => {
      await request(app)
        .get('/api/audit?entity=invalid_entity')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('debe validar fechaDesde inválida', async () => {
      await request(app)
        .get('/api/audit?fechaDesde=invalid_date')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('debe validar fechaHasta inválida', async () => {
      await request(app)
        .get('/api/audit?fechaHasta=invalid_date')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('debe soportar paginación', async () => {
      const response = await request(app)
        .get('/api/audit?limit=1&offset=0')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.offset).toBe(0);
    });
  });

  describe('GET /api/audit/:id', () => {
    it('debe obtener un log por ID', async () => {
      // Crear un log de prueba
      const testLog = LogEntry.create({
        userId: adminUser.id,
        action: LogAction.VIEW,
        entity: LogEntity.USER,
        entityId: regularUser.id,
      });
      const createdLog = await logEntryRepository.create(testLog);

      const response = await request(app)
        .get(`/api/audit/${createdLog.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('action');
      expect(response.body).toHaveProperty('entity');
      expect(response.body).toHaveProperty('entityId');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body.id).toBe(createdLog.id);
    });

    it('debe retornar 404 si el log no existe', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      await request(app)
        .get(`/api/audit/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('debe requerir autenticación', async () => {
      const testLog = LogEntry.create({
        userId: adminUser.id,
        action: LogAction.VIEW,
        entity: LogEntity.USER,
        entityId: regularUser.id,
      });
      const createdLog = await logEntryRepository.create(testLog);

      await request(app)
        .get(`/api/audit/${createdLog.id}`)
        .expect(401);
    });
  });

  describe('GET /api/audit/entity/:entity/:entityId', () => {
    it('debe obtener logs de una entidad específica', async () => {
      const response = await request(app)
        .get(`/api/audit/entity/${LogEntity.USER}/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach((log: any) => {
        expect(log.entity).toBe(LogEntity.USER);
        expect(log.entityId).toBe(regularUser.id);
      });
    });

    it('debe validar entity inválido', async () => {
      await request(app)
        .get(`/api/audit/entity/invalid_entity/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('debe soportar paginación', async () => {
      const response = await request(app)
        .get(`/api/audit/entity/${LogEntity.USER}/${regularUser.id}?limit=1&offset=0`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.offset).toBe(0);
    });

    it('debe requerir autenticación', async () => {
      await request(app)
        .get(`/api/audit/entity/${LogEntity.USER}/${regularUser.id}`)
        .expect(401);
    });
  });

  describe('GET /api/audit/user/:userId', () => {
    it('debe obtener logs de un usuario específico', async () => {
      const response = await request(app)
        .get(`/api/audit/user/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach((log: any) => {
        expect(log.userId).toBe(adminUser.id);
      });
    });

    it('debe soportar paginación', async () => {
      const response = await request(app)
        .get(`/api/audit/user/${adminUser.id}?limit=1&offset=0`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.offset).toBe(0);
    });

    it('debe requerir autenticación', async () => {
      await request(app)
        .get(`/api/audit/user/${adminUser.id}`)
        .expect(401);
    });
  });
});
