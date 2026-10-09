// CAPA: Dominio

export function crearCancion(data = {}) {
    return {
        id: data.id ?? null,
        proyecto_id: data.proyecto_id ?? null,
        nombre: data.nombre ?? '',
        duracion: data.duracion ?? null,
        ...data,
    };
}

export const Cancion = {
    crear: crearCancion,
};

export default crearCancion;