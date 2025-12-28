import { Connection } from 'mongoose';

/**
 * Migración: Crear índices iniciales para la colección minutes
 * Fecha: 2025-01-28
 * 
 * Esta migración crea todos los índices necesarios para la colección minutes:
 * - Índices simples: tipo, fecha, uploadedBy, uploadedAt, isActive, titulo
 * - Índices compuestos:
 *   - tipo + isActive
 *   - fecha + isActive
 *   - tipo + fecha + isActive
 *   - fecha (descendente)
 *   - uploadedAt (descendente)
 * - Índice de texto: búsqueda full-text en titulo y descripcion
 */
export async function up(connection: Connection): Promise<void> {
  if (!connection.db) {
    throw new Error('Database connection is not available');
  }
  const db = connection.db;
  const collection = db.collection('minutes');

  // 1. Índice simple para tipo
  try {
    await collection.createIndex(
      { tipo: 1 },
      { name: 'tipo_1' }
    );
    console.log('✓ Índice creado: tipo');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice tipo ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 2. Índice simple para fecha (fecha del evento)
  try {
    await collection.createIndex(
      { fecha: 1 },
      { name: 'fecha_1' }
    );
    console.log('✓ Índice creado: fecha');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice fecha ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 3. Índice simple para uploadedBy
  try {
    await collection.createIndex(
      { uploadedBy: 1 },
      { name: 'uploadedBy_1' }
    );
    console.log('✓ Índice creado: uploadedBy');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice uploadedBy ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 4. Índice simple para uploadedAt (descendente)
  try {
    await collection.createIndex(
      { uploadedAt: -1 },
      { name: 'uploadedAt_-1' }
    );
    console.log('✓ Índice creado: uploadedAt');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice uploadedAt ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 5. Índice simple para isActive
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

  // 6. Índice simple para titulo
  try {
    await collection.createIndex(
      { titulo: 1 },
      { name: 'titulo_1' }
    );
    console.log('✓ Índice creado: titulo');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice titulo ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 7. Índice compuesto: tipo + isActive
  try {
    await collection.createIndex(
      { tipo: 1, isActive: 1 },
      { name: 'tipo_1_isActive_1' }
    );
    console.log('✓ Índice compuesto creado: tipo + isActive');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice compuesto tipo+isActive ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 8. Índice compuesto: fecha + isActive
  try {
    await collection.createIndex(
      { fecha: 1, isActive: 1 },
      { name: 'fecha_1_isActive_1' }
    );
    console.log('✓ Índice compuesto creado: fecha + isActive');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice compuesto fecha+isActive ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 9. Índice compuesto: tipo + fecha + isActive
  try {
    await collection.createIndex(
      { tipo: 1, fecha: 1, isActive: 1 },
      { name: 'tipo_1_fecha_1_isActive_1' }
    );
    console.log('✓ Índice compuesto creado: tipo + fecha + isActive');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice compuesto tipo+fecha+isActive ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 10. Índice para ordenamiento por fecha del evento (descendente)
  try {
    await collection.createIndex(
      { fecha: -1 },
      { name: 'fecha_-1' }
    );
    console.log('✓ Índice creado: fecha (descendente)');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice fecha (descendente) ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 11. Índice de texto para búsqueda full-text (titulo, descripcion)
  try {
    await collection.createIndex(
      { titulo: 'text', descripcion: 'text' },
      { name: 'minute_text_search' }
    );
    console.log('✓ Índice de texto creado: minute_text_search');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice de texto ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  console.log('✅ Migración minutes-initial completada exitosamente');
}

export async function down(connection: Connection): Promise<void> {
  if (!connection.db) {
    throw new Error('Database connection is not available');
  }
  const db = connection.db;
  const collection = db.collection('minutes');

  console.log('Revirtiendo migración minutes-initial...');

  // Eliminar índices en orden inverso
  const indexesToDrop = [
    'minute_text_search',
    'fecha_-1',
    'tipo_1_fecha_1_isActive_1',
    'fecha_1_isActive_1',
    'tipo_1_isActive_1',
    'titulo_1',
    'isActive_1',
    'uploadedAt_-1',
    'uploadedBy_1',
    'fecha_1',
    'tipo_1',
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

  console.log('✅ Reversión de migración minutes-initial completada');
}
