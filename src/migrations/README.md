# Migraciones de Base de Datos

Este directorio contiene todas las migraciones de base de datos usando `ts-migrate-mongoose`.

## Convención de Nombres

Las migraciones deben seguir el formato:
```
YYYY_MM_DD_HHMMSS-modulo-descripcion.ts
```

Ejemplos:
- `2025_01_10_120000-collaborators-initial.ts`
- `2025_01_11_140000-users-initial.ts`
- `2025_01_12_100000-collaborators-add-indexes.ts`

## Crear una Nueva Migración

```bash
npm run migrate:create nombre-migracion
```

Esto creará un archivo con timestamp automático:
```
2025_01_15_143000-nombre-migracion.ts
```

## Estructura de una Migración

```typescript
import { Connection } from 'mongoose';

/**
 * Migración: descripción de lo que hace
 * Fecha: YYYY-MM-DD
 */
export async function up(connection: Connection): Promise<void> {
  const db = connection.db;
  const collection = db.collection('nombre_coleccion');
  
  // Ejemplo: Crear índice
  await collection.createIndex({ campo: 1 }, { unique: true });
  
  // Ejemplo: Modificar documentos existentes
  // await collection.updateMany(
  //   { campo: { $exists: false } },
  //   { $set: { campo: 'valor_por_defecto' } }
  // );
}

export async function down(connection: Connection): Promise<void> {
  const db = connection.db;
  const collection = db.collection('nombre_coleccion');
  
  // Revertir cambios de up()
  await collection.dropIndex('campo_1');
}
```

## Comandos Disponibles

- `npm run migrate` - Ejecutar todas las migraciones pendientes
- `npm run migrate:down` - Revertir la última migración
- `npm run migrate:create <nombre>` - Crear nueva migración
- `npm run migrate:status` - Ver estado de migraciones
- `npm run migrate:list` - Listar todas las migraciones

## Notas Importantes

1. **Orden de ejecución**: Las migraciones se ejecutan en orden alfabético. Usa el prefijo de fecha/hora para controlar el orden.

2. **Idempotencia**: Las migraciones deben ser idempotentes cuando sea posible. Verifica si los cambios ya se aplicaron antes de ejecutarlos.

3. **Reversibilidad**: Siempre implementa la función `down()` para poder revertir cambios si es necesario.

4. **Testing**: Prueba las migraciones en un entorno de desarrollo antes de aplicarlas en producción.

5. **Backup**: En producción, haz backup de la base de datos antes de ejecutar migraciones importantes.

## Organización por Módulos

Aunque las migraciones están centralizadas aquí, usa el prefijo del módulo en el nombre:
- `collaborators-*` - Migraciones del módulo de colaboradores
- `users-*` - Migraciones del módulo de usuarios
- `areas-*` - Migraciones del módulo de áreas
- etc.
