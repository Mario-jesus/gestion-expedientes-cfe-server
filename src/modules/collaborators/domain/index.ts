/**
 * Barrel export para el dominio del módulo collaborators
 */

// Entidades
export { Collaborator } from './entities/Collaborator';
export type { CollaboratorProps } from './entities/Collaborator';

// Enums
export { TipoContrato } from './enums/TipoContrato';

// Value Objects
export { RPE } from './value-objects/RPE';
export { RFC } from './value-objects/RFC';
export { CURP } from './value-objects/CURP';
export { IMSS } from './value-objects/IMSS';

// Excepciones
export { CollaboratorNotFoundError } from './exceptions/CollaboratorNotFoundError';
export { DuplicateCollaboratorError } from './exceptions/DuplicateCollaboratorError';

// Eventos
export { CollaboratorCreated } from './events/CollaboratorCreated';
export { CollaboratorUpdated } from './events/CollaboratorUpdated';
export { CollaboratorDeleted } from './events/CollaboratorDeleted';
export { CollaboratorActivated } from './events/CollaboratorActivated';
export { CollaboratorDeactivated } from './events/CollaboratorDeactivated';

// Ports
export type { ICollaboratorRepository } from './ports/output/ICollaboratorRepository';
