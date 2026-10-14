// CAPA: Dominio

export function crearProyecto(data = {}) {
    return {
        id: data.id ?? null,
        nombre: data.nombre ?? '',
        usuario_id: data.usuario_id ?? null,
        creado_en: data.creado_en ?? new Date().toISOString(),
        ...data,
    };
}

export const Proyecto = {
    crear: crearProyecto,
};

export default crearProyecto;