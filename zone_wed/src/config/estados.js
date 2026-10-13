export const ESTADOS = {
    solicitud: {
        estados: ['solicitud', 'en_negociacion', 'confirmada', 'rechazada', 'expirada'],
        transiciones: {
            solicitud: ['en_negociacion', 'confirmada', 'rechazada'],
            en_negociacion: ['confirmada', 'rechazada'],
        }
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