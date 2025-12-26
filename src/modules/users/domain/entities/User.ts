import { Entity } from '@shared/domain/entities/Entity';
import { UserRole } from '../enums/UserRole';
import { Email } from '../value-objects/Email';
import { Username } from '../value-objects/Username';
import { HashedPassword } from '../value-objects/HashedPassword';
import { FullName } from '../value-objects/FullName';

/**
 * Propiedades requeridas para crear un usuario
 * Usa value objects para encapsular validaciones
 */
export interface UserProps {
  username: Username;
  email: Email;
  password: HashedPassword; // Contraseña hasheada
  name: FullName;
  role: UserRole;
  isActive: boolean;
  createdBy?: string | undefined;
}

/**
 * Entidad de dominio User
 * Representa a un usuario del sistema con sus datos y reglas de negocio
 */
export class User extends Entity<UserProps> {
  private constructor(props: UserProps, id: string, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this.props = props;
  }

  private props: UserProps;

  /**
   * Factory method para crear una nueva instancia de User
   * Acepta strings primitivos y los convierte a value objects
   */
  public static create(props: {
    username: string | Username;
    email: string | Email;
    password: string | HashedPassword;
    name: string | FullName;
    role: UserRole;
    isActive: boolean;
    createdBy?: string | undefined;
  }, id?: string): User {
    const userId = id || crypto.randomUUID();

    // Convertir strings a value objects si es necesario
    const userProps: UserProps = {
      username: props.username instanceof Username 
        ? props.username 
        : Username.create(props.username),
      email: props.email instanceof Email 
        ? props.email 
        : Email.create(props.email),
      password: props.password instanceof HashedPassword 
        ? props.password 
        : HashedPassword.create(props.password),
      name: props.name instanceof FullName 
        ? props.name 
        : FullName.create(props.name),
      role: props.role,
      isActive: props.isActive,
      ...(props.createdBy !== undefined && { createdBy: props.createdBy }),
    };

    // Validar rol
    if (!Object.values(UserRole).includes(userProps.role)) {
      throw new Error(`El rol debe ser uno de: ${Object.values(UserRole).join(', ')}`);
    }

    const user = new User(userProps, userId);
    return user;
  }

  /**
   * Factory method para reconstruir un User desde persistencia
   * Acepta strings primitivos (desde base de datos) y los convierte a value objects
   */
  public static fromPersistence(props: {
    username: string;
    email: string;
    password: string;
    name: string;
    role: UserRole;
    isActive: boolean;
    createdBy?: string | undefined;
  }, id: string, createdAt: Date, updatedAt: Date): User {
    const userProps: UserProps = {
      username: Username.fromPersistence(props.username),
      email: Email.fromPersistence(props.email),
      password: HashedPassword.fromPersistence(props.password),
      name: FullName.fromPersistence(props.name),
      role: props.role,
      isActive: props.isActive,
      ...(props.createdBy !== undefined && { createdBy: props.createdBy }),
    };

    return new User(userProps, id, createdAt, updatedAt);
  }

  // Getters
  // Retornan value objects para mantener la encapsulación
  get username(): Username {
    return this.props.username;
  }

  get email(): Email {
    return this.props.email;
  }

  get password(): HashedPassword {
    return this.props.password;
  }

  get name(): FullName {
    return this.props.name;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdBy(): string | undefined {
    return this.props.createdBy;
  }

  // Getters para obtener valores primitivos (conveniencia)
  get usernameValue(): string {
    return this.props.username.value;
  }

  get emailValue(): string {
    return this.props.email.value;
  }

  get passwordValue(): string {
    return this.props.password.value;
  }

  get nameValue(): string {
    return this.props.name.value;
  }

  /**
   * Verifica si el usuario puede iniciar sesión
   */
  canLogin(): boolean {
    return this.props.isActive;
  }

  /**
   * Verifica si el usuario es administrador
   */
  isAdmin(): boolean {
    return this.props.role === UserRole.ADMIN;
  }

  /**
   * Verifica si el usuario es operador
   */
  isOperator(): boolean {
    return this.props.role === UserRole.OPERATOR;
  }

  /**
   * Activa el usuario
   */
  activate(): void {
    if (this.props.isActive) {
      return; // Ya está activo
    }
    this.props.isActive = true;
    this.markAsUpdated();
  }

  /**
   * Desactiva el usuario
   */
  deactivate(): void {
    if (!this.props.isActive) {
      return; // Ya está inactivo
    }
    this.props.isActive = false;
    this.markAsUpdated();
  }

  /**
   * Actualiza el nombre del usuario
   * @param name - Nombre como string o FullName value object
   */
  updateName(name: string | FullName): void {
    const fullName = name instanceof FullName 
      ? name 
      : FullName.create(name);
    this.props.name = fullName;
    this.markAsUpdated();
  }

  /**
   * Actualiza el email del usuario
   * @param email - Email como string o Email value object
   */
  updateEmail(email: string | Email): void {
    const emailVO = email instanceof Email 
      ? email 
      : Email.create(email);
    this.props.email = emailVO;
    this.markAsUpdated();
  }

  /**
   * Actualiza la contraseña del usuario
   * @param hashedPassword - La contraseña hasheada como string o HashedPassword value object
   */
  updatePassword(hashedPassword: string | HashedPassword): void {
    const passwordVO = hashedPassword instanceof HashedPassword 
      ? hashedPassword 
      : HashedPassword.create(hashedPassword);
    this.props.password = passwordVO;
    this.markAsUpdated();
  }

  /**
   * Actualiza el rol del usuario
   */
  updateRole(role: UserRole): void {
    if (!Object.values(UserRole).includes(role)) {
      throw new Error(`El rol debe ser uno de: ${Object.values(UserRole).join(', ')}`);
    }
    this.props.role = role;
    this.markAsUpdated();
  }

  /**
   * Obtiene las propiedades del usuario (para persistencia)
   * Convierte value objects a strings primitivos
   */
  toPersistence(): {
    id: string;
    username: string;
    email: string;
    password: string;
    name: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
  } {
    const result: {
      id: string;
      username: string;
      email: string;
      password: string;
      name: string;
      role: UserRole;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
      createdBy?: string;
    } = {
      id: this.id,
      username: this.props.username.value,
      email: this.props.email.value,
      password: this.props.password.value,
      name: this.props.name.value,
      role: this.props.role,
      isActive: this.props.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };

    if (this.props.createdBy !== undefined) {
      result.createdBy = this.props.createdBy;
    }

    return result;
  }

  /**
   * Obtiene los datos públicos del usuario (sin contraseña)
   * Convierte value objects a strings primitivos
   */
  toPublicJSON(): {
    id: string;
    username: string;
    email: string;
    name: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
  } {
    const result: {
      id: string;
      username: string;
      email: string;
      name: string;
      role: UserRole;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
      createdBy?: string;
    } = {
      id: this.id,
      username: this.props.username.value,
      email: this.props.email.value,
      name: this.props.name.value,
      role: this.props.role,
      isActive: this.props.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };

    if (this.props.createdBy) {
      result.createdBy = this.props.createdBy;
    }

    return result;
  }
}
