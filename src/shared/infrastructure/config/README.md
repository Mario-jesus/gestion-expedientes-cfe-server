# Módulo de Configuración Centralizado

Este módulo centraliza el acceso a todas las variables de entorno de la aplicación, proporcionando validación, valores por defecto y tipado fuerte.

## Características

- ✅ **Validación centralizada**: Todas las variables se validan al cargar el módulo
- ✅ **Tipado fuerte**: TypeScript con interfaces bien definidas
- ✅ **Valores por defecto**: Configuración sensata para desarrollo
- ✅ **Un solo punto de acceso**: No más `process.env` disperso por el código
- ✅ **Construcción automática**: URIs complejas se construyen automáticamente

## Uso

### Importar la configuración

```typescript
import { config } from './shared/infrastructure/config';

// Acceder a la configuración del servidor
const port = config.server.port;
const isDevelopment = config.server.isDevelopment;

// Acceder a la configuración de la base de datos
const useMongoDB = config.database.useMongoDB;
const mongoUri = config.database.mongoUri; // URI completa ya construida

// Acceder a la configuración del logger
const logLevel = config.logger.level;
const lokiUrl = config.logger.loki?.url;
```

### Estructura de la Configuración

```typescript
interface AppConfig {
  database: {
    useMongoDB: boolean;
    mongoHost: string;
    databaseName: string;
    mongoUri: string; // Construida automáticamente
  };
  server: {
    port: number;
    nodeEnv: string;
    baseUrl: string; // URL base del servidor
    isDevelopment: boolean;
    isProduction: boolean;
    isTest: boolean;
  };
  logger: {
    level: string;
    logToConsole: boolean;
    logToFile: boolean;
    logFilePath: string;
    logFileSync: boolean;
    loki?: {
      url?: string;
      labels?: Record<string, string>;
      batching: boolean;
      interval: number;
      basicAuth?: {
        username: string;
        password: string;
      };
    };
  };
}
```

## Variables de Entorno

### Base de Datos

```env
# Habilitar MongoDB
USE_MONGODB=true

# URI base de MongoDB (sin nombre de base de datos)
MONGODB_HOST=mongodb://localhost:27017
# O alternativamente:
# MONGODB_URI_BASE=mongodb://localhost:27017

# Credenciales de MongoDB (opcional - se agregan automáticamente a la URI si están presentes)
# Si MONGODB_HOST no incluye credenciales, estas variables se usarán para construir la URI
# MONGODB_USER=admin
# MONGODB_PASSWORD=12345678
# MONGODB_AUTH_SOURCE=admin

# Nombre de la base de datos
DATABASE_NAME=gestion-expedientes-cfe
```

**Nota**: La URI completa se construye automáticamente como `${MONGODB_HOST}/${DATABASE_NAME}`

### Servidor

```env
PORT=3000
NODE_ENV=development
SERVER_BASE_URL=http://localhost
# O alternativamente:
# BASE_URL=http://localhost
```

### CORS

```env
# Permitir todos los orígenes (solo desarrollo, NO usar en producción)
CORS_ALLOW_ALL=false

# Orígenes permitidos (uno o múltiples separados por coma)
# Si CORS_ALLOW_ALL=true, esta variable se ignora
CORS_ORIGIN=http://localhost:3000
# Múltiples orígenes:
# CORS_ORIGIN=http://localhost:3000,https://app.midominio.com

# Permitir credenciales (cookies, auth headers)
CORS_CREDENTIALS=true

# Métodos HTTP permitidos (separados por coma)
CORS_METHODS=GET,POST,PUT,PATCH,DELETE,OPTIONS

# Headers permitidos (separados por coma)
CORS_ALLOWED_HEADERS=Content-Type,Authorization,X-Requested-With

# Headers expuestos al cliente (separados por coma, opcional)
# CORS_EXPOSED_HEADERS=X-Total-Count,X-Page-Count

# Tiempo de caché para preflight requests en segundos (default: 86400 = 24 horas)
CORS_MAX_AGE=86400
```

**Notas importantes:**
- Si `CORS_ALLOW_ALL=true`, se permiten todos los orígenes (solo para desarrollo)
- Si `CORS_ALLOW_ALL=false` y no hay `CORS_ORIGIN`, en desarrollo se permite `http://localhost:3000` y `http://localhost:3001` por defecto
- En producción, si `CORS_ALLOW_ALL=false`, se requiere `CORS_ORIGIN` explícito

### Logger

```env
LOG_LEVEL=info
LOG_TO_CONSOLE=true
LOG_TO_FILE=false
LOG_FILE_PATH=./logs/app.log
LOG_FILE_SYNC=false

# Loki (opcional)
LOKI_URL=http://localhost:3100
LOKI_LABELS={"service":"gestion-expedientes-cfe"}
LOKI_BATCHING=true
LOKI_INTERVAL=5
LOKI_BASIC_AUTH_USERNAME=
LOKI_BASIC_AUTH_PASSWORD=
```

## Validaciones

El módulo valida automáticamente:

- **PORT**: Debe ser un número entre 1 y 65535
- **NODE_ENV**: Debe ser `development`, `production` o `test`
- **LOG_LEVEL**: Debe ser `trace`, `debug`, `info`, `warn`, `error`, o `fatal`
- **DATABASE_NAME**: Solo caracteres alfanuméricos, guiones y guiones bajos
- **MONGODB_HOST**: Requerido si `USE_MONGODB=true`
- **CORS_ORIGIN**: Debe ser una URL válida (formato `http://` o `https://`)
- **CORS_MAX_AGE**: Debe ser un número positivo
- **CORS_ORIGIN**: Requerido en producción si `CORS_ALLOW_ALL=false`

Si alguna validación falla, la aplicación lanzará un error al iniciar con un mensaje descriptivo.

## Construcción de URI de MongoDB

El módulo construye automáticamente la URI completa de MongoDB:

- Si `MONGODB_HOST` no tiene query parameters: `${MONGODB_HOST}/${DATABASE_NAME}`
- Si `MONGODB_HOST` tiene query parameters: `${MONGODB_HOST_BASE}/${DATABASE_NAME}?${QUERY_PARAMS}`

Ejemplos:

```env
MONGODB_HOST=mongodb://localhost:27017
DATABASE_NAME=myapp
# Resultado: mongodb://localhost:27017/myapp

MONGODB_HOST=mongodb://user:pass@host:27017?authSource=admin
DATABASE_NAME=myapp
# Resultado: mongodb://user:pass@host:27017/myapp?authSource=admin
```

## Testing

Para testing, puedes mockear el módulo de configuración:

```typescript
// En tu test
jest.mock('./shared/infrastructure/config', () => ({
  config: {
    database: {
      useMongoDB: false,
      mongoUri: '',
    },
    server: {
      port: 3001,
      nodeEnv: 'test',
      isDevelopment: false,
      isProduction: false,
      isTest: true,
    },
    logger: {
      level: 'silent',
      logToConsole: false,
    },
  },
}));
```

## Ventajas

1. **No más `process.env` disperso**: Todo el código accede a `config`
2. **Validación temprana**: Errores de configuración se detectan al iniciar
3. **TypeScript**: Autocompletado y verificación de tipos
4. **Documentación implícita**: La estructura de tipos documenta las opciones
5. **Fácil testing**: Mockear un solo objeto en lugar de múltiples `process.env`

## Migración

Si tienes código que usa `process.env` directamente, reemplázalo:

```typescript
// ❌ Antes
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI;

// ✅ Después
import { config } from './shared/infrastructure/config';
const port = config.server.port;
const mongoUri = config.database.mongoUri;
```
