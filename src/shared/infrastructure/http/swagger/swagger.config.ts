import swaggerJsdoc from 'swagger-jsdoc';
import { config } from '../../../config';

/**
 * Configuración de Swagger/OpenAPI para la documentación de la API
 * 
 * Esta configuración define:
 * - Información básica de la API (título, versión, descripción)
 * - Servidores disponibles
 * - Esquemas de seguridad (JWT Bearer)
 * - Rutas donde buscar comentarios JSDoc con definiciones de endpoints
 */
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Gestión de Expedientes CFE',
      version: '1.0.0',
      description: `
        API REST para la gestión de expedientes de colaboradores de CFE.

        ## Características principales:
        - **Autenticación**: JWT con refresh tokens
        - **Colaboradores**: CRUD completo de colaboradores
        - **Documentos**: Gestión de documentos con upload de archivos
        - **Minutas**: Gestión de minutas de reuniones
        - **Catálogos**: Áreas, adscripciones, puestos, tipos de documento
        - **Auditoría**: Logs de todas las operaciones

        ## Autenticación:
        Todos los endpoints (excepto login) requieren un token JWT en el header:
        \`\`\`
        Authorization: Bearer <token>
        \`\`\`

        Para obtener un token, usa el endpoint \`POST /api/auth/login\`.
      `,
      contact: {
        name: 'CFE - Gestión de Expedientes',
        email: 'soporte@cfe.mx',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: `${config.server.baseUrl}:${config.server.port}`,
        description: 'Servidor de desarrollo',
      },
      {
        url: 'http://localhost:4000',
        description: 'Localhost',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido del endpoint /api/auth/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensaje de error descriptivo',
            },
            field: {
              type: 'string',
              description: 'Campo específico que causó el error (opcional)',
            },
            code: {
              type: 'string',
              description: 'Código de error (opcional)',
            },
          },
          required: ['error'],
        },
        Pagination: {
          type: 'object',
          properties: {
            total: {
              type: 'number',
              description: 'Total de elementos',
            },
            limit: {
              type: 'number',
              description: 'Límite de elementos por página',
            },
            offset: {
              type: 'number',
              description: 'Offset para paginación',
            },
            totalPages: {
              type: 'number',
              description: 'Total de páginas',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    // Rutas donde buscar comentarios JSDoc con definiciones de endpoints
    './src/modules/**/infrastructure/adapters/input/http/routes.ts',
    './src/modules/**/infrastructure/adapters/input/http/*Controller.ts',
    './src/app.ts',
  ],
};

/**
 * Genera la especificación OpenAPI a partir de los comentarios JSDoc
 */
export const swaggerSpec = swaggerJsdoc(swaggerOptions);
