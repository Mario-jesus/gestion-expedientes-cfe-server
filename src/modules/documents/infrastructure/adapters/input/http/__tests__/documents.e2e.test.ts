/**
 * Tests E2E para endpoints de documentos
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
import { ICollaboratorRepository } from '@modules/collaborators/domain/ports/output/ICollaboratorRepository';
import { IDocumentRepository } from '@modules/documents/domain/ports/output/IDocumentRepository';
import { IEventBus, ILogger } from '@shared/domain';
import { User } from '@modules/users/domain';
import { UserRole } from '@modules/users/domain/enums/UserRole';
import { Collaborator } from '@modules/collaborators/domain';
import { TipoContrato } from '@modules/collaborators/domain/enums/TipoContrato';
import { DocumentKind } from '@modules/catalogs/domain/enums/DocumentKind';
import { createTestApp } from '@/__tests__/helpers/createTestApp';
import {
  InMemoryUserRepository,
  InMemoryRefreshTokenRepository,
  InMemoryCollaboratorRepository,
  InMemoryDocumentRepository,
  InMemoryFileStorageService,
} from '@/__tests__/mocks';
import { asFunction } from 'awilix';
import { registerUsersModule } from '@modules/users/infrastructure/container';
import { registerAuthModule } from '@modules/auth/infrastructure/container';
import { registerCollaboratorsModule } from '@modules/collaborators/infrastructure/container';
import { registerDocumentsModule } from '@modules/documents/infrastructure/container';

describe('Documents E2E Tests', () => {
  let app: ReturnType<typeof createTestApp>;
  let adminUser: User;
  let regularUser: User;
  let testCollaborator: Collaborator;
  let userRepository: IUserRepository;
  let collaboratorRepository: ICollaboratorRepository;
  let documentRepository: IDocumentRepository;
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

    // Registrar módulos primero
    registerUsersModule(container);
    registerAuthModule(container);
    registerCollaboratorsModule(container);
    registerDocumentsModule(container);

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
      collaboratorRepository: asFunction(() => new InMemoryCollaboratorRepository(logger), {
        lifetime: 'SINGLETON',
      }),
    });

    container.register({
      documentRepository: asFunction(() => new InMemoryDocumentRepository(logger), {
        lifetime: 'SINGLETON',
      }),
    });

    container.register({
      fileStorageService: asFunction(() => new InMemoryFileStorageService(logger), {
        lifetime: 'SINGLETON',
      }),
    });

    // Crear la aplicación Express para tests (sin registrar módulos de nuevo)
    app = createTestApp(true);

    // Resolver dependencias (ahora usarán los mocks)
    userRepository = container.resolve<IUserRepository>('userRepository');
    collaboratorRepository = container.resolve<ICollaboratorRepository>('collaboratorRepository');
    documentRepository = container.resolve<IDocumentRepository>('documentRepository');
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

    // Crear colaborador de prueba
    testCollaborator = Collaborator.create({
      nombre: 'Juan',
      apellidos: 'Pérez García',
      rpe: 'RPE001234',
      areaId: 'area-1',
      adscripcionId: 'adscripcion-1',
      puestoId: 'puesto-1',
      tipoContrato: TipoContrato.BASE,
      rfc: 'PEGJ800101ABC',
      curp: 'PEGJ800101HDFRRN01',
      imss: '12345678901',
      isActive: true,
    });
    await collaboratorRepository.create(testCollaborator);

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

  describe('POST /api/documents', () => {
    it('debe crear un documento cuando se envía un archivo válido', async () => {
      const fileContent = Buffer.from('Contenido de prueba del PDF');
      const response = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('collaboratorId', testCollaborator.id)
        .field('kind', DocumentKind.BATERIA)
        .field('periodo', '2024-Q1')
        .field('descripcion', 'Batería de pruebas')
        .attach('file', fileContent, {
          filename: 'bateria-test.pdf',
          contentType: 'application/pdf',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.collaboratorId).toBe(testCollaborator.id);
      expect(response.body.kind).toBe(DocumentKind.BATERIA);
      expect(response.body.periodo).toBe('2024-Q1');
      expect(response.body.descripcion).toBe('Batería de pruebas');
      expect(response.body.fileName).toContain('bateria');
      expect(response.body.fileUrl).toBeTruthy();
      expect(response.body.fileSize).toBe(fileContent.length);
      expect(response.body.fileType).toBe('application/pdf');
      expect(response.body.isActive).toBe(true);
    });

    it('debe retornar 400 si no se envía archivo', async () => {
      const response = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('collaboratorId', testCollaborator.id)
        .field('kind', DocumentKind.BATERIA);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('FILE_REQUIRED');
    });

    it('debe retornar 400 si no se envía collaboratorId', async () => {
      const fileContent = Buffer.from('Contenido de prueba');
      const response = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('kind', DocumentKind.BATERIA)
        .attach('file', fileContent, {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('COLLABORATOR_ID_REQUIRED');
    });

    it('debe retornar 400 si el kind es inválido', async () => {
      const fileContent = Buffer.from('Contenido de prueba');
      const response = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('collaboratorId', testCollaborator.id)
        .field('kind', 'invalid-kind')
        .attach('file', fileContent, {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('INVALID_KIND');
    });

    it('debe retornar 400 si el tipo de archivo no es permitido', async () => {
      const fileContent = Buffer.from('Contenido de prueba');
      const response = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('collaboratorId', testCollaborator.id)
        .field('kind', DocumentKind.BATERIA)
        .attach('file', fileContent, {
          filename: 'test.exe',
          contentType: 'application/x-msdownload',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('debe retornar 401 si no se envía token de autenticación', async () => {
      const fileContent = Buffer.from('Contenido de prueba');
      const response = await request(app)
        .post('/api/documents')
        .field('collaboratorId', testCollaborator.id)
        .field('kind', DocumentKind.BATERIA)
        .attach('file', fileContent, {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });

      expect(response.status).toBe(401);
    });

    it('debe retornar 404 si el colaborador no existe', async () => {
      const fileContent = Buffer.from('Contenido de prueba');
      const response = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('collaboratorId', 'non-existent-id')
        .field('kind', DocumentKind.BATERIA)
        .attach('file', fileContent, {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('debe retornar 409 si se intenta crear un documento duplicado (batería)', async () => {
      const fileContent1 = Buffer.from('Primera batería');
      const fileContent2 = Buffer.from('Segunda batería');

      // Crear primera batería
      await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('collaboratorId', testCollaborator.id)
        .field('kind', DocumentKind.BATERIA)
        .attach('file', fileContent1, {
          filename: 'bateria1.pdf',
          contentType: 'application/pdf',
        });

      // Intentar crear segunda batería (debe fallar)
      const response = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('collaboratorId', testCollaborator.id)
        .field('kind', DocumentKind.BATERIA)
        .attach('file', fileContent2, {
          filename: 'bateria2.pdf',
          contentType: 'application/pdf',
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('DUPLICATE_DOCUMENT');
    });
  });

  describe('GET /api/documents', () => {
    // No limpiar aquí para no afectar otros tests

    it('debe listar documentos sin filtros', async () => {
      // Crear algunos documentos de prueba
      const fileContent = Buffer.from('Contenido de prueba');
      await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('collaboratorId', testCollaborator.id)
        .field('kind', DocumentKind.BATERIA)
        .attach('file', fileContent, {
          filename: 'bateria1.pdf',
          contentType: 'application/pdf',
        });

      await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('collaboratorId', testCollaborator.id)
        .field('kind', DocumentKind.PERFIL)
        .attach('file', fileContent, {
          filename: 'perfil1.pdf',
          contentType: 'application/pdf',
        });

      const response = await request(app)
        .get('/api/documents')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(2);
    });

    it('debe filtrar documentos por collaboratorId', async () => {
      const fileContent = Buffer.from('Contenido de prueba');
      await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('collaboratorId', testCollaborator.id)
        .field('kind', DocumentKind.BATERIA)
        .attach('file', fileContent, {
          filename: 'bateria1.pdf',
          contentType: 'application/pdf',
        });

      const response = await request(app)
        .get(`/api/documents?collaboratorId=${testCollaborator.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((doc: any) => {
        expect(doc.collaboratorId).toBe(testCollaborator.id);
      });
    });

    it('debe filtrar documentos por kind', async () => {
      const fileContent = Buffer.from('Contenido de prueba');
      await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('collaboratorId', testCollaborator.id)
        .field('kind', DocumentKind.BATERIA)
        .attach('file', fileContent, {
          filename: 'bateria1.pdf',
          contentType: 'application/pdf',
        });

      const response = await request(app)
        .get(`/api/documents?kind=${DocumentKind.BATERIA}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      response.body.data.forEach((doc: any) => {
        expect(doc.kind).toBe(DocumentKind.BATERIA);
      });
    });

    it('debe aplicar paginación correctamente', async () => {
      const fileContent = Buffer.from('Contenido de prueba');
      // Crear varios documentos
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/documents')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('collaboratorId', testCollaborator.id)
          .field('kind', DocumentKind.HISTORIAL)
          .field('periodo', `2024-Q${i + 1}`)
          .attach('file', fileContent, {
            filename: `historial${i}.pdf`,
            contentType: 'application/pdf',
          });
      }

      const response = await request(app)
        .get('/api/documents?limit=2&offset=0')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.offset).toBe(0);
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(5);
    });
  });

  describe('GET /api/documents/:id', () => {
    let createdDocumentId: string;

    beforeEach(async () => {
      // Limpiar documentos antes de crear uno nuevo para este test
      (documentRepository as any).clear();

      // Crear un documento de prueba
      const fileContent = Buffer.from('Contenido de prueba');
      const createResponse = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('collaboratorId', testCollaborator.id)
        .field('kind', DocumentKind.BATERIA)
        .field('descripcion', 'Documento de prueba')
        .attach('file', fileContent, {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });

      expect(createResponse.status).toBe(201);
      createdDocumentId = createResponse.body.id;
    });

    it('debe obtener un documento por su ID', async () => {
      const response = await request(app)
        .get(`/api/documents/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(createdDocumentId);
      expect(response.body.collaboratorId).toBe(testCollaborator.id);
      expect(response.body.kind).toBe(DocumentKind.BATERIA);
      expect(response.body.descripcion).toBe('Documento de prueba');
    });

    it('debe retornar 404 si el documento no existe', async () => {
      const response = await request(app)
        .get('/api/documents/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('debe retornar 401 si no se envía token', async () => {
      const response = await request(app).get(`/api/documents/${createdDocumentId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/documents/:id/download', () => {
    let createdDocumentId: string;

    beforeEach(async () => {
      // Limpiar documentos antes de crear uno nuevo para este test
      (documentRepository as any).clear();

      // Crear un documento de prueba
      const fileContent = Buffer.from('Contenido de prueba para descarga');
      const createResponse = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('collaboratorId', testCollaborator.id)
        .field('kind', DocumentKind.BATERIA)
        .attach('file', fileContent, {
          filename: 'download-test.pdf',
          contentType: 'application/pdf',
        });

      expect(createResponse.status).toBe(201);
      createdDocumentId = createResponse.body.id;
    });

    it('debe obtener la URL de descarga de un documento', async () => {
      const response = await request(app)
        .get(`/api/documents/${createdDocumentId}/download`)
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

    it('debe retornar 404 si el documento no existe', async () => {
      const response = await request(app)
        .get('/api/documents/non-existent-id/download')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/documents/:id', () => {
    let createdDocumentId: string;

    beforeEach(async () => {
      // Limpiar documentos antes de crear uno nuevo para este test
      (documentRepository as any).clear();

      // Crear un documento de prueba
      const fileContent = Buffer.from('Contenido de prueba');
      const createResponse = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('collaboratorId', testCollaborator.id)
        .field('kind', DocumentKind.BATERIA)
        .attach('file', fileContent, {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });

      expect(createResponse.status).toBe(201);
      createdDocumentId = createResponse.body.id;
    });

    it('debe actualizar los metadatos de un documento', async () => {
      const response = await request(app)
        .put(`/api/documents/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          periodo: '2024-Q2',
          descripcion: 'Descripción actualizada',
          isActive: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.periodo).toBe('2024-Q2');
      expect(response.body.descripcion).toBe('Descripción actualizada');
    });

    it('debe retornar 404 si el documento no existe', async () => {
      const response = await request(app)
        .put('/api/documents/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          descripcion: 'Nueva descripción',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/documents/:id', () => {
    let createdDocumentId: string;

    beforeEach(async () => {
      // Limpiar documentos antes de crear uno nuevo para este test
      (documentRepository as any).clear();

      // Crear un documento de prueba
      const fileContent = Buffer.from('Contenido de prueba');
      const createResponse = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('collaboratorId', testCollaborator.id)
        .field('kind', DocumentKind.BATERIA)
        .attach('file', fileContent, {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });

      expect(createResponse.status).toBe(201);
      createdDocumentId = createResponse.body.id;
    });

    it('debe actualizar parcialmente los metadatos de un documento', async () => {
      const response = await request(app)
        .patch(`/api/documents/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          descripcion: 'Solo actualizar descripción',
        });

      expect(response.status).toBe(200);
      expect(response.body.descripcion).toBe('Solo actualizar descripción');
    });
  });

  describe('DELETE /api/documents/:id', () => {
    let createdDocumentId: string;

    beforeEach(async () => {
      // Limpiar documentos antes de crear uno nuevo para este test
      (documentRepository as any).clear();

      // Crear un documento de prueba
      const fileContent = Buffer.from('Contenido de prueba');
      const createResponse = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('collaboratorId', testCollaborator.id)
        .field('kind', DocumentKind.BATERIA)
        .attach('file', fileContent, {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });

      expect(createResponse.status).toBe(201);
      createdDocumentId = createResponse.body.id;
    });

    it('debe eliminar un documento (baja lógica)', async () => {
      const response = await request(app)
        .delete(`/api/documents/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      // Verificar que el documento está inactivo
      const getResponse = await request(app)
        .get(`/api/documents/${createdDocumentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.isActive).toBe(false);
    });

    it('debe retornar 404 si el documento no existe', async () => {
      const response = await request(app)
        .delete('/api/documents/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });
});
