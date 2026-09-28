// Reglas de negocio de los usuarios
// El email es ÚNICO, El rol debe existir (ROLES) y si es colaborador, debe tener perfil válido

import { Storage } from './storage.js';
import { ROLES, esRolValido, esPerfilValido } from './roles.js';

const COLECCION = 'usuarios';

// email en minúscula y sin espacios
function normalizarEmail(email) {
    return String(email || '').trim().toLowerCase();
}

export const UsuarioRepo = {
    // Todos los usuarios activos
    todas() {
        return Storage.buscar(COLECCION, (u) => u.activo !== false);
    },

    todosIncluyendoInactivos() {
        return Storage.obtenerTodos(COLECCION);
    },

    porId(id) {
        return Storage.obtenerPorId(COLECCION, id);
    },

    // Buscar por email
    porEmail(email) {
        const normalizado = normalizarEmail(email);
        return Storage.buscar(COLECCION, (u) => u.email && u.email.toLowerCase() === normalizado)[0] || null;
    },

    existeEmail(email) {
        return this.porEmail(email) !== null;
    },

    // Buscar por nombre
    porNombre(nombre) {
        const busqueda = String(nombre || '').trim().toLowerCase();
        return Storage.buscar(COLECCION, (u) => u.nombre && u.nombre.toLowerCase() === busqueda)[0] || null;
    },

    existeNombre(nombre) {
        return this.porNombre(nombre) !== null;
    },

    // Buscar por nombre de usuario O por email
    buscarPorIdentificador(identificador) {
        const busqueda = String(identificador || '').trim().toLowerCase();
        if (!busqueda) return null;
        return Storage.buscar(COLECCION, (u) =>
            (u.email && u.email.toLowerCase() === busqueda) ||
            (u.nombre && u.nombre.toLowerCase() === busqueda)
        )[0] || null;
    },

    // Valida los datos y crea el usuario
    crear(datos) {
        const nombre = String(datos?.nombre || '').trim();
        const email = normalizarEmail(datos?.email);
        const password = String(datos?.password || '');
        const rol = datos?.rol || ROLES.CLIENTE;
        const perfil = (rol === ROLES.COLABORADOR) ? (datos?.perfil || 'artista') : null;

        if (!nombre) throw new Error('El nombre es obligatorio');
        if (password.length < 3) throw new Error('La contraseña debe tener al menos 3 caracteres');
        if (!esRolValido(rol)) throw new Error('El rol no es válido');
        if (rol === ROLES.COLABORADOR && !esPerfilValido(perfil)) throw new Error('Un colaborador debe tener un perfil válido');
        if (email && this.existeEmail(email)) throw new Error('Ya existe el usuario con ese email');
        if (this.existeNombre(nombre)) throw new Error('Ya existe el usuario con ese nombre');

        return Storage.crear(COLECCION, {
            nombre,
            email: email || `${nombre.toLowerCase().replace(/\s+/g, '')}@z-one.com`,
            password,
            rol,
            perfil,
            activo: true,
        });
    },

    // Autentica el usuario para el inicio de sesión por correo o nombre
    autenticar(identificador, password, rolRequerido) {
        const usuario = this.buscarPorIdentificador(identificador);
        if (!usuario || usuario.activo === false) {
            return null;
        }
        if (String(usuario.password) !== String(password)) {
            return null;
        }
        if (rolRequerido && usuario.rol !== rolRequerido) {
            return null;
        }
        return usuario;
    },

    // Borrado lógico
    desactivar(id) {
        if (!this.porId(id)) return null;
        return Storage.actualizar(COLECCION, id, { activo: false });
    },

    activar(id) {
        if (!this.porId(id)) return null;
        return Storage.actualizar(COLECCION, id, { activo: true });
    },
};