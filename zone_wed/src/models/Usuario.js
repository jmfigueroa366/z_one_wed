// CAPA: Dominio

export function crearUsuario(data = {}) {
    return {
        id: data.id ?? null,
        nombre: data.nombre ?? '',
        email: data.email ?? '',
        password: data.password ?? '',
        rol: data.rol ?? 'cliente',
        perfil: data.perfil ?? null,
        activo: data.activo ?? true,
        ...data,
    };
}

export const Usuario = {
    crear: crearUsuario,
    esActivo(usuario) {
        return Boolean(usuario) && usuario.activo !== false;
    },
};

export default crearUsuario;
