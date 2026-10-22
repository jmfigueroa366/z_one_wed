// CAPA: Infraestructura
// Sube a Supabase las filas que la app crea o modifica.
//
// La app no espera a la red: primero guarda el cambio en local (para que se
// vea al instante) y despues lo sube en segundo plano. Las escrituras de la
// misma fila se encadenan con una clave, de modo que un alta seguida de una
// edicion se sube en ese orden y nunca se pisan.
import {
    encadenarEscritura,
    hayConexionSupabase,
    recordarIdRemoto,
} from './supabaseSync.ts';
import { registrarIdRemoto } from './identificadores.ts';
import type { TipoEntidad } from './identificadores.ts';

export interface OpcionesAlta {
    // Entidad a la que pertenece la fila (para recordar su id remoto).
    tipo: TipoEntidad;
    // Clave de la cola: una por fila.
    clave: string;
    // Id local de la fila.
    idLocal: number | string | null | undefined;
    // Inserta la fila en Supabase y devuelve el id que le dio.
    insertar: () => Promise<{ id: unknown }>;
    // Vuelve a traer los datos para que la lista local quede al dia.
    sincronizar: () => Promise<unknown>;
}

// Sube una fila nueva. Si la app no tiene conexion con Supabase, no hace nada.
export function subirAlta(opciones: OpcionesAlta): void {
    if (!hayConexionSupabase()) {
        return;
    }
    encadenarEscritura(opciones.clave, async () => {
        const { id } = await opciones.insertar();
        if (typeof id === 'number' || typeof id === 'string') {
            recordarIdRemoto(opciones.clave, id);
            registrarIdRemoto(opciones.tipo, opciones.idLocal, id);
        }
        await opciones.sincronizar();
    }).catch((error) => {
        console.warn('No se pudo guardar la fila en Supabase.', error);
    });
}

export interface OpcionesCambio {
    // Clave de la cola: la misma que se uso en el alta.
    clave: string;
    // Id remoto de la fila. Null si la fila todavia no existe en Supabase.
    obtenerIdRemoto: () => number | string | null;
    // Los campos que se cambian (en el formato de la base de datos).
    cambios: () => Record<string, unknown> | null;
    // Aplica el cambio en la fila remota.
    aplicar: (idRemoto: number | string, cambios: Record<string, unknown>) => Promise<void>;
    // Vuelve a traer los datos para que la lista local quede al dia.
    sincronizar: () => Promise<unknown>;
}

// Sube una edicion. Si la fila todavia no se habia subido, la Alta encadenada
// en la misma clave la sube despues con los datos mas recientes.
export function subirCambio(opciones: OpcionesCambio): void {
    if (!hayConexionSupabase()) {
        return;
    }
    encadenarEscritura(opciones.clave, async () => {
        const idRemoto = opciones.obtenerIdRemoto();
        if (idRemoto == null) {
            return;
        }
        const cambios = opciones.cambios();
        if (!cambios) {
            return;
        }
        await opciones.aplicar(idRemoto, cambios);
        await opciones.sincronizar();
    }).catch((error) => {
        console.warn('No se pudo actualizar la fila en Supabase.', error);
    });
}
