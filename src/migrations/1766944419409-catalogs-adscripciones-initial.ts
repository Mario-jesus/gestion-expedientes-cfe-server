import { Connection } from 'mongoose';

/**
 * Migración: Crear índices iniciales para la colección adscripciones
 * Fecha: 2025-01-28
 * 
 * Esta migración crea todos los índices necesarios para la colección adscripciones:
 * - Índice único compuesto: nombre + areaId (nombre único dentro del área)
 * - Índices simples: nombre, areaId, isActive
 * - Índices compuestos:
 *   - areaId + isActive
 *   - isActive + createdAt (descendente)
 * - Índice de texto: búsqueda full-text en nombre
 */
export async function up(connection: Connection): Promise<void> {
  if (!connection.db) {
    throw new Error('Database connection is not available');
  }
  const db = connection.db;
  const collection = db.collection('adscripciones');

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

  // 2. Índice simple para areaId
  try {
    await collection.createIndex(
      { areaId: 1 },
      { name: 'areaId_1' }
    );
    console.log('✓ Índice creado: areaId');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice areaId ya existe, omitiendo...');
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

  // 4. Índice único compuesto: nombre + areaId (nombre único dentro del área)
  try {
    await collection.createIndex(
      { nombre: 1, areaId: 1 },
      { unique: true, name: 'nombre_areaId_unique' }
    );
    console.log('✓ Índice único compuesto creado: nombre + areaId');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice único compuesto nombre+areaId ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 5. Índice compuesto: areaId + isActive
  try {
    await collection.createIndex(
      { areaId: 1, isActive: 1 },
      { name: 'areaId_1_isActive_1' }
    );
    console.log('✓ Índice compuesto creado: areaId + isActive');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice compuesto areaId+isActive ya existe, omitiendo...');
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
      { name: 'adscripcion_text_search' }
    );
    console.log('✓ Índice de texto creado: adscripcion_text_search');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice de texto ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  console.log('✅ Migración catalogs-adscripciones-initial completada exitosamente');
}

export async function down(connection: Connection): Promise<void> {
  if (!connection.db) {
    throw new Error('Database connection is not available');
  }
  const db = connection.db;
  const collection = db.collection('adscripciones');

  console.log('Revirtiendo migración catalogs-adscripciones-initial...');

  // Eliminar índices en orden inverso
  const indexesToDrop = [
    'adscripcion_text_search',
    'isActive_1_createdAt_-1',
    'areaId_1_isActive_1',
    'nombre_areaId_unique',
    'isActive_1',
    'areaId_1',
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

  console.log('✅ Reversión de migración catalogs-adscripciones-initial completada');
}
