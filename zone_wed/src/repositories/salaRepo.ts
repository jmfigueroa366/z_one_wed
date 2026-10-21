// CAPA: Infraestructura
import { Storage, generarIdUnico } from '../infrastructure/storage.ts';
import { SEED } from '../data/seed.ts';
import { crearSala } from '../models/Sala.ts';
import type { EntradaSala, Sala } from '../models/Sala.ts';
import {
    sincronizarSalas as sincronizarSalasRemotas,
    eliminarFilaRemota,
    idRemoto,
    hayConexionSupabase,
    claveSala,
    insertarSala,
    actualizarSala,
    cambiosDeSala,
} from '../infrastructure/supabaseSync.ts';
import { subirAlta, subirCambio } from '../infrastructure/colaRemota.ts';

const CLAVE = 'salas';

function obtenerListaInicial(): Sala[] {
    return SEED.salas.map((sala, indice) =>
        crearSala({ ...sala, id: indice + 1, origen: 'seed' })
    );
}

function normalizarLista(salas: EntradaSala[]): Sala[] {
    return salas.map((sala, indice) => crearSala({ ...sala, id: sala.id ?? indice + 1 }));
}

// Trae las salas reales de Supabase una vez y las guarda en la caché local.
let sincronizado = false;
export async function sincronizarSalas() {
    if (sincronizado) {
        return;
    }
    try {
        await sincronizarSalasRemotas();
        sincronizado = true;
    } catch (error) {
        console.warn('No se pudieron sincronizar las salas con Supabase.', error);
    }
}

// Se ejecuta al cargar el módulo.
sincronizarSalas();

export const salaRepo = {
    listar(): Sala[] {
        const salas = Storage.obtenerValor<unknown>(CLAVE, []);
        if (!Array.isArray(salas) || !Storage.existeValor(CLAVE)) {
            Storage.guardarValor(CLAVE, obtenerListaInicial());
            return obtenerListaInicial();
        }
        return normalizarLista(salas as EntradaSala[]);
    },

    obtenerPorId(id: number | string | null | undefined): Sala | null {
        if (id == null) return null;
        return this.listar().find((sala) => String(sala.id) === String(id)) ?? null;
    },

    crear(data: EntradaSala): Sala {
        const salas = this.listar();
        const siguienteId = generarIdUnico(salas);
        const sala = crearSala({ ...data, id: siguienteId, origen: 'usuario' });
        salas.push(sala);
        Storage.guardarValor(CLAVE, salas);
        this.subir(sala);
        return sala;
    },

    actualizar(id: number | string, data: EntradaSala): Sala | null {
        const salas = this.listar();
        const indice = salas.findIndex((sala) => String(sala.id) === String(id));
        if (indice === -1) {
            return null;
        }
        salas[indice] = crearSala({ ...salas[indice], ...data, id: salas[indice].id });
        Storage.guardarValor(CLAVE, salas);
        this.subirCambios(salas[indice]);
        return salas[indice];
    },

    eliminar(id: number | string): Sala[] {
        const salas = this.listar();
        const sala = salas.find((item) => String(item.id) === String(id)) ?? null;
        const salasRestantes = salas.filter((item) => String(item.id) !== String(id));
        Storage.guardarValor(CLAVE, salasRestantes);
        if (hayConexionSupabase() && sala) {
            // Solo se borra en Supabase la fila que existe alli: el id local
            // puede coincidir con el de otra sala y se borraria por error.
            const idRemotoSala = idRemoto(sala);
            if (idRemotoSala != null) {
                eliminarFilaRemota('salas', idRemotoSala).catch((error) => console.warn('No se pudo borrar la sala en Supabase.', error));
            }
        }
        return salasRestantes;
    },

    // Sube la sala a Supabase.
    subir(sala: Sala): void {
        subirAlta({
            tipo: 'salas',
            clave: claveSala(sala.id),
            idLocal: sala.id,
            insertar: () => insertarSala(sala),
            sincronizar: sincronizarSalasRemotas,
        });
    },

    // Sube los cambios de la sala (nombre, precio y si esta activa).
    subirCambios(sala: Sala): void {
        subirCambio({
            clave: claveSala(sala.id),
            obtenerIdRemoto: () => idRemoto(this.obtenerPorId(sala.id)) ?? idRemoto(sala),
            cambios: () => cambiosDeSala(sala),
            aplicar: (idRemotoSala, cambios) => actualizarSala(idRemotoSala, cambios),
            sincronizar: sincronizarSalasRemotas,
        });
    },
};

export default salaRepo;
