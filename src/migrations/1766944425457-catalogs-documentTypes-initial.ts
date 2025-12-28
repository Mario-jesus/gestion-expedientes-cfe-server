import { Connection } from 'mongoose';

/**
 * Migración: Crear índices iniciales para la colección documentTypes
 * Fecha: 2025-01-28
 * 
 * Esta migración crea todos los índices necesarios para la colección documentTypes:
 * - Índice único compuesto: nombre + kind (nombre único dentro del kind)
 * - Índices simples: nombre, kind, isActive
 * - Índices compuestos:
 *   - kind + isActive
 *   - isActive + createdAt (descendente)
 * - Índice de texto: búsqueda full-text en nombre
 */
export async function up(connection: Connection): Promise<void> {
  if (!connection.db) {
    throw new Error('Database connection is not available');
  }
  const db = connection.db;
  const collection = db.collection('documentTypes');

  // 1. Índice simple para nombre
  try {
    await collection.createIndex(
      { nombre: 1 },
      { name: 'nombre_1' }
    );
    console.log('✓ Índice creado: nombre');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice nombre ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 2. Índice simple para kind
  try {
    await collection.createIndex(
      { kind: 1 },
      { name: 'kind_1' }
    );
    console.log('✓ Índice creado: kind');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice kind ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 3. Índice simple para isActive
  try {
    await collection.createIndex(
      { isActive: 1 },
      { name: 'isActive_1' }
    );
    console.log('✓ Índice creado: isActive');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice isActive ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 4. Índice único compuesto: nombre + kind (nombre único dentro del kind)
  try {
    await collection.createIndex(
      { nombre: 1, kind: 1 },
      { unique: true, name: 'nombre_kind_unique' }
    );
    console.log('✓ Índice único compuesto creado: nombre + kind');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice único compuesto nombre+kind ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 5. Índice compuesto: kind + isActive
  try {
    await collection.createIndex(
      { kind: 1, isActive: 1 },
      { name: 'kind_1_isActive_1' }
    );
    console.log('✓ Índice compuesto creado: kind + isActive');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice compuesto kind+isActive ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 6. Índice compuesto: isActive + createdAt (descendente)
  try {
    await collection.createIndex(
      { isActive: 1, createdAt: -1 },
      { name: 'isActive_1_createdAt_-1' }
    );
    console.log('✓ Índice compuesto creado: isActive + createdAt');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice compuesto isActive+createdAt ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 7. Índice de texto para búsqueda full-text (nombre)
  try {
    await collection.createIndex(
      { nombre: 'text' },
      { name: 'documentType_text_search' }
    );
    console.log('✓ Índice de texto creado: documentType_text_search');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice de texto ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  console.log('✅ Migración catalogs-documentTypes-initial completada exitosamente');
}

export async function down(connection: Connection): Promise<void> {
  if (!connection.db) {
    throw new Error('Database connection is not available');
  }
  const db = connection.db;
  const collection = db.collection('documentTypes');

  console.log('Revirtiendo migración catalogs-documentTypes-initial...');

  // Eliminar índices en orden inverso
  const indexesToDrop = [
    'documentType_text_search',
    'isActive_1_createdAt_-1',
    'kind_1_isActive_1',
    'nombre_kind_unique',
    'isActive_1',
    'kind_1',
    'nombre_1',
  ];

  for (const indexName of indexesToDrop) {
    try {
      await collection.dropIndex(indexName);
      console.log(`✓ Índice eliminado: ${indexName}`);
    } catch (error: any) {
      if (error.code === 27 || error.codeName === 'IndexNotFound') {
        console.log(`⚠ Índice ${indexName} no existe, omitiendo...`);
      } else {
        throw error;
      }
    }
  }

  console.log('✅ Reversión de migración catalogs-documentTypes-initial completada');
}
