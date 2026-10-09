// CAPA: Dominio

export function crearArtista(data = {}) {
    return {
        id: data.id ?? null,
        nombre: data.nombre ?? '',
        especialidad: data.especialidad ?? '',
        usuario_id: data.usuario_id ?? null,
        activo: data.activo ?? true,
        ...data,
    };
}

export const Artista = {
    crear: crearArtista,
    esActivo(artista) {
        return Boolean(artista) && artista.activo !== false;
    },
};

export default crearArtista;
