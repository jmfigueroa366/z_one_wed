import { RUTAS } from './rutas.js';

//Los roles junto sus etiquetas
export const ROLES = {
    ADMINISTRADOR: 'administrador',
    COLABORADOR: 'colaborador',
    CLIENTE: 'cliente',
};

export const ETIQUETAS_ROL = {
    [ROLES.ADMINISTRADOR]: 'Administrador',
    [ROLES.COLABORADOR]: 'Colaborador',
    [ROLES.CLIENTE]: 'Cliente',
};

//Funciones dentro del rol COLABORADOR
export const PERFILES_COLABORADOR = {
    ARTISTA: 'artista',
    PRODUCTOR: 'productor',
    MUSICO: 'musico',
    INGENIERO: 'ingeniero',
};

export const ETIQUETAS_PERFIL = {
    [PERFILES_COLABORADOR.ARTISTA]: 'Artista',
    [PERFILES_COLABORADOR.PRODUCTOR]: 'Productor',
    [PERFILES_COLABORADOR.MUSICO]: 'Músico',
    [PERFILES_COLABORADOR.INGENIERO]: 'Ingeniero',
};

// Un solo lugar que define "qué panel admite qué roles".
export const ACCESOS_PANEL = {
    admin: { ruta: RUTAS.PANEL_ADMIN, roles: [ROLES.ADMINISTRADOR] },
    colaborador: { ruta: RUTAS.PANEL_COLABORADOR, roles: [ROLES.COLABORADOR] },
    cliente: { ruta: RUTAS.PANEL_CLIENTE, roles: [ROLES.CLIENTE] },
};

// ¿Puede este rol entrar a este panel? (defensivo)
export function puedeAcceder(rol, panel) {
    return Boolean(panel && ACCESOS_PANEL[panel]?.roles.includes(rol));
}

// A qué ruta va un rol; si no es válido → login (defensivo).
export function panelDeRol(rol) {
    const panel = Object.values(ACCESOS_PANEL).find((p) => p.roles.includes(rol));
    return panel ? panel.ruta : RUTAS.LOGIN;
}

export function esRolValido(rol) {
    return Object.values(ROLES).includes(rol);
}

export function esPerfilValido(perfil) {
    return Object.values(PERFILES_COLABORADOR).includes(perfil);
}

export function etiquetaRol(rol) {
    return ETIQUETAS_ROL[rol] || rol;
}

export function etiquetaPerfil(perfil) {
    return ETIQUETAS_PERFIL[perfil] || perfil;
}