// CAPA: Dominio

export function crearSesion(data = {}) {
    return {
        id: data.id ?? null,
        titulo: data.titulo ?? '',
        sala_id: data.sala_id ?? null,
        colaborador_id: data.colaborador_id ?? null,
        fecha: data.fecha ?? null,
        hora_inicio: data.hora_inicio ?? null,
        hora_fin: data.hora_fin ?? null,
        estado: data.estado ?? 'confirmada',
        ...data,
    };
}

export const Sesion = {
    crear: crearSesion,
    estaActiva(sesion) {
        return Boolean(sesion) && ['confirmada', 'en_proceso'].includes(sesion.estado);
    },
};

export default crearSesion;
