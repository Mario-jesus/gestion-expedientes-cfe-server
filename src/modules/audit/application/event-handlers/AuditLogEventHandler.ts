import { ILogger } from '@shared/domain';
import { DomainEvent } from '@shared/domain/entities/DomainEvent';
import { LogAction, LogEntity } from '../../domain';
import { ICreateLogEntryUseCase } from '../ports/input/ICreateLogEntryUseCase';
import { CreateLogEntryDTO } from '../dto/CreateLogEntryDTO';

// Importar todos los eventos de dominio para type safety
import {
  UserCreated,
  UserUpdated,
  UserDeleted,
  UserActivated,
  UserDeactivated,
  UserPasswordChanged,
} from '@modules/users/domain/events';

import {
  CollaboratorCreated,
  CollaboratorUpdated,
  CollaboratorDeleted,
  CollaboratorActivated,
  CollaboratorDeactivated,
} from '@modules/collaborators/domain/events';

import {
  DocumentCreated,
  DocumentUpdated,
  DocumentDeleted,
  DocumentDownloaded,
} from '@modules/documents/domain/events';

import {
  MinuteCreated,
  MinuteUpdated,
  MinuteDeleted,
  MinuteDownloaded,
} from '@modules/minutes/domain/events';

import {
  AreaCreated,
  AreaUpdated,
  AreaDeleted,
  AreaActivated,
  AreaDeactivated,
  AdscripcionCreated,
  AdscripcionUpdated,
  AdscripcionDeleted,
  AdscripcionActivated,
  AdscripcionDeactivated,
  PuestoCreated,
  PuestoUpdated,
  PuestoDeleted,
  PuestoActivated,
  PuestoDeactivated,
  DocumentTypeCreated,
  DocumentTypeUpdated,
  DocumentTypeDeleted,
  DocumentTypeActivated,
  DocumentTypeDeactivated,
} from '@modules/catalogs/domain/events';

import {
  UserLoggedIn,
  UserLoggedOut,
} from '@modules/auth/domain/events';

/**
 * Handler genérico para crear logs de auditoría desde eventos de dominio
 * 
 * Este handler escucha eventos de dominio y crea logs de auditoría automáticamente
 */
export class AuditLogEventHandler {
  constructor(
    private readonly createLogEntryUseCase: ICreateLogEntryUseCase,
    private readonly logger: ILogger
  ) {}

  /**
   * Mapea un evento de dominio a un log de auditoría
   * @param event - Evento de dominio
   * @returns DTO para crear el log, o null si el evento no debe ser auditado
   */
  private mapEventToLogEntry(event: DomainEvent): CreateLogEntryDTO | null {
    // Usuarios
    if (event instanceof UserCreated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.CREATE,
        entity: LogEntity.USER,
        entityId: event.user.id,
        metadata: {
          username: event.user.usernameValue,
          email: event.user.emailValue,
          role: event.user.role,
        },
      };
    }

    if (event instanceof UserUpdated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.UPDATE,
        entity: LogEntity.USER,
        entityId: event.user.id,
        metadata: {
          updatedFields: event.updatedFields,
          username: event.user.usernameValue,
        },
      };
    }

    if (event instanceof UserDeleted) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.DELETE,
        entity: LogEntity.USER,
        entityId: event.userId,
      };
    }

    if (event instanceof UserActivated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.ACTIVATE,
        entity: LogEntity.USER,
        entityId: event.userId,
      };
    }

    if (event instanceof UserDeactivated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.DEACTIVATE,
        entity: LogEntity.USER,
        entityId: event.userId,
      };
    }

    if (event instanceof UserPasswordChanged) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.CHANGE_PASSWORD,
        entity: LogEntity.USER,
        entityId: event.userId,
      };
    }

    // Colaboradores
    if (event instanceof CollaboratorCreated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.CREATE,
        entity: LogEntity.COLLABORATOR,
        entityId: event.collaborator.id,
        metadata: {
          nombre: event.collaborator.nombre,
          apellidos: event.collaborator.apellidos,
          rpe: event.collaborator.rpe,
        },
      };
    }

    if (event instanceof CollaboratorUpdated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.UPDATE,
        entity: LogEntity.COLLABORATOR,
        entityId: event.collaborator.id,
        metadata: {
          nombre: event.collaborator.nombre,
          rpe: event.collaborator.rpe,
        },
      };
    }

    if (event instanceof CollaboratorDeleted) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.DELETE,
        entity: LogEntity.COLLABORATOR,
        entityId: event.collaborator.id,
        metadata: {
          nombre: event.collaborator.nombre,
          rpe: event.collaborator.rpe,
        },
      };
    }

    if (event instanceof CollaboratorActivated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.ACTIVATE,
        entity: LogEntity.COLLABORATOR,
        entityId: event.collaborator.id,
      };
    }

    if (event instanceof CollaboratorDeactivated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.DEACTIVATE,
        entity: LogEntity.COLLABORATOR,
        entityId: event.collaborator.id,
      };
    }

    // Documentos
    if (event instanceof DocumentCreated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.UPLOAD,
        entity: LogEntity.DOCUMENT,
        entityId: event.document.id,
        metadata: {
          collaboratorId: event.document.collaboratorId,
          kind: event.document.kind,
          fileName: event.document.fileName,
          fileSize: event.document.fileSize,
        },
      };
    }

    if (event instanceof DocumentUpdated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.UPDATE,
        entity: LogEntity.DOCUMENT,
        entityId: event.document.id,
        metadata: {
          updatedFields: event.updatedFields,
          collaboratorId: event.document.collaboratorId,
          kind: event.document.kind,
        },
      };
    }

    if (event instanceof DocumentDeleted) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.DELETE,
        entity: LogEntity.DOCUMENT,
        entityId: event.document.id,
        metadata: {
          collaboratorId: event.document.collaboratorId,
          kind: event.document.kind,
          fileName: event.document.fileName,
        },
      };
    }

    if (event instanceof DocumentDownloaded) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.DOWNLOAD,
        entity: LogEntity.DOCUMENT,
        entityId: event.document.id,
        metadata: {
          collaboratorId: event.document.collaboratorId,
          fileName: event.document.fileName,
        },
      };
    }

    // Minutas
    if (event instanceof MinuteCreated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.UPLOAD,
        entity: LogEntity.MINUTE,
        entityId: event.minute.id,
        metadata: {
          titulo: event.minute.titulo,
          tipo: event.minute.tipo,
          fileName: event.minute.fileName,
          fileSize: event.minute.fileSize,
        },
      };
    }

    if (event instanceof MinuteUpdated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.UPDATE,
        entity: LogEntity.MINUTE,
        entityId: event.minute.id,
        metadata: {
          updatedFields: event.updatedFields,
          titulo: event.minute.titulo,
          tipo: event.minute.tipo,
        },
      };
    }

    if (event instanceof MinuteDeleted) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.DELETE,
        entity: LogEntity.MINUTE,
        entityId: event.minute.id,
        metadata: {
          titulo: event.minute.titulo,
          tipo: event.minute.tipo,
          fileName: event.minute.fileName,
        },
      };
    }

    if (event instanceof MinuteDownloaded) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.DOWNLOAD,
        entity: LogEntity.MINUTE,
        entityId: event.minute.id,
        metadata: {
          titulo: event.minute.titulo,
          fileName: event.minute.fileName,
        },
      };
    }

    // Catálogos - Áreas
    if (event instanceof AreaCreated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.CREATE,
        entity: LogEntity.AREA,
        entityId: event.area.id,
        metadata: {
          nombre: event.area.nombre,
        },
      };
    }

    if (event instanceof AreaUpdated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.UPDATE,
        entity: LogEntity.AREA,
        entityId: event.area.id,
        metadata: {
          nombre: event.area.nombre,
        },
      };
    }

    if (event instanceof AreaDeleted) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.DELETE,
        entity: LogEntity.AREA,
        entityId: event.area.id,
        metadata: {
          nombre: event.area.nombre,
        },
      };
    }

    if (event instanceof AreaActivated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.ACTIVATE,
        entity: LogEntity.AREA,
        entityId: event.area.id,
      };
    }

    if (event instanceof AreaDeactivated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.DEACTIVATE,
        entity: LogEntity.AREA,
        entityId: event.area.id,
      };
    }

    // Catálogos - Adscripciones
    if (event instanceof AdscripcionCreated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.CREATE,
        entity: LogEntity.ADSCRIPCION,
        entityId: event.adscripcion.id,
        metadata: {
          nombre: event.adscripcion.nombre,
          adscripcion: event.adscripcion.adscripcion,
        },
      };
    }

    if (event instanceof AdscripcionUpdated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.UPDATE,
        entity: LogEntity.ADSCRIPCION,
        entityId: event.adscripcion.id,
        metadata: {
          nombre: event.adscripcion.nombre,
        },
      };
    }

    if (event instanceof AdscripcionDeleted) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.DELETE,
        entity: LogEntity.ADSCRIPCION,
        entityId: event.adscripcion.id,
        metadata: {
          nombre: event.adscripcion.nombre,
        },
      };
    }

    if (event instanceof AdscripcionActivated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.ACTIVATE,
        entity: LogEntity.ADSCRIPCION,
        entityId: event.adscripcion.id,
      };
    }

    if (event instanceof AdscripcionDeactivated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.DEACTIVATE,
        entity: LogEntity.ADSCRIPCION,
        entityId: event.adscripcion.id,
      };
    }

    // Catálogos - Puestos
    if (event instanceof PuestoCreated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.CREATE,
        entity: LogEntity.PUESTO,
        entityId: event.puesto.id,
        metadata: {
          nombre: event.puesto.nombre,
        },
      };
    }

    if (event instanceof PuestoUpdated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.UPDATE,
        entity: LogEntity.PUESTO,
        entityId: event.puesto.id,
        metadata: {
          nombre: event.puesto.nombre,
        },
      };
    }

    if (event instanceof PuestoDeleted) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.DELETE,
        entity: LogEntity.PUESTO,
        entityId: event.puesto.id,
        metadata: {
          nombre: event.puesto.nombre,
        },
      };
    }

    if (event instanceof PuestoActivated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.ACTIVATE,
        entity: LogEntity.PUESTO,
        entityId: event.puesto.id,
      };
    }

    if (event instanceof PuestoDeactivated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.DEACTIVATE,
        entity: LogEntity.PUESTO,
        entityId: event.puesto.id,
      };
    }

    // Catálogos - Tipos de Documento
    if (event instanceof DocumentTypeCreated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.CREATE,
        entity: LogEntity.DOCUMENT_TYPE,
        entityId: event.documentType.id,
        metadata: {
          nombre: event.documentType.nombre,
          kind: event.documentType.kind,
        },
      };
    }

    if (event instanceof DocumentTypeUpdated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.UPDATE,
        entity: LogEntity.DOCUMENT_TYPE,
        entityId: event.documentType.id,
        metadata: {
          nombre: event.documentType.nombre,
        },
      };
    }

    if (event instanceof DocumentTypeDeleted) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.DELETE,
        entity: LogEntity.DOCUMENT_TYPE,
        entityId: event.documentType.id,
        metadata: {
          nombre: event.documentType.nombre,
        },
      };
    }

    if (event instanceof DocumentTypeActivated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.ACTIVATE,
        entity: LogEntity.DOCUMENT_TYPE,
        entityId: event.documentType.id,
      };
    }

    if (event instanceof DocumentTypeDeactivated) {
      const userId = event.performedBy;
      if (!userId) return null;
      return {
        userId,
        action: LogAction.DEACTIVATE,
        entity: LogEntity.DOCUMENT_TYPE,
        entityId: event.documentType.id,
      };
    }

    // Autenticación
    if (event instanceof UserLoggedIn) {
      return {
        userId: event.userId,
        action: LogAction.LOGIN,
        entity: LogEntity.USER,
        entityId: event.userId,
        metadata: {
          username: event.username,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
        },
      };
    }

    if (event instanceof UserLoggedOut) {
      return {
        userId: event.userId,
        action: LogAction.LOGOUT,
        entity: LogEntity.USER,
        entityId: event.userId,
        metadata: {
          username: event.username,
          revokedAllTokens: event.revokedAllTokens,
        },
      };
    }

    // Evento no mapeado, no crear log
    return null;
  }

  /**
   * Maneja un evento de dominio y crea un log de auditoría
   * @param event - Evento de dominio
   */
  async handle(event: DomainEvent): Promise<void> {
    try {
      const logDTO = this.mapEventToLogEntry(event);

      if (!logDTO) {
        // Evento no debe ser auditado
        return;
      }

      await this.createLogEntryUseCase.execute(logDTO);

      this.logger.debug('Log de auditoría creado desde evento', {
        eventName: event.constructor.name,
        eventId: event.eventId,
        logAction: logDTO.action,
        logEntity: logDTO.entity,
      });
    } catch (error) {
      // No fallar el evento si el log falla
      this.logger.error(
        `Error al crear log de auditoría desde evento ${event.constructor.name}`,
        error as Error,
        {
          eventId: event.eventId,
        }
      );
    }
  }
}
