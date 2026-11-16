import { apiGet } from './apiClient.ts';

// DTO de Z-one_backend/Dtos/ColaboradoresDtos.cs (System.Text.Json en camelCase).

export interface PortafolioPublicoDto {
    id: number;
    titulo: string;
    descripcion: string | null;
    productora: string | null;
    rol: string | null;
    anio: number | null;
    estado: string;
}

export interface ColaboradorPublicoDto {
    id: string;
    nombreArtistico: string;
    perfil: string;
    especialidad: string | null;
    ciudadOrigen: string | null;
    biografia: string | null;
    trayectoria: string | null;
    productoras: string | null;
    fotoUrl: string | null;
    disponibilidad: string;
    detalle: Record<string, string | null> | null;
    portafolio: PortafolioPublicoDto[] | null;
}

export function listarColaboradoresPublicos(limite = 50): Promise<ColaboradorPublicoDto[]> {
    const acotado = Math.min(50, Math.max(1, Math.trunc(limite)));
    return apiGet<ColaboradorPublicoDto[]>(`/publico/colaboradores/destacados?limite=${acotado}`);
}
