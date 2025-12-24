# Módulo de Base de Datos

Este módulo proporciona la infraestructura de base de datos para el sistema, soportando tanto MongoDB (producción) como una base de datos en memoria (desarrollo/testing).

## Implementaciones Disponibles

### InMemoryDatabase
Base de datos en memoria usando `Map`. Útil para:
- Desarrollo rápido sin necesidad de MongoDB
- Testing unitario
- Prototipado

### MongoDBDatabase
Implementación real usando MongoDB/Mongoose. Para uso en producción.

## Configuración

### Variables de Entorno

```env
# Habilitar MongoDB (true) o usar InMemoryDatabase (false)
USE_MONGODB=true

# URI de conexión a MongoDB
MONGODB_URI=mongodb://localhost:27017/gestion-expedientes-cfe
# También puedes usar MONGO_URI como alias
```

### Selección Automática

El sistema selecciona automáticamente la implementación según `USE_MONGODB`:
- `USE_MONGODB=true` → `MongoDBDatabase`
- `USE_MONGODB=false` o no definido → `InMemoryDatabase`

## Uso

### En el código

```typescript
import { resolve } from './shared/infrastructure';
import { IDatabase } from './shared/domain';

// Resolver la base de datos (automáticamente selecciona la correcta)
const database = resolve<IDatabase>('database');

// Conectar
await database.connect();

// Verificar conexión
if (database.isConnected()) {
  // Usar base de datos
}

// Desconectar
await database.disconnect();
```

### Acceso a Mongoose (solo MongoDB)

Si necesitas acceso directo a Mongoose (por ejemplo, en repositorios):

```typescript
import { resolve } from './shared/infrastructure';
import { MongoDBDatabase } from './shared/infrastructure/database/MongoDBDatabase';

const database = resolve<IDatabase>('database');

if (database instanceof MongoDBDatabase) {
  const connection = database.getConnection();
  // Usar connection para acceder a Mongoose
}
```

## Migraciones con ts-migrate-mongoose

### Estructura

Las migraciones se almacenan en un directorio centralizado:

```
src/
└── migrations/
    ├── 2025_01_10_120000-collaborators-initial.ts
    ├── 2025_01_11_140000-users-initial.ts
    └── 2025_01_12_100000-areas-initial.ts
```

**Convención de nombres**: `YYYY_MM_DD_HHMMSS-modulo-descripcion.ts`

### Crear una Migración

```bash
npm run migrate:create nombre-migracion
```

Esto creará un archivo en `src/migrations/` con el formato:
```
YYYY_MM_DD_HHMMSS-nombre-migracion.ts
```

### Estructura de una Migración

```typescript
import { Connection } from 'mongoose';

export async function up(connection: Connection): Promise<void> {
  const db = connection.db;
  const collection = db.collection('collaborators');
  
  // Crear índices, modificar datos, etc.
  await collection.createIndex({ rpe: 1 }, { unique: true });
}

export async function down(connection: Connection): Promise<void> {
  // Revertir cambios
  const db = connection.db;
  await db.collection('collaborators').dropIndex('rpe_1');
}
```

### Comandos Disponibles

```bash
# Ejecutar todas las migraciones pendientes
npm run migrate

# Revertir la última migración
npm run migrate:down

# Crear una nueva migración
npm run migrate:create nombre-migracion

# Ver estado de las migraciones
npm run migrate:status

# Listar todas las migraciones
npm run migrate:list
```

### Configuración

La configuración de `ts-migrate-mongoose` está en `migrate.ts` en la raíz del proyecto:

```typescript
export default {
  mongodb: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/gestion-expedientes-cfe',
  },
  migrationsDir: 'src/migrations',
  changelogCollectionName: 'changelog',
  migrationFileExtension: '.ts',
};
```

## Conexión de Mongoose

El módulo `mongoose.ts` proporciona funciones para gestionar la conexión:

```typescript
import { connectMongoose, disconnectMongoose, getConnection } from './shared/infrastructure/database/mongoose';

// Conectar
const connection = await connectMongoose(logger);

// Obtener conexión actual
const conn = getConnection();

// Desconectar
await disconnectMongoose(logger);
```

## Testing

Para testing, puedes usar `InMemoryDatabase`:

```typescript
import { InMemoryDatabase } from './shared/infrastructure/database/InMemoryDatabase';

const database = new InMemoryDatabase();
await database.connect();

// Usar base de datos...

// Limpiar después de cada test
await database.clearDatabase();
```

## Organización por Módulos

Aunque las migraciones están centralizadas en `src/migrations/`, se recomienda usar una convención de nombres que indique el módulo:

- `collaborators-initial.ts` - Migración del módulo de colaboradores
- `users-initial.ts` - Migración del módulo de usuarios
- `collaborators-add-indexes.ts` - Migración adicional de colaboradores

Los modelos de Mongoose se organizan por módulo:

```
src/
├── shared/
│   └── infrastructure/
│       └── database/
│           └── mongo/
│               └── models/
│                   └── index.ts  # Registro centralizado de modelos
└── modules/
    └── collaborators/
        └── infrastructure/
            └── persistence/
                └── CollaboratorModel.ts  # Schema y Model de Mongoose
```

### Registro de Modelos

Todos los modelos deben ser importados en `src/shared/infrastructure/database/mongo/models/index.ts` para que Mongoose los registre automáticamente:

```typescript
// src/shared/infrastructure/database/mongo/models/index.ts
import '../../../../modules/collaborators/infrastructure/persistence/CollaboratorModel';
import '../../../../modules/users/infrastructure/persistence/UserModel';
```

Este archivo se importa automáticamente en `mongoose.ts` antes de establecer la conexión, asegurando que todos los modelos estén disponibles.

## Notas

- La conexión de Mongoose es un singleton: solo hay una conexión activa por proceso
- Las migraciones se registran en la colección `changelog` de MongoDB
- Cada migración solo se ejecuta una vez
- El orden de ejecución de migraciones es el orden alfabético de los nombres de archivo
- Usa prefijos de fecha/hora para controlar el orden: `YYYY_MM_DD_HHMMSS`

