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

## 📁 Estructura del Proyecto

El proyecto sigue una arquitectura **Domain-Driven Design (DDD)** con separación clara entre dominio, aplicación e infraestructura.

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
│   │       │   ├── {Entity}.ts             # Entidades del dominio
│   │       │   └── {Repository}.ts        # Interfaces de repositorios
│   │       │
│   │       ├── application/                 # Casos de uso (Application Layer)
│   │       │   └── {UseCase}.ts            # Casos de uso
│   │       │
│   │       └── infrastructure/              # Implementaciones de infraestructura
│   │           ├── persistence/             # Persistencia
│   │           │   └── {Entity}Model.ts     # Modelos de Mongoose
│   │           └── http/                    # Controladores HTTP
│   │               └── {Entity}Controller.ts
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
- **`src/shared/infrastructure/`**: Implementaciones concretas de infraestructura (bases de datos, loggers, HTTP, etc.)
- **`src/modules/`**: Módulos de negocio organizados por dominio (cada módulo es un Bounded Context)
- **`src/migrations/`**: Scripts de migración de base de datos usando `ts-migrate-mongoose`
- **`config/`**: Archivos de configuración adicionales

## 🔧 Tecnologías Utilizadas

- **Node.js** - Runtime de JavaScript
- **Express** - Framework web para Node.js
- **TypeScript** - Superset de JavaScript con tipado estático
- **dotenv** - Manejo de variables de entorno
- **cors** - Middleware para habilitar CORS

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
