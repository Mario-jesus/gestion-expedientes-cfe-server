/**
 * Barrel export para el dominio del módulo minutes
 */

// Enums
export { MinuteType } from './enums/MinuteType';

// Entidades
export { Minute } from './entities/Minute';
export type { MinuteProps } from './entities/Minute';

// Excepciones
export { MinuteNotFoundError } from './exceptions/MinuteNotFoundError';

// Eventos
export { MinuteCreated } from './events/MinuteCreated';
export { MinuteUpdated } from './events/MinuteUpdated';
export { MinuteDeleted } from './events/MinuteDeleted';
export { MinuteDownloaded } from './events/MinuteDownloaded';

// Ports
// Nota: IFileStorageService se reutiliza de documents (no se duplica)
export type { IMinuteRepository } from './ports/output/IMinuteRepository';
