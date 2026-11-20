import { apiGet, apiPost, apiPut } from './apiClient.ts';
import type { SalaApi } from './apiClient.ts';

export type { SalaApi };

export interface SalaRequest {
    nombre: string;
    precioHora: number;
    activo: boolean;
}

export function listarSalasPublicas(): Promise<SalaApi[]> {
    return apiGet<SalaApi[]>('/publico/salas');
}

export function listarSalasAdmin(): Promise<SalaApi[]> {
    return apiGet<SalaApi[]>('/admin/salas');
}

export function crearSala(request: SalaRequest): Promise<SalaApi> {
    return apiPost<SalaApi>('/admin/salas', request);
}

export function actualizarSala(id: number, request: SalaRequest): Promise<SalaApi> {
    return apiPut<SalaApi>(`/admin/salas/${id}`, request);
}
