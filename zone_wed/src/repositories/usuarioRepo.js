// CAPA: Infraestructura
import { Storage } from '../infrastructure/storage.js';
import { SEED } from '../data/seed.js';
import { crearUsuario } from '../models/Usuario.js';

const CLAVE = 'usuarios';

function obtenerListaInicial() {
    return SEED.usuarios.map((usuario, indice) => crearUsuario({ ...usuario, id: indice + 1 }));
}

function normalizarLista(items) {
    return Array.isArray(items)
        ? items.map((usuario, indice) => crearUsuario({ ...usuario, id: usuario.id ?? indice + 1 }))
        : [];
}

export const usuarioRepo = {
    listar() {
        const usuarios = Storage.obtenerValor(CLAVE, []);
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

    obtenerPorId(id) {
        return this.listar().find((usuario) => String(usuario.id ?? usuario.email) === String(id)) ?? null;
    },

    crear(data) {
        const usuarios = this.listar();
        const siguienteId = usuarios.reduce((max, usuario) => Math.max(max, Number(usuario.id) || 0), 0) + 1;
        const usuario = crearUsuario({ ...data, id: siguienteId });
        usuarios.push(usuario);
        Storage.guardarValor(CLAVE, usuarios);
        return usuario;
    },

    actualizar(id, data) {
        const usuarios = this.listar();
        const indice = usuarios.findIndex((usuario) => String(usuario.id) === String(id));
        if (indice === -1) {
            return null;
        }
        usuarios[indice] = crearUsuario({ ...usuarios[indice], ...data, id: usuarios[indice].id });
        Storage.guardarValor(CLAVE, usuarios);
        return usuarios[indice];
    },

    eliminar(id) {
        const usuarios = this.listar().filter((usuario) => String(usuario.id) !== String(id));
        Storage.guardarValor(CLAVE, usuarios);
        return usuarios;
    },
};

export default usuarioRepo;
