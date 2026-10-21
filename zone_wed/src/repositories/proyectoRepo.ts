// CAPA: Infraestructura
import { Storage, generarIdUnico } from '../infrastructure/storage.ts';
import { SEED } from '../data/seed.ts';
import { crearProyecto } from '../models/Proyecto.ts';
import type { EntradaProyecto, Proyecto } from '../models/Proyecto.ts';
import {
    sincronizarProyectos,
    eliminarFilaRemota,
    idRemoto,
    hayConexionSupabase,
    claveProyecto,
    insertarProyecto,
    actualizarProyecto,
    cambiosDeProyecto,
    resolverClienteId,
} from '../infrastructure/supabaseSync.ts';
import { subirAlta, subirCambio } from '../infrastructure/colaRemota.ts';


const CLAVE = 'proyectos';

function obtenerListaInicial(): Proyecto[] {
    return SEED.proyectos.map((proyecto, indice) =>
        crearProyecto({ ...proyecto, id: proyecto.id ?? indice + 1, origen: 'seed' })
    );
}

function normalizarLista(proyectos: EntradaProyecto[]): Proyecto[] {
    return proyectos.map((proyecto, indice) =>
        crearProyecto({ ...proyecto, id: proyecto.id ?? indice + 1 })
    );
}

// Sincroniza proyectos desde Supabase una vez al cargar el módulo.
let sincronizado = false;
export async function sincronizar() {
    if (sincronizado) {
        return;
    }
    try {
        await sincronizarProyectos();
        sincronizado = true;
    } catch (error) {
        console.warn('No se pudieron sincronizar los proyectos con Supabase.', error);
    }
}

sincronizar();

export const proyectoRepo = {
    listar(): Proyecto[] {
        const proyectos = Storage.obtenerValor<unknown>(CLAVE, []);
        if (!Array.isArray(proyectos) || !Storage.existeValor(CLAVE)) {
            Storage.guardarValor(CLAVE, obtenerListaInicial());
            return obtenerListaInicial();
        }
        return normalizarLista(proyectos as EntradaProyecto[]);
    },

    obtenerPorId(id: number | string | null | undefined): Proyecto | null {
        return this.listar().find((proyecto) => String(proyecto.id ?? proyecto.nombre) === String(id)) ?? null;
    },

    listarPorUsuario(usuarioId: number | string | null | undefined): Proyecto[] {
        if (!usuarioId) {
            return [];
        }
        return this.listar().filter((proyecto) => String(proyecto.usuario_id) === String(usuarioId));
    },

    crear(data: EntradaProyecto): Proyecto {
        const proyectos = this.listar();
        const siguienteId = generarIdUnico(proyectos);
        const proyecto = crearProyecto({ ...data, id: siguienteId, origen: 'usuario' });
        proyectos.push(proyecto);
        Storage.guardarValor(CLAVE, proyectos);
        this.subir(proyecto);
        return proyecto;
    },

    actualizar(id: number | string, data: EntradaProyecto): Proyecto | null {
        const proyectos = this.listar();
        const indice = proyectos.findIndex((proyecto) => String(proyecto.id) === String(id));
        if (indice === -1) {
            return null;
        }
        proyectos[indice] = crearProyecto({ ...proyectos[indice], ...data, id: proyectos[indice].id });
        Storage.guardarValor(CLAVE, proyectos);
        this.subirCambios(proyectos[indice]);
        return proyectos[indice];
    },

    eliminar(id: number | string): Proyecto[] {
        const proyectos = this.listar();
        const proyecto = proyectos.find((item) => String(item.id) === String(id)) ?? null;
        const proyectosRestantes = proyectos.filter((item) => String(item.id) !== String(id));
        Storage.guardarValor(CLAVE, proyectosRestantes);
        if (hayConexionSupabase() && proyecto) {
            // Solo se borra en Supabase la fila que existe alli: el id local
            // puede coincidir con el de otro proyecto y se borraria por error.
            const idRemotoProyecto = idRemoto(proyecto);
            if (idRemotoProyecto != null) {
                eliminarFilaRemota('proyectos', idRemotoProyecto).catch((error) => console.warn('No se pudo borrar el proyecto en Supabase.', error));
            }
        }
        return proyectosRestantes;
    },

    // Sube el proyecto a Supabase. El proyecto necesita un cliente: si el
    // propietario no tiene cliente en la base de datos, no se sube.
    subir(proyecto: Proyecto): void {
        subirAlta({
            tipo: 'proyectos',
            clave: claveProyecto(proyecto.id),
            idLocal: proyecto.id,
            insertar: async () => {
                const clienteId = await resolverClienteId(proyecto.usuario_id);
                if (!clienteId) {
                    throw new Error('El propietario del proyecto no tiene un cliente en Supabase.');
                }
                return insertarProyecto(proyecto, clienteId);
            },
            sincronizar: sincronizarProyectos,
        });
    },

    // Sube los cambios del proyecto (nombre y tipo) a la fila de Supabase.
    subirCambios(proyecto: Proyecto): void {
        subirCambio({
            clave: claveProyecto(proyecto.id),
            obtenerIdRemoto: () => idRemoto(this.obtenerPorId(proyecto.id)) ?? idRemoto(proyecto),
            cambios: () => cambiosDeProyecto(proyecto),
            aplicar: (idRemotoProyecto, cambios) => actualizarProyecto(idRemotoProyecto, cambios),
            sincronizar: sincronizarProyectos,
        });
    },
};

export default proyectoRepo;
