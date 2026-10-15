// CAPA: Aplicación
import { Orden, crearPago } from '../models/Orden.js';
import { ordenRepo } from '../repositories/ordenRepo.js';
import { proyectoRepo } from '../repositories/proyectoRepo.js';
import { cancionRepo } from '../repositories/cancionRepo.js';
import { sesionRepo } from '../repositories/sesionRepo.js';
import { ConfiguracionService } from './configuracionService.js';
import { calcularTotalAlbum, calcularTotalCancion, calcularTotalSesion, calcularAnticipoYSaldo, aplicarPoliticaCancelacion, horasDesdeSesiones, redondearMoneda } from './facturacionService.js';
import { TIPOS_ORDEN } from '../config/facturacion.js';
import { ROLES } from '../config/roles.js';
import { SolicitudService } from './solicitudService.js';

const ROLES_FACTURACION = [ROLES.ADMINISTRADOR, ROLES.CLIENTE];

function exigirAcceso(rol) {
    if (!ROLES_FACTURACION.includes(rol)) {
        throw new Error('Tu rol no tiene acceso a la facturación.');
    }
}

function exigirAdministrador(rol) {
    if (rol !== ROLES.ADMINISTRADOR) {
        throw new Error('Solo un administrador puede realizar esta acción.');
    }
}

function esEnsayo(sesion) {
    return sesion?.tipo === 'ensayo';
}

function realizadas(sesiones) {
    return sesiones.filter((sesion) => sesion.estado === 'completada');
}

function agendadas(sesiones) {
    return sesiones.filter((sesion) => sesion.estado !== 'cancelada');
}

function horasPorDia(sesiones) {
    const porFecha = new Map();
    sesiones.forEach((sesion) => {
        const fecha = sesion.fecha ?? 'sin-fecha';
        const horas = horasDesdeSesiones([sesion]);
        porFecha.set(fecha, (porFecha.get(fecha) ?? 0) + horas);
    });
    return [...porFecha.values()];
}

function sesionesDeCancion(cancionId) {
    return sesionRepo.listar().filter((sesion) => String(sesion.cancion_id) === String(cancionId));
}

function sesionesDeProyecto(proyectoId) {
    const canciones = cancionRepo.listarPorProyecto(proyectoId);
    const idsCancion = new Set(canciones.map((cancion) => String(cancion.id)));
    return sesionRepo.listar().filter((sesion) =>
        String(sesion.proyecto_id) === String(proyectoId) ||
        (sesion.cancion_id != null && idsCancion.has(String(sesion.cancion_id)))
    );
}

function construirOrdenCancion({ cancion, usuario_id }, config) {
    const todas = sesionesDeCancion(cancion.id);
    const produccionReal = realizadas(todas).filter((sesion) => !esEnsayo(sesion));
    const ensayoReal = realizadas(todas).filter(esEnsayo);

    const horasProduccion = horasDesdeSesiones(produccionReal);
    const horasEnsayo = horasDesdeSesiones(ensayoReal);
    const requiereEnsayo = Boolean(cancion.requiere_ensayo);

    const total = calcularTotalCancion({ horasProduccion, horasEnsayo, requiereEnsayo }, config);

    const horasEstimadas = horasDesdeSesiones(agendadas(todas).filter((sesion) => !esEnsayo(sesion)));
    const ensayoEstimado = horasDesdeSesiones(agendadas(todas).filter(esEnsayo));
    const estimado = calcularTotalCancion(
        { horasProduccion: horasEstimadas, horasEnsayo: ensayoEstimado, requiereEnsayo },
        config
    );

    return {
        orden: {
            tipo: TIPOS_ORDEN.CANCION,
            usuario_id,
            proyecto_id: cancion.proyecto_id ?? null,
            cancion_id: cancion.id,
            descripcion: `Producción · ${cancion.nombre}`,
            detalle: {
                horasProduccion,
                horasEnsayo: requiereEnsayo ? horasEnsayo : 0,
                requiereEnsayo,
                tarifaProduccion: config.tarifaProduccionHora,
                tarifaEnsayo: config.tarifaEnsayoHora,
                bloqueRedondeoMin: config.bloqueRedondeoMin,
            },
            total_estimado: estimado.total,
        },
        total,
    };
}

function construirOrdenAlbum({ proyecto, usuario_id }, config) {
    const canciones = cancionRepo.listarPorProyecto(proyecto.id);
    const todas = sesionesDeProyecto(proyecto.id);

    const produccionReal = realizadas(todas).filter((sesion) => !esEnsayo(sesion));
    const ensayoReal = realizadas(todas).filter(esEnsayo);

    const dias = horasPorDia(produccionReal);
    const horasEnsayo = horasDesdeSesiones(ensayoReal);
    const total = calcularTotalAlbum(
        { horasPorDia: dias, horasEnsayo, cantidadCanciones: canciones.length },
        config
    );

    const diasEstimados = horasPorDia(agendadas(todas).filter((sesion) => !esEnsayo(sesion)));
    const ensayoEstimado = horasDesdeSesiones(agendadas(todas).filter(esEnsayo));
    const estimado = calcularTotalAlbum(
        { horasPorDia: diasEstimados, horasEnsayo: ensayoEstimado, cantidadCanciones: canciones.length },
        config
    );

    return {
        orden: {
            tipo: TIPOS_ORDEN.ALBUM,
            usuario_id,
            proyecto_id: proyecto.id,
            cancion_id: null,
            descripcion: `${proyecto.nombre}`,
            detalle: {
                horasProduccion: total.horasProduccion,
                horasPorDia: dias,
                horasEnsayo,
                cantidadCanciones: canciones.length,
                umbralDescuento: config.umbralAlbumDescuento,
                descuentoPorcentaje: config.descuentoAlbum,
                tarifaProduccion: config.tarifaProduccionHora,
                tarifaEnsayo: config.tarifaEnsayoHora,
                bloqueRedondeoMin: config.bloqueRedondeoMin,
            },
            total_estimado: estimado.total,
        },
        total,
    };
}

export const OrdenService = {
    listar({ usuario, rol } = {}) {
        exigirAcceso(rol);
        if (rol === ROLES.ADMINISTRADOR) {
            return ordenRepo.listar();
        }
        return ordenRepo.listarPorUsuario(usuario?.id);
    },

    obtenerPorId(id, { usuario, rol } = {}) {
        const orden = ordenRepo.obtenerPorId(id);
        if (!orden) return null;
        if (rol === ROLES.CLIENTE && String(orden.usuario_id) !== String(usuario?.id)) {
            throw new Error('No puedes acceder a una factura que no es tuya.');
        }
        exigirAcceso(rol);
        return orden;
    },

    emitir({ proyecto_id, cancion_id } = {}, { rol } = {}) {
        exigirAdministrador(rol);
        const config = ConfiguracionService.obtener();

        let construccion;
        if (cancion_id != null) {
            const cancion = cancionRepo.obtenerPorId(cancion_id);
            if (!cancion) {
                throw new Error('La canción no existe.');
            }
            const proyecto = cancion.proyecto_id != null ? proyectoRepo.obtenerPorId(cancion.proyecto_id) : null;
            construccion = construirOrdenCancion({ cancion, usuario_id: proyecto?.usuario_id ?? null }, config);
        } else if (proyecto_id != null) {
            const proyecto = proyectoRepo.obtenerPorId(proyecto_id);
            if (!proyecto) {
                throw new Error('El proyecto no existe.');
            }
            construccion = construirOrdenAlbum({ proyecto, usuario_id: proyecto.usuario_id ?? null }, config);
        } else {
            throw new Error('Indica un proyecto o una canción para emitir la factura.');
        }

        const { anticipo, saldo } = calcularAnticipoYSaldo(
            { total: construccion.total.total, totalEstimado: construccion.orden.total_estimado, anticipoPagado: 0 },
            config
        );

        return ordenRepo.crear({
            ...construccion.orden,
            total: construccion.total.total,
            desglose: construccion.total,
            anticipo,
            saldo,
            estado: 'facturada',
            fecha_emision: new Date().toISOString().slice(0, 10),
        });
    },

    // Genera la factura del anticipo de una reserva. La dispara el sistema al
    // autorizar la solicitud (o al crear la sesión), sin exigir rol.
    emitirReserva(referencia, { usuario_id, solicitud_id = null } = {}) {
        if (!referencia) {
            throw new Error('La reserva no existe.');
        }
        const config = ConfiguracionService.obtener();
        const estimado = calcularTotalSesion(
            { tipo: referencia.tipo, horaInicio: referencia.hora_inicio, horaFin: referencia.hora_fin },
            config
        );
        const anticipo = redondearMoneda(estimado.total * config.anticipoPorcentaje);
        const refSolicitud = solicitud_id ?? referencia.solicitud_id ?? null;
        const refSesion = referencia.sesion_id ?? (refSolicitud == null ? referencia.id ?? null : null);
        const franja = referencia.hora_inicio && referencia.hora_fin
            ? `${referencia.hora_inicio}-${referencia.hora_fin}`
            : referencia.franja ?? null;

        return ordenRepo.crear({
            tipo: TIPOS_ORDEN.RESERVA,
            usuario_id: usuario_id ?? null,
            proyecto_id: referencia.proyecto_id ?? null,
            cancion_id: referencia.cancion_id ?? null,
            solicitud_id: refSolicitud,
            descripcion: `Anticipo · ${referencia.titulo || 'Reserva de sesión'}`,
            detalle: {
                sesion_id: refSesion,
                solicitud_id: refSolicitud,
                tipoSesion: referencia.tipo ?? null,
                fecha: referencia.fecha ?? null,
                franja,
                horasProduccion: estimado.horasProduccion,
                horasEnsayo: estimado.horasEnsayo,
                tarifaProduccion: config.tarifaProduccionHora,
                tarifaEnsayo: config.tarifaEnsayoHora,
                bloqueRedondeoMin: config.bloqueRedondeoMin,
            },
            desglose: estimado,
            total: anticipo,
            total_estimado: estimado.total,
            anticipo: 0,
            estado: 'facturada',
            fecha_emision: new Date().toISOString().slice(0, 10),
        });
    },

    pagar(id, { usuario, rol, monto, metodo } = {}) {
        const orden = ordenRepo.obtenerPorId(id);
        if (!orden) {
            throw new Error('La orden no existe.');
        }
        if (rol === ROLES.CLIENTE && String(orden.usuario_id) !== String(usuario?.id)) {
            throw new Error('No puedes pagar una factura que no es tuya.');
        }
        exigirAcceso(rol);

        const valor = Orden.validarPago(orden, { monto });
        const pago = crearPago({ monto: valor, metodo, registrado_por: usuario?.id ?? null });
        const pagos = [...orden.pagos, pago];
        const pagado = orden.pagado + valor;
        const nuevoEstado = pagado >= orden.total ? 'pagada' : 'parcial';
        if (!Orden.puedeTransicionar(orden, nuevoEstado)) {
            throw new Error('La orden no admite ese pago en su estado actual.');
        }

        const actualizada = ordenRepo.actualizar(id, {
            pagos,
            estado: nuevoEstado,
            pagada_en: nuevoEstado === 'pagada' ? pago.fecha : orden.pagada_en ?? null,
        });

        // Al pagar el anticipo de la reserva, la solicitud se confirma y se
        // crea la sesión: sin ese pago el proceso no continúa.
        if (actualizada.estado === 'pagada' && actualizada.tipo === TIPOS_ORDEN.RESERVA && actualizada.solicitud_id != null) {
            SolicitudService.confirmarPorPago(actualizada.solicitud_id);
        }

        return actualizada;
    },

    cancelar(id, { usuario, rol, horasAnticipacion = 0 } = {}) {
        const orden = ordenRepo.obtenerPorId(id);
        if (!orden) {
            throw new Error('La orden no existe.');
        }
        if (rol === ROLES.CLIENTE && String(orden.usuario_id) !== String(usuario?.id)) {
            throw new Error('No puedes cancelar una factura que no es tuya.');
        }
        exigirAcceso(rol);
        if (orden.estado === 'pagada') {
            throw new Error('Una orden pagada no se puede cancelar.');
        }
        if (!Orden.puedeTransicionar(orden, 'cancelada')) {
            throw new Error('Esta orden no se puede cancelar en su estado actual.');
        }

        const config = ConfiguracionService.obtener();
        const { cargo } = aplicarPoliticaCancelacion(
            { estimado: orden.total_estimado, horasAnticipacion },
            config
        );

        const actualizada = ordenRepo.actualizar(id, {
            estado: 'cancelada',
            fecha_cancelacion: new Date().toISOString().slice(0, 10),
            cargo_cancelacion: cargo,
        });

        // Si se cancela el anticipo de una reserva, la solicitud también se cancela.
        if (actualizada.tipo === TIPOS_ORDEN.RESERVA && actualizada.solicitud_id != null) {
            try {
                SolicitudService.cancelar(actualizada.solicitud_id);
            } catch {
                /* la solicitud ya no se puede cancelar: se ignora */
            }
        }

        return actualizada;
    },

    resumen({ usuario, rol } = {}) {
        const ordenes = this.listar({ usuario, rol });
        return ordenes.reduce(
            (acc, orden) => {
                if (orden.estado === 'cancelada') return acc;
                acc.facturado += orden.total;
                acc.pagado += orden.pagado;
                acc.porPagar += orden.saldo > 0 ? orden.saldo : 0;
                acc.saldoFavor += orden.saldo_favor;
                if (['facturada', 'parcial'].includes(orden.estado)) acc.pendientes += 1;
                return acc;
            },
            { facturado: 0, pagado: 0, porPagar: 0, saldoFavor: 0, pendientes: 0 }
        );
    },
};

export default OrdenService;
