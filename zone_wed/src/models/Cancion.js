// CAPA: Dominio

export function crearCancion(data = {}) {
    return {
        id: data.id ?? null,
        proyecto_id: data.proyecto_id ?? null,
        nombre: data.nombre ?? '',
        duracion: data.duracion ?? null,
        partes: data.partes ?? [],
        requiere_ensayo: data.requiere_ensayo ?? false,
        ...data,
    };
}

export const Cancion = {
    crear: crearCancion,
};

export default crearCancion;