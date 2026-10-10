// CAPA: Aplicación
import { sesionRepo } from '../repositories/sesionRepo.js';
import { solicitudRepo } from '../repositories/solicitudRepo.js';
import { salaRepo } from '../repositories/salaRepo.js';
import { ordenRepo } from '../repositories/ordenRepo.js';
import { colaboradorRepo } from '../repositories/colaboradorRepo.js';

const ETIQUETAS_ESTADO = {
    completada: 'Completadas',
    confirmada: 'Confirmadas',
    en_proceso: 'En proceso',
    pendiente: 'Pendientes',
    cancelada: 'Canceladas',
};

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];

function aMinutos(hora) {
    if (!hora || typeof hora !== 'string') return 0;
    const [horas, minutos] = hora.split(':').map(Number);
    if (!Number.isFinite(horas)) return 0;
    return horas * 60 + (Number.isFinite(minutos) ? minutos : 0);
}

function horasDeSesion(sesion) {
    const inicio = aMinutos(sesion.hora_inicio);
    const fin = aMinutos(sesion.hora_fin);
    if (fin <= inicio) return Number(sesion.duracion) || 0;
    return (fin - inicio) / 60;
}

function diaSemana(fecha) {
    if (!fecha) return null;
    const valor = new Date(`${fecha}T00:00:00`);
    return Number.isNaN(valor.getTime()) ? null : valor.getDay();
}

function redondear(valor, decimales = 0) {
    const factor = 10 ** decimales;
    return Math.round(valor * factor) / factor;
}

function describirIndice(valor) {
    if (valor >= 75) return 'Ritmo efervescente';
    if (valor >= 55) return 'Pulso saludable';
    if (valor >= 35) return 'Respiración estable';
    return 'Latido en calma';
}

export const EstadisticasService = {
    obtenerResumen() {
        const sesiones = sesionRepo.listar();
        const solicitudes = solicitudRepo.listar();

        return {
            totalSesiones: sesiones.length,
            totalSolicitudes: solicitudes.length,
            sesionesCompletadas: sesiones.filter((sesion) => sesion.estado === 'completada').length,
            solicitudesAbiertas: solicitudes.filter((solicitud) => ['solicitud', 'en_negociacion'].includes(solicitud.estado)).length,
        };
    },

    obtenerAnalitica() {
        const sesiones = sesionRepo.listar();
        const solicitudes = solicitudRepo.listar();
        const salas = salaRepo.listar();
        const ordenes = ordenRepo.listar();
        const colaboradores = colaboradorRepo.listar();

        const porEstadoMapa = new Map();
        sesiones.forEach((sesion) => {
            const clave = sesion.estado ?? 'pendiente';
            porEstadoMapa.set(clave, (porEstadoMapa.get(clave) ?? 0) + 1);
        });
        const porEstado = [...porEstadoMapa.entries()]
            .map(([estado, valor]) => ({ estado, etiqueta: ETIQUETAS_ESTADO[estado] ?? estado, valor }))
            .sort((a, b) => b.valor - a.valor);

        const sesionesPorSala = new Map();
        sesiones.forEach((sesion) => {
            const clave = String(sesion.sala_id);
            const actual = sesionesPorSala.get(clave) ?? { sesiones: 0, horas: 0 };
            actual.sesiones += 1;
            actual.horas += horasDeSesion(sesion);
            sesionesPorSala.set(clave, actual);
        });

        const sesionPorId = new Map(sesiones.map((sesion) => [String(sesion.id), sesion]));
        const ingresosPorSala = new Map();
        ordenes.forEach((orden) => {
            const sesion = sesionPorId.get(String(orden.sesion_id));
            if (!sesion) return;
            const clave = String(sesion.sala_id);
            ingresosPorSala.set(clave, (ingresosPorSala.get(clave) ?? 0) + Number(orden.total || 0));
        });

        const porSala = salas
            .map((sala) => {
                const clave = String(sala.id);
                const datos = sesionesPorSala.get(clave) ?? { sesiones: 0, horas: 0 };
                return {
                    id: sala.id,
                    nombre: sala.nombre,
                    precioHora: sala.precio_hora ?? 0,
                    sesiones: datos.sesiones,
                    horas: redondear(datos.horas, 1),
                    ingresos: ingresosPorSala.get(clave) ?? 0,
                };
            })
            .sort((a, b) => b.sesiones - a.sesiones);

        const totalHoras = sesiones.reduce((suma, sesion) => suma + horasDeSesion(sesion), 0);
        const capacidadHoras = Math.max(salas.length, 1) * 8 * 5;
        const ocupacion = Math.min(100, redondear((totalHoras / capacidadHoras) * 100));

        const sesionesPorColaborador = new Map();
        sesiones.forEach((sesion) => {
            const clave = String(sesion.colaborador_id);
            sesionesPorColaborador.set(clave, (sesionesPorColaborador.get(clave) ?? 0) + 1);
        });
        const porColaborador = [...sesionesPorColaborador.entries()]
            .map(([id, valor]) => ({
                id,
                nombre: colaboradores.find((colaborador) => String(colaborador.id) === id)?.nombre ?? `Talento #${id}`,
                valor,
            }))
            .sort((a, b) => b.valor - a.valor)
            .slice(0, 5);
        const maxColaborador = Math.max(1, ...porColaborador.map((item) => item.valor));

        const conteoDias = ORDEN_DIAS.map((indice) => ({ dia: DIAS[indice], valor: 0 }));
        sesiones.forEach((sesion) => {
            const indice = diaSemana(sesion.fecha);
            if (indice === null) return;
            const posicion = ORDEN_DIAS.indexOf(indice);
            if (posicion >= 0) conteoDias[posicion].valor += 1;
        });
        const maxDia = Math.max(1, ...conteoDias.map((item) => item.valor));
        const diaPico = [...conteoDias].sort((a, b) => b.valor - a.valor)[0];

        const ingresos = { total: 0, cobrado: 0, porCobrar: 0, borrador: 0 };
        const ingresosPorEstadoMapa = new Map();
        ordenes.forEach((orden) => {
            const valor = Number(orden.total || 0);
            ingresos.total += valor;
            if (orden.estado === 'pagada') ingresos.cobrado += valor;
            else if (orden.estado === 'borrador') ingresos.borrador += valor;
            else ingresos.porCobrar += valor;
            ingresosPorEstadoMapa.set(orden.estado, (ingresosPorEstadoMapa.get(orden.estado) ?? 0) + valor);
        });

        const completadas = sesiones.filter((sesion) => sesion.estado === 'completada').length;
        const confirmadas = sesiones.filter((sesion) => sesion.estado === 'confirmada').length;
        const solicitudesAbiertas = solicitudes.filter((solicitud) => ['solicitud', 'en_negociacion'].includes(solicitud.estado)).length;

        const intensidad = Math.min(100, sesiones.length * 12);
        const comercial = Math.min(100, solicitudes.length * 9);
        const conversion = sesiones.length ? Math.round((completadas / sesiones.length) * 100) : 0;
        const indiceActividad = Math.round((intensidad + comercial + conversion) / 3);

        const salaTop = porSala[0];
        const participacionSala = salaTop && sesiones.length ? Math.round((salaTop.sesiones / sesiones.length) * 100) : 0;

        const insightDefecto = [
            {
                etiqueta: 'Ocupación',
                titulo: `La semana respira al ${ocupacion}%`,
                texto: `${redondear(totalHoras, 1)} h reservadas sobre una base operativa de ${capacidadHoras} h entre ${salas.length} cabinas.`,
                tono: ocupacion >= 60 ? 'exito' : 'aviso',
            },
            {
                etiqueta: 'Foco',
                titulo: salaTop ? `${salaTop.nombre} marca el pulso` : 'Sin actividad registrada',
                texto: salaTop
                    ? `Concentra el ${participacionSala}% de las sesiones (${salaTop.sesiones}) y ${salaTop.horas} h de estudio.`
                    : 'Aún no hay sesiones que dibujen una tendencia clara.',
                tono: 'accent',
            },
            {
                etiqueta: 'Tendencia',
                titulo: diaPico && diaPico.valor > 0 ? `${diaPico.dia} es el día que despierta` : 'Semana sin picos marcados',
                texto: diaPico && diaPico.valor > 0
                    ? `${diaPico.valor} sesiones caen en ${diaPico.dia}; el resto de la semana respira distinto.`
                    : 'Los movimientos están repartidos y no hay una jornada dominante.',
                tono: 'magenta',
            },
            {
                etiqueta: 'Comercial',
                titulo: solicitudesAbiertas ? `${solicitudesAbiertas} hilos por cerrar` : 'Bandeja en calma',
                texto: solicitudesAbiertas
                    ? `Hay ${solicitudesAbiertas} solicitudes entre petición y negociación esperando una decisión.`
                    : 'No hay solicitudes abiertas compitiendo por atención.',
                tono: solicitudesAbiertas ? 'aviso' : 'exito',
            },
        ];

        return {
            kpis: {
                totalSesiones: sesiones.length,
                completadas,
                confirmadas,
                ocupacion,
                totalSolicitudes: solicitudes.length,
                solicitudesAbiertas,
                totalOrdenes: ordenes.length,
            },
            porEstado,
            porSala,
            porColaborador,
            maxColaborador,
            conteoDias,
            maxDia,
            ordenes: { ...ingresos, porEstado: [...ingresosPorEstadoMapa.entries()].map(([estado, valor]) => ({ estado, valor })) },
            indice: { valor: indiceActividad, descriptor: describirIndice(indiceActividad), componentes: { intensidad, comercial, conversion } },
            insights: insightDefecto,
        };
    },
};

export default EstadisticasService;
