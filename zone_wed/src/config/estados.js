export const ESTADOS = {
    solicitud: {
        estados: ['solicitada', 'confirmada', 'rechazada', 'cancelada'],
        transiciones: {
            solicitada: ['confirmada', 'rechazada', 'cancelada'],
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
        estados: ['borrador', 'facturada', 'pagada', 'cancelada'],
        transiciones: {
            borrador: ['facturada', 'cancelada'],
            facturada: ['pagada', 'cancelada'],
        },
    },
};