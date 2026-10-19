// CAPA: Dominio
export function esEmailValido(email: unknown): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? '').trim());
}

export function esCampoRequerido(valor: unknown): boolean {
    return String(valor ?? '').trim().length > 0;
}

export interface DatosRegistro {
    nombre?: string;
    email?: string;
    password?: string;
}

export function validarRegistro({ nombre, email, password }: DatosRegistro = {}): Record<string, string> {
    const errores: Record<string, string> = {};

    if (!esCampoRequerido(nombre)) {
        errores.nombre = 'El nombre es obligatorio.';
    }
    if (!esEmailValido(email)) {
        errores.email = 'Ingresa un email válido.';
    }
    if (!esCampoRequerido(password)) {
        errores.password = 'La contraseña es obligatoria.';
    }

    return errores;
}
