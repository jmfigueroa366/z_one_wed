import { TIPOS_PROYECTO } from '../config/facturacion.ts';
import type { Cancion } from '../models/Cancion.ts';
import type { Proyecto } from '../models/Proyecto.ts';
import type { Invitacion, Solicitud } from '../models/Solicitud.ts';
import type {
    ActualizarCancionRequest,
    CancionDto,
    CrearCancionRequest,
} from './cancionesApi.ts';
import type { ProyectoResumenDto } from './proyectosApi.ts';
import type {
    SolicitudColaboradorDto,
    SolicitudDto,
    SolicitudResumenDto,
} from './solicitudesApi.ts';

// Adaptadores puros entre los DTO del backend y los modelos actuales del frontend.

export type CancionParaEnviar = Pick<Cancion, 'nombre' | 'duracion' | 'partes' | 'requiere_ensayo'>;

export function adaptarProyecto(dto: ProyectoResumenDto, idLocal: number | string): Proyecto {
    return {
        id: idLocal,
        id_remoto: dto.id,
        nombre: dto.titulo,
        tipo: TIPOS_PROYECTO.SENCILLO,
        estado: dto.estado,
        cliente_id: dto.clienteId,
        usuario_id: dto.clienteId,
        cliente_nombre: dto.cliente,
        servicio: dto.servicio,
        etapa_actual: dto.etapaActual,
        sesiones_incluidas: dto.sesionesIncluidas,
        sesiones_cumplidas: dto.sesionesCumplidas,
        creado_en: dto.creadoEn,
        revision_vence_en: dto.revisionVenceEn,
        origen: 'usuario',
    };
}

export function adaptarCancion(dto: CancionDto, proyectoIdLocal?: number | string): Cancion {
    return {
        id: dto.id,
        id_remoto: dto.id,
        proyecto_id: proyectoIdLocal ?? dto.proyectoId,
        nombre: dto.titulo,
        duracion: dto.duracionSeg == null ? null : dto.duracionSeg / 60,
        partes: Array.isArray(dto.partes) ? [...dto.partes] : [],
        requiere_ensayo: Boolean(dto.requiereEnsayo),
        origen: 'usuario',
    };
}

export function aCrearCancionRequest(cancion: CancionParaEnviar): CrearCancionRequest {
    return {
        titulo: cancion.nombre,
        duracionSeg: cancion.duracion == null ? null : Math.round(cancion.duracion * 60),
        partes: Array.isArray(cancion.partes) ? [...cancion.partes] : [],
        requiereEnsayo: Boolean(cancion.requiere_ensayo),
    };
}

export function aActualizarCancionRequest(cancion: Partial<CancionParaEnviar>): ActualizarCancionRequest {
    const request: ActualizarCancionRequest = {};

    if (cancion.nombre !== undefined) {
        request.titulo = cancion.nombre;
    }
    if (cancion.duracion !== undefined) {
        request.duracionSeg = cancion.duracion == null ? null : Math.round(cancion.duracion * 60);
    }
    if (cancion.partes !== undefined) {
        request.partes = [...cancion.partes];
    }
    if (cancion.requiere_ensayo !== undefined) {
        request.requiereEnsayo = cancion.requiere_ensayo;
    }

    return request;
}

function adaptarInvitacion(dto: SolicitudColaboradorDto): Invitacion {
    return {
        colaborador_id: dto.colaboradorId,
        rol: dto.rol,
        estado: dto.estado,
    };
}

export function adaptarSolicitud(dto: SolicitudDto): Solicitud {
    return {
        id: dto.id,
        id_remoto: dto.id,
        usuario_id: dto.clienteId,
        solicitante_nombre: dto.cliente,
        titulo: dto.titulo,
        descripcion: dto.descripcion ?? '',
        tipo: dto.tipo,
        sala_id: dto.salaId,
        cancion_id: dto.cancionId,
        proyecto_id: dto.proyectoId,
        partes: Array.isArray(dto.partes) ? [...dto.partes] : [],
        fecha: dto.fechaDeseada,
        franja: dto.franja ?? '',
        fecha_solicitud: dto.creadoEn,
        colaboradores: Array.isArray(dto.colaboradores) ? dto.colaboradores.map(adaptarInvitacion) : [],
        estado: dto.estado,
    };
}

export function adaptarSolicitudResumen(dto: SolicitudResumenDto): Solicitud {
    return {
        id: dto.id,
        id_remoto: dto.id,
        usuario_id: dto.clienteId,
        solicitante_nombre: dto.cliente,
        titulo: dto.titulo,
        descripcion: '',
        tipo: dto.tipo,
        sala_id: dto.salaId,
        cancion_id: null,
        proyecto_id: null,
        partes: [],
        fecha: dto.fechaDeseada,
        franja: dto.franja ?? '',
        fecha_solicitud: dto.creadoEn,
        colaboradores: [],
        estado: dto.estado,
    };
}
