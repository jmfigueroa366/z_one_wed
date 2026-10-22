// CAPA: Infraestructura
// Traduccion entre el id local de una entidad y el id que tiene en Supabase.
//
// La app guarda cada fila con dos referencias: `id` (estable en el navegador,
// no cambia nunca) e `id_remoto` (la fila real de Supabase). Las claves
// foraneas de la app apuntan siempre al id local, asi que hay que traducirlas
// en los dos sentidos: al leer de Supabase se traduce remoto -> local y al
// escribir se traduce local -> remoto. Si la fila nunca se subio, no hay id
// remoto y la clave foranea se deja vacia: escribir el id local en una
// columna que apunta a Supabase tocaria la fila equivocada.
import { Storage } from './storage.ts';

export type TipoEntidad =
    | 'proyectos'
    | 'canciones'
    | 'colaboradores'
    | 'salas'
    | 'solicitudes'
    | 'sesiones';

export interface EntidadConIds {
    id?: number | string | null;
    id_remoto?: number | string | null;
    [clave: string]: unknown;
}

const CLAVES: Record<TipoEntidad, string> = {
    proyectos: 'proyectos',
    canciones: 'canciones',
    colaboradores: 'colaboradores',
    salas: 'salas',
    solicitudes: 'solicitudes',
    sesiones: 'sesiones',
};

// La lista local de una entidad tal y como esta guardada.
export function listarLocales(tipo: TipoEntidad): EntidadConIds[] {
    const valor = Storage.obtenerValor<unknown>(CLAVES[tipo], []);
    return Array.isArray(valor) ? (valor as EntidadConIds[]) : [];
}

// El id que la fila tiene en Supabase, o null si nunca se subio.
export function idRemotoDeEntidad(entidad: EntidadConIds | null | undefined): number | string | null {
    const remoto = entidad?.id_remoto;
    if (typeof remoto === 'number' || typeof remoto === 'string') {
        return remoto;
    }
    return null;
}

// Id remoto de una fila local. Null si la fila no existe o nunca se subio.
export function idRemotoDe(
    tipo: TipoEntidad,
    idLocal: number | string | null | undefined
): number | string | null {
    if (idLocal == null) {
        return null;
    }
    const entidad = listarLocales(tipo).find((item) => String(item.id) === String(idLocal));
    if (!entidad) {
        return null;
    }
    return idRemotoDeEntidad(entidad);
}

// Id local de una fila que vino de Supabase.
export function idLocalDe(
    tipo: TipoEntidad,
    idRemoto: number | string | null | undefined
): number | string | null {
    if (idRemoto == null) {
        return null;
    }
    const entidad = listarLocales(tipo).find(
        (item) => item.id_remoto != null && String(item.id_remoto) === String(idRemoto)
    );
    return entidad?.id ?? null;
}

export interface CampoForaneo {
    campo: string;
    tipo: TipoEntidad;
}

// Traduce las claves foraneas de una entidad local a sus ids remotos.
export function traducirARemoto<T>(entidad: T, campos: CampoForaneo[]): T {
    const copia: Record<string, unknown> = { ...(entidad as Record<string, unknown>) };
    for (const { campo, tipo } of campos) {
        if (!(campo in copia)) {
            continue;
        }
        const remoto = idRemotoDe(tipo, copia[campo] as number | string | null);
        // Sin id remoto la clave foranea se deja nula: nunca se envia un id
        // local a una columna que apunta a Supabase.
        copia[campo] = remoto;
    }
    return copia as T;
}

// Traduce las claves foraneas de una fila remota a sus ids locales. Si la
// entidad local no existe (por ejemplo porque las politicas de seguridad la
// ocultan), se conserva el valor remoto para no perder el dato.
export function traducirALocal<T>(entidad: T, campos: CampoForaneo[]): T {
    const copia: Record<string, unknown> = { ...(entidad as Record<string, unknown>) };
    for (const { campo, tipo } of campos) {
        if (!(campo in copia)) {
            continue;
        }
        const valor = copia[campo] as number | string | null;
        if (valor == null) {
            continue;
        }
        copia[campo] = idLocalDe(tipo, valor) ?? valor;
    }
    return copia as T;
}

// Guarda el id que Supabase asigno a una fila local.
export function registrarIdRemoto(
    tipo: TipoEntidad,
    idLocal: number | string | null | undefined,
    idRemoto: number | string | null | undefined
): void {
    if (idLocal == null || idRemoto == null) {
        return;
    }
    const lista = listarLocales(tipo);
    const indice = lista.findIndex((item) => String(item.id) === String(idLocal));
    if (indice === -1) {
        return;
    }
    lista[indice] = { ...lista[indice], id_remoto: idRemoto };
    Storage.guardarValor(CLAVES[tipo], lista);
}
