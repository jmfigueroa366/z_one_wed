export const ESTADOS = {
    solicitud: {
        // Flujo: el cliente pide -> los colaboradores aceptan (por_autorizar)
        // -> el administrador autoriza (por_pagar) -> el cliente paga (confirmada).
        estados: ['solicitada', 'por_autorizar', 'por_pagar', 'confirmada', 'rechazada', 'cancelada'],
        transiciones: {
            solicitada: ['por_autorizar', 'rechazada', 'cancelada'],
            por_autorizar: ['por_pagar', 'confirmada', 'rechazada', 'cancelada'],
            por_pagar: ['confirmada', 'cancelada'],
            confirmada: ['cancelada'],
        },
    },
    invitacion: {
        estados: ['pendiente', 'aceptada', 'rechazada'],
        transiciones: {
            pendiente: ['aceptada', 'rechazada'],
        },
    },
    sesion: {
        estados: ['solicitada', 'confirmada', 'completada', 'cancelada'],
        transiciones: {
            solicitada: ['confirmada', 'cancelada'],
            confirmada: ['completada', 'cancelada'],
        },
    },
    orden: {
        estados: ['borrador', 'facturada', 'parcial', 'pagada', 'cancelada'],
        transiciones: {
            borrador: ['facturada', 'cancelada'],
            facturada: ['parcial', 'pagada', 'cancelada'],
            parcial: ['pagada'],
            pagada: [],
            cancelada: [],
        },
    },
};

// Estados de solicitud que mantienen la cabina y el equipo comprometidos.
export const ESTADOS_SOLICITUD_ACTIVOS = ['solicitada', 'por_autorizar', 'por_pagar', 'confirmada'];