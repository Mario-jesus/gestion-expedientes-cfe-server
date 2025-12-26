/**
 * Barrel export para el dominio del módulo users
 */
export { User, type UserProps } from './entities/User';
export { UserRole } from './enums/UserRole';
export type { IUserRepository } from './ports/output/IUserRepository';
export {
  UserNotFoundError,
  UserInactiveError,
  InvalidCredentialsError,
  DuplicateUserError,
  ForbiddenError,
} from './exceptions';
export {
  UserCreated,
  UserUpdated,
  UserPasswordChanged,
  UserActivated,
  UserDeactivated,
  UserDeleted,
} from './events';
export { Email, Username, HashedPassword, FullName } from './value-objects';
