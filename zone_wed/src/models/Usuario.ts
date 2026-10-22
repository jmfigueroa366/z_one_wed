// CAPA: Dominio

export interface Usuario {
    id: number | string | null;
    nombre: string;
    email: string;
    password?: string;
    rol: string;
    perfil: string | null;
    activo: boolean;
    [key: string]: unknown;
}

export type EntradaUsuario = Partial<Usuario>;

export function crearUsuario(data: EntradaUsuario = {}): Usuario {
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
    esActivo(usuario: Usuario | null | undefined): boolean {
        return usuario != null && usuario.activo !== false;
    },
};

export default crearUsuario;
