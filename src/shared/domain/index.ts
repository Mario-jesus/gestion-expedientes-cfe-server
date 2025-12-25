/**
 * Barrel export para el dominio compartido
 */
export type { ILogger } from './ports/output/ILogger';
export type { IEventBus } from './ports/output/IEventBus';
export type { IDatabase } from './ports/output/IDatabase';
export { DomainEvent } from './entities/DomainEvent';
export { Entity } from './entities/Entity';
