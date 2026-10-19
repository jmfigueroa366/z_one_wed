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

export interface UsuarioConRol {
    rol?: string;
}

export function tieneRol(usuario: UsuarioConRol | null | undefined, rol: string): boolean {
    return Boolean(usuario) && usuario!.rol === rol;
}

export function tieneAlgunoDeLosRoles(usuario: UsuarioConRol | null | undefined, roles: string[] = []): boolean {
    if (!usuario) {
        return false;
    }

    return Array.isArray(roles) && roles.includes(usuario.rol ?? '');
}

export function esAdministrador(usuario: UsuarioConRol | null | undefined): boolean {
    return tieneRol(usuario, ROLES.ADMINISTRADOR);
}

export function esColaborador(usuario: UsuarioConRol | null | undefined): boolean {
    return tieneRol(usuario, ROLES.COLABORADOR);
}

export function esCliente(usuario: UsuarioConRol | null | undefined): boolean {
    return tieneRol(usuario, ROLES.CLIENTE);
}
