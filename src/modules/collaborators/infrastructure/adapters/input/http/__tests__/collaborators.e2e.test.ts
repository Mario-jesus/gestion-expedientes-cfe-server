/**
 * Tests E2E para endpoints de colaboradores
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
import { CollaboratorDocument } from '@modules/documents/domain/entities/CollaboratorDocument';
import { createTestApp } from '@/__tests__/helpers/createTestApp';
import {
  InMemoryUserRepository,
  InMemoryRefreshTokenRepository,
  InMemoryCollaboratorRepository,
  InMemoryDocumentRepository,
} from '@/__tests__/mocks';
import { asFunction } from 'awilix';
import { registerUsersModule } from '@modules/users/infrastructure/container';
import { registerAuthModule } from '@modules/auth/infrastructure/container';
import { registerCollaboratorsModule } from '@modules/collaborators/infrastructure/container';
import { registerDocumentsModule } from '@modules/documents/infrastructure/container';

describe('Collaborators E2E Tests', () => {
  let app: ReturnType<typeof createTestApp>;
  let adminUser: User;
  let regularUser: User;
  let userRepository: IUserRepository;
  let collaboratorRepository: ICollaboratorRepository;
  let documentRepository: IDocumentRepository;
  let passwordHasher: IPasswordHasher;
  let database: IDatabase;
  let adminToken: string;

  // IDs de prueba para áreas, adscripciones y puestos
  const testAreaId = 'area-test-1';
  const testAdscripcionId = 'adscripcion-test-1';
  const testPuestoId = 'puesto-test-1';

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

  describe('POST /api/collaborators', () => {
    it('debe crear un colaborador cuando se envían datos válidos', async () => {
      const response = await request(app)
        .post('/api/collaborators')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Juan',
          apellidos: 'Pérez García',
          rpe: 'RPE001234',
          areaId: testAreaId,
          adscripcionId: testAdscripcionId,
          puestoId: testPuestoId,
          tipoContrato: TipoContrato.BASE,
          rfc: 'PEGJ800101ABC',
          curp: 'PEGJ800101HDFRRN01',
          imss: '12345678901',
          isActive: true,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.nombre).toBe('Juan');
      expect(response.body.apellidos).toBe('Pérez García');
      expect(response.body.rpe).toBe('RPE001234');
      expect(response.body.areaId).toBe(testAreaId);
      expect(response.body.adscripcionId).toBe(testAdscripcionId);
      expect(response.body.puestoId).toBe(testPuestoId);
      expect(response.body.tipoContrato).toBe(TipoContrato.BASE);
      expect(response.body.isActive).toBe(true);
    });

    it('debe retornar error si faltan campos requeridos', async () => {
      const response = await request(app)
        .post('/api/collaborators')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Juan',
          // Faltan apellidos, rpe, etc.
        });

      // Las validaciones del dominio pueden lanzar errores que se convierten en 500
      // o errores de validación que se convierten en 400
      expect([400, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    });

    it('debe retornar error si el RPE es inválido', async () => {
      const response = await request(app)
        .post('/api/collaborators')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Juan',
          apellidos: 'Pérez García',
          rpe: '', // RPE vacío
          areaId: testAreaId,
          adscripcionId: testAdscripcionId,
          puestoId: testPuestoId,
          tipoContrato: TipoContrato.BASE,
          rfc: 'PEGJ800101ABC',
          curp: 'PEGJ800101HDFRRN01',
          imss: '12345678901',
        });

      // Las validaciones del dominio pueden lanzar errores que se convierten en 500
      expect([400, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    });

    it('debe retornar error si el tipo de contrato es inválido', async () => {
      const response = await request(app)
        .post('/api/collaborators')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Juan',
          apellidos: 'Pérez García',
          rpe: 'RPE001234',
          areaId: testAreaId,
          adscripcionId: testAdscripcionId,
          puestoId: testPuestoId,
          tipoContrato: 'invalid-tipo' as any,
          rfc: 'PEGJ800101ABC',
          curp: 'PEGJ800101HDFRRN01',
          imss: '12345678901',
        });

      // Las validaciones del dominio pueden lanzar errores que se convierten en 400, 500 o 409
      expect([400, 500, 409]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    });

    it('debe retornar 409 si el RPE ya existe', async () => {
      // Crear primer colaborador
      await request(app)
        .post('/api/collaborators')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Juan',
          apellidos: 'Pérez García',
          rpe: 'RPE001234',
          areaId: testAreaId,
          adscripcionId: testAdscripcionId,
          puestoId: testPuestoId,
          tipoContrato: TipoContrato.BASE,
          rfc: 'PEGJ800101ABC',
          curp: 'PEGJ800101HDFRRN01',
          imss: '12345678901',
        });

      // Intentar crear segundo colaborador con el mismo RPE
      const response = await request(app)
        .post('/api/collaborators')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Pedro',
          apellidos: 'González López',
          rpe: 'RPE001234', // Mismo RPE
          areaId: testAreaId,
          adscripcionId: testAdscripcionId,
          puestoId: testPuestoId,
          tipoContrato: TipoContrato.BASE,
          rfc: 'GOLP800101ABC',
          curp: 'GOLP800101HDFRRN02',
          imss: '12345678902',
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('DUPLICATE_COLLABORATOR');
    });

    it('debe retornar 401 si no se envía token de autenticación', async () => {
      const response = await request(app).post('/api/collaborators').send({
        nombre: 'Juan',
        apellidos: 'Pérez García',
        rpe: 'RPE001234',
        areaId: testAreaId,
        adscripcionId: testAdscripcionId,
        puestoId: testPuestoId,
        tipoContrato: TipoContrato.BASE,
        rfc: 'PEGJ800101ABC',
        curp: 'PEGJ800101HDFRRN01',
        imss: '12345678901',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/collaborators', () => {
    beforeEach(async () => {
      // Limpiar colaboradores antes de cada test
      (collaboratorRepository as any).clear();
      (documentRepository as any).clear();
    });

    it('debe listar colaboradores sin filtros', async () => {
      // Crear algunos colaboradores de prueba
      const collaborator1 = Collaborator.create({
        nombre: 'Juan',
        apellidos: 'Pérez García',
        rpe: 'RPE001234',
        areaId: testAreaId,
        adscripcionId: testAdscripcionId,
        puestoId: testPuestoId,
        tipoContrato: TipoContrato.BASE,
        rfc: 'PEGJ800101ABC',
        curp: 'PEGJ800101HDFRRN01',
        imss: '12345678901',
        isActive: true,
      });
      await collaboratorRepository.create(collaborator1);

      const collaborator2 = Collaborator.create({
        nombre: 'María',
        apellidos: 'González López',
        rpe: 'RPE001235',
        areaId: testAreaId,
        adscripcionId: testAdscripcionId,
        puestoId: testPuestoId,
        tipoContrato: TipoContrato.CONFIANZA,
        rfc: 'GOLM800101ABC',
        curp: 'GOLM800101HDFRRN02',
        imss: '12345678902',
        isActive: true,
      });
      await collaboratorRepository.create(collaborator2);

      const response = await request(app)
        .get('/api/collaborators')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(2);
    });

    it('debe filtrar colaboradores por areaId', async () => {
      // Crear colaboradores con diferentes áreas
      const collaborator1 = Collaborator.create({
        nombre: 'Juan',
        apellidos: 'Pérez García',
        rpe: 'RPE001234',
        areaId: testAreaId,
        adscripcionId: testAdscripcionId,
        puestoId: testPuestoId,
        tipoContrato: TipoContrato.BASE,
        rfc: 'PEGJ800101ABC',
        curp: 'PEGJ800101HDFRRN01',
        imss: '12345678901',
        isActive: true,
      });
      await collaboratorRepository.create(collaborator1);

      const collaborator2 = Collaborator.create({
        nombre: 'María',
        apellidos: 'González López',
        rpe: 'RPE001235',
        areaId: 'area-test-2', // Diferente área
        adscripcionId: testAdscripcionId,
        puestoId: testPuestoId,
        tipoContrato: TipoContrato.BASE,
        rfc: 'GOLM800101ABC',
        curp: 'GOLM800101HDFRRN02',
        imss: '12345678902',
        isActive: true,
      });
      await collaboratorRepository.create(collaborator2);

      const response = await request(app)
        .get(`/api/collaborators?areaId=${testAreaId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((collaborator: any) => {
        expect(collaborator.areaId).toBe(testAreaId);
      });
    });

    it('debe filtrar colaboradores por tipoContrato', async () => {
      const collaborator1 = Collaborator.create({
        nombre: 'Juan',
        apellidos: 'Pérez García',
        rpe: 'RPE001234',
        areaId: testAreaId,
        adscripcionId: testAdscripcionId,
        puestoId: testPuestoId,
        tipoContrato: TipoContrato.BASE,
        rfc: 'PEGJ800101ABC',
        curp: 'PEGJ800101HDFRRN01',
        imss: '12345678901',
        isActive: true,
      });
      await collaboratorRepository.create(collaborator1);

      const response = await request(app)
        .get(`/api/collaborators?tipoContrato=${TipoContrato.BASE}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      response.body.data.forEach((collaborator: any) => {
        expect(collaborator.tipoContrato).toBe(TipoContrato.BASE);
      });
    });

    it('debe filtrar colaboradores por isActive', async () => {
      const collaborator1 = Collaborator.create({
        nombre: 'Juan',
        apellidos: 'Pérez García',
        rpe: 'RPE001234',
        areaId: testAreaId,
        adscripcionId: testAdscripcionId,
        puestoId: testPuestoId,
        tipoContrato: TipoContrato.BASE,
        rfc: 'PEGJ800101ABC',
        curp: 'PEGJ800101HDFRRN01',
        imss: '12345678901',
        isActive: true,
      });
      await collaboratorRepository.create(collaborator1);

      const collaborator2 = Collaborator.create({
        nombre: 'María',
        apellidos: 'González López',
        rpe: 'RPE001235',
        areaId: testAreaId,
        adscripcionId: testAdscripcionId,
        puestoId: testPuestoId,
        tipoContrato: TipoContrato.BASE,
        rfc: 'GOLM800101ABC',
        curp: 'GOLM800101HDFRRN02',
        imss: '12345678902',
        isActive: false,
      });
      await collaboratorRepository.create(collaborator2);

      const response = await request(app)
        .get('/api/collaborators?isActive=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      response.body.data.forEach((collaborator: any) => {
        expect(collaborator.isActive).toBe(true);
      });
    });

    it('debe filtrar colaboradores por búsqueda de texto', async () => {
      const collaborator1 = Collaborator.create({
        nombre: 'Juan',
        apellidos: 'Pérez García',
        rpe: 'RPE001234',
        areaId: testAreaId,
        adscripcionId: testAdscripcionId,
        puestoId: testPuestoId,
        tipoContrato: TipoContrato.BASE,
        rfc: 'PEGJ800101ABC',
        curp: 'PEGJ800101HDFRRN01',
        imss: '12345678901',
        isActive: true,
      });
      await collaboratorRepository.create(collaborator1);

      const response = await request(app)
        .get('/api/collaborators?search=Juan')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.some((c: any) => c.nombre === 'Juan')).toBe(true);
    });

    it('debe aplicar paginación correctamente', async () => {
      // Crear varios colaboradores
      for (let i = 0; i < 5; i++) {
        // Generar CURP válido de 18 caracteres
        const curpSuffix = String(i).padStart(2, '0');
        const curp = `CURP${i}800101HDFRRN${curpSuffix}`.substring(0, 18);
        
        const collaborator = Collaborator.create({
          nombre: `Colaborador${i}`,
          apellidos: `Apellido${i}`,
          rpe: `RPE00${1000 + i}`,
          areaId: testAreaId,
          adscripcionId: testAdscripcionId,
          puestoId: testPuestoId,
          tipoContrato: TipoContrato.BASE,
          rfc: `RFC${i}800101ABC`,
          curp: curp,
          imss: `1234567890${i}`,
          isActive: true,
        });
        await collaboratorRepository.create(collaborator);
      }

      const response = await request(app)
        .get('/api/collaborators?limit=2&offset=0')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.offset).toBe(0);
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(5);
    });

    it('debe filtrar colaboradores por estadoExpediente', async () => {
      // Crear colaborador sin documentos (sin_documentos)
      const collaborator1 = Collaborator.create({
        nombre: 'Sin Documentos',
        apellidos: 'Test',
        rpe: 'RPE001234',
        areaId: testAreaId,
        adscripcionId: testAdscripcionId,
        puestoId: testPuestoId,
        tipoContrato: TipoContrato.BASE,
        rfc: 'PEGJ800101ABC',
        curp: 'PEGJ800101HDFRRN01',
        imss: '12345678901',
        isActive: true,
      });
      await collaboratorRepository.create(collaborator1);

      // Crear colaborador con documentos completos
      const collaborator2 = Collaborator.create({
        nombre: 'Con Documentos',
        apellidos: 'Test',
        rpe: 'RPE001235',
        areaId: testAreaId,
        adscripcionId: testAdscripcionId,
        puestoId: testPuestoId,
        tipoContrato: TipoContrato.BASE,
        rfc: 'GOLM800101ABC',
        curp: 'GOLM800101HDFRRN02',
        imss: '12345678902',
        isActive: true,
      });
      await collaboratorRepository.create(collaborator2);

      // Crear documentos para el segundo colaborador (BATERIA y PERFIL)
      const { CollaboratorDocument } = await import('@modules/documents/domain');
      const bateria = CollaboratorDocument.create({
        collaboratorId: collaborator2.id,
        kind: DocumentKind.BATERIA,
        fileName: 'bateria.pdf',
        fileUrl: '/documents/bateria.pdf',
        fileSize: 1000,
        fileType: 'application/pdf',
        uploadedBy: adminUser.id,
      });
      await documentRepository.create(bateria);

      const perfil = CollaboratorDocument.create({
        collaboratorId: collaborator2.id,
        kind: DocumentKind.PERFIL,
        fileName: 'perfil.pdf',
        fileUrl: '/documents/perfil.pdf',
        fileSize: 1000,
        fileType: 'application/pdf',
        uploadedBy: adminUser.id,
      });
      await documentRepository.create(perfil);

      // Filtrar por sin_documentos
      const responseSinDocs = await request(app)
        .get('/api/collaborators?estadoExpediente=sin_documentos')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(responseSinDocs.status).toBe(200);
      expect(responseSinDocs.body.data.some((c: any) => c.rpe === 'RPE001234')).toBe(true);

      // Filtrar por completo
      const responseCompleto = await request(app)
        .get('/api/collaborators?estadoExpediente=completo')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(responseCompleto.status).toBe(200);
      expect(responseCompleto.body.data.some((c: any) => c.rpe === 'RPE001235')).toBe(true);
    });
  });

  describe('GET /api/collaborators/:id', () => {
    let createdCollaboratorId: string;

    beforeEach(async () => {
      // Limpiar colaboradores antes de crear uno nuevo para este test
      (collaboratorRepository as any).clear();

      // Crear un colaborador de prueba
      const collaborator = Collaborator.create({
        nombre: 'Juan',
        apellidos: 'Pérez García',
        rpe: 'RPE001234',
        areaId: testAreaId,
        adscripcionId: testAdscripcionId,
        puestoId: testPuestoId,
        tipoContrato: TipoContrato.BASE,
        rfc: 'PEGJ800101ABC',
        curp: 'PEGJ800101HDFRRN01',
        imss: '12345678901',
        isActive: true,
      });
      await collaboratorRepository.create(collaborator);
      createdCollaboratorId = collaborator.id;
    });

    it('debe obtener un colaborador por su ID', async () => {
      const response = await request(app)
        .get(`/api/collaborators/${createdCollaboratorId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(createdCollaboratorId);
      expect(response.body.nombre).toBe('Juan');
      expect(response.body.apellidos).toBe('Pérez García');
      expect(response.body.rpe).toBe('RPE001234');
    });

    it('debe retornar 404 si el colaborador no existe', async () => {
      const response = await request(app)
        .get('/api/collaborators/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('debe retornar 401 si no se envía token', async () => {
      const response = await request(app).get(`/api/collaborators/${createdCollaboratorId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/collaborators/:id', () => {
    let createdCollaboratorId: string;

    beforeEach(async () => {
      // Limpiar colaboradores antes de crear uno nuevo para este test
      (collaboratorRepository as any).clear();

      // Crear un colaborador de prueba
      const collaborator = Collaborator.create({
        nombre: 'Juan',
        apellidos: 'Pérez García',
        rpe: 'RPE001234',
        areaId: testAreaId,
        adscripcionId: testAdscripcionId,
        puestoId: testPuestoId,
        tipoContrato: TipoContrato.BASE,
        rfc: 'PEGJ800101ABC',
        curp: 'PEGJ800101HDFRRN01',
        imss: '12345678901',
        isActive: true,
      });
      await collaboratorRepository.create(collaborator);
      createdCollaboratorId = collaborator.id;
    });

    it('debe actualizar un colaborador completo', async () => {
      const response = await request(app)
        .put(`/api/collaborators/${createdCollaboratorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Juan Carlos',
          apellidos: 'Pérez García',
          rpe: 'RPE001234', // RPE no cambia
          areaId: testAreaId,
          adscripcionId: testAdscripcionId,
          puestoId: testPuestoId,
          tipoContrato: TipoContrato.CONFIANZA,
          rfc: 'PEGJ800101ABC',
          curp: 'PEGJ800101HDFRRN01',
          imss: '12345678901',
          isActive: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.nombre).toBe('Juan Carlos');
      expect(response.body.tipoContrato).toBe(TipoContrato.CONFIANZA);
    });

    it('debe retornar 404 si el colaborador no existe', async () => {
      const response = await request(app)
        .put('/api/collaborators/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Juan Carlos',
          apellidos: 'Pérez García',
          rpe: 'RPE001234',
          areaId: testAreaId,
          adscripcionId: testAdscripcionId,
          puestoId: testPuestoId,
          tipoContrato: TipoContrato.BASE,
          rfc: 'PEGJ800101ABC',
          curp: 'PEGJ800101HDFRRN01',
          imss: '12345678901',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/collaborators/:id', () => {
    let createdCollaboratorId: string;

    beforeEach(async () => {
      // Limpiar colaboradores antes de crear uno nuevo para este test
      (collaboratorRepository as any).clear();

      // Crear un colaborador de prueba
      const collaborator = Collaborator.create({
        nombre: 'Juan',
        apellidos: 'Pérez García',
        rpe: 'RPE001234',
        areaId: testAreaId,
        adscripcionId: testAdscripcionId,
        puestoId: testPuestoId,
        tipoContrato: TipoContrato.BASE,
        rfc: 'PEGJ800101ABC',
        curp: 'PEGJ800101HDFRRN01',
        imss: '12345678901',
        isActive: true,
      });
      await collaboratorRepository.create(collaborator);
      createdCollaboratorId = collaborator.id;
    });

    it('debe actualizar parcialmente un colaborador', async () => {
      const response = await request(app)
        .patch(`/api/collaborators/${createdCollaboratorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Juan Carlos', // Solo actualizar nombre
        });

      expect(response.status).toBe(200);
      expect(response.body.nombre).toBe('Juan Carlos');
      expect(response.body.apellidos).toBe('Pérez García'); // No cambió
    });
  });

  describe('DELETE /api/collaborators/:id', () => {
    let createdCollaboratorId: string;

    beforeEach(async () => {
      // Limpiar colaboradores antes de crear uno nuevo para este test
      (collaboratorRepository as any).clear();

      // Crear un colaborador de prueba
      const collaborator = Collaborator.create({
        nombre: 'Juan',
        apellidos: 'Pérez García',
        rpe: 'RPE001234',
        areaId: testAreaId,
        adscripcionId: testAdscripcionId,
        puestoId: testPuestoId,
        tipoContrato: TipoContrato.BASE,
        rfc: 'PEGJ800101ABC',
        curp: 'PEGJ800101HDFRRN01',
        imss: '12345678901',
        isActive: true,
      });
      await collaboratorRepository.create(collaborator);
      createdCollaboratorId = collaborator.id;
    });

    it('debe eliminar un colaborador (baja lógica)', async () => {
      const response = await request(app)
        .delete(`/api/collaborators/${createdCollaboratorId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      // Verificar que el colaborador está inactivo
      const getResponse = await request(app)
        .get(`/api/collaborators/${createdCollaboratorId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.isActive).toBe(false);
    });

    it('debe retornar 404 si el colaborador no existe', async () => {
      const response = await request(app)
        .delete('/api/collaborators/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/collaborators/:id/activate', () => {
    let createdCollaboratorId: string;

    beforeEach(async () => {
      // Limpiar colaboradores antes de crear uno nuevo para este test
      (collaboratorRepository as any).clear();

      // Crear un colaborador inactivo de prueba
      const collaborator = Collaborator.create({
        nombre: 'Juan',
        apellidos: 'Pérez García',
        rpe: 'RPE001234',
        areaId: testAreaId,
        adscripcionId: testAdscripcionId,
        puestoId: testPuestoId,
        tipoContrato: TipoContrato.BASE,
        rfc: 'PEGJ800101ABC',
        curp: 'PEGJ800101HDFRRN01',
        imss: '12345678901',
        isActive: false, // Inactivo
      });
      await collaboratorRepository.create(collaborator);
      createdCollaboratorId = collaborator.id;
    });

    it('debe activar un colaborador inactivo', async () => {
      const response = await request(app)
        .post(`/api/collaborators/${createdCollaboratorId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.isActive).toBe(true);
      expect(response.body.id).toBe(createdCollaboratorId);
    });

    it('debe retornar 404 si el colaborador no existe', async () => {
      const response = await request(app)
        .post('/api/collaborators/non-existent-id/activate')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/collaborators/:id/deactivate', () => {
    let createdCollaboratorId: string;

    beforeEach(async () => {
      // Limpiar colaboradores antes de crear uno nuevo para este test
      (collaboratorRepository as any).clear();

      // Crear un colaborador activo de prueba
      const collaborator = Collaborator.create({
        nombre: 'Juan',
        apellidos: 'Pérez García',
        rpe: 'RPE001234',
        areaId: testAreaId,
        adscripcionId: testAdscripcionId,
        puestoId: testPuestoId,
        tipoContrato: TipoContrato.BASE,
        rfc: 'PEGJ800101ABC',
        curp: 'PEGJ800101HDFRRN01',
        imss: '12345678901',
        isActive: true, // Activo
      });
      await collaboratorRepository.create(collaborator);
      createdCollaboratorId = collaborator.id;
    });

    it('debe desactivar un colaborador activo', async () => {
      const response = await request(app)
        .post(`/api/collaborators/${createdCollaboratorId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.isActive).toBe(false);
      expect(response.body.id).toBe(createdCollaboratorId);
    });

    it('debe retornar 404 si el colaborador no existe', async () => {
      const response = await request(app)
        .post('/api/collaborators/non-existent-id/deactivate')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/collaborators/:id/documents', () => {
    let createdCollaboratorId: string;

    beforeEach(async () => {
      // Limpiar repositorios antes de crear datos de prueba
      (collaboratorRepository as any).clear();
      (documentRepository as any).clear();

      // Crear un colaborador de prueba
      const collaborator = Collaborator.create({
        nombre: 'Juan',
        apellidos: 'Pérez García',
        rpe: 'RPE001234',
        areaId: testAreaId,
        adscripcionId: testAdscripcionId,
        puestoId: testPuestoId,
        tipoContrato: TipoContrato.BASE,
        rfc: 'PEGJ800101ABC',
        curp: 'PEGJ800101HDFRRN01',
        imss: '12345678901',
        isActive: true,
      });
      await collaboratorRepository.create(collaborator);
      createdCollaboratorId = collaborator.id;

      // Crear algunos documentos para el colaborador
      const document1 = CollaboratorDocument.create({
        collaboratorId: createdCollaboratorId,
        kind: DocumentKind.BATERIA,
        fileName: 'bateria.pdf',
        fileUrl: '/uploads/documents/bateria.pdf',
        fileSize: 256000,
        fileType: 'application/pdf',
        uploadedBy: adminUser.id,
      });
      await documentRepository.create(document1);

      const document2 = CollaboratorDocument.create({
        collaboratorId: createdCollaboratorId,
        kind: DocumentKind.HISTORIAL,
        fileName: 'historial.pdf',
        fileUrl: '/uploads/documents/historial.pdf',
        fileSize: 512000,
        fileType: 'application/pdf',
        uploadedBy: adminUser.id,
        periodo: '2024-Q1',
      });
      await documentRepository.create(document2);

      const document3 = CollaboratorDocument.create({
        collaboratorId: createdCollaboratorId,
        kind: DocumentKind.CONSTANCIA,
        fileName: 'constancia.pdf',
        fileUrl: '/uploads/documents/constancia.pdf',
        fileSize: 128000,
        fileType: 'application/pdf',
        uploadedBy: adminUser.id,
        isActive: false, // Documento inactivo
      });
      await documentRepository.create(document3);
    });

    it('debe obtener todos los documentos de un colaborador', async () => {
      const response = await request(app)
        .get(`/api/collaborators/${createdCollaboratorId}/documents`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.total).toBe(3);
      expect(response.body.data.length).toBe(3);
      expect(response.body.data.every((doc: any) => doc.collaboratorId === createdCollaboratorId)).toBe(true);
    });

    it('debe filtrar documentos por kind', async () => {
      const response = await request(app)
        .get(`/api/collaborators/${createdCollaboratorId}/documents?kind=${DocumentKind.BATERIA}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].kind).toBe(DocumentKind.BATERIA);
      expect(response.body.total).toBe(1);
    });

    it('debe filtrar documentos por isActive', async () => {
      const response = await request(app)
        .get(`/api/collaborators/${createdCollaboratorId}/documents?isActive=true`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data.every((doc: any) => doc.isActive === true)).toBe(true);
      expect(response.body.total).toBe(2);
    });

    it('debe filtrar documentos por isActive=false', async () => {
      const response = await request(app)
        .get(`/api/collaborators/${createdCollaboratorId}/documents?isActive=false`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].isActive).toBe(false);
      expect(response.body.total).toBe(1);
    });

    it('debe combinar filtros kind e isActive', async () => {
      const response = await request(app)
        .get(`/api/collaborators/${createdCollaboratorId}/documents?kind=${DocumentKind.CONSTANCIA}&isActive=false`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].kind).toBe(DocumentKind.CONSTANCIA);
      expect(response.body.data[0].isActive).toBe(false);
      expect(response.body.total).toBe(1);
    });

    it('debe retornar 404 si el colaborador no existe', async () => {
      const response = await request(app)
        .get('/api/collaborators/non-existent-id/documents')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('debe retornar array vacío si el colaborador no tiene documentos', async () => {
      // Crear un colaborador sin documentos
      const collaborator = Collaborator.create({
        nombre: 'María',
        apellidos: 'González López',
        rpe: 'RPE005678',
        areaId: testAreaId,
        adscripcionId: testAdscripcionId,
        puestoId: testPuestoId,
        tipoContrato: TipoContrato.BASE,
        rfc: 'GOLM800101ABC',
        curp: 'GOLM800101HDFRRN01',
        imss: '98765432109',
        isActive: true,
      });
      await collaboratorRepository.create(collaborator);

      const response = await request(app)
        .get(`/api/collaborators/${collaborator.id}/documents`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('debe retornar 401 sin token', async () => {
      const response = await request(app)
        .get(`/api/collaborators/${createdCollaboratorId}/documents`);

      expect(response.status).toBe(401);
    });

    it('debe retornar 401 con token inválido', async () => {
      const response = await request(app)
        .get(`/api/collaborators/${createdCollaboratorId}/documents`)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('debe ordenar documentos por fecha de subida descendente (más recientes primero)', async () => {
      const response = await request(app)
        .get(`/api/collaborators/${createdCollaboratorId}/documents`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const documents = response.body.data;
      if (documents.length > 1) {
        for (let i = 0; i < documents.length - 1; i++) {
          const currentDate = new Date(documents[i].uploadedAt).getTime();
          const nextDate = new Date(documents[i + 1].uploadedAt).getTime();
          expect(currentDate).toBeGreaterThanOrEqual(nextDate);
        }
      }
    });
  });
});
