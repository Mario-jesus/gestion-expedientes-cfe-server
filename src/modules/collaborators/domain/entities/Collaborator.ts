import { Entity } from '@shared/domain/entities/Entity';
import { TipoContrato } from '../enums/TipoContrato';
import { RPE } from '../value-objects/RPE';
import { RFC } from '../value-objects/RFC';
import { CURP } from '../value-objects/CURP';
import { IMSS } from '../value-objects/IMSS';

/**
 * Propiedades requeridas para crear un colaborador
 * Usa value objects para campos con validaciones complejas
 */
export interface CollaboratorProps {
  nombre: string;
  apellidos: string;
  rpe: RPE;
  rtt?: string | undefined; // Opcional
  areaId: string;
  adscripcionId: string;
  puestoId: string;
  tipoContrato: TipoContrato;
  rfc: RFC;
  curp: CURP;
  imss: IMSS;
  isActive: boolean;
  createdBy?: string | undefined;
}

/**
 * Entidad de dominio Collaborator
 * Representa a un colaborador de CFE con sus datos personales y laborales
 */
export class Collaborator extends Entity<CollaboratorProps> {
  private constructor(
    props: CollaboratorProps,
    id: string,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    this.props = props;
  }

  private props: CollaboratorProps;

  /**
   * Factory method para crear una nueva instancia de Collaborator
   * Acepta strings primitivos y los convierte a value objects donde corresponde
   */
  public static create(
    props: {
      nombre: string;
      apellidos: string;
      rpe: string | RPE;
      rtt?: string | undefined;
      areaId: string;
      adscripcionId: string;
      puestoId: string;
      tipoContrato: TipoContrato;
      rfc: string | RFC;
      curp: string | CURP;
      imss: string | IMSS;
      isActive: boolean;
      createdBy?: string | undefined;
    },
    id?: string
  ): Collaborator {
    const collaboratorId = id || crypto.randomUUID();

    // Convertir strings a value objects si es necesario
    const collaboratorProps: CollaboratorProps = {
      nombre: props.nombre.trim(),
      apellidos: props.apellidos.trim(),
      rpe:
        props.rpe instanceof RPE ? props.rpe : RPE.create(props.rpe),
      rtt: props.rtt?.trim() || undefined,
      areaId: props.areaId,
      adscripcionId: props.adscripcionId,
      puestoId: props.puestoId,
      tipoContrato: props.tipoContrato,
      rfc: props.rfc instanceof RFC ? props.rfc : RFC.create(props.rfc),
      curp: props.curp instanceof CURP ? props.curp : CURP.create(props.curp),
      imss: props.imss instanceof IMSS ? props.imss : IMSS.create(props.imss),
      isActive: props.isActive,
      ...(props.createdBy !== undefined && { createdBy: props.createdBy }),
    };

    // Validar tipo de contrato
    if (!Object.values(TipoContrato).includes(collaboratorProps.tipoContrato)) {
      throw new Error(
        `El tipo de contrato debe ser uno de: ${Object.values(TipoContrato).join(', ')}`
      );
    }

    // Validar que nombre y apellidos no estén vacíos
    if (!collaboratorProps.nombre) {
      throw new Error('El nombre es requerido');
    }
    if (!collaboratorProps.apellidos) {
      throw new Error('Los apellidos son requeridos');
    }

    const collaborator = new Collaborator(collaboratorProps, collaboratorId);
    return collaborator;
  }

  /**
   * Factory method para reconstruir un Collaborator desde persistencia
   * Acepta strings primitivos (desde base de datos) y los convierte a value objects
   */
  public static fromPersistence(
    props: {
      nombre: string;
      apellidos: string;
      rpe: string;
      rtt?: string | undefined;
      areaId: string;
      adscripcionId: string;
      puestoId: string;
      tipoContrato: TipoContrato;
      rfc: string;
      curp: string;
      imss: string;
      isActive: boolean;
      createdBy?: string | undefined;
    },
    id: string,
    createdAt: Date,
    updatedAt: Date
  ): Collaborator {
    const collaboratorProps: CollaboratorProps = {
      nombre: props.nombre,
      apellidos: props.apellidos,
      rpe: RPE.fromPersistence(props.rpe),
      rtt: props.rtt || undefined,
      areaId: props.areaId,
      adscripcionId: props.adscripcionId,
      puestoId: props.puestoId,
      tipoContrato: props.tipoContrato,
      rfc: RFC.fromPersistence(props.rfc),
      curp: CURP.fromPersistence(props.curp),
      imss: IMSS.fromPersistence(props.imss),
      isActive: props.isActive,
      ...(props.createdBy !== undefined && { createdBy: props.createdBy }),
    };

    return new Collaborator(collaboratorProps, id, createdAt, updatedAt);
  }

  // ============================================
  // GETTERS
  // ============================================

  get nombre(): string {
    return this.props.nombre;
  }

  get apellidos(): string {
    return this.props.apellidos;
  }

  get rpe(): RPE {
    return this.props.rpe;
  }

  get rtt(): string | undefined {
    return this.props.rtt;
  }

  get areaId(): string {
    return this.props.areaId;
  }

  get adscripcionId(): string {
    return this.props.adscripcionId;
  }

  get puestoId(): string {
    return this.props.puestoId;
  }

  get tipoContrato(): TipoContrato {
    return this.props.tipoContrato;
  }

  get rfc(): RFC {
    return this.props.rfc;
  }

  get curp(): CURP {
    return this.props.curp;
  }

  get imss(): IMSS {
    return this.props.imss;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdBy(): string | undefined {
    return this.props.createdBy;
  }

  // Getters para obtener valores primitivos (conveniencia)
  get rpeValue(): string {
    return this.props.rpe.value;
  }

  get rfcValue(): string {
    return this.props.rfc.value;
  }

  get curpValue(): string {
    return this.props.curp.value;
  }

  get imssValue(): string {
    return this.props.imss.value;
  }

  /**
   * Obtiene el nombre completo del colaborador
   */
  get nombreCompleto(): string {
    return `${this.props.nombre} ${this.props.apellidos}`.trim();
  }

  // ============================================
  // MÉTODOS DE NEGOCIO
  // ============================================

  /**
   * Activa el colaborador
   */
  activate(): void {
    if (this.props.isActive) {
      return; // Ya está activo
    }
    this.props.isActive = true;
    this.markAsUpdated();
  }

  /**
   * Desactiva el colaborador (baja lógica)
   */
  deactivate(): void {
    if (!this.props.isActive) {
      return; // Ya está inactivo
    }
    this.props.isActive = false;
    this.markAsUpdated();
  }

  /**
   * Actualiza el nombre del colaborador
   */
  updateNombre(nombre: string): void {
    const trimmedNombre = nombre.trim();
    if (!trimmedNombre) {
      throw new Error('El nombre es requerido');
    }
    this.props.nombre = trimmedNombre;
    this.markAsUpdated();
  }

  /**
   * Actualiza los apellidos del colaborador
   */
  updateApellidos(apellidos: string): void {
    const trimmedApellidos = apellidos.trim();
    if (!trimmedApellidos) {
      throw new Error('Los apellidos son requeridos');
    }
    this.props.apellidos = trimmedApellidos;
    this.markAsUpdated();
  }

  /**
   * Actualiza el RTT del colaborador
   */
  updateRTT(rtt: string | undefined): void {
    this.props.rtt = rtt?.trim() || undefined;
    this.markAsUpdated();
  }

  /**
   * Actualiza el área del colaborador
   */
  updateAreaId(areaId: string): void {
    if (!areaId) {
      throw new Error('El areaId es requerido');
    }
    this.props.areaId = areaId;
    this.markAsUpdated();
  }

  /**
   * Actualiza la adscripción del colaborador
   */
  updateAdscripcionId(adscripcionId: string): void {
    if (!adscripcionId) {
      throw new Error('El adscripcionId es requerido');
    }
    this.props.adscripcionId = adscripcionId;
    this.markAsUpdated();
  }

  /**
   * Actualiza el puesto del colaborador
   */
  updatePuestoId(puestoId: string): void {
    if (!puestoId) {
      throw new Error('El puestoId es requerido');
    }
    this.props.puestoId = puestoId;
    this.markAsUpdated();
  }

  /**
   * Actualiza el tipo de contrato del colaborador
   */
  updateTipoContrato(tipoContrato: TipoContrato): void {
    if (!Object.values(TipoContrato).includes(tipoContrato)) {
      throw new Error(
        `El tipo de contrato debe ser uno de: ${Object.values(TipoContrato).join(', ')}`
      );
    }
    this.props.tipoContrato = tipoContrato;
    this.markAsUpdated();
  }

  /**
   * Actualiza el RFC del colaborador
   */
  updateRFC(rfc: string | RFC): void {
    const rfcVO = rfc instanceof RFC ? rfc : RFC.create(rfc);
    this.props.rfc = rfcVO;
    this.markAsUpdated();
  }

  /**
   * Actualiza el CURP del colaborador
   */
  updateCURP(curp: string | CURP): void {
    const curpVO = curp instanceof CURP ? curp : CURP.create(curp);
    this.props.curp = curpVO;
    this.markAsUpdated();
  }

  /**
   * Actualiza el IMSS del colaborador
   */
  updateIMSS(imss: string | IMSS): void {
    const imssVO = imss instanceof IMSS ? imss : IMSS.create(imss);
    this.props.imss = imssVO;
    this.markAsUpdated();
  }

  // ============================================
  // SERIALIZACIÓN
  // ============================================

  /**
   * Obtiene las propiedades del colaborador (para persistencia)
   * Convierte value objects a strings primitivos
   */
  toPersistence(): {
    id: string;
    nombre: string;
    apellidos: string;
    rpe: string;
    rtt?: string;
    areaId: string;
    adscripcionId: string;
    puestoId: string;
    tipoContrato: TipoContrato;
    rfc: string;
    curp: string;
    imss: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
  } {
    const result: {
      id: string;
      nombre: string;
      apellidos: string;
      rpe: string;
      rtt?: string;
      areaId: string;
      adscripcionId: string;
      puestoId: string;
      tipoContrato: TipoContrato;
      rfc: string;
      curp: string;
      imss: string;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
      createdBy?: string;
    } = {
      id: this.id,
      nombre: this.props.nombre,
      apellidos: this.props.apellidos,
      rpe: this.props.rpe.value,
      areaId: this.props.areaId,
      adscripcionId: this.props.adscripcionId,
      puestoId: this.props.puestoId,
      tipoContrato: this.props.tipoContrato,
      rfc: this.props.rfc.value,
      curp: this.props.curp.value,
      imss: this.props.imss.value,
      isActive: this.props.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };

    if (this.props.rtt !== undefined) {
      result.rtt = this.props.rtt;
    }

    if (this.props.createdBy !== undefined) {
      result.createdBy = this.props.createdBy;
    }

    return result;
  }

  /**
   * Obtiene los datos públicos del colaborador
   * Convierte value objects a strings primitivos
   */
  toPublicJSON(): {
    id: string;
    nombre: string;
    apellidos: string;
    nombreCompleto: string;
    rpe: string;
    rtt?: string;
    areaId: string;
    adscripcionId: string;
    puestoId: string;
    tipoContrato: TipoContrato;
    rfc: string;
    curp: string;
    imss: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
  } {
    const result: {
      id: string;
      nombre: string;
      apellidos: string;
      nombreCompleto: string;
      rpe: string;
      rtt?: string;
      areaId: string;
      adscripcionId: string;
      puestoId: string;
      tipoContrato: TipoContrato;
      rfc: string;
      curp: string;
      imss: string;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
      createdBy?: string;
    } = {
      id: this.id,
      nombre: this.props.nombre,
      apellidos: this.props.apellidos,
      nombreCompleto: this.nombreCompleto,
      rpe: this.props.rpe.value,
      areaId: this.props.areaId,
      adscripcionId: this.props.adscripcionId,
      puestoId: this.props.puestoId,
      tipoContrato: this.props.tipoContrato,
      rfc: this.props.rfc.value,
      curp: this.props.curp.value,
      imss: this.props.imss.value,
      isActive: this.props.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };

    if (this.props.rtt !== undefined) {
      result.rtt = this.props.rtt;
    }

    if (this.props.createdBy) {
      result.createdBy = this.props.createdBy;
    }

    return result;
  }
}
