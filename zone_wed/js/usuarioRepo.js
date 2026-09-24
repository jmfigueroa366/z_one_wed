//Reglas de negocio de los usuarios
//El email es ÚNICO, El rol debe existir (ROLES) y si es colaborador, debe tener perfil válido
//"Borrado": se desactiva, no se elimina.

import { Storage } from './storage.js';
import { ROLES, esRolValido, esPerfilValido } from './roles.js';

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

    existeNombre(nombre) {
        const busqueda = String(nombre || '').trim().toLowerCase();
        return Storage.buscar(COLECCION, (u) => u.nombre && u.nombre.toLowerCase() === busqueda).length > 0;
    },

    buscarPorIdentificador(identificador) {
        const busqueda = String(identificador || '').trim().toLowerCase();
        if (!busqueda) return null;
        return Storage.buscar(COLECCION, (u) =>
            (u.email && u.email.toLowerCase() === busqueda) ||
            (u.nombre && u.nombre.toLowerCase() === busqueda)
        )[0] || null;
    },

    //Valida los datos y crea el usuario
    crear(datos) {
        const nombre = String (datos?.nombre || '').trim();
        const email = normalizarEmail(datos?.email);
        const password = String(datos?.password||'');
        const rol = datos?.rol;
        const perfil = (rol === ROLES.COLABORADOR) ? (datos?.perfil || 'artista') : null;

        if (!nombre) throw new Error ('El nombre es obligatorio');
        if (!email.includes('@')) throw new Error ('El email no es valido');
        if (password.length < 6) throw new Error ('Por lo menos 6 caracteres');
        if (!esRolValido(rol)) throw new Error ('El rol no es valido');
        if (rol === ROLES.COLABORADOR && !esPerfilValido(perfil)) throw new Error ('Un colaborador debe tener un perfil valido');
        if (this.existeEmail(email)) throw new Error ('Ya existe el usuario con ese email');
        if (this.existeNombre(nombre)) throw new Error ('Ya existe el usuario con ese nombre');

        return Storage.crear(COLECCION, {
            nombre,
            email,
            password,
            rol,
            perfil,
            activo: true,
        });
    },

    //Autentica el usuario por correo o nombre, contraseña y opcionalmente rol
    autenticar(identificador, password, rol) {
        const usuario = this.buscarPorIdentificador(identificador);
        if (!usuario || usuario.activo === false) {
            return null;
        }
        if (usuario.password !== password) {
            return null;
        }
        if (rol && usuario.rol !== rol) {
            return null;
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