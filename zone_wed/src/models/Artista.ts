// CAPA: Dominio
import type { Colaborador } from './Colaborador.ts';

export interface Artista extends Colaborador {}

export type EntradaArtista = Partial<Artista>;

export function crearArtista(data: EntradaArtista = {}): Artista {
    return {
        ...data,
        id: data.id ?? null,
        id_remoto: data.id_remoto ?? null,
        nombre: data.nombre ?? '',
        especialidad: data.especialidad ?? '',
        usuario_id: data.usuario_id ?? null,
        activo: data.activo ?? true,
    };
}

export const Artista = {
    crear: crearArtista,
    esActivo(artista: Artista | null | undefined): boolean {
        return artista != null && artista.activo !== false;
    },
};

export default crearArtista;
