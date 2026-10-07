//Reglas de negocio de los usuarios
//El email es ÚNICO, El rol debe existir (ROLES) y si es colaborador, debe tener perfil válido
//"Borrado": se desactiva, no se elimina.

import { Storage } from './storage.js';
import { ROLES, esRolValido, esPerfilValido } from './roles.js';
import { Crypto } from './crypto.js';

const COLECCION ='usuarios';

//email en minuscula y sin espacio
function normalizarEmail(email) {
    return String(email || '').trim().toLowerCase();
}

export const UsuarioRepo = {
    //Todos los usuarios activos
    todas() {
        return Storage.buscar(COLECCION, (u) => u.activo !==false);
    },

    todosIncluyendoInactivos() {
        return Storage.obtenerTodos(COLECCION);
    },

    porId(id) {
        return Storage.obtenerPorId(COLECCION, id);
    },

    //Buscar por email
    porEmail(email) {
        const normalizado = normalizarEmail(email);
        return Storage.buscar(COLECCION, (u) => u.email === normalizado) [0] || null;
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

    async crear(datos) {
        const nombre = String(datos?.nombre || '').trim();
        const email = normalizarEmail(datos?.email);
        const password = String(datos?.password || '');
        const rol = datos?.rol;
        const perfil = datos?.perfil;

        if (!nombre) throw new Error('El nombre es obligatorio');
        if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres');
        if (!esRolValido(rol)) throw new Error('El rol no es válido');
        if (rol === ROLES.COLABORADOR && !esPerfilValido(perfil)) throw new Error('Un colaborador debe tener un perfil válido');
        if (!email.includes('@')) throw new Error('El email no es válido');
        if (email && this.existeEmail(email)) throw new Error('Ya existe el usuario con ese email');
        if (this.existeNombre(nombre)) throw new Error('Ya existe el usuario con ese nombre');

        const passwordHash = await Crypto.hashPassword(password);

        return Storage.crear(COLECCION, {
            nombre,
            email,
            password: passwordHash,
            rol,
            perfil: rol === ROLES.COLABORADOR ? perfil : null,
            activo: true,
        });
    },

    // Autentica el usuario para el inicio de sesión por correo o nombre
    async autenticar(identificador, password, rolRequerido) {
        const usuario = this.buscarPorIdentificador(identificador);
        if (!usuario || usuario.activo === false) {
            return null;
        }
        const passwordGuardada = String(usuario.password || '');
        const esHash = passwordGuardada.includes(':');
        const passwordValida = esHash
            ? await Crypto.verifyPassword(password, passwordGuardada)
            : passwordGuardada === String(password);
        if (!passwordValida) {
            return null;
        }
        if (rolRequerido && usuario.rol !== rolRequerido) {
            return null;
        }
        if (!esHash) {
            const passwordHash = await Crypto.hashPassword(password);
            return Storage.actualizar(COLECCION, usuario.id, { password: passwordHash });
        }
        return usuario;
    },
    
    //Borrador; la cuenta existe, pero no se puede volver a entrar
    desactivar(id) {
        if (!this.porId(id)) 
            return null;
        return Storage.actualizar(COLECCION, id, { activo: false });
    },

    activar(id) {
        if (!this.porId(id))
            return null;
        return Storage.actualizar(COLECCION, id, {activo:true});
    },
};