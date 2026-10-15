// CAPA: Infraestructura
// Datos iniciales; la persistencia se orquesta desde la capa de aplicación.
//
// Las órdenes de servicio NO se escriben a mano: se derivan de los proyectos,
// canciones y sesiones reales usando las mismas funciones de facturacionService
// que usa la aplicación en tiempo de ejecución.

import { FACTURACION } from '../config/facturacion.js';
import {
    calcularTotalAlbum,
    calcularTotalCancion,
    calcularAnticipoYSaldo,
    horasDesdeSesiones,
} from '../services/facturacionService.js';

// Incrementa este valor cuando cambie SEED para que los navegadores
// con datos antiguos se repueblen automáticamente.
export const SEED_VERSION = '2026-10-15-1';

function fechaLocalISO(fecha) {
    return (
        fecha.getFullYear() + '-' +
        String(fecha.getMonth() + 1).padStart(2, '0') + '-' +
        String(fecha.getDate()).padStart(2, '0')
    );
}

function enDias(offset) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return fechaLocalISO(d);
}

// --- Proyectos, canciones y sesiones (base de la facturación) ---

const PROYECTOS = [
    { id: 1, nombre: 'Mi primer álbum', usuario_id: 3, tipo: 'album' },
    { id: 2, nombre: 'Sencillos 2026', usuario_id: 3, tipo: 'ep' },
];

const CANCIONES = [
    { id: 1, proyecto_id: 1, nombre: 'Amanecer', duracion: 3, partes: ['Vocales', 'Guitarra', 'Batería', 'Coros'], requiere_ensayo: true },
    { id: 2, proyecto_id: 1, nombre: 'Ritmo del alma', duracion: 4, partes: ['Vocales', 'Bajo', 'Teclados'] },
    { id: 3, proyecto_id: 1, nombre: 'Sin título', duracion: 2 },
    ...Array.from({ length: 13 }, (_, i) => ({
        id: i + 4,
        proyecto_id: 1,
        nombre: `Pista ${i + 4}`,
        duracion: 3,
    })),
    { id: 17, proyecto_id: 2, nombre: 'Noche azul', duracion: 3, partes: ['Voz', 'Teclados'] },
    { id: 18, proyecto_id: 2, nombre: 'Contigo', duracion: 3 },
];

const SESIONES = [
    { id: 1, titulo: 'Grabación Lúa', sala_id: 1, colaborador_id: 1, fecha: enDias(-3), hora_inicio: '10:00', hora_fin: '12:00', tipo: 'grabacion', estado: 'completada' },
    { id: 2, titulo: 'Mezcla Batey Norte', sala_id: 3, colaborador_id: 2, fecha: enDias(-2), hora_inicio: '15:00', hora_fin: '18:00', tipo: 'mezcla', estado: 'completada' },
    { id: 3, titulo: 'Masterización Ecos', sala_id: 2, colaborador_id: 6, fecha: enDias(-1), hora_inicio: '09:00', hora_fin: '10:30', tipo: 'masterizacion', estado: 'completada' },
    { id: 4, titulo: 'Grabación Amanecer', solicitud_id: 3, sala_id: 2, colaborador_id: 3, fecha: enDias(2), hora_inicio: '09:00', hora_fin: '11:00', tipo: 'grabacion', estado: 'confirmada', cancion_id: 1, proyecto_id: 1, partes: ['Vocales', 'Guitarra'] },
    { id: 5, titulo: 'Producción Leo Norte', sala_id: 1, colaborador_id: 4, fecha: enDias(2), hora_inicio: '14:00', hora_fin: '16:00', tipo: 'produccion', estado: 'confirmada' },
    { id: 6, titulo: 'Composición Alma Beats', sala_id: 3, colaborador_id: 5, fecha: enDias(3), hora_inicio: '18:00', hora_fin: '20:00', tipo: 'produccion', estado: 'confirmada' },
    { id: 7, titulo: 'Ensayo Amanecer', solicitud_id: 6, sala_id: 3, colaborador_id: 1, fecha: enDias(-4), hora_inicio: '11:00', hora_fin: '13:00', tipo: 'ensayo', estado: 'completada', cancion_id: 1, proyecto_id: 1 },
    { id: 8, titulo: 'Grabación álbum · día 1', sala_id: 1, colaborador_id: 1, fecha: enDias(-10), hora_inicio: '08:00', hora_fin: '16:00', tipo: 'grabacion', estado: 'completada', cancion_id: 1, proyecto_id: 1 },
    { id: 9, titulo: 'Grabación álbum · día 2', sala_id: 1, colaborador_id: 1, fecha: enDias(-9), hora_inicio: '08:00', hora_fin: '16:00', tipo: 'grabacion', estado: 'completada', cancion_id: 1, proyecto_id: 1 },
    { id: 10, titulo: 'Grabación álbum · día 3', sala_id: 1, colaborador_id: 4, fecha: enDias(-8), hora_inicio: '08:00', hora_fin: '16:00', tipo: 'grabacion', estado: 'completada', cancion_id: 1, proyecto_id: 1 },
    { id: 11, titulo: 'Grabación Noche azul', sala_id: 2, colaborador_id: 3, fecha: enDias(-6), hora_inicio: '10:00', hora_fin: '13:00', tipo: 'grabacion', estado: 'completada', cancion_id: 17, proyecto_id: 2 },
    { id: 12, titulo: 'Grabación Contigo', sala_id: 2, colaborador_id: 3, fecha: enDias(-5), hora_inicio: '10:00', hora_fin: '14:00', tipo: 'grabacion', estado: 'completada', cancion_id: 18, proyecto_id: 2 },
];

function horasPorDiaDe(sesiones) {
    const porFecha = new Map();
    sesiones.forEach((sesion) => {
        porFecha.set(sesion.fecha, (porFecha.get(sesion.fecha) ?? 0) + horasDesdeSesiones([sesion]));
    });
    return [...porFecha.values()];
}

function construirOrdenAlbum() {
    const proyecto = PROYECTOS[0];
    const canciones = CANCIONES.filter((cancion) => cancion.proyecto_id === proyecto.id);
    const sesiones = SESIONES.filter((sesion) => sesion.proyecto_id === proyecto.id);
    const realizadas = sesiones.filter((sesion) => sesion.estado === 'completada');
    const ensayoReal = realizadas.filter((sesion) => sesion.tipo === 'ensayo');
    const produccionReal = realizadas.filter((sesion) => sesion.tipo !== 'ensayo');

    const total = calcularTotalAlbum({
        horasPorDia: horasPorDiaDe(produccionReal),
        horasEnsayo: horasDesdeSesiones(ensayoReal),
        cantidadCanciones: canciones.length,
    }, FACTURACION);

    const agendadas = sesiones.filter((sesion) => sesion.estado !== 'cancelada');
    const estimado = calcularTotalAlbum({
        horasPorDia: horasPorDiaDe(agendadas.filter((sesion) => sesion.tipo !== 'ensayo')),
        horasEnsayo: horasDesdeSesiones(agendadas.filter((sesion) => sesion.tipo === 'ensayo')),
        cantidadCanciones: canciones.length,
    }, FACTURACION);

    const { anticipo, saldo } = calcularAnticipoYSaldo(
        { total: total.total, totalEstimado: estimado.total, anticipoPagado: 0 },
        FACTURACION
    );

    return {
        numero: `ZW-${new Date().getFullYear()}-0001`,
        tipo: 'album',
        usuario_id: proyecto.usuario_id,
        proyecto_id: proyecto.id,
        descripcion: proyecto.nombre,
        detalle: {
            horasProduccion: total.horasProduccion,
            horasPorDia: horasPorDiaDe(produccionReal),
            horasEnsayo: total.horasEnsayo,
            cantidadCanciones: canciones.length,
            descuentoPorcentaje: FACTURACION.descuentoAlbum,
            tarifaProduccion: FACTURACION.tarifaProduccionHora,
            tarifaEnsayo: FACTURACION.tarifaEnsayoHora,
        },
        desglose: total,
        total: total.total,
        total_estimado: estimado.total,
        anticipo,
        saldo,
        estado: 'facturada',
        fecha_emision: enDias(-7),
    };
}

function construirOrdenCancion(cancionId, { numero, estado, pagos = [] }) {
    const cancion = CANCIONES.find((item) => item.id === cancionId);
    const sesiones = SESIONES.filter((sesion) => sesion.cancion_id === cancionId);
    const realizadas = sesiones.filter((sesion) => sesion.estado === 'completada');
    const ensayoReal = realizadas.filter((sesion) => sesion.tipo === 'ensayo');
    const produccionReal = realizadas.filter((sesion) => sesion.tipo !== 'ensayo');

    const total = calcularTotalCancion({
        horasProduccion: horasDesdeSesiones(produccionReal),
        horasEnsayo: horasDesdeSesiones(ensayoReal),
        requiereEnsayo: cancion.requiere_ensayo,
    }, FACTURACION);

    const { anticipo, saldo } = calcularAnticipoYSaldo(
        { total: total.total, totalEstimado: total.total, anticipoPagado: 0 },
        FACTURACION
    );

    return {
        numero,
        tipo: 'cancion',
        usuario_id: PROYECTOS.find((proyecto) => proyecto.id === cancion.proyecto_id)?.usuario_id ?? null,
        proyecto_id: cancion.proyecto_id,
        cancion_id: cancion.id,
        descripcion: `Producción · ${cancion.nombre}`,
        detalle: {
            horasProduccion: total.horasProduccion,
            horasEnsayo: total.horasEnsayo,
            requiereEnsayo: cancion.requiere_ensayo,
            tarifaProduccion: FACTURACION.tarifaProduccionHora,
            tarifaEnsayo: FACTURACION.tarifaEnsayoHora,
        },
        desglose: total,
        total: total.total,
        total_estimado: total.total,
        anticipo,
        saldo,
        estado,
        fecha_emision: enDias(-6),
        pagos,
    };
}

const SOLICITUDES = [
    {
        usuario_id: 2, solicitante_nombre: 'Lúa Ferreira', sala_id: 1,
        fecha: enDias(0), franja: '10:00-12:00', tipo: 'grabacion',
        titulo: 'Grabación de voces', descripcion: '', fecha_solicitud: enDias(-2),
        colaboradores: [{ colaborador_id: 1, rol: 'artista', estado: 'pendiente' }],
        estado: 'solicitada',
    },
    {
        usuario_id: 3, solicitante_nombre: 'Cliente Zeta', sala_id: 3,
        fecha: enDias(1), franja: '15:00-18:00', tipo: 'produccion',
        titulo: 'Producción de sencillo', descripcion: 'Necesito dirección musical', fecha_solicitud: enDias(-1),
        colaboradores: [
            { colaborador_id: 2, rol: 'productor', estado: 'aceptada' },
            { colaborador_id: 5, rol: 'artista', estado: 'aceptada' },
        ],
        estado: 'por_autorizar',
    },
    {
        usuario_id: 3, solicitante_nombre: 'Cliente Zeta', sala_id: 1,
        fecha: enDias(6), franja: '09:00-12:00', tipo: 'grabacion',
        titulo: 'EP Primavera', descripcion: 'Primeras tomas del EP', fecha_solicitud: enDias(-3),
        colaboradores: [
            { colaborador_id: 3, rol: 'artista', estado: 'aceptada' },
            { colaborador_id: 4, rol: 'productor', estado: 'aceptada' },
        ],
        estado: 'por_pagar',
    },
    {
        usuario_id: 3, solicitante_nombre: 'Cliente Zeta', sala_id: 2,
        fecha: enDias(2), franja: '09:00-11:00', tipo: 'grabacion',
        titulo: 'Grabación Amanecer', cancion_id: 1, proyecto_id: 1, partes: ['Vocales', 'Guitarra'],
        fecha_solicitud: enDias(-5),
        colaboradores: [
            { colaborador_id: 3, rol: 'artista', estado: 'aceptada' },
            { colaborador_id: 4, rol: 'productor', estado: 'aceptada' },
        ],
        estado: 'confirmada',
    },
    {
        usuario_id: 3, solicitante_nombre: 'Cliente Zeta', sala_id: 1,
        fecha: enDias(-1), franja: '14:00-16:00', tipo: 'produccion',
        titulo: 'Producción descartada', descripcion: '', fecha_solicitud: enDias(-4),
        colaboradores: [
            { colaborador_id: 4, rol: 'productor', estado: 'aceptada' },
            { colaborador_id: 5, rol: 'artista', estado: 'rechazada' },
        ],
        estado: 'rechazada',
    },
    {
        usuario_id: 2, solicitante_nombre: 'Lúa Ferreira', sala_id: 2,
        fecha: enDias(3), franja: '18:00-20:00', tipo: 'masterizacion',
        titulo: 'Masterización', descripcion: '', fecha_solicitud: enDias(0),
        colaboradores: [{ colaborador_id: 5, rol: 'artista', estado: 'pendiente' }],
        estado: 'solicitada',
    },
    {
        usuario_id: 2, solicitante_nombre: 'Lúa Ferreira', sala_id: 3,
        fecha: enDias(-4), franja: '11:00-13:00', tipo: 'ensayo',
        titulo: 'Ensayo general', descripcion: '', fecha_solicitud: enDias(-8),
        colaboradores: [{ colaborador_id: 1, rol: 'artista', estado: 'aceptada' }],
        estado: 'confirmada',
    },
    {
        usuario_id: 3, solicitante_nombre: 'Cliente Zeta', sala_id: 2,
        fecha: enDias(4), franja: '10:00-12:00', tipo: 'mezcla',
        titulo: 'Mezcla cancelada', descripcion: '', fecha_solicitud: enDias(-1),
        colaboradores: [{ colaborador_id: 2, rol: 'productor', estado: 'pendiente' }],
        estado: 'cancelada',
    },
    {
        usuario_id: 3, solicitante_nombre: 'Cliente Zeta', sala_id: 2,
        fecha: enDias(5), franja: '16:00-19:00', tipo: 'mezcla',
        titulo: 'Mezcla Noche azul', cancion_id: 17, proyecto_id: 2, descripcion: '', fecha_solicitud: enDias(0),
        colaboradores: [
            { colaborador_id: 3, rol: 'artista', estado: 'pendiente' },
            { colaborador_id: 4, rol: 'productor', estado: 'pendiente' },
        ],
        estado: 'solicitada',
    },
];

const ORDENES_SERVICIO = [
    construirOrdenAlbum(),
    construirOrdenCancion(17, {
        numero: `ZW-${new Date().getFullYear()}-0002`,
        estado: 'parcial',
        pagos: [{ monto: 60000, metodo: 'transferencia', fecha: enDias(-3), registrado_por: 3 }],
    }),
    construirOrdenCancion(18, {
        numero: `ZW-${new Date().getFullYear()}-0003`,
        estado: 'pagada',
        pagos: [{ monto: 160000, metodo: 'efectivo', fecha: enDias(-2), registrado_por: 3 }],
    }),
];

export const SEED = {
    usuarios: [
        { nombre: 'Dirección Z-ONE', email: 'admin@z-one.com', password: 'admin123', rol: 'administrador', activo: true },
        { nombre: 'Lúa Ferreira', email: 'lua@z-one.com', password: 'colab123', rol: 'colaborador', perfil: 'artista', activo: true },
        { nombre: 'Cliente Zeta', email: 'cliente@z-one.com', password: 'cliente123', rol: 'cliente', activo: true },
        { nombre: 'Mario', email: 'mario@z-one.com', password: 'colab123', rol: 'colaborador', perfil: 'ingeniero', activo: true },
    ],

    salas: [
        { nombre: 'Cabina A', precio_hora: 40000, activo: true },
        { nombre: 'Cabina B', precio_hora: 47000, activo: true },
        { nombre: 'Sala de mezcla', precio_hora: 60000, activo: true },
    ],

    colaboradores: [
        { nombre: 'Lúa Ferreira', especialidad: 'Canto', usuario_id: 2, activo: true },
        { nombre: 'Batey Norte', especialidad: 'Producción', activo: true },
        { nombre: 'Nova Lima', especialidad: 'Canto', activo: true },
        { nombre: 'Leo Norte', especialidad: 'Producción', activo: true },
        { nombre: 'Alma Beats', especialidad: 'Composición', activo: true },
        { nombre: 'Ecos del Sur', especialidad: 'Instrumental', activo: false },
        { nombre: 'Mario', especialidad: 'Ingeniero de sonido', usuario_id: 4, activo: true },
    ],

    solicitudes: SOLICITUDES,

    sesiones: SESIONES,

    proyectos: PROYECTOS,

    canciones: CANCIONES,

    ordenes_servicio: ORDENES_SERVICIO,
};
