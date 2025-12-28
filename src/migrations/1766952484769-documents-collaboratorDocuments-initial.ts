import { Connection } from 'mongoose';

/**
 * Migración: Crear índices iniciales para la colección collaboratorDocuments
 * Fecha: 2025-12-28
 * 
 * Esta migración crea todos los índices necesarios para la colección collaboratorDocuments:
 * - Índices simples: collaboratorId, kind, uploadedBy, uploadedAt, documentTypeId, isActive
 * - Índices compuestos:
 *   - collaboratorId + kind + isActive
 *   - collaboratorId + isActive
 *   - kind + isActive
 *   - collaboratorId + kind + periodo
 *   - uploadedAt (descendente)
 * - Índice de texto: búsqueda full-text en descripcion y fileName
 */
export async function up(connection: Connection): Promise<void> {
  if (!connection.db) {
    throw new Error('Database connection is not available');
  }
  const db = connection.db;
  const collection = db.collection('collaboratorDocuments');

  // 1. Índice simple para collaboratorId
  try {
    await collection.createIndex(
      { collaboratorId: 1 },
      { name: 'collaboratorId_1' }
    );
    console.log('✓ Índice creado: collaboratorId');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice collaboratorId ya existe, omitiendo...');
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

  // 5. Índice simple para documentTypeId
  try {
    await collection.createIndex(
      { documentTypeId: 1 },
      { name: 'documentTypeId_1' }
    );
    console.log('✓ Índice creado: documentTypeId');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice documentTypeId ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 6. Índice simple para isActive
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

  // 7. Índice compuesto: collaboratorId + kind + isActive
  try {
    await collection.createIndex(
      { collaboratorId: 1, kind: 1, isActive: 1 },
      { name: 'collaboratorId_1_kind_1_isActive_1' }
    );
    console.log('✓ Índice compuesto creado: collaboratorId + kind + isActive');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice compuesto collaboratorId+kind+isActive ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 8. Índice compuesto: collaboratorId + isActive
  try {
    await collection.createIndex(
      { collaboratorId: 1, isActive: 1 },
      { name: 'collaboratorId_1_isActive_1' }
    );
    console.log('✓ Índice compuesto creado: collaboratorId + isActive');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice compuesto collaboratorId+isActive ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 9. Índice compuesto: kind + isActive
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

  // 10. Índice compuesto: collaboratorId + kind + periodo
  try {
    await collection.createIndex(
      { collaboratorId: 1, kind: 1, periodo: 1 },
      { name: 'collaboratorId_1_kind_1_periodo_1' }
    );
    console.log('✓ Índice compuesto creado: collaboratorId + kind + periodo');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice compuesto collaboratorId+kind+periodo ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  // 11. Índice de texto para búsqueda full-text (descripcion, fileName)
  try {
    await collection.createIndex(
      { descripcion: 'text', fileName: 'text' },
      { name: 'document_text_search' }
    );
    console.log('✓ Índice de texto creado: document_text_search');
  } catch (error: any) {
    if (error.code === 85) {
      console.log('⚠ Índice de texto ya existe, omitiendo...');
    } else {
      throw error;
    }
  }

  console.log('✅ Migración documents-collaboratorDocuments-initial completada exitosamente');
}

export async function down(connection: Connection): Promise<void> {
  if (!connection.db) {
    throw new Error('Database connection is not available');
  }
  const db = connection.db;
  const collection = db.collection('collaboratorDocuments');

  console.log('Revirtiendo migración documents-collaboratorDocuments-initial...');

  // Eliminar índices en orden inverso
  const indexesToDrop = [
    'document_text_search',
    'collaboratorId_1_kind_1_periodo_1',
    'kind_1_isActive_1',
    'collaboratorId_1_isActive_1',
    'collaboratorId_1_kind_1_isActive_1',
    'isActive_1',
    'documentTypeId_1',
    'uploadedAt_-1',
    'uploadedBy_1',
    'kind_1',
    'collaboratorId_1',
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

  console.log('✅ Reversión de migración documents-collaboratorDocuments-initial completada');
}
