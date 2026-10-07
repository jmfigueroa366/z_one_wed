//Reglas de negocio de órdenes de servicio
//La orden se genera a partir de una sesión completada y lleva el movimiento de dinero.
//Estados del flujo de pago: borrador → facturada → pagada (o cancelada).

import { Storage } from './storage.js';
import { SesionRepo, ESTADOS_SESION } from './sesionRepo.js';

const COLECCION = 'ordenes_servicio';

export const ESTADOS_ORDEN = {
    BORRADOR: 'borrador',
    FACTURADA: 'facturada',
    PAGADA: 'pagada',
    CANCELADA: 'cancelada',
};

export const OrdenRepo = {

    todas() {
        return Storage.obtenerTodos(COLECCION);
    },

    porId(id) {
        return Storage.obtenerPorId(COLECCION, id);
    },

    // Órdenes de un mes, dado en formato "aaaa-mm" (2026-09).
    deMes(mes) {
        return Storage.buscar(COLECCION, (o) => String(o.fecha_emision).startsWith(mes));
    },

    // Dinero facturado en un mes
    totalDeMes(mes) {
        return this.deMes(mes)
            .filter((o) => o.estado === ESTADOS_ORDEN.FACTURADA)
            .reduce((total, o) => total + (Number(o.total) || 0), 0);
    },

    crear(datos) {
        const sesionId = Number(datos?.sesion_id);
        const total = Number(datos?.total);
        const fechaEmision = String(datos?.fecha_emision || '');

        const sesion = SesionRepo.porId(sesionId);
        if (!sesion) throw new Error('La sesión seleccionada no existe.');
        if (sesion.estado !== ESTADOS_SESION.COMPLETADA)
            throw new Error('Solo se facturan sesiones completadas.');
        if (!(total > 0)) throw new Error('El total debe ser mayor que cero.');
        if (!fechaEmision) throw new Error('La fecha de emisión es obligatoria.');

        return Storage.crear(COLECCION, {
            sesion_id: sesionId,
            descripcion: String(datos?.descripcion || ''),
            total,
            estado: ESTADOS_ORDEN.BORRADOR,
            fecha_emision: fechaEmision,
        });
    },

    // No se borran órdenes: se cancelan (queda la huella).
    cambiarEstado(id, estado) {
        const valido = Object.values(ESTADOS_ORDEN).includes(estado);
        if (!valido) throw new Error(`El estado "${estado}" no es válido para una orden.`);
        if (!this.porId(id)) return null;
        return Storage.actualizar(COLECCION, id, { estado });
    },

    facturar: (id) => OrdenRepo.cambiarEstado(id, ESTADOS_ORDEN.FACTURADA),
    pagar: (id) => OrdenRepo.cambiarEstado(id, ESTADOS_ORDEN.PAGADA),
    cancelar: (id) => OrdenRepo.cambiarEstado(id, ESTADOS_ORDEN.CANCELADA),
};