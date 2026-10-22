// CAPA: Infraestructura
// Los clientes de Supabase: la cuenta de estudio de cada usuario. Un proyecto
// pertenece a un cliente, asi que hace falta saber que usuarios tienen una
// fila en "clientes" para poder asignar y subir el proyecto.
import { Storage } from '../infrastructure/storage.ts';
import { sincronizarClientes, hayConexionSupabase } from '../infrastructure/supabaseSync.ts';

export interface Cliente {
    id: string | null;
    usuario_id: string | null;
    nombre: string;
    email: string;
}

const CLAVE = 'clientes';

function normalizarLista(items: unknown): Cliente[] {
    if (!Array.isArray(items)) {
        return [];
    }
    return items.map((item) => {
        const fila = (item ?? {}) as Partial<Cliente>;
        return {
            id: fila.id ?? null,
            usuario_id: fila.usuario_id ?? null,
            nombre: String(fila.nombre ?? ''),
            email: String(fila.email ?? ''),
        };
    });
}

export const clienteRepo = {
    listar(): Cliente[] {
        return normalizarLista(Storage.obtenerValor<unknown>(CLAVE, []));
    },

    // El cliente de un usuario de la app (busca por el id de "usuarios").
    obtenerPorUsuario(usuarioId: number | string | null | undefined): Cliente | null {
        if (usuarioId == null) return null;
        return this.listar().find((cliente) => String(cliente.usuario_id) === String(usuarioId)) ?? null;
    },

    // Trae los clientes de Supabase y los deja en la caché local.
    async sincronizar(): Promise<Cliente[]> {
        if (!hayConexionSupabase()) {
            return this.listar();
        }
        try {
            await sincronizarClientes();
        } catch (error) {
            console.warn('No se pudieron sincronizar los clientes con Supabase.', error);
        }
        return this.listar();
    },
};

export default clienteRepo;
