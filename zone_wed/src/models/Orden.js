// CAPA: Dominio

export function crearOrden(data = {}) {
    return {
        id: data.id ?? null,
        sesion_id: data.sesion_id ?? null,
        descripcion: data.descripcion ?? '',
        total: data.total ?? 0,
        estado: data.estado ?? 'borrador',
        fecha_emision: data.fecha_emision ?? null,
        ...data,
    };
}

export const Orden = {
    crear: crearOrden,
    estaPagada(orden) {
        return Boolean(orden) && orden.estado === 'pagada';
    },
};

export default crearOrden;
