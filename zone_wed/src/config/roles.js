// CAPA: Dominio

export const ROLES = Object.freeze({
    ADMINISTRADOR: 'administrador',
    COLABORADOR: 'colaborador',
    CLIENTE: 'cliente',
});

export const PERFILES = Object.freeze({
    ARTISTA: 'artista',
    INGENIERO: 'ingeniero',
    PRODUCCION: 'produccion',
    CLIENTE: 'cliente',
});

export function tieneRol(usuario, rol) {
    return Boolean(usuario) && usuario.rol === rol;
}

export function tieneAlgunoDeLosRoles(usuario, roles = []) {
    if (!usuario) {
        return false;
    }

    return Array.isArray(roles) && roles.includes(usuario.rol);
}

export function esAdministrador(usuario) {
    return tieneRol(usuario, ROLES.ADMINISTRADOR);
}

export function esColaborador(usuario) {
    return tieneRol(usuario, ROLES.COLABORADOR);
}

export function esCliente(usuario) {
    return tieneRol(usuario, ROLES.CLIENTE);
}
