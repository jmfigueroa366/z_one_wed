// CAPA: Infraestructura
import { Storage, generarIdUnico } from '../infrastructure/storage.ts';
import { SEED } from '../data/seed.ts';
import { crearUsuario } from '../models/Usuario.ts';
import type { EntradaUsuario, Usuario } from '../models/Usuario.ts';

const CLAVE = 'usuarios';

function obtenerListaInicial(): Usuario[] {
    return SEED.usuarios.map((usuario, indice) => crearUsuario({ ...usuario, id: indice + 1 }));
}

function normalizarLista(items: unknown): Usuario[] {
    return Array.isArray(items)
        ? items.map((usuario, indice) => crearUsuario({ ...usuario, id: usuario.id ?? indice + 1 }))
        : [];
}

export const usuarioRepo = {
    listar(): Usuario[] {
        const usuarios = Storage.obtenerValor<unknown>(CLAVE, []);
        if (!Array.isArray(usuarios) || usuarios.length === 0) {
            const inicial = obtenerListaInicial();
            Storage.guardarValor(CLAVE, inicial);
            return inicial;
        }

        const usuariosNormalizados = normalizarLista(usuarios);
        if (JSON.stringify(usuarios) !== JSON.stringify(usuariosNormalizados)) {
            Storage.guardarValor(CLAVE, usuariosNormalizados);
        }

        return usuariosNormalizados;
    },

    obtenerPorId(id: number | string | null | undefined): Usuario | null {
        if (id == null) return null;
        return this.listar().find((usuario) => String(usuario.id ?? usuario.email) === String(id)) ?? null;
    },

    crear(data: EntradaUsuario): Usuario {
        const usuarios = this.listar();
        const siguienteId = generarIdUnico(usuarios);
        const usuario = crearUsuario({ ...data, id: siguienteId });
        usuarios.push(usuario);
        Storage.guardarValor(CLAVE, usuarios);
        return usuario;
    },

    actualizar(id: number | string, data: EntradaUsuario): Usuario | null {
        const usuarios = this.listar();
        const indice = usuarios.findIndex((usuario) => String(usuario.id) === String(id));
        if (indice === -1) {
            return null;
        }
        usuarios[indice] = crearUsuario({ ...usuarios[indice], ...data, id: usuarios[indice].id });
        Storage.guardarValor(CLAVE, usuarios);
        return usuarios[indice];
    },

    eliminar(id: number | string): Usuario[] {
        const usuarios = this.listar().filter((usuario) => String(usuario.id) !== String(id));
        Storage.guardarValor(CLAVE, usuarios);
        return usuarios;
    },
};

export default usuarioRepo;
