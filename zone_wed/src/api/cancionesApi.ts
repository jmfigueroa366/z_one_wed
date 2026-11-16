import { apiDelete, apiGet, apiPatch, apiPost } from './apiClient.ts';

// DTOs de Z-one_backend/Dtos/CancionDtos.cs (System.Text.Json en camelCase).

export interface CrearCancionRequest {
    titulo?: string | null;
    duracionSeg?: number | null;
    partes?: string[] | null;
    requiereEnsayo?: boolean | null;
}

export interface ActualizarCancionRequest {
    titulo?: string | null;
    duracionSeg?: number | null;
    partes?: string[] | null;
    requiereEnsayo?: boolean | null;
}

export interface CancionDto {
    id: number;
    proyectoId: number;
    titulo: string;
    duracionSeg: number | null;
    partes: string[];
    requiereEnsayo: boolean;
    creadoEn: string;
}

export function listarCanciones(proyectoId: number): Promise<CancionDto[]> {
    return apiGet<CancionDto[]>(`/proyectos/${proyectoId}/canciones`);
}

export function crearCancion(proyectoId: number, request: CrearCancionRequest): Promise<CancionDto> {
    return apiPost<CancionDto>(`/proyectos/${proyectoId}/canciones`, request);
}

export function actualizarCancion(id: number, request: ActualizarCancionRequest): Promise<CancionDto> {
    return apiPatch<CancionDto>(`/canciones/${id}`, request);
}

export function eliminarCancion(id: number): Promise<void> {
    return apiDelete<void>(`/canciones/${id}`);
}
