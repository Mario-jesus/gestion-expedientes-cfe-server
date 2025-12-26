import { IEventBus, ILogger } from '@shared/domain';
import { User } from '../../domain';
import { DuplicateUserError } from '../../domain/exceptions/DuplicateUserError';
import { UserCreated } from '../../domain/events/UserCreated';
import { IUserRepository } from '../../domain/ports/output/IUserRepository';
import { IPasswordHasher } from '../ports/output/IPasswordHasher';
import { ICreateUserUseCase } from '../ports/input/ICreateUserUseCase';
import { CreateUserDTO } from '../dto/CreateUserDTO';
import { UserAuthorizationService } from '../services/UserAuthorizationService';

/**
 * Caso de uso para crear un nuevo usuario
 * 
 * Se encarga de:
 * - Validar permisos (solo administradores pueden crear usuarios)
 * - Validar que el username y email no existan
 * - Hashear la contraseña antes de guardarla
 * - Crear la entidad User con los value objects correctos
 * - Persistir el usuario
 * - Publicar eventos de dominio (UserCreated)
 */
export class CreateUserUseCase implements ICreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly eventBus: IEventBus,
    private readonly userAuthorizationService: UserAuthorizationService,
    private readonly logger: ILogger
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param dto - DTO con los datos del usuario a crear
   * @param createdBy - ID del usuario que está creando este usuario (opcional, para audit)
   * @returns El usuario creado
   * @throws ForbiddenError si el usuario no tiene permisos para crear usuarios
   * @throws DuplicateUserError si el username o email ya existe
   */
  async execute(dto: CreateUserDTO, createdBy?: string): Promise<User> {
    this.logger.info('Ejecutando caso de uso: Crear usuario', {
      username: dto.username,
      email: dto.email,
      role: dto.role,
      createdBy,
    });

    // Validar permisos: solo administradores pueden crear usuarios
    if (createdBy) {
      await this.userAuthorizationService.requireCanCreateUser(createdBy);
    }

    // Validar que el username no exista
    const usernameExists = await this.userRepository.existsByUsername(dto.username);
    if (usernameExists) {
      this.logger.warn('Intento de crear usuario con username duplicado', {
        username: dto.username,
        createdBy,
      });
      throw new DuplicateUserError('username', dto.username);
    }

    // Validar que el email no exista
    const emailExists = await this.userRepository.existsByEmail(dto.email);
    if (emailExists) {
      this.logger.warn('Intento de crear usuario con email duplicado', {
        email: dto.email,
        createdBy,
      });
      throw new DuplicateUserError('email', dto.email);
    }

    // Hashear la contraseña
    const hashedPassword = await this.passwordHasher.hash(dto.password);

    // Crear la entidad User
    // El método User.create acepta strings y los convierte a value objects
    const user = User.create(
      {
        username: dto.username,
        email: dto.email,
        password: hashedPassword, // Ya está hasheada
        name: dto.name,
        role: dto.role,
        isActive: dto.isActive ?? true, // Default: true
        createdBy,
      }
    );

    // Persistir el usuario
    const savedUser = await this.userRepository.create(user);

    // Publicar evento de dominio
    // createdBy se usa como performedBy en el evento
    await this.eventBus.publish(new UserCreated(savedUser, createdBy));

    this.logger.info('Usuario creado exitosamente', {
      userId: savedUser.id,
      username: savedUser.usernameValue,
      createdBy,
    });

    return savedUser;
  }
}
