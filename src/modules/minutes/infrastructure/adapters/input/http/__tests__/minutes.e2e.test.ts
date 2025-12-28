/**
 * Tests E2E para endpoints de minutas
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
import { IMinuteRepository } from '@modules/minutes/domain/ports/output/IMinuteRepository';
import { IEventBus, ILogger } from '@shared/domain';
import { User } from '@modules/users/domain';
import { UserRole } from '@modules/users/domain/enums/UserRole';
import { MinuteType } from '@modules/minutes/domain/enums/MinuteType';
import { createTestApp } from '@/__tests__/helpers/createTestApp';
import {
  InMemoryUserRepository,
  InMemoryRefreshTokenRepository,
  InMemoryMinuteRepository,
  InMemoryFileStorageService,
} from '@/__tests__/mocks';
import { asFunction } from 'awilix';

describe('Minutes E2E Tests', () => {
  let app: ReturnType<typeof createTestApp>;
  let adminUser: User;
  let regularUser: User;
  let userRepository: IUserRepository;
  let minuteRepository: IMinuteRepository;
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
        minuteRepository: asFunction(() => new InMemoryMinuteRepository(logger), {
          lifetime: 'SINGLETON',
        }),
      });

      container.register({
        fileStorageService: asFunction(() => new InMemoryFileStorageService(logger), {
          lifetime: 'SINGLETON',
        }),
      });
    });

    // Resolver dependencias (ahora usarán los mocks)
    userRepository = container.resolve<IUserRepository>('userRepository');
    minuteRepository = container.resolve<IMinuteRepository>('minuteRepository');
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

    // Obtener tokens de autenticación
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123',
      });
    adminToken = adminLoginResponse.body.token;

    // Obtener token de usuario regular (no se usa en estos tests pero puede ser útil)
    await request(app)
      .post('/api/auth/login')
      .send({
        username: 'user',
        password: 'user123',
      });
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

  describe('POST /api/minutes', () => {
    it('debe crear una minuta cuando se envía un archivo válido', async () => {
      const fileContent = Buffer.from('Contenido de prueba del PDF');
      const fechaEvento = new Date('2024-01-15');
      const response = await request(app)
        .post('/api/minutes')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('titulo', 'Minuta de Reunión')
        .field('tipo', MinuteType.REUNION)
        .field('descripcion', 'Reunión de trabajo')
        .field('fecha', fechaEvento.toISOString())
        .attach('file', fileContent, {
          filename: 'minuta-reunion.pdf',
          contentType: 'application/pdf',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.titulo).toBe('Minuta de Reunión');
      expect(response.body.tipo).toBe(MinuteType.REUNION);
      expect(response.body.descripcion).toBe('Reunión de trabajo');
      expect(response.body.fileName).toMatch(/^minuta_\d+_[a-f0-9]+\.pdf$/);
      expect(response.body.fileUrl).toBeTruthy();
      expect(response.body.fileSize).toBe(fileContent.length);
      expect(response.body.fileType).toBe('application/pdf');
      expect(response.body.isActive).toBe(true);
      expect(new Date(response.body.fecha)).toEqual(fechaEvento);
    });

    it('debe retornar 400 si no se envía archivo', async () => {
      const fechaEvento = new Date('2024-01-15');
      const response = await request(app)
        .post('/api/minutes')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('titulo', 'Minuta de Reunión')
        .field('tipo', MinuteType.REUNION)
        .field('fecha', fechaEvento.toISOString());

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('FILE_REQUIRED');
    });

    it('debe retornar 400 si no se envía título', async () => {
      const fileContent = Buffer.from('Contenido de prueba');
      const fechaEvento = new Date('2024-01-15');
      const response = await request(app)
        .post('/api/minutes')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('tipo', MinuteType.REUNION)
        .field('fecha', fechaEvento.toISOString())
        .attach('file', fileContent, {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('debe retornar 400 si no se envía tipo', async () => {
      const fileContent = Buffer.from('Contenido de prueba');
      const fechaEvento = new Date('2024-01-15');
      const response = await request(app)
        .post('/api/minutes')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('titulo', 'Minuta de Reunión')
        .field('fecha', fechaEvento.toISOString())
        .attach('file', fileContent, {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('debe retornar 400 si el tipo es inválido', async () => {
      const fileContent = Buffer.from('Contenido de prueba');
      const fechaEvento = new Date('2024-01-15');
      const response = await request(app)
        .post('/api/minutes')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('titulo', 'Minuta de Reunión')
        .field('tipo', 'invalid-type')
        .field('fecha', fechaEvento.toISOString())
        .attach('file', fileContent, {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('debe retornar 400 si no se envía fecha', async () => {
      const fileContent = Buffer.from('Contenido de prueba');
      const response = await request(app)
        .post('/api/minutes')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('titulo', 'Minuta de Reunión')
        .field('tipo', MinuteType.REUNION)
        .attach('file', fileContent, {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('debe retornar 400 si el tipo de archivo no es permitido', async () => {
      const fileContent = Buffer.from('Contenido de prueba');
      const fechaEvento = new Date('2024-01-15');
      const response = await request(app)
        .post('/api/minutes')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('titulo', 'Minuta de Reunión')
        .field('tipo', MinuteType.REUNION)
        .field('fecha', fechaEvento.toISOString())
        .attach('file', fileContent, {
          filename: 'test.exe',
          contentType: 'application/x-msdownload',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('debe retornar 401 si no se envía token de autenticación', async () => {
      const fileContent = Buffer.from('Contenido de prueba');
      const fechaEvento = new Date('2024-01-15');
      const response = await request(app)
        .post('/api/minutes')
        .field('titulo', 'Minuta de Reunión')
        .field('tipo', MinuteType.REUNION)
        .field('fecha', fechaEvento.toISOString())
        .attach('file', fileContent, {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/minutes', () => {
    it('debe listar minutas sin filtros', async () => {
      // Limpiar antes de crear minutas de prueba
      (minuteRepository as any).clear();

      // Crear algunas minutas de prueba
      const fileContent = Buffer.from('Contenido de prueba');
      await request(app)
        .post('/api/minutes')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('titulo', 'Minuta de Reunión 1')
        .field('tipo', MinuteType.REUNION)
        .field('fecha', new Date('2024-01-15').toISOString())
        .attach('file', fileContent, {
          filename: 'reunion1.pdf',
          contentType: 'application/pdf',
        });

      await request(app)
        .post('/api/minutes')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('titulo', 'Minuta de Junta 1')
        .field('tipo', MinuteType.JUNTA)
        .field('fecha', new Date('2024-01-16').toISOString())
        .attach('file', fileContent, {
          filename: 'junta1.pdf',
          contentType: 'application/pdf',
        });

      const response = await request(app)
        .get('/api/minutes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(2);
    });

    it('debe filtrar minutas por tipo', async () => {
      (minuteRepository as any).clear();

      const fileContent = Buffer.from('Contenido de prueba');
      await request(app)
        .post('/api/minutes')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('titulo', 'Minuta de Reunión')
        .field('tipo', MinuteType.REUNION)
        .field('fecha', new Date('2024-01-15').toISOString())
        .attach('file', fileContent, {
          filename: 'reunion1.pdf',
          contentType: 'application/pdf',
        });

      const response = await request(app)
        .get(`/api/minutes?tipo=${MinuteType.REUNION}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      response.body.data.forEach((minute: any) => {
        expect(minute.tipo).toBe(MinuteType.REUNION);
      });
    });

    it('debe filtrar minutas por rango de fechas', async () => {
      (minuteRepository as any).clear();

      const fileContent = Buffer.from('Contenido de prueba');
      const fecha1 = new Date('2024-01-15');
      const fecha2 = new Date('2024-01-20');
      const fecha3 = new Date('2024-02-01');

      await request(app)
        .post('/api/minutes')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('titulo', 'Minuta 1')
        .field('tipo', MinuteType.REUNION)
        .field('fecha', fecha1.toISOString())
        .attach('file', fileContent, {
          filename: 'minuta1.pdf',
          contentType: 'application/pdf',
        });

      await request(app)
        .post('/api/minutes')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('titulo', 'Minuta 2')
        .field('tipo', MinuteType.REUNION)
        .field('fecha', fecha2.toISOString())
        .attach('file', fileContent, {
          filename: 'minuta2.pdf',
          contentType: 'application/pdf',
        });

      await request(app)
        .post('/api/minutes')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('titulo', 'Minuta 3')
        .field('tipo', MinuteType.REUNION)
        .field('fecha', fecha3.toISOString())
        .attach('file', fileContent, {
          filename: 'minuta3.pdf',
          contentType: 'application/pdf',
        });

      const fechaDesde = '2024-01-15';
      const fechaHasta = '2024-01-31';
      const response = await request(app)
        .get(`/api/minutes?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      response.body.data.forEach((minute: any) => {
        const fechaMinuta = new Date(minute.fecha);
        expect(fechaMinuta >= new Date(fechaDesde)).toBe(true);
        expect(fechaMinuta <= new Date(fechaHasta)).toBe(true);
      });
    });

    it('debe buscar minutas por texto (título o descripción)', async () => {
      (minuteRepository as any).clear();

      const fileContent = Buffer.from('Contenido de prueba');
      await request(app)
        .post('/api/minutes')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('titulo', 'Reunión de Trabajo')
        .field('tipo', MinuteType.REUNION)
        .field('descripcion', 'Reunión sobre proyectos')
        .field('fecha', new Date('2024-01-15').toISOString())
        .attach('file', fileContent, {
          filename: 'reunion.pdf',
          contentType: 'application/pdf',
        });

      const response = await request(app)
        .get('/api/minutes?search=Trabajo')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      const found = response.body.data.some(
        (minute: any) =>
          minute.titulo.includes('Trabajo') ||
          (minute.descripcion && minute.descripcion.includes('Trabajo'))
      );
      expect(found).toBe(true);
    });

    it('debe aplicar paginación correctamente', async () => {
      (minuteRepository as any).clear();

      const fileContent = Buffer.from('Contenido de prueba');
      // Crear varias minutas
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/minutes')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('titulo', `Minuta ${i + 1}`)
          .field('tipo', MinuteType.REUNION)
          .field('fecha', new Date(`2024-01-${15 + i}`).toISOString())
          .attach('file', fileContent, {
            filename: `minuta${i}.pdf`,
            contentType: 'application/pdf',
          });
      }

      const response = await request(app)
        .get('/api/minutes?limit=2&offset=0')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.offset).toBe(0);
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(5);
    });
  });

  describe('GET /api/minutes/:id', () => {
    let createdMinuteId: string;

    beforeEach(async () => {
      // Limpiar minutas antes de crear una nueva para este test
      (minuteRepository as any).clear();

      // Crear una minuta de prueba
      const fileContent = Buffer.from('Contenido de prueba');
      const createResponse = await request(app)
        .post('/api/minutes')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('titulo', 'Minuta de Prueba')
        .field('tipo', MinuteType.REUNION)
        .field('descripcion', 'Descripción de prueba')
        .field('fecha', new Date('2024-01-15').toISOString())
        .attach('file', fileContent, {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });

      expect(createResponse.status).toBe(201);
      createdMinuteId = createResponse.body.id;
    });

    it('debe obtener una minuta por su ID', async () => {
      const response = await request(app)
        .get(`/api/minutes/${createdMinuteId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(createdMinuteId);
      expect(response.body.titulo).toBe('Minuta de Prueba');
      expect(response.body.tipo).toBe(MinuteType.REUNION);
      expect(response.body.descripcion).toBe('Descripción de prueba');
    });

    it('debe retornar 404 si la minuta no existe', async () => {
      const response = await request(app)
        .get('/api/minutes/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('debe retornar 401 si no se envía token', async () => {
      const response = await request(app).get(`/api/minutes/${createdMinuteId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/minutes/:id/download', () => {
    let createdMinuteId: string;

    beforeEach(async () => {
      // Limpiar minutas antes de crear una nueva para este test
      (minuteRepository as any).clear();

      // Crear una minuta de prueba
      const fileContent = Buffer.from('Contenido de prueba para descarga');
      const createResponse = await request(app)
        .post('/api/minutes')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('titulo', 'Minuta de Descarga')
        .field('tipo', MinuteType.REUNION)
        .field('fecha', new Date('2024-01-15').toISOString())
        .attach('file', fileContent, {
          filename: 'download-test.pdf',
          contentType: 'application/pdf',
        });

      expect(createResponse.status).toBe(201);
      createdMinuteId = createResponse.body.id;
    });

    it('debe obtener la URL de descarga de una minuta', async () => {
      const response = await request(app)
        .get(`/api/minutes/${createdMinuteId}/download`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('fileName');
      expect(response.body).toHaveProperty('fileType');
      expect(response.body.url).toBeTruthy();
      expect(response.body.fileName).toBeTruthy();
      expect(response.body.fileName).toMatch(/\.pdf$/i); // Debe terminar en .pdf
      expect(response.body.fileType).toBe('application/pdf');
    });

    it('debe retornar 404 si la minuta no existe', async () => {
      const response = await request(app)
        .get('/api/minutes/non-existent-id/download')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/minutes/:id', () => {
    let createdMinuteId: string;

    beforeEach(async () => {
      // Limpiar minutas antes de crear una nueva para este test
      (minuteRepository as any).clear();

      // Crear una minuta de prueba
      const fileContent = Buffer.from('Contenido de prueba');
      const createResponse = await request(app)
        .post('/api/minutes')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('titulo', 'Minuta Original')
        .field('tipo', MinuteType.REUNION)
        .field('fecha', new Date('2024-01-15').toISOString())
        .attach('file', fileContent, {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });

      expect(createResponse.status).toBe(201);
      createdMinuteId = createResponse.body.id;
    });

    it('debe actualizar los metadatos de una minuta', async () => {
      const nuevaFecha = new Date('2024-02-20');
      const response = await request(app)
        .put(`/api/minutes/${createdMinuteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titulo: 'Minuta Actualizada',
          tipo: MinuteType.JUNTA,
          descripcion: 'Descripción actualizada',
          fecha: nuevaFecha.toISOString(),
          isActive: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.titulo).toBe('Minuta Actualizada');
      expect(response.body.tipo).toBe(MinuteType.JUNTA);
      expect(response.body.descripcion).toBe('Descripción actualizada');
      expect(new Date(response.body.fecha)).toEqual(nuevaFecha);
    });

    it('debe retornar 404 si la minuta no existe', async () => {
      const response = await request(app)
        .put('/api/minutes/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titulo: 'Nuevo título',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/minutes/:id', () => {
    let createdMinuteId: string;

    beforeEach(async () => {
      // Limpiar minutas antes de crear una nueva para este test
      (minuteRepository as any).clear();

      // Crear una minuta de prueba
      const fileContent = Buffer.from('Contenido de prueba');
      const createResponse = await request(app)
        .post('/api/minutes')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('titulo', 'Minuta Original')
        .field('tipo', MinuteType.REUNION)
        .field('fecha', new Date('2024-01-15').toISOString())
        .attach('file', fileContent, {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });

      expect(createResponse.status).toBe(201);
      createdMinuteId = createResponse.body.id;
    });

    it('debe actualizar parcialmente los metadatos de una minuta', async () => {
      const response = await request(app)
        .patch(`/api/minutes/${createdMinuteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          descripcion: 'Solo actualizar descripción',
        });

      expect(response.status).toBe(200);
      expect(response.body.descripcion).toBe('Solo actualizar descripción');
      // Los demás campos deben mantenerse
      expect(response.body.titulo).toBe('Minuta Original');
      expect(response.body.tipo).toBe(MinuteType.REUNION);
    });
  });

  describe('DELETE /api/minutes/:id', () => {
    let createdMinuteId: string;

    beforeEach(async () => {
      // Limpiar minutas antes de crear una nueva para este test
      (minuteRepository as any).clear();

      // Crear una minuta de prueba
      const fileContent = Buffer.from('Contenido de prueba');
      const createResponse = await request(app)
        .post('/api/minutes')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('titulo', 'Minuta a Eliminar')
        .field('tipo', MinuteType.REUNION)
        .field('fecha', new Date('2024-01-15').toISOString())
        .attach('file', fileContent, {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });

      expect(createResponse.status).toBe(201);
      createdMinuteId = createResponse.body.id;
    });

    it('debe eliminar una minuta (baja lógica)', async () => {
      const response = await request(app)
        .delete(`/api/minutes/${createdMinuteId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      // Verificar que la minuta está inactiva
      const getResponse = await request(app)
        .get(`/api/minutes/${createdMinuteId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.isActive).toBe(false);
    });

    it('debe retornar 404 si la minuta no existe', async () => {
      const response = await request(app)
        .delete('/api/minutes/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });
});
