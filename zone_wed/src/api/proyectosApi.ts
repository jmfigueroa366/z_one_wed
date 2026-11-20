import { apiGet } from './apiClient.ts';

// DTOs de Z-one_backend/Dtos/ProyectoDtos.cs (System.Text.Json en camelCase).

export interface ProyectoResumenDto {
    id: number;
    titulo: string;
    tipo: string;
    servicio: string;
    estado: string;
    etapaActual: string | null;
    clienteId: string;
    cliente: string;
    sesionesIncluidas: number;
    sesionesCumplidas: number;
    creadoEn: string;
    revisionVenceEn: string | null;
}

export interface PaginaProyectosDto<T> {
    items: T[];
    total: number;
    pagina: number;
    tamano: number;
}

export function listarProyectosPagina(
    pagina = 1,
    tamano = 100,
): Promise<PaginaProyectosDto<ProyectoResumenDto>> {
    const query = new URLSearchParams({ pagina: String(pagina), tamano: String(tamano) });
    return apiGet<PaginaProyectosDto<ProyectoResumenDto>>(`/proyectos?${query.toString()}`);
}

export async function listarProyectos(): Promise<ProyectoResumenDto[]> {
    const primera = await listarProyectosPagina(1, 100);
    const items = [...primera.items];
    const tamano = primera.tamano > 0 ? primera.tamano : 100;
    let pagina = primera.pagina > 0 ? primera.pagina : 1;

    while (items.length < primera.total) {
        pagina += 1;
        const siguiente = await listarProyectosPagina(pagina, tamano);
        if (!siguiente.items.length) {
            break;
        }
        items.push(...siguiente.items);
    }

    return items;
}
