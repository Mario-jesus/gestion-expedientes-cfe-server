import { Connection } from 'mongoose';

/**
 * Migración: Crear índices iniciales para la colección areas
 * Fecha: 2025-01-28
 * 
 * Esta migración crea todos los índices necesarios para la colección areas:
 * - Índice único: nombre
 * - Índice simple: isActive
 * - Índice compuesto: isActive + createdAt (descendente)
 * - Índice de texto: búsqueda full-text en nombre
 */
export async function up(connection: Connection): Promise<void> {
  if (!connection.db) {
    throw new Error('Database connection is not available');
  }
  const db = connection.db;
  const collection = db.collection('areas');

  // 1. Índice único para nombre
  try {
    await collection.createIndex(
      { nombre: 1 },
      { unique: true, name: 'nombre_1' }
    );
    console.log('✓ Índice único creado: nombre');
  } catch (error: any) {
    if (error.code === 85) {
      // Índice ya existe con diferentes opciones
      console.log('⚠ Índice nombre ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 2. Índice simple para isActive
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

  // 3. Índice compuesto: isActive + createdAt (descendente)
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

  // 4. Índice de texto para búsqueda full-text (nombre)
  try {
    await collection.createIndex(
      { nombre: 'text' },
      { name: 'area_text_search' }
    );
    console.log('✓ Índice de texto creado: area_text_search');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice de texto ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  console.log('✅ Migración catalogs-areas-initial completada exitosamente');
}

export async function down(connection: Connection): Promise<void> {
  if (!connection.db) {
    throw new Error('Database connection is not available');
  }
  const db = connection.db;
  const collection = db.collection('areas');

  console.log('Revirtiendo migración catalogs-areas-initial...');

  // Eliminar índices en orden inverso
  const indexesToDrop = [
    'area_text_search',
    'isActive_1_createdAt_-1',
    'isActive_1',
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

  console.log('✅ Reversión de migración catalogs-areas-initial completada');
}
