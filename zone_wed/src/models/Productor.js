// CAPA: Dominio

export function crearProductor(data = {}) {
    return {
        id: data.id ?? null,
        nombre: data.nombre ?? '',
        especialidad: data.especialidad ?? '',
        usuario_id: data.usuario_id ?? null,
        activo: data.activo ?? true,
        ...data,
    };
}

export const Productor = {
    crear: crearProductor,
    esActivo(productor) {
        return Boolean(productor) && productor.activo !== false;
    },
};

export default crearProductor;
