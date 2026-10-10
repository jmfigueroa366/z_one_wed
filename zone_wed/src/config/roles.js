// CAPA: Dominio

export const ROLES = Object.freeze({
    ADMINISTRADOR: 'administrador',
    COLABORADOR: 'colaborador',
    COORDINADOR: 'coordinador',
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
    return tieneAlgunoDeLosRoles(usuario, [ROLES.COLABORADOR, ROLES.COORDINADOR]);
}

export function esCoordinador(usuario) {
    return tieneRol(usuario, ROLES.COORDINADOR);
}

export function esCliente(usuario) {
    return tieneRol(usuario, ROLES.CLIENTE);
}
