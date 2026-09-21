//Reglas de negocio de los usuarios
//El email es ÚNICO, El rol debe existir (ROLES) y si es colaborador, debe tener perfil válido
//"Borrado": se desactiva, no se elimina.

import { Storage } from './storage';
import { ROLES, esRolValido, esPerfilValido } from './roles';

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

    //Valida los datos y crea el usuario
    crear(datos) {
        const nombre = String (datos?.nombre || '').trim();
        const email = normalizarEmail(datos?.email);
        const password = String(datos?.password||'');
        const rol = datos?.rol;
        const perfil = datos?.perfil;

        if (!nombre) throw new Error ('El nombre es obligatorio');
        if (!email.includes('@')) throw new Error ('El email no es valido');
        if (password.length <6) throw new Error ('Por lo menos 6 caracteres');
        if (!esRolValido(rol)) throw new Error ('El rol no es valido');
        if (rol === ROLES.COLABORADOR && !esPerfilValido(perfil)) throw new Error ('Un colaborador debe tener un perfil valido');
        if (this.existeEmail(email)) throw new Error ('Ya existe el usuario con ese email');

        return Storage.crear(COLECCION, {
            nombre,
            email,
            password,
            rol,
            perfil: rol === ROLES.COLABORADOR ? perfil : null,
            activo: true,
        });
    },

    //Autentica el usuario para el inicio de sesion
    autenticar(email, password) {
        const usuario = this.porEmail(email);
        if (usuario && usuario.password === password && usuario.activo !== false) {
            return usuario;
        }
        return null;
    },
    
    //Borrador; la cuenta existe, pero no se puede volver a entrar
    desactivar(id) {
        if (!this.porId(id)) return null;
        return Storage.actualizar(COLECCION, id, { activo: false });
    },

    activar(id) {
        if (!this.porId(id))
            return Storage.actualizar(COLECCION, id, {activo:true});
    },
};