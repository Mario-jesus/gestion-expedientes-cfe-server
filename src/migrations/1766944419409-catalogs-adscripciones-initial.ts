import { Connection } from 'mongoose';

/**
 * Migración: Crear índices iniciales para la colección adscripciones
 * Fecha: 2025-01-28
 * 
 * Esta migración crea todos los índices necesarios para la colección adscripciones:
 * - Índice único: adscripcion (adscripcion única globalmente)
 * - Índice simple: nombre (no único, permite múltiples registros con mismo nombre)
 * - Índice simple: isActive
 * - Índice compuesto: isActive + createdAt (descendente)
 * - Índice de texto: búsqueda full-text en nombre y adscripcion
 */
export async function up(connection: Connection): Promise<void> {
  if (!connection.db) {
    throw new Error('Database connection is not available');
  }
  const db = connection.db;
  const collection = db.collection('adscripciones');

  // 1. Índice único para adscripcion (adscripcion única globalmente)
  try {
    await collection.createIndex(
      { adscripcion: 1 },
      { unique: true, name: 'adscripcion_1' }
    );
    console.log('✓ Índice único creado: adscripcion');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice único adscripcion ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 2. Índice simple para nombre (no único, permite duplicados)
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

  // 4. Índice compuesto: isActive + createdAt (descendente)
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

  // 5. Índice de texto para búsqueda full-text (nombre y adscripcion)
  try {
    await collection.createIndex(
      { nombre: 'text', adscripcion: 'text' },
      { name: 'adscripcion_text_search' }
    );
    console.log('✓ Índice de texto creado: adscripcion_text_search (nombre + adscripcion)');
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
    'isActive_1',
    'nombre_1',
    'adscripcion_1',
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
