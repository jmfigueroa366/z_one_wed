// CAPA: Dominio
import { ROLES } from './roles.ts';

export const RUTAS = Object.freeze({
    LOGIN: '/login',
    REGISTRO: '/register',
    MENU_PRINCIPAL: '/menu-principal',
    ESTUDIO: '/estudio',
    AGENDA: '/agenda',
    ARTISTAS: '/artistas',
    CATALOGO: '/catalogo',
    CHATBOT: '/chatbot',
    CONFIGURACION: '/configuracion',
    ESTADISTICAS: '/estadisticas',
    CUANDO_SUENA: '/cuando-suena',
    PRODUCTORES: '/productores',
    PROYECTOS: '/proyectos',
    SESIONES: '/sesiones',
    SOLICITUDES: '/solicitudes',
    PAGOS: '/pagos',
    PRECIOS: '/precios',
});

export type Ruta = (typeof RUTAS)[keyof typeof RUTAS];

export const rutasPorRol: Record<string, readonly string[]> = Object.freeze({
    [ROLES.ADMINISTRADOR]: [
        RUTAS.MENU_PRINCIPAL,
        RUTAS.ESTUDIO,
        RUTAS.AGENDA,
        RUTAS.SOLICITUDES,
        RUTAS.SESIONES,
        RUTAS.PROYECTOS,
        RUTAS.ARTISTAS,
        RUTAS.PRODUCTORES,
        RUTAS.CATALOGO,
        RUTAS.ESTADISTICAS,
        RUTAS.CUANDO_SUENA,
        RUTAS.CHATBOT,
        RUTAS.PAGOS,
        RUTAS.PRECIOS,
        RUTAS.CONFIGURACION,
    ],
    [ROLES.COLABORADOR]: [
        RUTAS.MENU_PRINCIPAL,
        RUTAS.ESTUDIO,
        RUTAS.AGENDA,
        RUTAS.SOLICITUDES,
        RUTAS.SESIONES,
        RUTAS.PROYECTOS,
        RUTAS.CATALOGO,
        RUTAS.CHATBOT,
        RUTAS.CONFIGURACION,
    ],
    [ROLES.CLIENTE]: [
        RUTAS.MENU_PRINCIPAL,
        RUTAS.ESTUDIO,
        RUTAS.AGENDA,
        RUTAS.SOLICITUDES,
        RUTAS.PROYECTOS,
        RUTAS.PAGOS,
        RUTAS.CATALOGO,
        RUTAS.CHATBOT,
        RUTAS.CONFIGURACION,
    ],
});

export interface NavegacionItem {
    ruta: string;
    etiqueta: string;
    icono: string;
    badge?: string;
}

export interface NavegacionGrupo {
    titulo: string;
    items: NavegacionItem[];
}

export const NAVEGACION: readonly NavegacionGrupo[] = Object.freeze([
    {
        titulo: 'Principal',
        items: [
            { ruta: RUTAS.MENU_PRINCIPAL, etiqueta: 'Inicio', icono: 'Home' },
            { ruta: RUTAS.ESTUDIO, etiqueta: 'Escuchar artistas', icono: 'Music2' },
            { ruta: RUTAS.AGENDA, etiqueta: 'Agenda', icono: 'CalendarDays' },
        ],
    },
    {
        titulo: 'Operación',
        items: [
            { ruta: RUTAS.SOLICITUDES, etiqueta: 'Solicitudes', icono: 'Inbox', badge: 'pendientes' },
            { ruta: RUTAS.SESIONES, etiqueta: 'Sesiones', icono: 'Radio' },
            { ruta: RUTAS.PROYECTOS, etiqueta: 'Mis proyectos', icono: 'FolderKanban' },
            { ruta: RUTAS.PAGOS, etiqueta: 'Pagos', icono: 'Receipt' },
        ],
    },
    {
        titulo: 'Estudio',
        items: [
            { ruta: RUTAS.ARTISTAS, etiqueta: 'Artistas', icono: 'Mic2' },
            { ruta: RUTAS.PRODUCTORES, etiqueta: 'Productores', icono: 'SlidersHorizontal' },
            { ruta: RUTAS.CATALOGO, etiqueta: 'Catálogo', icono: 'LayoutGrid' },
        ],
    },
    {
        titulo: 'Administración',
        items: [
            { ruta: RUTAS.ESTADISTICAS, etiqueta: 'Estadísticas', icono: 'BarChart3' },
            { ruta: RUTAS.CUANDO_SUENA, etiqueta: 'Cuándo suena', icono: 'Flame' },
            { ruta: RUTAS.PRECIOS, etiqueta: 'Precios', icono: 'Coins' },
        ],
    },
    {
        titulo: 'Sistema',
        items: [
            { ruta: RUTAS.CHATBOT, etiqueta: 'Chatbot', icono: 'Bot' },
            { ruta: RUTAS.CONFIGURACION, etiqueta: 'Configuración', icono: 'Settings' },
        ],
    },
]);

export function rutasPermitidasPorRol(rol: string | null | undefined): readonly string[] {
    return (rol ? rutasPorRol[rol] : undefined) ?? rutasPorRol[ROLES.CLIENTE];
}

export function rutaEsPermitida(rol: string | null | undefined, ruta: string): boolean {
    return rutasPermitidasPorRol(rol).includes(ruta);
}
