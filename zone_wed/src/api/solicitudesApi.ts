import { apiGet, apiPatch, apiPost } from './apiClient.ts';

// DTOs de Z-one_backend/Dtos/SolicitudDtos.cs (System.Text.Json en camelCase).

export interface InvitacionRequest {
    colaboradorId: string;
    rol?: string | null;
}

export interface CrearSolicitudRequest {
    titulo?: string | null;
    descripcion?: string | null;
    tipo?: string | null;
    fechaDeseada?: string | null;
    franja?: string | null;
    partes?: string[] | null;
    salaId?: number | null;
    cancionId?: number | null;
    proyectoId?: number | null;
    colaboradores?: InvitacionRequest[] | null;
    clienteId?: string | null;
}

export interface CambiarEstadoSolicitudRequest {
    estado?: string | null;
}

export interface ResponderInvitacionRequest {
    estado?: string | null;
}

export interface SolicitudColaboradorDto {
    colaboradorId: string;
    nombre: string;
    perfil: string;
    rol: string | null;
    estado: string;
    creadoEn: string;
}

export interface SolicitudDto {
    id: number;
    clienteId: string;
    cliente: string;
    salaId: number | null;
    sala: string | null;
    cancionId: number | null;
    cancion: string | null;
    proyectoId: number | null;
    proyecto: string | null;
    titulo: string;
    descripcion: string | null;
    tipo: string;
    fechaDeseada: string | null;
    franja: string | null;
    partes: string[];
    estado: string;
    creadoEn: string;
    actualizadoEn: string;
    colaboradores: SolicitudColaboradorDto[];
}

export interface SolicitudResumenDto {
    id: number;
    clienteId: string;
    cliente: string;
    salaId: number | null;
    sala: string | null;
    titulo: string;
    tipo: string;
    fechaDeseada: string | null;
    franja: string | null;
    estado: string;
    invitados: number;
    aceptados: number;
    creadoEn: string;
    actualizadoEn: string;
}

export interface PaginaDto<T> {
    items: T[];
    total: number;
    pagina: number;
    tamano: number;
}

export interface ListarSolicitudesParams {
    estado?: string;
    pagina?: number;
    tamano?: number;
}

function queryDeListado(params: ListarSolicitudesParams): string {
    const query = new URLSearchParams();
    if (params.estado) {
        query.set('estado', params.estado);
    }
    if (params.pagina !== undefined) {
        query.set('pagina', String(params.pagina));
    }
    if (params.tamano !== undefined) {
        query.set('tamano', String(params.tamano));
    }
    return query.toString();
}

export function listarSolicitudes(params: ListarSolicitudesParams = {}): Promise<PaginaDto<SolicitudResumenDto>> {
    const query = queryDeListado(params);
    return apiGet<PaginaDto<SolicitudResumenDto>>(`/solicitudes${query ? `?${query}` : ''}`);
}

export function obtenerSolicitud(id: number): Promise<SolicitudDto> {
    return apiGet<SolicitudDto>(`/solicitudes/${id}`);
}

export function crearSolicitud(request: CrearSolicitudRequest): Promise<SolicitudDto> {
    return apiPost<SolicitudDto>('/solicitudes', request);
}

export function cambiarEstadoSolicitud(id: number, estado: string): Promise<SolicitudDto> {
    return apiPatch<SolicitudDto>(`/solicitudes/${id}/estado`, { estado });
}

export function responderInvitacionSolicitud(
    id: number,
    colaboradorId: string,
    estado: string,
): Promise<SolicitudDto> {
    return apiPatch<SolicitudDto>(`/solicitudes/${id}/colaboradores/${colaboradorId}`, { estado });
}
