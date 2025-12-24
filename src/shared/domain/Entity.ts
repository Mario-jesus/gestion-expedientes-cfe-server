import { DomainEvent } from './DomainEvent';

/**
 * Clase base para todas las entidades de dominio
 * Proporciona funcionalidad común a todas las entidades
 */
export abstract class Entity<T> {
  protected readonly _id: string;
  protected readonly _createdAt: Date;
  protected _updatedAt: Date;
  protected _domainEvents: DomainEvent[] = [];

  constructor(id: string, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
  }

  get id(): string {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Marca la entidad como actualizada
   */
  protected markAsUpdated(): void {
    this._updatedAt = new Date();
  }

  /**
   * Agrega un evento de dominio
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Obtiene todos los eventos de dominio pendientes
   */
  getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * Limpia los eventos de dominio (después de publicarlos)
   */
  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Compara si dos entidades son iguales
   */
  equals(other: Entity<T>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return this._id === other._id;
  }
}
