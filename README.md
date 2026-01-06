# Gestión de Expedientes CFE - Backend Server

Backend server para gestión de expedientes de colaboradores de CFE, desarrollado con Node.js, Express y TypeScript.

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior)
- **npm** (viene incluido con Node.js)
- **Git** (para clonar el repositorio)

Para verificar las versiones instaladas:

```bash
node --version
npm --version
git --version
```

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd gestion-expedientes-cfe-server
```

### 2. Instalar dependencias

```bash
npm install
```

Esto instalará todas las dependencias necesarias definidas en `package.json`.

## ⚙️ Configuración

### 1. Crear archivo de variables de entorno

Copia el archivo de ejemplo y crea tu propio `.env`:

```bash
cp .env.example .env
```

### 2. Configurar variables de entorno

Edita el archivo `.env` con tus configuraciones. A continuación se muestran las variables principales:

#### Variables del Servidor

```env
# Puerto del servidor (requerido)
PORT=4000

# Ambiente: development, production, test (requerido)
NODE_ENV=development

# URL base del servidor (opcional, por defecto: http://localhost)
SERVER_BASE_URL=http://localhost
# O usar BASE_URL como alternativa
# BASE_URL=http://localhost
```

#### Variables de Base de Datos (MongoDB)

```env
# Habilitar MongoDB (requerido si usas MongoDB)
USE_MONGODB=true

# Host de MongoDB (requerido si USE_MONGODB=true)
# Puede ser: mongodb://localhost:27017 o mongodb+srv://cluster.mongodb.net
MONGODB_HOST=mongodb://localhost:27017

# Nombre de la base de datos (opcional, por defecto: gestion-expedientes-cfe)
DATABASE_NAME=gestion-expedientes-cfe

# Credenciales de MongoDB (opcionales, solo si MongoDB requiere autenticación)
MONGODB_USER=admin
MONGODB_PASSWORD=12345678
MONGODB_AUTH_SOURCE=admin
```

**Nota:** Si `MONGODB_HOST` ya incluye credenciales (ej: `mongodb://user:pass@host`), no necesitas `MONGODB_USER` y `MONGODB_PASSWORD`.

#### Variables de CORS

```env
# Permitir todos los orígenes (solo para desarrollo, no recomendado en producción)
CORS_ALLOW_ALL=false

# Orígenes permitidos separados por coma (requerido si CORS_ALLOW_ALL=false)
# En desarrollo, por defecto permite: http://localhost:5174
CORS_ORIGIN=http://localhost:5174,http://localhost:3000

# Permitir credenciales (cookies, auth headers) (opcional, por defecto: true)
CORS_CREDENTIALS=true

# Métodos HTTP permitidos (opcional, por defecto: GET,POST,PUT,PATCH,DELETE,OPTIONS)
CORS_METHODS=GET,POST,PUT,PATCH,DELETE,OPTIONS

# Headers permitidos (opcional, por defecto: Content-Type,Authorization,X-Requested-With)
CORS_ALLOWED_HEADERS=Content-Type,Authorization,X-Requested-With

# Headers expuestos al cliente (opcional)
CORS_EXPOSED_HEADERS=

# Tiempo de caché para preflight requests en segundos (opcional, por defecto: 86400 = 24h)
CORS_MAX_AGE=86400
```

#### Variables de Logger

```env
# Nivel de log: trace, debug, info, warn, error, fatal (opcional, por defecto: info)
LOG_LEVEL=info

# Log a consola (opcional, por defecto: true)
LOG_TO_CONSOLE=true

# Log a archivo (opcional, por defecto: false)
LOG_TO_FILE=false

# Ruta del archivo de log (opcional, por defecto: ./logs/app.log)
LOG_FILE_PATH=./logs/app.log

# Sincronizar escritura a archivo (opcional, por defecto: false)
LOG_FILE_SYNC=false
```

#### Variables de Autenticación JWT (Requeridas)

```env
# Secret para firmar access tokens (requerido, mínimo 32 caracteres)
JWT_SECRET=your-super-secret-key-change-in-production-minimum-32-chars

# Tiempo de expiración del access token (opcional, por defecto: 1h)
# Formatos válidos: "1h", "30m", "3600" (segundos), "7d"
JWT_EXPIRES_IN=1h

# Secret para firmar refresh tokens (opcional, por defecto: usa JWT_SECRET)
# Si no se especifica, se usa el mismo secret que JWT_SECRET
# Recomendado: usar un secret diferente para mayor seguridad
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production-minimum-32-chars

# Tiempo de expiración del refresh token (opcional, por defecto: 7d)
JWT_REFRESH_EXPIRES_IN=7d
```

**💡 Generador de claves secretas:** Puedes generar claves secretas seguras para JWT usando [https://jwtsecrets.com/](https://jwtsecrets.com/)

#### Variables de Rate Limiting (Opcionales)

```env
# Ventana de tiempo para rate limiting de login en milisegundos (opcional, por defecto: 900000 = 15 min)
RATE_LIMIT_LOGIN_WINDOW_MS=900000

# Máximo número de intentos de login por ventana (opcional, por defecto: 5)
RATE_LIMIT_LOGIN_MAX_ATTEMPTS=5

# Ventana de tiempo para rate limiting de refresh token en milisegundos (opcional, por defecto: 900000 = 15 min)
RATE_LIMIT_REFRESH_WINDOW_MS=900000

# Máximo número de intentos de refresh por ventana (opcional, por defecto: 10)
RATE_LIMIT_REFRESH_MAX_ATTEMPTS=10
```

#### Variables de Loki (Opcional - para agregación de logs)

```env
# URL del servidor Loki (opcional)
LOKI_URL=http://localhost:3100

# Labels para Loki en formato JSON (opcional)
LOKI_LABELS={"app":"gestion-expedientes-cfe","env":"development"}

# Habilitar batching de logs (opcional, por defecto: true)
LOKI_BATCHING=true

# Intervalo de batching en segundos (opcional, por defecto: 5)
LOKI_INTERVAL=5

# Autenticación básica para Loki (opcional)
LOKI_BASIC_AUTH_USERNAME=admin
LOKI_BASIC_AUTH_PASSWORD=secret
```

#### Ejemplo de `.env` mínimo para desarrollo

```env
# Servidor
PORT=4000
NODE_ENV=development

# Base de datos (sin MongoDB)
USE_MONGODB=false

# CORS (por defecto permite localhost:5174 en desarrollo)
# No necesitas configurar CORS_ORIGIN en desarrollo
```

#### Ejemplo de `.env` completo con MongoDB

```env
# Servidor
PORT=4000
NODE_ENV=development
SERVER_BASE_URL=http://localhost

# Base de datos
USE_MONGODB=true
MONGODB_HOST=mongodb://localhost:27017
DATABASE_NAME=gestion-expedientes-cfe
MONGODB_USER=admin
MONGODB_PASSWORD=12345678
MONGODB_AUTH_SOURCE=admin

# Autenticación JWT (REQUERIDAS)
JWT_SECRET=your-super-secret-key-change-in-production-minimum-32-characters-long
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production-minimum-32-characters-long
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting (Opcionales)
RATE_LIMIT_LOGIN_WINDOW_MS=900000
RATE_LIMIT_LOGIN_MAX_ATTEMPTS=5
RATE_LIMIT_REFRESH_WINDOW_MS=900000
RATE_LIMIT_REFRESH_MAX_ATTEMPTS=10

# CORS
CORS_ALLOW_ALL=false
CORS_ORIGIN=http://localhost:5174
CORS_CREDENTIALS=true

# Logger
LOG_LEVEL=info
LOG_TO_CONSOLE=true
LOG_TO_FILE=false
```

**Nota:** El archivo `.env` está en `.gitignore` y no se subirá al repositorio. Solo el archivo `.env.example` se mantiene como plantilla.

## 🏃 Ejecución

### Configuración Inicial (Primera vez)

Antes de ejecutar el servidor por primera vez, sigue estos pasos:

1. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   # Edita .env con tus configuraciones
   ```

2. **Configurar JWT (Requerido para autenticación):**
   Asegúrate de tener estas variables en tu `.env`:
   ```env
   JWT_SECRET=tu-secret-key-super-seguro-minimo-32-caracteres
   JWT_EXPIRES_IN=1h
   JWT_REFRESH_SECRET=tu-refresh-secret-key-super-seguro-minimo-32-caracteres
   JWT_REFRESH_EXPIRES_IN=7d
   ```
   
   **💡 Tip:** Puedes generar claves secretas seguras usando [https://jwtsecrets.com/](https://jwtsecrets.com/)

3. **Si usas MongoDB, ejecutar migraciones:**
   ```bash
   # Primera vez: ejecutar todas las migraciones automáticamente (sin confirmación)
   npm run migrate:all

   # O si prefieres confirmar cada migración manualmente:
   npm run migrate
   ```

4. **Crear datos iniciales (usuario y catálogos):**
   ```bash
   npm run seed
   ```

   Este comando ejecuta ambos seeds:
   - Crea el usuario administrador inicial (si no existe)
   - Crea los catálogos (áreas y puestos) si no existen

   También puedes ejecutarlos por separado:
   ```bash
   npm run seed:user      # Solo usuario
   npm run seed:catalogs  # Solo catálogos
   ```

### Modo Desarrollo

Ejecuta el servidor en modo desarrollo con hot-reload (recarga automática al guardar cambios):

```bash
npm run dev
```

O usando el alias:

```bash
npm run start:dev
```

El servidor estará disponible en: `http://localhost:4000` (o el puerto configurado en `.env`)

### Modo Producción

1. **Compilar TypeScript a JavaScript:**

```bash
npm run build
```

Esto generará los archivos compilados en la carpeta `dist/`.

2. **Ejecutar el servidor:**

```bash
npm start
```

## 📝 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Ejecuta el servidor en modo desarrollo con hot-reload |
| `npm run build` | Compila TypeScript a JavaScript en la carpeta `dist/` |
| `npm start` | Ejecuta el servidor en modo producción (requiere build previo) |
| `npm run start:dev` | Alias para `npm run dev` |
| `npm run migrate` | Ejecuta todas las migraciones pendientes (alias de `migrate:up`) |
| `npm run migrate:up` | Ejecuta todas las migraciones pendientes (con confirmación manual) |
| `npm run migrate:all` | Ejecuta todas las migraciones pendientes automáticamente (sin confirmación) - Recomendado para primera vez |
| `npm run migrate:down` | Revierte la última migración ejecutada |
| `npm run migrate:create` | Crea un nuevo archivo de migración |
| `npm run migrate:list` | Lista todas las migraciones y su estado |
| `npm run migrate:prune` | Elimina migraciones antiguas del historial |
| `npm run seed` | Crea usuario administrador inicial y catálogos (áreas y puestos) |
| `npm run seed:user` | Crea solo el usuario administrador inicial si no existe ningún usuario |
| `npm run seed:catalogs` | Crea solo los catálogos (áreas y puestos) si no existen |
| `npm test` | Ejecuta todos los tests (unitarios, integración y E2E) |
| `npm run test:watch` | Ejecuta tests en modo watch (se re-ejecutan al cambiar archivos) |
| `npm run test:coverage` | Ejecuta tests y genera reporte de cobertura |
| `npm run test:e2e` | Ejecuta solo los tests E2E |

## 🧪 Verificar que funciona

Una vez que el servidor esté corriendo, puedes verificar que funciona correctamente:

### Health Check

```bash
curl http://localhost:4000/health
```

O abre en tu navegador: `http://localhost:4000/health`

Deberías ver una respuesta como:

```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2024-06-15T10:00:00.000Z"
}
```

### Ruta raíz

```bash
curl http://localhost:4000/
```

O abre en tu navegador: `http://localhost:4000/`

## 🗄️ Migraciones de Base de Datos

El proyecto usa `ts-migrate-mongoose` para gestionar migraciones de esquemas e índices de MongoDB.

### Crear una nueva migración

```bash
npm run migrate:create nombre-de-la-migracion
```

Esto creará un archivo en `src/migrations/` con un timestamp y el nombre proporcionado.

### Ejecutar migraciones

```bash
# Primera vez: ejecutar todas las migraciones automáticamente (sin confirmación)
npm run migrate:all

# O ejecutar con confirmación manual (útil para revisar cada migración)
npm run migrate
# O explícitamente:
npm run migrate:up
```

**Recomendación:** Usa `migrate:all` cuando sea la primera vez o cuando quieras aplicar todas las migraciones pendientes sin confirmación. Usa `migrate:up` cuando quieras revisar cada migración antes de aplicarla.

Las migraciones se ejecutan en orden cronológico y solo se aplican una vez (se registran en la colección `migrations` de MongoDB).

### Revertir migraciones

```bash
# Revertir la última migración ejecutada
npm run migrate:down
```

### Listar migraciones

```bash
# Ver todas las migraciones y su estado
npm run migrate:list
```

### Limpiar historial de migraciones

```bash
# Eliminar migraciones antiguas del historial (útil para limpiar)
npm run migrate:prune
```

### Estructura de una migración

Las migraciones se crean en `src/migrations/` y tienen la siguiente estructura:

```typescript
import { Migration } from 'ts-migrate-mongoose';

export const up: Migration = async ({ db }) => {
  // Código para aplicar la migración
  // Ejemplo: crear índices, colecciones, etc.
};

export const down: Migration = async ({ db }) => {
  // Código para revertir la migración
  // Ejemplo: eliminar índices, colecciones, etc.
};
```

**Nota:** Las migraciones se ejecutan contra la base de datos configurada en `.env` (`MONGODB_HOST` y `DATABASE_NAME`).

## 🌱 Scripts de Seed (Datos Iniciales)

El proyecto incluye scripts para poblar la base de datos con datos iniciales necesarios para el funcionamiento del sistema.

### Seed Completo

Para crear todos los datos iniciales (usuario y catálogos) de una vez:

```bash
npm run seed
```

Este comando ejecuta en secuencia:
1. `seed:user` - Crea el usuario administrador inicial
2. `seed:catalogs` - Crea las áreas y puestos del catálogo

---

## 👤 Crear Usuario Administrador Inicial

Para crear solo el usuario administrador inicial:

```bash
npm run seed:user
```

Este script:
- Verifica si ya existe algún usuario en la base de datos
- Si no existe ningún usuario, crea un usuario administrador con los datos por defecto
- Si ya existen usuarios, no hace nada (idempotente)

### Configuración del usuario inicial

Puedes personalizar los datos del usuario inicial usando variables de entorno:

```bash
# Usar valores por defecto
npm run seed:user

# O personalizar los valores
SEED_USERNAME=admin \
SEED_PASSWORD=miPasswordSegura123 \
SEED_EMAIL=admin@cfe.com \
SEED_NAME="Administrador Principal" \
npm run seed:user
```

**Valores por defecto:**
- `SEED_USERNAME`: `admin`
- `SEED_PASSWORD`: `password123`
- `SEED_EMAIL`: `admin@cfe.com`
- `SEED_NAME`: `Administrador Principal`
- `SEED_ROLE`: `admin` (siempre)

**⚠️ IMPORTANTE:** 
- Cambia la contraseña después del primer login
- Este script solo crea un usuario si NO existe ningún usuario en la base de datos
- Asegúrate de tener MongoDB corriendo y configurado correctamente en `.env`

---

## 📋 Crear Catálogos (Áreas y Puestos)

Para crear solo los catálogos (áreas y puestos):

```bash
npm run seed:catalogs
```

Este script:
- Crea 9 áreas organizacionales (Distribución, Planeación, Medición, etc.)
- Crea 12 puestos técnicos y operativos (Liniero Comercial, Técnico de Distribución, etc.)
- Verifica si cada registro ya existe antes de crearlo (idempotente)
- Todos los registros se crean como activos (`isActive: true`)

### Configuración del seed de catálogos

Puedes saltar la creación de áreas o puestos usando variables de entorno:

```bash
# Saltar creación de áreas
SEED_CATALOGS_SKIP_AREAS=true npm run seed:catalogs

# Saltar creación de puestos
SEED_CATALOGS_SKIP_PUESTOS=true npm run seed:catalogs
```

**Variables de entorno opcionales:**
- `SEED_CATALOGS_SKIP_AREAS`: Si es `true`, no crea áreas (default: `false`)
- `SEED_CATALOGS_SKIP_PUESTOS`: Si es `true`, no crea puestos (default: `false`)

**Áreas creadas:**
- Distribución
- Planeación
- Medición
- Gestión comercial
- Capacitación
- Administración personal
- Administración general
- Servicios generales
- TI

**Puestos creados:**
- Liniero Comercial
- Liniero Encargado LV RGD
- Liniero LV RGD
- Ayudante Liniero
- Verificador Calibrador I
- Sobrestante RGD
- Técnico de Distribución
- Técnico de Control
- Técnico de Comunicaciones
- Técnico de Protecciones
- Técnico de Subestaciones
- Técnico de Zona

## 🧪 Testing

El proyecto incluye tests E2E (End-to-End) usando Jest y Supertest.

### Ejecutar todos los tests

```bash
npm test
```

### Ejecutar tests en modo watch

```bash
npm run test:watch
```

Los tests se re-ejecutan automáticamente cuando cambias archivos.

### Generar reporte de cobertura

```bash
npm run test:coverage
```

Esto genera un reporte de cobertura en la carpeta `coverage/` con información detallada de qué código está cubierto por tests.

### Ejecutar solo tests E2E

```bash
npm run test:e2e
```

### Ubicación de los tests

Los tests E2E se encuentran en:
- `src/modules/auth/infrastructure/adapters/input/http/__tests__/auth.e2e.test.ts`
- `src/modules/users/infrastructure/adapters/input/http/__tests__/users.e2e.test.ts`
- `src/modules/minutes/infrastructure/adapters/input/http/__tests__/minutes.e2e.test.ts`

### Configuración de tests

Los tests:
- Usan una base de datos en memoria (`InMemoryDatabase`) por defecto
- No requieren MongoDB corriendo
- Usan mocks de repositorios (`InMemoryUserRepository`, `InMemoryRefreshTokenRepository`)
- Se configuran automáticamente mediante `src/__tests__/setup.ts`
- Limpian recursos (EventBus, Logger streams) después de ejecutarse

### Estructura de un test E2E

```typescript
describe('Module E2E Tests', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeAll(async () => {
    // Configuración inicial: conectar DB, crear usuarios de prueba, etc.
  });

  afterAll(async () => {
    // Limpieza: desconectar DB, limpiar recursos
  });

  describe('POST /api/endpoint', () => {
    it('debe hacer algo', async () => {
      const response = await request(app)
        .post('/api/endpoint')
        .send({ data: 'test' });
      
      expect(response.status).toBe(200);
    });
  });
});
```

## 📁 Estructura del Proyecto

El proyecto sigue una arquitectura combinada que integra tres patrones arquitectónicos:

- **Domain-Driven Design (DDD)**: Organización del código alrededor del dominio del negocio, con Bounded Contexts, entidades y eventos de dominio
- **Arquitectura Hexagonal (Ports & Adapters)**: Separación entre dominio (core) e infraestructura mediante ports (interfaces) y adapters (implementaciones)
- **Event-Driven Architecture**: Comunicación entre módulos y actualización de estado mediante eventos de dominio y un Event Bus

Esta combinación proporciona separación clara de responsabilidades, testabilidad y flexibilidad para evolucionar el sistema.

```
gestion-expedientes-cfe-server/
│
├── src/                                    # Código fuente
│   ├── app.ts                              # Configuración de Express (middlewares, rutas)
│   ├── server.ts                           # Entry point (arranca el servidor)
│   │
│   ├── shared/                             # Módulos compartidos
│   │   ├── config/                         # Configuración centralizada
│   │   │   ├── env.ts                      # Carga y validación de variables de entorno
│   │   │   ├── types.ts                    # Tipos de configuración
│   │   │   └── index.ts                    # Exportación de config
│   │   │
│   │   ├── domain/                         # Interfaces y abstracciones del dominio
│   │   │   ├── entities/                   # Entidades base del dominio
│   │   │   │   ├── Entity.ts               # Clase base para entidades
│   │   │   │   └── DomainEvent.ts          # Clase base para eventos de dominio
│   │   │   ├── ports/                      # Interfaces/contratos (Ports)
│   │   │   │   └── output/                 # Output ports (Driven ports)
│   │   │   │       ├── IDatabase.ts        # Interfaz de base de datos
│   │   │   │       ├── IEventBus.ts        # Interfaz de bus de eventos
│   │   │   │       └── ILogger.ts          # Interfaz de logger
│   │   │   └── index.ts                    # Exportaciones
│   │   │
│   │   ├── infrastructure/                 # Implementaciones de infraestructura
│   │   │   ├── adapters/                   # Adaptadores (implementaciones de ports)
│   │   │   │   └── output/                 # Output adapters (Driven adapters)
│   │   │   │       ├── database/           # Adaptadores de base de datos
│   │   │   │       │   ├── InMemoryDatabase.ts  # Base de datos en memoria
│   │   │   │       │   └── mongo/          # Implementación MongoDB
│   │   │   │       │       ├── mongoose.ts # Conexión y gestión de Mongoose
│   │   │   │       │       ├── MongoDBDatabase.ts  # Implementación de IDatabase
│   │   │   │       │       └── models/     # Registro centralizado de modelos
│   │   │   │       │           └── index.ts
│   │   │   │       ├── logger/             # Adaptadores de logger
│   │   │   │       │   ├── PinoLogger.ts   # Logger con Pino
│   │   │   │       │   └── loggerFactory.ts
│   │   │   │       └── bus/                # Adaptadores de event bus
│   │   │   │           └── InMemoryEventBus.ts
│   │   │   ├── container/                  # Contenedor de inyección de dependencias (Awilix)
│   │   │   │   └── container.ts            # Registro de dependencias
│   │   │   ├── http/                       # Middlewares HTTP
│   │   │   │   ├── cors.ts                 # Configuración de CORS
│   │   │   │   └── errorHandler.ts         # Manejo de errores
│   │   │   └── index.ts                    # Exportaciones de infraestructura
│   │   │
│   │   └── utils/                          # Utilidades compartidas
│   │
│   ├── modules/                             # Módulos de dominio (Bounded Contexts)
│   │   └── {modulo}/                       # Ejemplo: collaborators, users, areas, etc.
│   │       ├── domain/                      # Lógica de dominio
│   │       │   ├── entities/                # Entidades del dominio
│   │       │   │   ├── Collaborator.ts      # Entidades específicas del módulo
│   │       │   │   └── index.ts
│   │       │   ├── ports/                   # Interfaces/contratos del módulo
│   │       │   │   └── output/              # Output ports (lo que el módulo necesita)
│   │       │   │       ├── ICollaboratorRepository.ts  # Interfaces de repositorios
│   │       │   │       └── index.ts
│   │       │   ├── events/                  # Eventos de dominio (opcional)
│   │       │   │   ├── CollaboratorCreated.ts
│   │       │   │   └── index.ts
│   │       │   └── index.ts                 # Barrel export
│   │       │
│   │       ├── application/                 # Casos de uso (Application Layer)
│   │       │   ├── use-cases/               # Casos de uso
│   │       │   │   ├── CreateCollaboratorUseCase.ts
│   │       │   │   ├── UpdateCollaboratorUseCase.ts
│   │       │   │   └── index.ts
│   │       │   ├── event-handlers/          # Event Handlers (reaccionan a eventos de dominio)
│   │       │   │   ├── CollaboratorCreatedHandler.ts  # Maneja evento CollaboratorCreated
│   │       │   │   ├── CollaboratorUpdatedHandler.ts
│   │       │   │   └── index.ts
│   │       │   ├── dto/                     # Data Transfer Objects
│   │       │   │   ├── CreateCollaboratorDTO.ts
│   │       │   │   └── index.ts
│   │       │   └── index.ts                 # Barrel export
│   │       │
│   │       └── infrastructure/              # Implementaciones de infraestructura
│   │           ├── adapters/
│   │           │   ├── output/              # Output adapters (implementaciones)
│   │           │   │   ├── database/        # Base de datos MongoDB
│   │           │   │   │   └── mongo/
│   │           │   │   │       ├── schemas/          # Esquemas/modelos de Mongoose
│   │           │   │   │       │   ├── {Entity}Schema.ts  # Schema y Model de Mongoose
│   │           │   │   │       │   └── index.ts
│   │           │   │   │       ├── persistence/      # Repositorios (implementaciones)
│   │           │   │   │       │   ├── CollaboratorRepository.ts  # Implementa ICollaboratorRepository
│   │           │   │   │       │   └── index.ts
│   │           │   │   │       └── index.ts          # Barrel export del módulo
│   │           │   │   └── index.ts
│   │           │   └── input/               # Input adapters (controllers)
│   │           │       ├── http/
│   │           │       │   ├── CollaboratorController.ts
│   │           │       │   ├── routes.ts    # Rutas del módulo
│   │           │       │   └── index.ts
│   │           │       └── index.ts
│   │           └── index.ts                 # Barrel export
│   │
│   └── migrations/                          # Migraciones de base de datos
│       └── {timestamp}_{nombre}.ts          # Archivos de migración
│
├── config/                                  # Configuración adicional
│
├── dist/                                    # Código compilado (generado)
├── logs/                                    # Archivos de log (generado)
│
├── migrate.ts                               # Configuración de ts-migrate-mongoose
├── .env.example                             # Plantilla de variables de entorno
├── .gitignore                               # Archivos ignorados por Git
├── package.json                             # Dependencias y scripts
├── tsconfig.json                            # Configuración de TypeScript
└── README.md                                # Este archivo
```

### Descripción de Carpetas Principales

- **`src/shared/domain/`**: Interfaces y abstracciones que definen el contrato del dominio (sin implementaciones)
  - `entities/`: Entidades base del dominio (Entity, DomainEvent)
  - `ports/output/`: Interfaces de servicios externos (IDatabase, ILogger, IEventBus)
- **`src/shared/infrastructure/`**: Implementaciones concretas de infraestructura compartida
  - `adapters/output/`: Adaptadores que implementan los ports compartidos (database, logger, eventBus)
  - `container/`: Contenedor de inyección de dependencias (Awilix)
  - `http/`: Middlewares HTTP compartidos (CORS, error handling)
- **`src/modules/{modulo}/`**: Módulos de negocio organizados por dominio (cada módulo es un Bounded Context)
  - `domain/`: Entidades, ports, eventos e interfaces específicas del módulo
  - `application/`: Casos de uso, event handlers y DTOs (orquestación de la lógica)
  - `infrastructure/adapters/`: Implementaciones (repositorios, controllers)
- **`src/migrations/`**: Scripts de migración de base de datos usando `ts-migrate-mongoose`
- **`config/`**: Archivos de configuración adicionales

## 🏗️ Principios Arquitectónicos

### Domain-Driven Design (DDD)
- **Bounded Contexts**: Cada módulo (`collaborators`, `users`, etc.) es un contexto acotado
- **Entidades de Dominio**: Modelos ricos con lógica de negocio
- **Eventos de Dominio**: Cambios de estado se comunican mediante eventos
- **Agregados**: Entidades con consistencia transaccional

### Arquitectura Hexagonal (Ports & Adapters)
- **Ports (Interfaces)**: Definidos en `domain/ports/` - contratos que el dominio necesita
- **Adapters (Implementaciones)**: En `infrastructure/adapters/` - implementaciones concretas
- **Inversión de Dependencias**: El dominio no depende de infraestructura, la infraestructura depende del dominio
- **Testabilidad**: Fácil mockear ports para testing

### Event-Driven Architecture
- **Event Bus**: Sistema centralizado para publicar y suscribirse a eventos (`IEventBus`)
- **Eventos de Dominio**: Representan hechos relevantes del negocio (definidos en `domain/events/`)
- **Desacoplamiento**: Módulos se comunican mediante eventos sin conocer implementaciones
- **Event Handlers**: Suscriptores que reaccionan a eventos, ubicados en `application/event-handlers/`
  - Orquestan casos de uso, llaman a repositorios, servicios externos, etc.
  - Algunos handlers muy específicos con lógica pura de dominio pueden ir en `domain/`

## 🔧 Tecnologías Utilizadas

- **Node.js** - Runtime de JavaScript
- **Express** - Framework web para Node.js
- **TypeScript** - Superset de JavaScript con tipado estático
- **Awilix** - Contenedor de inyección de dependencias
- **MongoDB/Mongoose** - Base de datos y ODM
- **Pino** - Logger estructurado
- **dotenv** - Manejo de variables de entorno
- **cors** - Middleware para habilitar CORS
- **jsonwebtoken** - Generación y verificación de tokens JWT
- **bcrypt** - Hashing de contraseñas
- **express-rate-limit** - Rate limiting para protección contra ataques
- **Jest** - Framework de testing
- **Supertest** - Testing de APIs HTTP
- **ts-migrate-mongoose** - Gestión de migraciones de MongoDB

## 🐛 Solución de Problemas

### El servidor no inicia

1. Verifica que el puerto no esté en uso:
```bash
# Linux/Mac
lsof -i :4000

# Windows
netstat -ano | findstr :4000
```

2. Verifica que las variables de entorno estén correctamente configuradas en `.env`

3. Asegúrate de que todas las dependencias estén instaladas:
```bash
npm install
```

### Errores de TypeScript

Si hay errores de compilación, verifica la configuración en `tsconfig.json` y asegúrate de tener TypeScript instalado:

```bash
npm install -g typescript
```

### Errores de JWT_SECRET

Si el servidor no inicia y muestra un error sobre `JWT_SECRET`:

1. Verifica que tengas la variable `JWT_SECRET` en tu `.env`
2. Asegúrate de que tenga al menos 32 caracteres
3. Ejemplo válido:
   ```env
   JWT_SECRET=mi-super-secret-key-para-jwt-minimo-32-caracteres
   ```

**💡 Generar claves secretas:** Puedes usar [https://jwtsecrets.com/](https://jwtsecrets.com/) para generar claves secretas seguras y aleatorias para JWT.

### Errores de conexión a MongoDB

Si tienes problemas conectando a MongoDB:

1. Verifica que MongoDB esté corriendo:
   ```bash
   # Linux/Mac
   sudo systemctl status mongod

   # O verifica el proceso
   ps aux | grep mongod
   ```

2. Verifica las credenciales en `.env`:
   ```env
   USE_MONGODB=true
   MONGODB_HOST=mongodb://localhost:27017
   DATABASE_NAME=gestion-expedientes-cfe
   ```

3. Prueba conectarte manualmente:
   ```bash
   mongosh mongodb://localhost:27017/gestion-expedientes-cfe
   ```

### Errores en migraciones

Si las migraciones fallan:

1. Verifica que MongoDB esté corriendo y accesible
2. Verifica que la base de datos esté configurada correctamente en `.env`
3. Lista las migraciones para ver su estado:
   ```bash
   npm run migrate:list
   ```

### Errores en tests

Si los tests fallan:

1. Asegúrate de que no tengas MongoDB corriendo (los tests usan base de datos en memoria)
2. Verifica que todas las dependencias estén instaladas:
   ```bash
   npm install
   ```

3. Si hay problemas con path aliases, verifica `tsconfig.json` y `jest.config.js`

## 📚 Guías Adicionales

### Flujo de trabajo típico

1. **Configuración inicial:**
   ```bash
   # 1. Instalar dependencias
   npm install

   # 2. Configurar .env
   cp .env.example .env
   # Editar .env con tus configuraciones

   # 3. Si usas MongoDB, ejecutar migraciones
   npm run migrate:all

   # 4. Crear datos iniciales (usuario y catálogos)
   npm run seed
   ```

2. **Desarrollo:**
   ```bash
   # Iniciar servidor en modo desarrollo
   npm run dev

   # En otra terminal, ejecutar tests
   npm test
   ```

3. **Antes de commit:**
   ```bash
   # Ejecutar todos los tests
   npm test

   # Verificar cobertura
   npm run test:coverage
   ```

### Endpoints de la API

Una vez que el servidor esté corriendo, los endpoints disponibles son:

#### Autenticación (`/api/auth`)
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/refresh` - Refrescar token

#### Usuarios (`/api/users`)
- `POST /api/users` - Crear usuario (solo admin)
- `GET /api/users` - Listar usuarios (solo admin)
- `GET /api/users/:id` - Obtener usuario (mismo usuario o admin)
- `PUT /api/users/:id` - Actualizar usuario completo (solo admin)
- `PATCH /api/users/:id` - Actualizar usuario parcial (solo admin)
- `DELETE /api/users/:id` - Eliminar usuario (solo admin)
- `POST /api/users/:id/activate` - Activar usuario (solo admin)
- `POST /api/users/:id/deactivate` - Desactivar usuario (solo admin)
- `POST /api/users/:id/change-password` - Cambiar contraseña (mismo usuario o admin)
- `PATCH /api/users/me` - Actualizar perfil propio (solo name y email)
- `GET /api/users/me/activity` - Obtener historial de actividad propio (con paginación)

#### Colaboradores (`/api/collaborators`)
- `POST /api/collaborators` - Crear colaborador
- `GET /api/collaborators` - Listar colaboradores con filtros (área, adscripción, puesto, tipo de contrato, estado de expediente, búsqueda, paginación)
- `GET /api/collaborators/:id` - Obtener colaborador por ID
- `GET /api/collaborators/:id/documents` - Obtener documentos del colaborador (con filtros opcionales: kind, isActive)
- `PUT /api/collaborators/:id` - Actualizar colaborador completo
- `PATCH /api/collaborators/:id` - Actualizar colaborador parcial
- `DELETE /api/collaborators/:id` - Eliminar colaborador (baja lógica)
- `POST /api/collaborators/:id/activate` - Activar colaborador
- `POST /api/collaborators/:id/deactivate` - Desactivar colaborador

#### Documentos (`/api/documents`)
- `POST /api/documents` - Crear/subir documento (con archivo, multipart/form-data)
- `GET /api/documents` - Listar documentos con filtros (collaboratorId, kind, isActive, paginación)
- `GET /api/documents/:id` - Obtener documento por ID
- `GET /api/documents/:id/download` - Obtener URL de descarga/visualización
- `PUT /api/documents/:id` - Actualizar documento completo (metadatos)
- `PATCH /api/documents/:id` - Actualizar documento parcial (metadatos)
- `DELETE /api/documents/:id` - Eliminar documento (baja lógica)

#### Minutas (`/api/minutes`)
- `POST /api/minutes` - Crear/subir minuta (con archivo, multipart/form-data)
- `GET /api/minutes` - Listar minutas con filtros (tipo, fechaDesde, fechaHasta, search, paginación)
- `GET /api/minutes/:id` - Obtener minuta por ID
- `GET /api/minutes/:id/download` - Obtener URL de descarga/visualización
- `PUT /api/minutes/:id` - Actualizar minuta completa (metadatos)
- `PATCH /api/minutes/:id` - Actualizar minuta parcial (metadatos)
- `DELETE /api/minutes/:id` - Eliminar minuta (baja lógica)

#### Catálogos (`/api/catalogs`)
- **Áreas**: `GET /api/catalogs/areas`, `GET /api/catalogs/areas/:id`, `GET /api/catalogs/areas/:id/adscripciones` (obtener adscripciones del área, con filtro opcional: isActive), `POST /api/catalogs/areas` (solo admin), `PUT /api/catalogs/areas/:id` (solo admin), `DELETE /api/catalogs/areas/:id` (solo admin), `POST /api/catalogs/areas/:id/activate` (solo admin), `POST /api/catalogs/areas/:id/deactivate` (solo admin)
- **Adscripciones**: `GET /api/catalogs/adscripciones`, `GET /api/catalogs/adscripciones/:id`, `POST /api/catalogs/adscripciones` (solo admin), `PUT /api/catalogs/adscripciones/:id` (solo admin), `DELETE /api/catalogs/adscripciones/:id` (solo admin), `POST /api/catalogs/adscripciones/:id/activate` (solo admin), `POST /api/catalogs/adscripciones/:id/deactivate` (solo admin)
- **Puestos**: `GET /api/catalogs/puestos`, `GET /api/catalogs/puestos/:id`, `POST /api/catalogs/puestos` (solo admin), `PUT /api/catalogs/puestos/:id` (solo admin), `DELETE /api/catalogs/puestos/:id` (solo admin), `POST /api/catalogs/puestos/:id/activate` (solo admin), `POST /api/catalogs/puestos/:id/deactivate` (solo admin)
- **Tipos de Documento**: `GET /api/catalogs/documentTypes`, `GET /api/catalogs/documentTypes/:id`, `POST /api/catalogs/documentTypes` (solo admin), `PUT /api/catalogs/documentTypes/:id` (solo admin), `DELETE /api/catalogs/documentTypes/:id` (solo admin), `POST /api/catalogs/documentTypes/:id/activate` (solo admin), `POST /api/catalogs/documentTypes/:id/deactivate` (solo admin)

#### Auditoría (`/api/audit`)
- `GET /api/audit` - Listar logs de auditoría con filtros (entity, entityId, userId, action, fechaDesde, fechaHasta, paginación)
- `GET /api/audit/entity/:entity/:entityId` - Obtener logs de una entidad específica
- `GET /api/audit/user/:userId` - Obtener logs de un usuario específico
- `GET /api/audit/:id` - Obtener log por ID

**Nota:** Todos los endpoints requieren autenticación (token JWT en el header `Authorization: Bearer <token>`).

### Documentación de la API (Swagger/OpenAPI)

El proyecto incluye documentación interactiva de la API usando Swagger/OpenAPI:

- **Swagger UI**: `http://localhost:4000/api-docs` - Interfaz web interactiva para explorar y probar los endpoints
- **Especificación OpenAPI JSON**: `http://localhost:4000/api-docs.json` - Especificación OpenAPI en formato JSON

**Características:**
- Documentación interactiva de todos los endpoints
- Prueba de endpoints directamente desde el navegador
- Autenticación JWT integrada (botón "Authorize")
- Ejemplos de request/response
- Esquemas de datos documentados

**Uso:**
1. Inicia el servidor: `npm run dev`
2. Abre tu navegador en: `http://localhost:4000/api-docs`
3. Para probar endpoints protegidos:
   - Haz login usando `POST /api/auth/login`
   - Copia el `token` de la respuesta
   - Haz clic en el botón "Authorize" (arriba a la derecha)
   - Pega el token en el campo "Value" y haz clic en "Authorize"
   - Ahora puedes probar todos los endpoints protegidos
