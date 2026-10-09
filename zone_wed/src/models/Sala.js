// CAPA: Dominio

export function crearSala(data = {}) {
    return {
        id: data.id ?? null,
        nombre: data.nombre ?? '',
        precio_hora: data.precio_hora ?? 0,
        activo: data.activo ?? true,
        ...data,
    };
}

export const Sala = {
    crear: crearSala,
    esActivo(sala) {
        return Boolean(sala) && sala.activo !== false;
    },
};

export default crearSala;
