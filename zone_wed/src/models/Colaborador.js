// CAPA: Dominio

export function crearColaborador(data = {}) {
    return {
        id: data.id ?? null,
        nombre: data.nombre ?? '',
        especialidad: data.especialidad ?? '',
        usuario_id: data.usuario_id ?? null,
        activo: data.activo ?? true,
        ...data,
    };
}

export const Colaborador = {
    crear: crearColaborador,
    esActivo(colaborador) {
        return Boolean(colaborador) && colaborador.activo !== false;
    },
};

export default crearColaborador;
