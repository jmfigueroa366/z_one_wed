import { RUTAS } from './rutas.js';

//Los roles junto sus etiquetas
export const ROLES = {
    ADMINISTRADOR: 'administrador',
    COORDINADOR: 'coordinador',
    COLABORADOR: 'colaborador',
    CLIENTE: 'cliente',
};

export const ETIQUETAS_ROL = {
    [ROLES.ADMINISTRADOR]: 'Administrador',
    [ROLES.COORDINADOR]: 'Coordinador',
    [ROLES.COLABORADOR]: 'Colaborador',
    [ROLES.CLIENTE]: 'Cliente',
};

export const MATRIZ_PERMISOS = [
    { id: 'usuarios.gestionar', etiqueta: 'Gestionar usuarios', roles: [ROLES.ADMINISTRADOR] },
    { id: 'colaboradores.aprobar', etiqueta: 'Aprobar colaboradores y definir rangos', roles: [ROLES.ADMINISTRADOR] },
    { id: 'proyectos.leer_global', etiqueta: 'Consultar proyectos globales', roles: [ROLES.ADMINISTRADOR, ROLES.COORDINADOR] },
    { id: 'solicitudes.crear', etiqueta: 'Crear solicitudes de producción', roles: [ROLES.CLIENTE, ROLES.COLABORADOR] },
    { id: 'solicitudes.leer_propias', etiqueta: 'Consultar solicitudes propias', roles: [ROLES.CLIENTE, ROLES.COLABORADOR] },
    { id: 'solicitudes.leer_global', etiqueta: 'Consultar todas las solicitudes', roles: [ROLES.ADMINISTRADOR, ROLES.COORDINADOR] },
    { id: 'invitaciones.enviar', etiqueta: 'Invitar colaboradores a un proyecto', roles: [ROLES.CLIENTE, ROLES.COLABORADOR] },
    { id: 'invitaciones.responder', etiqueta: 'Aceptar o rechazar invitaciones propias', roles: [ROLES.COLABORADOR] },
    { id: 'invitaciones.contraofertar', etiqueta: 'Enviar una contraoferta', roles: [ROLES.COLABORADOR] },
    { id: 'contraofertas.aceptar', etiqueta: 'Aceptar una contraoferta propia', roles: [ROLES.CLIENTE, ROLES.COLABORADOR] },
    { id: 'solicitudes.cancelar', etiqueta: 'Cancelar solicitudes propias', roles: [ROLES.CLIENTE, ROLES.COLABORADOR] },
    { id: 'solicitudes.confirmar', etiqueta: 'Confirmar solicitudes manualmente', roles: [ROLES.ADMINISTRADOR, ROLES.COORDINADOR] },
    { id: 'invitaciones.forzar', etiqueta: 'Forzar aceptación de una invitación', roles: [ROLES.ADMINISTRADOR] },
    { id: 'agenda.global', etiqueta: 'Consultar la agenda global', roles: [ROLES.ADMINISTRADOR, ROLES.COORDINADOR] },
    { id: 'agenda.propia', etiqueta: 'Consultar agenda propia', roles: [ROLES.CLIENTE, ROLES.COLABORADOR] },
    { id: 'entregables.subir', etiqueta: 'Subir entregables', roles: [ROLES.ADMINISTRADOR, ROLES.COORDINADOR, ROLES.COLABORADOR] },
    { id: 'entregables.revisar', etiqueta: 'Aprobar entregas o pedir cambios', roles: [ROLES.ADMINISTRADOR, ROLES.CLIENTE] },
    { id: 'auditoria.leer', etiqueta: 'Consultar auditoría del sistema', roles: [ROLES.ADMINISTRADOR] },
];

export function tienePermiso(rol, permisoId) {
    return MATRIZ_PERMISOS.some((permiso) =>
        permiso.id === permisoId && permiso.roles.includes(rol)
    );
}

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
    coordinador: { ruta: RUTAS.PANEL_COORDINADOR, roles: [ROLES.COORDINADOR] },
    colaborador: { ruta: RUTAS.PANEL_COLABORADOR, roles: [ROLES.COLABORADOR] },
    cliente: { ruta: RUTAS.PANEL_CLIENTE, roles: [ROLES.CLIENTE] },
    operaciones: { ruta: RUTAS.MENU_PRINCIPAL, roles: Object.values(ROLES) },
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