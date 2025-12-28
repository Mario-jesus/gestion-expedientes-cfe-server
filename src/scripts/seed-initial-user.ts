/**
 * Script de seed para crear un usuario administrador inicial
 * 
 * Este script crea un usuario administrador por defecto si no existe ningún usuario en la base de datos.
 * 
 * Uso:
 *   npm run seed
 *   O directamente: npx ts-node -r tsconfig-paths/register src/scripts/seed-initial-user.ts
 * 
 * Variables de entorno opcionales:
 *   SEED_USERNAME=admin (default: admin)
 *   SEED_PASSWORD=password123 (default: password123)
 *   SEED_EMAIL=admin@cfe.com (default: admin@cfe.com)
 *   SEED_NAME=Administrador Principal (default: Administrador Principal)
 */

import dotenv from 'dotenv';
import { container } from '../shared/infrastructure';
import { registerUsersModule } from '../modules/users/infrastructure/container';
import { IUserRepository } from '../modules/users/domain/ports/output/IUserRepository';
import { IPasswordHasher } from '../modules/users/application/ports/output/IPasswordHasher';
import { IEventBus, ILogger } from '../shared/domain';
import { User } from '../modules/users/domain';
import { UserRole } from '../modules/users/domain/enums/UserRole';
import { connectMongoose, disconnectMongoose } from '../shared/infrastructure/adapters/output/database/mongo/mongoose';

// Cargar variables de entorno
dotenv.config();

// Configuración del usuario inicial
const DEFAULT_USERNAME = process.env.SEED_USERNAME || 'admin';
const DEFAULT_PASSWORD = process.env.SEED_PASSWORD || 'password123';
const DEFAULT_EMAIL = process.env.SEED_EMAIL || 'admin@cfe.com';
const DEFAULT_NAME = process.env.SEED_NAME || 'Administrador Principal';

/**
 * Función principal del script
 */
async function seedInitialUser(): Promise<void> {
  let logger: ILogger | null = null;

  try {
    // Registrar módulos en el contenedor de DI
    registerUsersModule(container);

    // Resolver dependencias
    logger = container.resolve<ILogger>('logger');
    const userRepository = container.resolve<IUserRepository>('userRepository');
    const passwordHasher = container.resolve<IPasswordHasher>('passwordHasher');
    const eventBus = container.resolve<IEventBus>('eventBus');

    logger.info('Iniciando script de seed para usuario inicial');

    // Conectar a MongoDB
    logger.info('Conectando a MongoDB...');
    await connectMongoose(logger);
    logger.info('✅ Conectado a MongoDB');

    // Verificar si ya existe algún usuario
    logger.info('Verificando si ya existe un usuario en la base de datos...');
    const existingUsersResult = await userRepository.findAll(undefined, 1, 0);

    if (existingUsersResult.total > 0) {
      logger.info(`✅ Ya existen ${existingUsersResult.total} usuario(s) en la base de datos`);
      logger.info('Usuarios existentes:');
      existingUsersResult.users.forEach((user: User) => {
        logger!.info(`  - ${user.usernameValue} (${user.emailValue}) - ${user.role}`);
      });
      logger.info('No se creará un usuario inicial. El script finaliza.');
      return;
    }

    logger.info('No se encontraron usuarios. Creando usuario administrador inicial...');

    // Verificar si el username o email ya existen (por si acaso)
    const usernameExists = await userRepository.existsByUsername(DEFAULT_USERNAME);
    if (usernameExists) {
      logger.warn(`⚠️  El username "${DEFAULT_USERNAME}" ya existe. Saltando creación.`);
      return;
    }

    const emailExists = await userRepository.existsByEmail(DEFAULT_EMAIL);
    if (emailExists) {
      logger.warn(`⚠️  El email "${DEFAULT_EMAIL}" ya existe. Saltando creación.`);
      return;
    }

    // Hashear la contraseña
    logger.info('Hasheando contraseña...');
    const hashedPassword = await passwordHasher.hash(DEFAULT_PASSWORD);

    // Crear la entidad User
    logger.info('Creando entidad User...');
    const user = User.create({
      username: DEFAULT_USERNAME,
      email: DEFAULT_EMAIL,
      password: hashedPassword,
      name: DEFAULT_NAME,
      role: UserRole.ADMIN,
      isActive: true,
      // No pasamos createdBy porque es el primer usuario
    });

    // Persistir el usuario
    logger.info('Guardando usuario en la base de datos...');
    const savedUser = await userRepository.create(user);

    logger.info('✅ Usuario administrador inicial creado exitosamente', {
      userId: savedUser.id,
      username: savedUser.usernameValue,
      email: savedUser.emailValue,
      role: savedUser.role,
    });

    // Publicar evento de dominio (opcional, pero mantiene consistencia)
    try {
      const { UserCreated } = await import('../modules/users/domain/events/UserCreated');
      await eventBus.publish(new UserCreated(savedUser, undefined));
      logger.info('✅ Evento UserCreated publicado');
    } catch (error) {
      // Si falla la publicación del evento, no es crítico para el seed
      logger.warn('⚠️  No se pudo publicar el evento UserCreated', { error });
    }

    console.log('\n========================================');
    console.log('✅ Usuario inicial creado exitosamente');
    console.log('========================================');
    console.log(`Username: ${DEFAULT_USERNAME}`);
    console.log(`Email: ${DEFAULT_EMAIL}`);
    console.log(`Password: ${DEFAULT_PASSWORD}`);
    console.log(`Role: ${savedUser.role}`);
    console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
    console.log('========================================\n');

  } catch (error: any) {
    if (logger) {
      const errorObj = error instanceof Error ? error : new Error(error.message || String(error));
      logger.error('❌ Error al crear usuario inicial', errorObj, {
        message: error.message,
        stack: error.stack,
      });
    } else {
      console.error('❌ Error al crear usuario inicial:', error);
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
  seedInitialUser()
    .then(() => {
      console.log('✅ Script de seed completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

export { seedInitialUser };
