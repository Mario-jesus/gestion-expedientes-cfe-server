import { Entity } from '@shared/domain/entities/Entity';
import { LogAction } from '../enums/LogAction';
import { LogEntity } from '../enums/LogEntity';

/**
 * Propiedades requeridas para crear un log de auditoría
 */
export interface LogEntryProps {
  userId: string;
  action: LogAction;
  entity: LogEntity;
  entityId: string;
  metadata?: Record<string, unknown> | undefined;
}

/**
 * Entidad de dominio LogEntry
 * Representa un registro de auditoría de una acción realizada en el sistema
 * 
 * Los logs son inmutables: una vez creados, no se pueden modificar ni eliminar
 */
export class LogEntry extends Entity<LogEntryProps> {
  private constructor(
    props: LogEntryProps,
    id: string,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    this.props = props;
  }

  private props: LogEntryProps;

  /**
   * Factory method para crear una nueva instancia de LogEntry
   * 
   * Los logs se crean automáticamente, por lo que este método es principalmente
   * para uso interno del sistema
   */
  public static create(
    props: {
      userId: string;
      action: LogAction;
      entity: LogEntity;
      entityId: string;
      metadata?: Record<string, unknown> | undefined;
    },
    id?: string
  ): LogEntry {
    const logId = id || crypto.randomUUID();

    // Validaciones
    if (!props.userId || props.userId.trim().length === 0) {
      throw new Error('El userId es requerido');
    }

    if (!props.action) {
      throw new Error('La acción es requerida');
    }

    if (!Object.values(LogAction).includes(props.action)) {
      throw new Error(
        `La acción debe ser una de: ${Object.values(LogAction).join(', ')}`
      );
    }

    if (!props.entity) {
      throw new Error('La entidad es requerida');
    }

    if (!Object.values(LogEntity).includes(props.entity)) {
      throw new Error(
        `La entidad debe ser una de: ${Object.values(LogEntity).join(', ')}`
      );
    }

    if (!props.entityId || props.entityId.trim().length === 0) {
      throw new Error('El entityId es requerido');
    }

    const logProps: LogEntryProps = {
      userId: props.userId.trim(),
      action: props.action,
      entity: props.entity,
      entityId: props.entityId.trim(),
      metadata: props.metadata || undefined,
    };

    const logEntry = new LogEntry(logProps, logId);
    return logEntry;
  }

  /**
   * Factory method para reconstruir una LogEntry desde persistencia
   */
  public static fromPersistence(
    props: {
      userId: string;
      action: LogAction;
      entity: LogEntity;
      entityId: string;
      metadata?: Record<string, unknown> | undefined;
    },
    id: string,
    createdAt: Date,
    updatedAt: Date
  ): LogEntry {
    const logProps: LogEntryProps = {
      userId: props.userId,
      action: props.action,
      entity: props.entity,
      entityId: props.entityId,
      metadata: props.metadata || undefined,
    };

    return new LogEntry(logProps, id, createdAt, updatedAt);
  }

  // ============================================
  // GETTERS
  // ============================================

  get userId(): string {
    return this.props.userId;
  }

  get action(): LogAction {
    return this.props.action;
  }

  get entity(): LogEntity {
    return this.props.entity;
  }

  get entityId(): string {
    return this.props.entityId;
  }

  get metadata(): Record<string, unknown> | undefined {
    return this.props.metadata;
  }

  // ============================================
  // SERIALIZACIÓN
  // ============================================

  /**
   * Obtiene las propiedades del log (para persistencia)
   */
  toPersistence(): {
    id: string;
    userId: string;
    action: LogAction;
    entity: LogEntity;
    entityId: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  } {
    const result: {
      id: string;
      userId: string;
      action: LogAction;
      entity: LogEntity;
      entityId: string;
      metadata?: Record<string, unknown>;
      createdAt: Date;
      updatedAt: Date;
    } = {
      id: this.id,
      userId: this.props.userId,
      action: this.props.action,
      entity: this.props.entity,
      entityId: this.props.entityId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };

    if (this.props.metadata !== undefined) {
      result.metadata = this.props.metadata;
    }

    return result;
  }

  /**
   * Obtiene los datos públicos del log
   */
  toPublicJSON(): {
    id: string;
    userId: string;
    action: LogAction;
    entity: LogEntity;
    entityId: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  } {
    return this.toPersistence();
  }
}
