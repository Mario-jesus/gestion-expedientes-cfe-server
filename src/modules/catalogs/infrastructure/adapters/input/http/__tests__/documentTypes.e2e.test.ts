/**
 * Tests E2E para endpoints de tipos de documento
 * 
 * Estos tests verifican que los endpoints HTTP funcionan correctamente
 * desde el punto de vista del usuario final.
 */

import request from 'supertest';
import { container, clearContainer, registerSharedDependencies } from '@shared/infrastructure';
import { IDatabase } from '@shared/domain/ports/output/IDatabase';
import { IUserRepository } from '@modules/users/domain/ports/output/IUserRepository';
import { IPasswordHasher } from '@modules/users/application/ports/output/IPasswordHasher';
import { IDocumentTypeRepository } from '@modules/catalogs/domain/ports/output/IDocumentTypeRepository';
import { IEventBus, ILogger } from '@shared/domain';
import { User } from '@modules/users/domain';
import { UserRole } from '@modules/users/domain/enums/UserRole';
import { DocumentType } from '@modules/catalogs/domain';
import { DocumentKind } from '@modules/catalogs/domain/enums/DocumentKind';
import { createTestApp } from '@/__tests__/helpers/createTestApp';
import { InMemoryUserRepository } from '@/__tests__/mocks/InMemoryUserRepository';
import { InMemoryRefreshTokenRepository } from '@/__tests__/mocks/InMemoryRefreshTokenRepository';
import { InMemoryDocumentTypeRepository } from '@/__tests__/mocks/InMemoryDocumentTypeRepository';
import { asFunction } from 'awilix';
import { registerUsersModule } from '@modules/users/infrastructure/container';
import { registerAuthModule } from '@modules/auth/infrastructure/container';
import { registerCatalogsModule } from '@modules/catalogs/infrastructure/container';

describe('DocumentTypes E2E Tests', () => {
  let app: ReturnType<typeof createTestApp>;
  let adminUser: User;
  let regularUser: User;
  let userRepository: IUserRepository;
  let documentTypeRepository: IDocumentTypeRepository;
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
      documentTypeRepository: asFunction(() => new InMemoryDocumentTypeRepository(logger), {
        lifetime: 'SINGLETON',
      }),
    });

    app = createTestApp(true);

    userRepository = container.resolve<IUserRepository>('userRepository');
    documentTypeRepository = container.resolve<IDocumentTypeRepository>('documentTypeRepository');
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

  describe('POST /api/catalogs/document-types', () => {
    it('debe crear un tipo de documento cuando es admin', async () => {
      const response = await request(app)
        .post('/api/catalogs/document-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Tipo de Documento de Prueba',
          kind: DocumentKind.BATERIA,
          descripcion: 'Descripción de prueba',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.nombre).toBe('Tipo de Documento de Prueba');
      expect(response.body.kind).toBe(DocumentKind.BATERIA);
      expect(response.body.isActive).toBe(true);
    });

    it('debe retornar 403 cuando un usuario regular intenta crear', async () => {
      const response = await request(app)
        .post('/api/catalogs/document-types')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          nombre: 'Tipo No Autorizado',
          kind: DocumentKind.BATERIA,
        });

      expect(response.status).toBe(403);
    });

    it('debe retornar error si el nombre ya existe en el kind', async () => {
      await request(app)
        .post('/api/catalogs/document-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Tipo Duplicado',
          kind: DocumentKind.BATERIA,
        });

      const response = await request(app)
        .post('/api/catalogs/document-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Tipo Duplicado',
          kind: DocumentKind.BATERIA,
        });

      expect([400, 409].includes(response.status)).toBe(true);
      expect(response.body).toHaveProperty('error');
    });

    it('debe permitir el mismo nombre en diferentes kinds', async () => {
      await request(app)
        .post('/api/catalogs/document-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Mismo Nombre',
          kind: DocumentKind.BATERIA,
        });

      const response = await request(app)
        .post('/api/catalogs/document-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Mismo Nombre',
          kind: DocumentKind.HISTORIAL,
        });

      expect(response.status).toBe(201);
      expect(response.body.nombre).toBe('Mismo Nombre');
      expect(response.body.kind).toBe(DocumentKind.HISTORIAL);
    });
  });

  describe('GET /api/catalogs/document-types', () => {
    beforeEach(async () => {
      const repo = container.resolve<IDocumentTypeRepository>('documentTypeRepository') as InMemoryDocumentTypeRepository;
      repo.clear();

      const docType1 = DocumentType.create({
        nombre: 'Tipo 1',
        kind: DocumentKind.BATERIA,
        descripcion: 'Primer tipo',
        isActive: true,
      });
      await documentTypeRepository.create(docType1);

      const docType2 = DocumentType.create({
        nombre: 'Tipo 2',
        kind: DocumentKind.HISTORIAL,
        descripcion: 'Segundo tipo',
        isActive: true,
      });
      await documentTypeRepository.create(docType2);
    });

    it('debe listar tipos de documento cuando está autenticado', async () => {
      const response = await request(app)
        .get('/api/catalogs/document-types')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('debe filtrar tipos de documento por kind', async () => {
      const response = await request(app)
        .get(`/api/catalogs/document-types?kind=${DocumentKind.BATERIA}`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((dt: any) => dt.kind === DocumentKind.BATERIA)).toBe(true);
    });

    it('debe filtrar tipos de documento por isActive', async () => {
      const response = await request(app)
        .get('/api/catalogs/document-types?isActive=true')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((dt: any) => dt.isActive === true)).toBe(true);
    });
  });

  describe('GET /api/catalogs/document-types/:id', () => {
    let testDocumentType: DocumentType;

    beforeEach(async () => {
      const repo = container.resolve<IDocumentTypeRepository>('documentTypeRepository') as InMemoryDocumentTypeRepository;
      repo.clear();

      testDocumentType = DocumentType.create({
        nombre: 'Tipo de Documento de Prueba',
        kind: DocumentKind.BATERIA,
        descripcion: 'Descripción de prueba',
        isActive: true,
      });
      await documentTypeRepository.create(testDocumentType);
    });

    it('debe obtener un tipo de documento por ID cuando está autenticado', async () => {
      const response = await request(app)
        .get(`/api/catalogs/document-types/${testDocumentType.id}`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testDocumentType.id);
      expect(response.body.nombre).toBe('Tipo de Documento de Prueba');
      expect(response.body.kind).toBe(DocumentKind.BATERIA);
    });
  });

  describe('PUT /api/catalogs/document-types/:id', () => {
    let testDocumentType: DocumentType;

    beforeEach(async () => {
      const repo = container.resolve<IDocumentTypeRepository>('documentTypeRepository') as InMemoryDocumentTypeRepository;
      repo.clear();

      testDocumentType = DocumentType.create({
        nombre: 'Tipo Original',
        kind: DocumentKind.BATERIA,
        descripcion: 'Descripción original',
        isActive: true,
      });
      await documentTypeRepository.create(testDocumentType);
    });

    it('debe actualizar un tipo de documento cuando es admin', async () => {
      const response = await request(app)
        .put(`/api/catalogs/document-types/${testDocumentType.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Tipo Actualizado',
          kind: DocumentKind.BATERIA,
          descripcion: 'Nueva descripción',
        });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testDocumentType.id);
      expect(response.body.nombre).toBe('Tipo Actualizado');
    });
  });

  describe('DELETE /api/catalogs/document-types/:id', () => {
    let testDocumentType: DocumentType;

    beforeEach(async () => {
      const repo = container.resolve<IDocumentTypeRepository>('documentTypeRepository') as InMemoryDocumentTypeRepository;
      repo.clear();

      testDocumentType = DocumentType.create({
        nombre: 'Tipo a Eliminar',
        kind: DocumentKind.BATERIA,
        descripcion: 'Este tipo será eliminado',
        isActive: true,
      });
      await documentTypeRepository.create(testDocumentType);
    });

    it('debe eliminar un tipo de documento (baja lógica) cuando es admin', async () => {
      const response = await request(app)
        .delete(`/api/catalogs/document-types/${testDocumentType.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      const deletedDocumentType = await documentTypeRepository.findById(testDocumentType.id);
      expect(deletedDocumentType).not.toBeNull();
      expect(deletedDocumentType?.isActive).toBe(false);
    });
  });

  describe('POST /api/catalogs/document-types/:id/activate', () => {
    let testDocumentType: DocumentType;

    beforeEach(async () => {
      const repo = container.resolve<IDocumentTypeRepository>('documentTypeRepository') as InMemoryDocumentTypeRepository;
      repo.clear();

      testDocumentType = DocumentType.create({
        nombre: 'Tipo Inactivo',
        kind: DocumentKind.BATERIA,
        descripcion: 'Tipo que será activado',
        isActive: false,
      });
      await documentTypeRepository.create(testDocumentType);
    });

    it('debe activar un tipo de documento cuando es admin', async () => {
      const response = await request(app)
        .post(`/api/catalogs/document-types/${testDocumentType.id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testDocumentType.id);
      expect(response.body.isActive).toBe(true);
    });
  });

  describe('POST /api/catalogs/document-types/:id/deactivate', () => {
    let testDocumentType: DocumentType;

    beforeEach(async () => {
      const repo = container.resolve<IDocumentTypeRepository>('documentTypeRepository') as InMemoryDocumentTypeRepository;
      repo.clear();

      testDocumentType = DocumentType.create({
        nombre: 'Tipo Activo',
        kind: DocumentKind.BATERIA,
        descripcion: 'Tipo que será desactivado',
        isActive: true,
      });
      await documentTypeRepository.create(testDocumentType);
    });

    it('debe desactivar un tipo de documento cuando es admin', async () => {
      const response = await request(app)
        .post(`/api/catalogs/document-types/${testDocumentType.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testDocumentType.id);
      expect(response.body.isActive).toBe(false);
    });
  });
});
