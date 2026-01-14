/**
 * Script de seed para crear datos iniciales de catálogos (Áreas, Adscripciones y Puestos)
 * 
 * Este script crea áreas, adscripciones y puestos por defecto si no existen en la base de datos.
 * 
 * Uso:
 *   npm run seed:catalogs
 *   O directamente: npx ts-node -r tsconfig-paths/register src/scripts/seed-catalogs.ts
 * 
 * Variables de entorno opcionales:
 *   SEED_CATALOGS_SKIP_AREAS=false (default: false) - Saltar creación de áreas
 *   SEED_CATALOGS_SKIP_ADSCRIPCIONES=false (default: false) - Saltar creación de adscripciones
 *   SEED_CATALOGS_SKIP_PUESTOS=false (default: false) - Saltar creación de puestos
 */

import dotenv from 'dotenv';
import { container } from '../shared/infrastructure';
import { registerCatalogsModule } from '../modules/catalogs/infrastructure/container';
import { IAreaRepository } from '../modules/catalogs/domain/ports/output/IAreaRepository';
import { IAdscripcionRepository } from '../modules/catalogs/domain/ports/output/IAdscripcionRepository';
import { IPuestoRepository } from '../modules/catalogs/domain/ports/output/IPuestoRepository';
import { ILogger } from '../shared/domain';
import { Area } from '../modules/catalogs/domain/entities/Area';
import { Adscripcion } from '../modules/catalogs/domain/entities/Adscripcion';
import { Puesto } from '../modules/catalogs/domain/entities/Puesto';
import { connectMongoose, disconnectMongoose } from '../shared/infrastructure/adapters/output/database/mongo/mongoose';

// Cargar variables de entorno
dotenv.config();

// Configuración del seed
const SKIP_AREAS = process.env.SEED_CATALOGS_SKIP_AREAS === 'true';
const SKIP_ADSCRIPCIONES = process.env.SEED_CATALOGS_SKIP_ADSCRIPCIONES === 'true';
const SKIP_PUESTOS = process.env.SEED_CATALOGS_SKIP_PUESTOS === 'true';

// Nombre de la adscripción a crear para todas las áreas
const ADSCRIPCION_NOMBRE = 'Zona Ríos';

// Datos de Áreas
const AREAS_DATA = [
  {
    nombre: 'Distribución',
    descripcion: 'Operación y mantenimiento de las redes eléctricas locales.',
  },
  {
    nombre: 'Planeación',
    descripcion: 'Diseño y proyección de nuevas obras y crecimiento de red.',
  },
  {
    nombre: 'Medición',
    descripcion: 'Control de consumos, medidores y reducción de pérdidas.',
  },
  {
    nombre: 'Gestión comercial',
    descripcion: 'Facturación, contratos y atención a clientes.',
  },
  {
    nombre: 'Capacitación',
    descripcion: 'Entrenamiento técnico y normativas de seguridad.',
  },
  {
    nombre: 'Administración personal',
    descripcion: 'Manejo de nómina, contratos y recursos humanos.',
  },
  {
    nombre: 'Administración general',
    descripcion: 'Control de presupuesto, finanzas y legalidad.',
  },
  {
    nombre: 'Servicios generales',
    descripcion: 'Mantenimiento de edificios, vehículos y logística.',
  },
  {
    nombre: 'TI',
    descripcion: 'Soporte técnico, sistemas, redes y software interno.',
  },
];

// Datos de Puestos
const PUESTOS_DATA = [
  {
    nombre: 'Liniero Comercial',
    descripcion: 'Ejecutar con calidad, oportunidad y precisión las actividades de campo con impacto en la gestión comercial de la EPS Distribución, en el marco de la normatividad, la seguridad y salud en el trabajo, coadyuvando a la rentabilidad del proceso de servicios comerciale',
  },
  {
    nombre: 'Liniero Encargado LV RGD',
    descripcion: 'Planear, organizar, supervisar, dirigir y ejecutar las actividades de puesta en servicio, operación y mantenimiento en Líneas Energizadas y Desenergizadas en conjunto con el liniero LV, así como, las maniobras de apoyo de operación y mantenimiento en subestaciones y líneas de alta tensión de Distribución, a fin de contribuir al suministro de energía eléctrica en condiciones de seguridad del personal, eficiencia, calidad, confiabilidad, continuidad y sustentabilidad de la RGD.',
  },
  {
    nombre: 'Liniero LV RGD',
    descripcion: 'Planear, organizar, revisar y ejecutar las actividades de puesta en servicio, operación y mantenimiento en Líneas Energizadas y Desenergizadas, así como las maniobras de apoyo de operación y mantenimiento en subestaciones y líneas de Alta tensión de Distribución, a fin de contribuir al suministro de energía eléctrica en condiciones de seguridad del personal, eficiencia, calidad, confiabilidad, continuidad y sustentabilidad de la RGD.',
  },
  {
    nombre: 'Ayudante Liniero',
    descripcion: 'En coordinación con el liniero responsable planear, ejecutar y verificar con seguridad y responsabilidad las actividades de restablecimiento y conexión del suministro de energía eléctrica en baja y media tensión, apegadas a los procedimientos del Sistema Integral de Gestión con el fin de garantizar la continuidad del servicio al cliente.',
  },
  {
    nombre: 'Verificador Calibrador I',
    descripcion: 'Realizar la revisión, prueba, aseguramiento y calibración de equipos de medición, instalar servicios en baja tensión, así como elaborar reportes de resultados de sus actividades y manejar vehículos automotores.',
  },
  {
    nombre: 'Sobrestante RGD',
    descripcion: 'Planear, organizar, coordinar, supervisar, dirigir y ejecutar las actividades de construcción, puesta en servicio, operación y mantenimiento en redes energizadas y desenergizadas en la Red General de Distribución (RGD), así como las maniobras de apoyo de operación y mantenimiento en subestaciones y líneas de alta tensión de distribución, en el ámbito de su responsabilidad, a fin de contribuir al suministro de energía eléctrica en condiciones de seguridad del personal, eficiencia, calidad, confiabilidad, continuidad y sustentabilidad de la RGD.',
  },
  {
    nombre: 'Técnico de Distribución',
    descripcion: 'Efectuar acciones relacionadas con la operación y mantenimiento del sistema eléctrico, así como la elaboración y actualización de la información estadística del área de distribución, para garantizar el suministro de energía eléctrica con parámetros de calidad.',
  },
  {
    nombre: 'Tecnico de Control',
    descripcion: 'Mantener los equipos, instalaciones y sistemas de control supervisorio y automatismo, as como la red de transmisión de datos requeridos para este fin en óptimas condiciones de operación, cumpliendo los indicadores de disponibilidad y confiabilidad establecidos en la zona.',
  },
  {
    nombre: 'Técnico de Comunicaciones',
    descripcion: 'Mantener los equipos e instalaciones de la red de datos, telefonía, videoconferencia y radiocomunicación en óptimas condiciones de operación cumpliendo con los indicadores de disponibilidad y confiabilidad establecidos en la zona.',
  },
  {
    nombre: 'Técnico de Protecciones',
    descripcion: 'Operar y mantener los esquemas de control, protección y medición instaldos en os tableros de control, protección y medición de las subestaciones reductoras de distribución',
  },
  {
    nombre: 'Técnico de Subestaciones',
    descripcion: 'Ejecutar el mantenimiento, reparación y operación del equipo eléctrico instalado en las subestaciones reductoras de distribución para asegurar una operación confiable dentro de los parámetros establecidos por la C.F.E. para estos propósitos',
  },
  {
    nombre: 'Técnico de Zona',
    descripcion: 'Efectuar acciones relacionadas con la operación y mantenimiento del sistema eléctrico, así como la elaboración y actualización de la información estadística del área del área de distribución para garantizar el suministro de energía eléctrica con parámetros de calidad',
  },
];

/**
 * Función para crear áreas
 */
async function seedAreas(
  areaRepository: IAreaRepository,
  logger: ILogger
): Promise<void> {
  logger.info('Iniciando seed de áreas...');

  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const areaData of AREAS_DATA) {
    try {
      // Verificar si el área ya existe
      const existingArea = await areaRepository.findByNombre(areaData.nombre);

      if (existingArea) {
        logger.debug(`Área "${areaData.nombre}" ya existe, saltando...`);
        skippedCount++;
        continue;
      }

      // Crear la entidad Area
      const area = Area.create({
        nombre: areaData.nombre,
        descripcion: areaData.descripcion,
        isActive: true,
      });

      // Persistir el área
      await areaRepository.create(area);
      logger.info(`✅ Área creada: ${areaData.nombre}`);
      createdCount++;
    } catch (error: any) {
      errorCount++;
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error(`❌ Error al crear área "${areaData.nombre}"`, errorObj, {
        nombre: areaData.nombre,
        message: error.message,
      });
    }
  }

  logger.info('Seed de áreas completado', {
    total: AREAS_DATA.length,
    creadas: createdCount,
    saltadas: skippedCount,
    errores: errorCount,
  });
}

/**
 * Función para crear adscripciones
 * Crea la adscripción "Zona Ríos" para todas las áreas existentes
 */
async function seedAdscripciones(
  areaRepository: IAreaRepository,
  adscripcionRepository: IAdscripcionRepository,
  logger: ILogger
): Promise<void> {
  logger.info('Iniciando seed de adscripciones...');

  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  try {
    // Obtener todas las áreas activas
    const { areas } = await areaRepository.findAll(
      { isActive: true },
      1000, // Límite alto para obtener todas las áreas
      0
    );

    if (areas.length === 0) {
      logger.warn('No se encontraron áreas activas. No se pueden crear adscripciones.');
      return;
    }

    logger.info(`Se encontraron ${areas.length} áreas activas. Creando adscripción "${ADSCRIPCION_NOMBRE}" para cada una...`);

    for (const area of areas) {
      try {
        // Verificar si la adscripción ya existe para esta área
        const existingAdscripcion = await adscripcionRepository.findByNombreAndAreaId(
          ADSCRIPCION_NOMBRE,
          area.id
        );

        if (existingAdscripcion) {
          logger.debug(`Adscripción "${ADSCRIPCION_NOMBRE}" ya existe para el área "${area.nombre}", saltando...`);
          skippedCount++;
          continue;
        }

        // Crear la entidad Adscripcion
        const adscripcion = Adscripcion.create({
          nombre: ADSCRIPCION_NOMBRE,
          areaId: area.id,
          descripcion: `Adscripción ${ADSCRIPCION_NOMBRE} del área ${area.nombre}`,
          isActive: true,
        });

        // Persistir la adscripción
        await adscripcionRepository.create(adscripcion);
        logger.info(`✅ Adscripción "${ADSCRIPCION_NOMBRE}" creada para el área: ${area.nombre}`);
        createdCount++;
      } catch (error: any) {
        errorCount++;
        const errorObj = error instanceof Error ? error : new Error(String(error));
        logger.error(`❌ Error al crear adscripción "${ADSCRIPCION_NOMBRE}" para el área "${area.nombre}"`, errorObj, {
          areaId: area.id,
          areaNombre: area.nombre,
          message: error.message,
        });
      }
    }

    logger.info('Seed de adscripciones completado', {
      totalAreas: areas.length,
      creadas: createdCount,
      saltadas: skippedCount,
      errores: errorCount,
    });
  } catch (error: any) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error('❌ Error al obtener áreas para crear adscripciones', errorObj, {
      message: error.message,
    });
    throw error;
  }
}

/**
 * Función para crear puestos
 */
async function seedPuestos(
  puestoRepository: IPuestoRepository,
  logger: ILogger
): Promise<void> {
  logger.info('Iniciando seed de puestos...');

  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const puestoData of PUESTOS_DATA) {
    try {
      // Verificar si el puesto ya existe
      const existingPuesto = await puestoRepository.findByNombre(puestoData.nombre);

      if (existingPuesto) {
        logger.debug(`Puesto "${puestoData.nombre}" ya existe, saltando...`);
        skippedCount++;
        continue;
      }

      // Crear la entidad Puesto
      const puesto = Puesto.create({
        nombre: puestoData.nombre,
        descripcion: puestoData.descripcion,
        isActive: true,
      });

      // Persistir el puesto
      await puestoRepository.create(puesto);
      logger.info(`✅ Puesto creado: ${puestoData.nombre}`);
      createdCount++;
    } catch (error: any) {
      errorCount++;
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error(`❌ Error al crear puesto "${puestoData.nombre}"`, errorObj, {
        nombre: puestoData.nombre,
        message: error.message,
      });
    }
  }

  logger.info('Seed de puestos completado', {
    total: PUESTOS_DATA.length,
    creados: createdCount,
    saltados: skippedCount,
    errores: errorCount,
  });
}

/**
 * Función principal del script
 */
async function seedCatalogs(): Promise<void> {
  let logger: ILogger | null = null;

  try {
    // Registrar módulos en el contenedor de DI
    registerCatalogsModule(container);

    // Resolver dependencias
    logger = container.resolve<ILogger>('logger');
    const areaRepository = container.resolve<IAreaRepository>('areaRepository');
    const adscripcionRepository = container.resolve<IAdscripcionRepository>('adscripcionRepository');
    const puestoRepository = container.resolve<IPuestoRepository>('puestoRepository');

    logger.info('Iniciando script de seed para catálogos');

    // Conectar a MongoDB
    logger.info('Conectando a MongoDB...');
    await connectMongoose(logger);
    logger.info('✅ Conectado a MongoDB');

    // Seed de áreas
    if (!SKIP_AREAS) {
      await seedAreas(areaRepository, logger);
    } else {
      logger.info('⏭️  Saltando seed de áreas (SEED_CATALOGS_SKIP_AREAS=true)');
    }

    // Seed de adscripciones (requiere que existan áreas)
    if (!SKIP_ADSCRIPCIONES) {
      await seedAdscripciones(areaRepository, adscripcionRepository, logger);
    } else {
      logger.info('⏭️  Saltando seed de adscripciones (SEED_CATALOGS_SKIP_ADSCRIPCIONES=true)');
    }

    // Seed de puestos
    if (!SKIP_PUESTOS) {
      await seedPuestos(puestoRepository, logger);
    } else {
      logger.info('⏭️  Saltando seed de puestos (SEED_CATALOGS_SKIP_PUESTOS=true)');
    }

    console.log('\n========================================');
    console.log('✅ Seed de catálogos completado');
    console.log('========================================');
    if (!SKIP_AREAS) {
      console.log(`Áreas: ${AREAS_DATA.length} definidas`);
    }
    if (!SKIP_ADSCRIPCIONES) {
      console.log(`Adscripciones: "${ADSCRIPCION_NOMBRE}" creada para todas las áreas`);
    }
    if (!SKIP_PUESTOS) {
      console.log(`Puestos: ${PUESTOS_DATA.length} definidos`);
    }
    console.log('========================================\n');

  } catch (error: any) {
    if (logger) {
      const errorObj = error instanceof Error ? error : new Error(error.message || String(error));
      logger.error('❌ Error al ejecutar seed de catálogos', errorObj, {
        message: error.message,
        stack: error.stack,
      });
    } else {
      console.error('❌ Error al ejecutar seed de catálogos:', error);
    }
    process.exit(1);
  } finally {
    // Desconectar de MongoDB
    if (logger) {
      logger.info('Desconectando de MongoDB...');
      await disconnectMongoose(logger);
      logger.info('✅ Desconectado de MongoDB');
    }
  }
}

// Ejecutar el script
if (require.main === module) {
  seedCatalogs()
    .then(() => {
      console.log('✅ Script de seed de catálogos completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

export { seedCatalogs };
